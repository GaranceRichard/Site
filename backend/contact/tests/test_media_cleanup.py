from contextlib import contextmanager
from io import StringIO
from pathlib import Path
from datetime import datetime, timedelta, timezone
import os
import shutil
import uuid
from unittest.mock import patch

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management.base import CommandError
from django.core.management import call_command
from django.test.utils import override_settings
from rest_framework.test import APITestCase

from contact.models import ContactMessage, Reference, SiteSettings
from contact.site_settings_defaults import DEFAULT_PUBLICATIONS_SETTINGS

TEST_TMP_ROOT = Path(__file__).resolve().parents[2] / ".tmp-test-media"
TEST_TMP_ROOT.mkdir(exist_ok=True)


@contextmanager
def workspace_tempdir():
    tempdir = TEST_TMP_ROOT / f"case-{uuid.uuid4().hex}"
    tempdir.mkdir(parents=True, exist_ok=False)
    try:
        yield str(tempdir)
    finally:
        shutil.rmtree(tempdir, ignore_errors=True)


class ReferenceMediaCleanupTests(APITestCase):
    @override_settings(MEDIA_URL="/media/")
    def test_reference_delete_removes_media_files(self):
        with workspace_tempdir() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                image_path = default_storage.save(
                    "references/test-image.webp", ContentFile(b"image")
                )
                icon_path = default_storage.save(
                    "references/test-icon.webp", ContentFile(b"icon")
                )
                thumb_path = default_storage.save(
                    "references/thumbs/test-image.webp", ContentFile(b"thumb")
                )

                ref = Reference.objects.create(
                    reference="Ref cleanup",
                    image=image_path,
                    image_thumb=thumb_path,
                    icon=f"/media/{icon_path}",
                    situation="Situation",
                    tasks=[],
                    actions=[],
                    results=[],
                )

                self.assertTrue(default_storage.exists(image_path))
                self.assertTrue(default_storage.exists(icon_path))
                self.assertTrue(default_storage.exists(thumb_path))

                ref.delete()

                self.assertFalse(default_storage.exists(image_path))
                self.assertFalse(default_storage.exists(icon_path))
                self.assertFalse(default_storage.exists(thumb_path))


