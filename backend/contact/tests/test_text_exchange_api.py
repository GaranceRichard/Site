from contextlib import contextmanager
from pathlib import Path
import shutil
from unittest.mock import patch
import uuid

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test.utils import override_settings
from rest_framework import serializers, status
from rest_framework.test import APITestCase

from contact.models import Reference, SiteSettings
from contact.image_upload import MAX_UPLOAD_BYTES
from contact.ga4 import GA4FetchError
from contact.text_exchange import (
    TextExchangeError,
    export_exchange_text,
    import_exchange_text,
    parse_exchange_text,
)

TEST_TMP_ROOT = Path(__file__).resolve().parents[2] / ".tmp-test-media"
TEST_TMP_ROOT.mkdir(exist_ok=True)


@contextmanager
def workspace_tempdir():
    tempdir = TEST_TMP_ROOT / f"exchange-{uuid.uuid4().hex}"
    tempdir.mkdir(parents=True, exist_ok=False)
    try:
        yield str(tempdir)
    finally:
        shutil.rmtree(tempdir, ignore_errors=True)


class TextExchangeApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.template_url = "/api/contact/exchange/admin/template"
        self.export_url = "/api/contact/exchange/admin/export"
        self.import_url = "/api/contact/exchange/admin/import"

        user = get_user_model().objects.create_user(
            username="exchange-admin",
            password="exchange-pass-123",
            is_staff=True,
        )
        token_res = self.client.post(
            "/api/auth/token/",
            {"username": user.username, "password": "exchange-pass-123"},
            format="json",
        )
        self.assertEqual(token_res.status_code, status.HTTP_200_OK)
        self.token = token_res.data["access"]
        self.site_settings_public_url = "/api/settings/"
        self.reference_upload_url = "/api/contact/references/admin/upload"
        self.stats_summary_url = "/api/stats/summary/"

    def _auth_headers(self) -> dict:
        return {"HTTP_AUTHORIZATION": f"Bearer {self.token}"}

    def _valid_exchange_text(self) -> str:
        return """format_version = 1

[header]
name = "Nom importe"
title = "Titre importe"
booking_url = "https://example.com/book"

[home_hero]
eyebrow = "Surtitre"
title = "Titre hero"
subtitle = "Sous-titre hero"
keywords = ["Clarte", "Focus"]

[[home_hero.links]]
target = "services"
label = "Services"
enabled = true

[[home_hero.cards]]
title = "Carte 1"
content = "Contenu 1"

[about]
title = "Titre about"
subtitle = "Sous-titre about"
highlight_intro = "Intro about"
highlight_items = ["Point 1", "Point 2"]

[promise]
title = "Titre promise"
subtitle = "Sous-titre promise"

[[promise.cards]]
title = "Promesse 1"
content = "Contenu promesse"

[method]
eyebrow = "Approche"
title = "Titre method"
subtitle = "Sous-titre method"

[[method.steps]]
step = "01"
title = "Etape 1"
text = "Texte etape 1"

[publications]
title = "Titre publications"
subtitle = "Sous-titre publications"
highlight_title = "Encart"
highlight_content = "Contenu encart"

[[publications.items]]
title = "Publication 1"
content = "Contenu publication 1"

[[publications.items.links]]
title = "Lien 1"
url = "https://example.com/pub-1"

[[references]]
reference = "Reference A"
reference_short = "Ref A"
icon = "https://example.com/icon-a.png"
situation = "Situation A"
tasks = ["Task 1", "Task 2"]
actions = ["Action 1"]
results = ["Resultat 1"]

[[references]]
reference = "Reference B"
reference_short = "Ref B"
icon = ""
situation = "Situation B"
tasks = []
actions = ["Action B"]
results = ["Resultat B"]
"""

    def test_template_download_requires_auth(self):
        response = self.client.get(self.template_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_template_download_returns_toml(self):
        response = self.client.get(
            self.template_url,
            **self._auth_headers(),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("format_version = 1", response.content.decode("utf-8"))
        self.assertIn("[[references]]", response.content.decode("utf-8"))

    def test_export_returns_current_content(self):
        settings = SiteSettings.get_solo()
        settings.header = {
            "name": "Export Nom",
            "title": "Export Titre",
            "bookingUrl": "https://example.com/booking",
        }
        settings.save()
        Reference.objects.create(
            reference="Reference exportee",
            reference_short="Export",
            order_index=1,
            image="references/export.webp",
            image_thumb="references/thumbs/export.webp",
            icon="https://example.com/icon.png",
            situation="Situation export",
            tasks=["Task A"],
            actions=["Action A"],
            results=["Result A"],
        )

        response = self.client.get(
            self.export_url,
            **self._auth_headers(),
        )

        text = response.content.decode("utf-8")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('name = "Export Nom"', text)
        self.assertIn('reference = "Reference exportee"', text)
        self.assertIn('tasks = ["Task A"]', text)

    def test_import_replaces_settings_and_references(self):
        with workspace_tempdir() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir, MEDIA_URL="/media/"):
                response = self.client.post(
                    self.import_url,
                    {
                        "file": SimpleUploadedFile(
                            "import.toml",
                            self._valid_exchange_text().encode("utf-8"),
                            content_type="text/plain",
                        )
                    },
                    format="multipart",
                    **self._auth_headers(),
                )

                self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
                self.assertEqual(response.data["references_count"], 2)
                self.assertEqual(SiteSettings.get_solo().header["name"], "Nom importe")
                references = list(Reference.objects.order_by("order_index"))
                self.assertEqual(len(references), 2)
                self.assertEqual(references[0].reference, "Reference A")
                self.assertTrue(str(references[0].image).startswith("references/"))
                self.assertTrue(str(references[0].image_thumb).startswith("references/thumbs/"))
                self.assertTrue((Path(tempdir) / str(references[0].image)).exists())
                self.assertTrue((Path(tempdir) / str(references[0].image_thumb)).exists())

    def test_import_rejects_invalid_toml_without_changes(self):
        Reference.objects.create(
            reference="Reference initiale",
            reference_short="Initiale",
            order_index=1,
            image="references/initial.webp",
            image_thumb="references/thumbs/initial.webp",
            icon="",
            situation="Avant import",
            tasks=[],
            actions=[],
            results=[],
        )

        response = self.client.post(
            self.import_url,
            {
                "file": SimpleUploadedFile(
                    "broken.toml",
                    b"format_version = 1\n[header\nname = 'boom'",
                    content_type="text/plain",
                )
            },
            format="multipart",
            **self._auth_headers(),
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Reference.objects.count(), 1)
        self.assertEqual(Reference.objects.first().reference, "Reference initiale")

    def test_parse_exchange_text_rejects_missing_table(self):
        with self.assertRaises(TextExchangeError) as ctx:
            parse_exchange_text("format_version = 1")

        self.assertIn("header", ctx.exception.detail)

    def test_parse_exchange_text_rejects_invalid_scalar_and_list_types(self):
        file_text = self._valid_exchange_text().replace('name = "Nom importe"', "name = 12")
        with self.assertRaises(TextExchangeError) as ctx:
            parse_exchange_text(file_text)
        self.assertEqual(ctx.exception.detail["header"], "`name` doit etre une chaine.")

        file_text = self._valid_exchange_text().replace(
            'keywords = ["Clarte", "Focus"]',
            'keywords = [1, "Focus"]',
        )
        with self.assertRaises(TextExchangeError) as ctx:
            parse_exchange_text(file_text)
        self.assertEqual(
            ctx.exception.detail["home_hero"],
            "`keywords` doit etre une liste de chaines.",
        )

        file_text = self._valid_exchange_text().replace("enabled = true", 'enabled = "oui"')
        with self.assertRaises(TextExchangeError) as ctx:
            parse_exchange_text(file_text)
        self.assertEqual(
            ctx.exception.detail["home_hero.links[1]"],
            "`enabled` doit etre un booleen.",
        )

    def test_parse_exchange_text_rejects_invalid_target_publication_links_and_reference_values(self):
        file_text = self._valid_exchange_text().replace('target = "services"', 'target = "foo"')
        with self.assertRaises(TextExchangeError) as ctx:
            parse_exchange_text(file_text)
        self.assertEqual(
            ctx.exception.detail["home_hero.links[1]"],
            "`target` invalide pour le lien.",
        )

        file_text = self._valid_exchange_text().replace(
            '[[publications.items.links]]\ntitle = "Lien 1"\nurl = "https://example.com/pub-1"\n',
            'links = ["oops"]\n',
        )
        with self.assertRaises(TextExchangeError) as ctx:
            parse_exchange_text(file_text)
        self.assertEqual(
            ctx.exception.detail["publications.items[1]"],
            "`links` doit contenir des sections.",
        )

        file_text = self._valid_exchange_text().replace(
            'reference = "Reference A"',
            'reference = "   "',
        )
        with self.assertRaises(TextExchangeError) as ctx:
            parse_exchange_text(file_text)
        self.assertEqual(
            ctx.exception.detail["references[1]"],
            "`reference` est obligatoire.",
        )

        file_text = self._valid_exchange_text().replace(
            'reference_short = "Ref A"',
            "reference_short = 12",
        )
        with self.assertRaises(TextExchangeError) as ctx:
            parse_exchange_text(file_text)
        self.assertEqual(
            ctx.exception.detail["reference_short"],
            "La valeur doit etre une chaine.",
        )

    def test_parse_exchange_text_rejects_invalid_reference_urls_and_sections(self):
        file_text = self._valid_exchange_text().replace(
            'icon = "https://example.com/icon-a.png"',
            'icon = "notaurl"',
        )
        with self.assertRaises(TextExchangeError) as ctx:
            parse_exchange_text(file_text)
        self.assertEqual(ctx.exception.detail["references[1].icon"], "URL invalide.")

        file_text = self._valid_exchange_text().replace(
            'actions = ["Action B"]',
            'actions = "Action B"',
        )
        with self.assertRaises(TextExchangeError) as ctx:
            parse_exchange_text(file_text)
        self.assertEqual(
            ctx.exception.detail["references[2]"],
            "`actions` doit etre une liste de chaines.",
        )

        file_text = self._valid_exchange_text().replace("format_version = 1", "format_version = 2")
        with self.assertRaises(TextExchangeError) as ctx:
            parse_exchange_text(file_text)
        self.assertEqual(
            ctx.exception.detail["format_version"],
            "Version de format non supportee.",
        )

    def test_export_and_import_handle_multiline_text_and_existing_media_cleanup(self):
        settings = SiteSettings.get_solo()
        settings.header = {
            "name": 'Nom "multi"\nligne',
            "title": "Titre export",
            "bookingUrl": "https://example.com/booking",
        }
        settings.save()

        with workspace_tempdir() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir, MEDIA_URL="/media/"):
                old_image = Path(tempdir) / "references/old.webp"
                old_thumb = Path(tempdir) / "references/thumbs/old.webp"
                old_icon = Path(tempdir) / "references/icons/old.svg"
                old_image.parent.mkdir(parents=True, exist_ok=True)
                old_thumb.parent.mkdir(parents=True, exist_ok=True)
                old_icon.parent.mkdir(parents=True, exist_ok=True)
                old_image.write_bytes(b"img")
                old_thumb.write_bytes(b"thumb")
                old_icon.write_bytes(b"icon")
                Reference.objects.create(
                    reference="Ancienne reference",
                    reference_short="Ancienne",
                    order_index=1,
                    image="references/old.webp",
                    image_thumb="references/thumbs/old.webp",
                    icon="/media/references/icons/old.svg",
                    situation="Avant",
                    tasks=[],
                    actions=[],
                    results=[],
                )

                exported = export_exchange_text()
                self.assertIn('name = """', exported)
                self.assertIn('Nom "multi"', exported)

                result = import_exchange_text(self._valid_exchange_text())

                self.assertEqual(result["references_count"], 2)
                self.assertFalse(old_image.exists())
                self.assertFalse(old_thumb.exists())
                self.assertFalse(old_icon.exists())

    def test_import_requires_uploaded_file(self):
        response = self.client.post(
            self.import_url,
            {},
            format="multipart",
            **self._auth_headers(),
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Aucun fichier texte fourni.")

    def test_import_rejects_non_utf8_file(self):
        response = self.client.post(
            self.import_url,
            {
                "file": SimpleUploadedFile(
                    "latin1.toml",
                    b"\xff\xfe\x00",
                    content_type="text/plain",
                )
            },
            format="multipart",
            **self._auth_headers(),
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Le fichier doit etre encodé en UTF-8.")

    def test_import_surfaces_serializer_validation_errors(self):
        with patch(
            "contact.views.import_exchange_text",
            side_effect=serializers.ValidationError({"detail": "serializer boom"}),
        ):
            response = self.client.post(
                self.import_url,
                {
                    "file": SimpleUploadedFile(
                        "import.toml",
                        self._valid_exchange_text().encode("utf-8"),
                        content_type="text/plain",
                    )
                },
                format="multipart",
                **self._auth_headers(),
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"]["detail"], "serializer boom")

    def test_reference_upload_rejects_invalid_content_type_and_oversized_file(self):
        response = self.client.post(
            self.reference_upload_url,
            {
                "file": SimpleUploadedFile(
                    "notes.txt",
                    b"hello",
                    content_type="text/plain",
                )
            },
            format="multipart",
            **self._auth_headers(),
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Format de fichier invalide.")

        oversize_file = SimpleUploadedFile(
            "big.png",
            b"0" * (MAX_UPLOAD_BYTES + 1),
            content_type="image/png",
        )
        response = self.client.post(
            self.reference_upload_url,
            {"file": oversize_file},
            format="multipart",
            **self._auth_headers(),
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Fichier trop volumineux (max 5MB).")

    def test_site_settings_public_view_uses_cache_on_second_request(self):
        first = self.client.get(self.site_settings_public_url)
        second = self.client.get(self.site_settings_public_url)

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(first.data, second.data)

    def test_stats_summary_returns_503_when_fetch_fails_without_stale_cache(self):
        with patch("contact.views.is_ga4_configured", return_value=True), patch(
            "contact.views.fetch_ga4_summary",
            side_effect=GA4FetchError("ga4 indisponible"),
        ):
            response = self.client.get(
                self.stats_summary_url,
                **self._auth_headers(),
            )

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data["configured"], True)
        self.assertEqual(response.data["stale"], True)
        self.assertEqual(response.data["warning"], "ga4 indisponible")