class MediaCleanupUnitTests(APITestCase):
    def test_cleanup_signal_skips_orphan_cleanup_in_e2e_mode(self):
        from contact import signals

        with (
            patch.dict(os.environ, {"DJANGO_E2E_MODE": "true"}, clear=False),
            patch.object(
                signals, "cleanup_orphan_reference_media_files"
            ) as cleanup_mock,
        ):
            signals.cleanup_orphan_reference_media(sender=Reference, instance=None)

        cleanup_mock.assert_not_called()

    def test_cleanup_signal_uses_grace_period_outside_e2e_mode(self):
        from contact import signals

        with (
            patch.dict(os.environ, {"DJANGO_E2E_MODE": ""}, clear=False),
            patch.object(
                signals, "cleanup_orphan_reference_media_files"
            ) as cleanup_mock,
        ):
            signals.cleanup_orphan_reference_media(sender=Reference, instance=None)

        cleanup_mock.assert_called_once_with(grace_seconds=30)

    def test_media_relative_path_variants(self):
        from contact.media_cleanup import media_relative_path

        self.assertIsNone(media_relative_path(""))
        self.assertIsNone(media_relative_path("http://example.com"))
        self.assertIsNone(media_relative_path("https://example.com/other.png"))
        self.assertEqual(
            media_relative_path("http://testserver/media/references/a.webp"),
            "references/a.webp",
        )
        self.assertEqual(
            media_relative_path("/media/references/b.webp"),
            "references/b.webp",
        )
        self.assertEqual(media_relative_path("references/c.webp"), "references/c.webp")

    @override_settings(MEDIA_URL="/media/")
    def test_cleanup_orphan_reference_media_handles_missing_dir(self):
        from contact.media_cleanup import cleanup_orphan_reference_media

        with workspace_tempdir() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                self.assertEqual(cleanup_orphan_reference_media(), 0)

    @override_settings(MEDIA_URL="/media/")
    def test_audit_reference_media_reports_missing_and_orphan_files(self):
        from contact.media_cleanup import audit_reference_media

        with workspace_tempdir() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                keep_image = default_storage.save(
                    "references/keep.webp", ContentFile(b"keep")
                )
                keep_thumb = default_storage.save(
                    "references/thumbs/keep.webp", ContentFile(b"keep-thumb")
                )
                orphan_path = default_storage.save(
                    "references/orphan.webp", ContentFile(b"orphan")
                )
                orphan_thumb = default_storage.save(
                    "references/thumbs/orphan.webp", ContentFile(b"orphan-thumb")
                )

                Reference.objects.create(
                    reference="Ref broken",
                    image="references/missing.webp",
                    image_thumb="references/thumbs/missing.webp",
                    icon="/media/references/icon-missing.webp",
                    situation="",
                    tasks=[],
                    actions=[],
                    results=[],
                )
                Reference.objects.create(
                    reference="Ref healthy",
                    image=keep_image,
                    image_thumb=keep_thumb,
                    icon="",
                    situation="",
                    tasks=[],
                    actions=[],
                    results=[],
                )

                report = audit_reference_media()

                self.assertEqual(report["summary"]["references_total"], 2)
                self.assertEqual(report["summary"]["references_with_broken_media"], 1)
                self.assertEqual(report["summary"]["broken_field_count"], 3)
                self.assertIn("references/missing.webp", report["missing_media_files"])
                self.assertIn(
                    "references/thumbs/missing.webp",
                    report["missing_media_files"],
                )
                self.assertIn(
                    "references/icon-missing.webp",
                    report["missing_media_files"],
                )
                self.assertIn(orphan_path, report["orphan_media_files"])
                self.assertIn(orphan_thumb, report["orphan_media_files"])
                self.assertEqual(
                    report["broken_references"][0]["reference"], "Ref broken"
                )

    @override_settings(MEDIA_URL="/media/")
    def test_cleanup_orphan_reference_media_removes_unused(self):
        from contact.media_cleanup import cleanup_orphan_reference_media

        with workspace_tempdir() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                orphan_path = default_storage.save(
                    "references/orphan.webp", ContentFile(b"orphan")
                )
                orphan_thumb = default_storage.save(
                    "references/thumbs/orphan.webp", ContentFile(b"orphan-thumb")
                )
                keep_path = default_storage.save(
                    "references/keep.webp", ContentFile(b"keep")
                )
                keep_thumb = default_storage.save(
                    "references/thumbs/keep.webp", ContentFile(b"keep-thumb")
                )

                Reference.objects.create(
                    reference="Ref keep",
                    image=keep_path,
                    image_thumb=keep_thumb,
                    icon="",
                    situation="",
                    tasks=[],
                    actions=[],
                    results=[],
                )

                deleted = cleanup_orphan_reference_media()

                self.assertEqual(deleted, 2)
                self.assertFalse(default_storage.exists(orphan_path))
                self.assertFalse(default_storage.exists(orphan_thumb))
                self.assertTrue(default_storage.exists(keep_path))
                self.assertTrue(default_storage.exists(keep_thumb))

    @override_settings(MEDIA_URL="/media/")
    def test_cleanup_orphan_reference_media_keeps_recent_files_during_grace_period(
        self,
    ):
        from contact.media_cleanup import cleanup_orphan_reference_media

        with workspace_tempdir() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                orphan_path = default_storage.save(
                    "references/orphan.webp", ContentFile(b"orphan")
                )
                orphan_thumb = default_storage.save(
                    "references/thumbs/orphan.webp", ContentFile(b"orphan-thumb")
                )

                deleted = cleanup_orphan_reference_media(grace_seconds=30)

                self.assertEqual(deleted, 0)
                self.assertTrue(default_storage.exists(orphan_path))
                self.assertTrue(default_storage.exists(orphan_thumb))

    @override_settings(MEDIA_URL="/media/")
    def test_cleanup_reference_media_command(self):
        with workspace_tempdir() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                orphan_path = default_storage.save(
                    "references/orphan.webp", ContentFile(b"orphan")
                )
                orphan_thumb = default_storage.save(
                    "references/thumbs/orphan.webp", ContentFile(b"orphan-thumb")
                )

                out = StringIO()
                call_command("cleanup_reference_media", stdout=out)

                self.assertIn("Fichiers supprimes: 2", out.getvalue())
                self.assertFalse(default_storage.exists(orphan_path))
                self.assertFalse(default_storage.exists(orphan_thumb))

    @override_settings(MEDIA_URL="/media/")
    def test_audit_reference_media_command_json(self):
        with workspace_tempdir() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                Reference.objects.create(
                    reference="Ref broken",
                    image="references/missing.webp",
                    image_thumb="references/thumbs/missing.webp",
                    icon="",
                    situation="",
                    tasks=[],
                    actions=[],
                    results=[],
                )

                out = StringIO()
                call_command("audit_reference_media", "--format=json", stdout=out)
                payload = out.getvalue()

                self.assertIn('"references_with_broken_media": 1', payload)
                self.assertIn('"references/missing.webp"', payload)

    @override_settings(MEDIA_URL="/media/")
    def test_audit_project_data_command_json(self):
        with workspace_tempdir() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                SiteSettings.objects.create(
                    pk=2,
                    header={},
                    home_hero={},
                    promise={},
                )
                Reference.objects.create(
                    reference="Ref broken",
                    image="references/missing.webp",
                    image_thumb="references/thumbs/missing.webp",
                    icon="",
                    situation="",
                    tasks=[],
                    actions=[],
                    results=[],
                )
                ContactMessage.objects.create(
                    name="E2E user",
                    email="e2e@example.com",
                    subject="Sujet",
                    message="Message",
                    consent=False,
                    source="e2e",
                )

                out = StringIO()
                call_command("audit_project_data", "--format=json", stdout=out)
                payload = out.getvalue()

                self.assertIn('"reference_media_broken_references": 1', payload)
                self.assertIn('"probable_test_messages": 1', payload)
                self.assertIn('"messages_without_consent": 1', payload)

    def test_export_demo_snapshot_command_writes_current_content(self):
        with workspace_tempdir() as tempdir:
            output_path = Path(tempdir) / "demo-snapshot.json"
            settings = SiteSettings.get_solo()
            settings.header = {
                "name": "Garance Richard",
                "title": "Delivery & Transformation",
                "bookingUrl": "https://example.com/book",
            }
            settings.save()
            Reference.objects.create(
                reference="Reference exportee",
                reference_short="Ref",
                order_index=1,
                image="references/export.webp",
                image_thumb="references/thumbs/export.webp",
                icon="",
                situation="Situation",
                tasks=["Task"],
                actions=["Action"],
                results=["Result"],
            )

            out = StringIO()
            call_command(
                "export_demo_snapshot", "--output", str(output_path), stdout=out
            )

            payload = output_path.read_text(encoding="utf-8")
            self.assertEqual("", out.getvalue())
            self.assertIn('"settings"', payload)
            self.assertIn('"references"', payload)
            self.assertIn('"Reference exportee"', payload)

    def test_export_demo_snapshot_command_raises_command_error_on_write_failure(self):
        with workspace_tempdir() as tempdir:
            output_path = Path(tempdir) / "demo-snapshot.json"

            with patch("pathlib.Path.write_text", side_effect=OSError("disk full")):
                with self.assertRaises(CommandError) as ctx:
                    call_command("export_demo_snapshot", "--output", str(output_path))

            self.assertIn("Unable to write snapshot", str(ctx.exception))

    def test_export_demo_snapshot_command_resolves_relative_output_from_cwd(self):
        with workspace_tempdir() as tempdir:
            relative_output = Path("exports") / "demo-snapshot.json"

            with patch("pathlib.Path.cwd", return_value=Path(tempdir)):
                call_command("export_demo_snapshot", "--output", str(relative_output))

            output_path = Path(tempdir) / relative_output
            self.assertTrue(output_path.exists())
            self.assertIn('"settings"', output_path.read_text(encoding="utf-8"))

    @override_settings(MEDIA_URL="/media/")
    def test_reference_delete_cleans_orphaned_media(self):
        with workspace_tempdir() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                orphan_path = default_storage.save(
                    "references/orphan.webp", ContentFile(b"orphan")
                )
                orphan_thumb = default_storage.save(
                    "references/thumbs/orphan.webp", ContentFile(b"orphan-thumb")
                )
                kept_path = default_storage.save(
                    "references/keep.webp", ContentFile(b"keep")
                )
                kept_thumb = default_storage.save(
                    "references/thumbs/keep.webp", ContentFile(b"keep-thumb")
                )

                ref = Reference.objects.create(
                    reference="Ref keep",
                    image=kept_path,
                    image_thumb=kept_thumb,
                    icon="",
                    situation="Situation",
                    tasks=[],
                    actions=[],
                    results=[],
                )

                self.assertTrue(default_storage.exists(orphan_path))
                self.assertTrue(default_storage.exists(orphan_thumb))
                self.assertTrue(default_storage.exists(kept_path))
                self.assertTrue(default_storage.exists(kept_thumb))

                old_timestamp = (
                    datetime.now(timezone.utc) - timedelta(seconds=120)
                ).timestamp()
                os.utime(Path(tempdir) / orphan_path, (old_timestamp, old_timestamp))
                os.utime(Path(tempdir) / orphan_thumb, (old_timestamp, old_timestamp))

                ref.delete()

                self.assertFalse(default_storage.exists(orphan_path))
                self.assertFalse(default_storage.exists(orphan_thumb))
                self.assertFalse(default_storage.exists(kept_path))
                self.assertFalse(default_storage.exists(kept_thumb))


class DataAuditTests(APITestCase):
    @override_settings(MEDIA_URL="/media/")
    def test_audit_project_data_integrity_reports_clean_state(self):
        from contact.data_audit import audit_project_data_integrity

        with workspace_tempdir() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                image_path = default_storage.save(
                    "references/ok.webp", ContentFile(b"ok")
                )
                thumb_path = default_storage.save(
                    "references/thumbs/ok.webp", ContentFile(b"thumb")
                )

                Reference.objects.create(
                    reference="Ref ok",
                    image=image_path,
                    image_thumb=thumb_path,
                    icon="",
                    situation="Situation",
                    tasks=[],
                    actions=[],
                    results=[],
                )
                SiteSettings.get_solo()
                ContactMessage.objects.create(
                    name="Client",
                    email="client@company.test",
                    subject="Question",
                    message="Bonjour",
                    consent=True,
                    source="site",
                )

                report = audit_project_data_integrity()

                self.assertEqual(
                    report["summary"]["reference_media_broken_references"], 0
                )
                self.assertEqual(report["summary"]["reference_media_missing_files"], 0)
                self.assertEqual(report["summary"]["site_settings_problems"], 0)
                self.assertEqual(report["summary"]["probable_test_messages"], 0)
                self.assertEqual(report["summary"]["messages_without_consent"], 0)

    @override_settings(MEDIA_URL="/media/")
    def test_audit_site_settings_reports_invalid_singleton_state(self):
        from contact.data_audit import audit_site_settings

        fake_one = SiteSettings(
            header={},
            home_hero={},
            promise={},
            method={},
            publications={},
        )
        fake_one.pk = 1
        fake_two = SiteSettings(
            header={"name": "X"},
            home_hero={},
            promise={},
            method={},
            publications={},
        )
        fake_two.pk = 2

        with patch("contact.data_audit.SiteSettings.objects.all") as all_mock:
            all_mock.return_value = [fake_one, fake_two]
            report = audit_site_settings()

        self.assertIn("site_settings_row_count_invalid", report["problems"])
        self.assertEqual(report["summary"]["row_count"], 2)

    def test_audit_site_settings_reports_pk_not_one(self):
        from contact.data_audit import audit_site_settings

        fake = SiteSettings(
            header={
                "name": "Garance Richard",
                "title": "Coach Lean-Agile",
                "bookingUrl": "https://calendar.app.google/hYgX38RpfWiu65Vh8",
            },
            home_hero={
                "eyebrow": "Lean-Agile - transformation pragmatique, ancree dans le reel",
                "title": "Des equipes plus sereines.\nDes livraisons plus fiables.",
                "subtitle": "Accompagnement oriente resultats : clarifier la priorite, stabiliser le flux, renforcer l autonomie - sans surcouche inutile.",
                "links": [
                    {"id": "services", "label": "Voir les offres", "enabled": True},
                    {
                        "id": "references",
                        "label": "Exemples d'impact",
                        "enabled": True,
                    },
                ],
                "keywords": ["Clarte"],
                "cards": [
                    {
                        "id": "card-1",
                        "title": "Titre",
                        "content": "Contenu",
                    }
                ],
            },
            promise={
                "title": "Titre",
                "subtitle": "Sous-titre",
                "cards": [
                    {
                        "id": "promise-card-1",
                        "title": "Titre",
                        "content": "Contenu",
                    }
                ],
            },
            method={
                "eyebrow": "Approche",
                "title": "Titre",
                "subtitle": "Sous-titre",
                "steps": [
                    {
                        "id": "method-step-1",
                        "step": "01",
                        "title": "Observer",
                        "text": "Comprendre",
                    }
                ],
            },
            publications=DEFAULT_PUBLICATIONS_SETTINGS,
        )
        fake.pk = 2

        with patch("contact.data_audit.SiteSettings.objects.all") as all_mock:
            all_mock.return_value = [fake]
            report = audit_site_settings()

        self.assertIn("site_settings_pk_not_one", report["problems"])
        self.assertTrue(report["summary"]["serializer_valid"])

    @override_settings(MEDIA_URL="/media/")
    def test_audit_references_reports_duplicate_orders_and_non_list_json(self):
        from contact.data_audit import audit_references

        Reference.objects.create(
            reference="Ref one",
            order_index=1,
            image="references/one.webp",
            image_thumb="references/thumbs/one.webp",
            icon="",
            tasks="not-a-list",
            actions=[],
            results=[],
        )
        Reference.objects.create(
            reference="Ref two",
            order_index=1,
            image="references/two.webp",
            image_thumb="references/thumbs/two.webp",
            icon="",
            tasks=[],
            actions="oops",
            results=[],
        )

        report = audit_references()

        self.assertEqual(report["summary"]["duplicate_order_index_count"], 1)
        self.assertEqual(report["duplicate_order_indexes"], [1])
        self.assertEqual(report["summary"]["non_list_json_field_count"], 2)

    def test_audit_references_reports_blank_required_fields(self):
        from contact.data_audit import audit_references

        Reference.objects.create(
            reference="",
            order_index=0,
            image="",
            image_thumb="references/thumbs/missing.webp",
            icon="",
            tasks=[],
            actions=[],
            results=[],
        )

        report = audit_references()

        self.assertEqual(report["summary"]["blank_required_reference_count"], 1)
        self.assertEqual(
            report["blank_required_references"][0]["fields"], ["reference", "image"]
        )

    def test_audit_contact_messages_flags_test_like_and_missing_consent(self):
        from contact.data_audit import audit_contact_messages

        ContactMessage.objects.create(
            name="E2E User",
            email="e2e@example.com",
            subject="Sujet",
            message="Message",
            consent=True,
            source="site",
        )
        missing_consent_message = ContactMessage.objects.create(
            name="Client",
            email="client@company.test",
            subject="Question",
            message="Message",
            consent=False,
            source="site",
        )

        report = audit_contact_messages()

        self.assertEqual(report["summary"]["probable_test_message_count"], 1)
        self.assertEqual(report["summary"]["consent_false_count"], 1)
        self.assertEqual(report["consent_false_ids"], [missing_consent_message.id])

    def test_audit_contact_messages_ignores_regular_messages(self):
        from contact.data_audit import audit_contact_messages

        ContactMessage.objects.create(
            name="Client",
            email="client@company.org",
            subject="Question",
            message="Message",
            consent=True,
            source="site",
        )

        report = audit_contact_messages()

        self.assertEqual(report["summary"]["probable_test_message_count"], 0)
        self.assertEqual(report["summary"]["consent_false_count"], 0)

    @override_settings(MEDIA_URL="/media/")
    def test_audit_project_data_command_text(self):
        with workspace_tempdir() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                Reference.objects.create(
                    reference="Ref broken",
                    image="references/missing.webp",
                    image_thumb="references/thumbs/missing.webp",
                    icon="",
                    situation="",
                    tasks=[],
                    actions=[],
                    results=[],
                )
                ContactMessage.objects.create(
                    name="E2E user",
                    email="e2e@example.com",
                    subject="Sujet",
                    message="Message",
                    consent=True,
                    source="e2e",
                )

                out = StringIO()
                call_command("audit_project_data", stdout=out)
                payload = out.getvalue()

                self.assertIn("Audit project data", payload)
                self.assertIn("Messages probablement issus de tests: 1", payload)
                self.assertIn("Ref broken", payload)

    @override_settings(MEDIA_URL="/media/")
    def test_audit_project_data_command_text_with_site_settings_and_duplicate_order(
        self,
    ):
        SiteSettings.get_solo()
        Reference.objects.create(
            reference="Ref one",
            order_index=2,
            image="references/one.webp",
            image_thumb="references/thumbs/one.webp",
            icon="",
            tasks=[],
            actions=[],
            results=[],
        )
        Reference.objects.create(
            reference="Ref two",
            order_index=2,
            image="references/two.webp",
            image_thumb="references/thumbs/two.webp",
            icon="",
            tasks=[],
            actions=[],
            results=[],
        )

        out = StringIO()
        call_command("audit_project_data", stdout=out)
        payload = out.getvalue()

        self.assertIn("Order indexes dupliqués:", payload)
        self.assertIn("- 2", payload)

    @override_settings(MEDIA_URL="/media/")
    def test_audit_project_data_command_text_skips_broken_media_section_when_empty(
        self,
    ):
        with workspace_tempdir() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                image_path = default_storage.save(
                    "references/ok.webp", ContentFile(b"ok")
                )
                thumb_path = default_storage.save(
                    "references/thumbs/ok.webp", ContentFile(b"thumb")
                )

                SiteSettings.get_solo()
                Reference.objects.create(
                    reference="Ref saine",
                    order_index=1,
                    image=image_path,
                    image_thumb=thumb_path,
                    icon="",
                    tasks=[],
                    actions=[],
                    results=[],
                )

                out = StringIO()
                call_command("audit_project_data", stdout=out)
                payload = out.getvalue()

                self.assertIn("Audit project data", payload)
                self.assertNotIn("RÃ©fÃ©rences avec chemins cassÃ©s:", payload)

    @override_settings(MEDIA_URL="/media/")
    def test_audit_reference_media_command_text_lists_orphans(self):
        with workspace_tempdir() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                default_storage.save("references/orphan.webp", ContentFile(b"orphan"))

                out = StringIO()
                call_command("audit_reference_media", stdout=out)
                payload = out.getvalue()

                self.assertIn("Audit Reference media", payload)
                self.assertIn("Fichiers orphelins sur disque: 1", payload)
                self.assertIn("references/orphan.webp", payload)

    @override_settings(MEDIA_URL="/media/")
    def test_audit_reference_media_command_text_lists_broken_and_missing(self):
        with workspace_tempdir() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                Reference.objects.create(
                    reference="Ref broken",
                    image="references/missing.webp",
                    image_thumb="references/thumbs/missing.webp",
                    icon="/media/references/icon-missing.webp",
                    situation="",
                    tasks=[],
                    actions=[],
                    results=[],
                )

                out = StringIO()
                call_command("audit_reference_media", stdout=out)
                payload = out.getvalue()

                self.assertIn("Références cassées:", payload)
                self.assertIn("Chemins référencés absents du disque:", payload)
                self.assertIn("references/icon-missing.webp", payload)
