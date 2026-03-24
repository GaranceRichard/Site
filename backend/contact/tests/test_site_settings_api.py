from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from django.test.utils import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from contact.models import SiteSettings
from contact.site_settings_cache import (
    SITE_SETTINGS_CACHE_VERSION_KEY,
    bump_public_site_settings_cache_version,
    get_public_site_settings_cache_key,
)
from contact.site_settings_defaults import (
    DEFAULT_ABOUT_SETTINGS,
    DEFAULT_HEADER_SETTINGS,
    DEFAULT_HOME_HERO_SETTINGS,
    DEFAULT_METHOD_SETTINGS,
    DEFAULT_PUBLICATIONS_SETTINGS,
    DEFAULT_PROMISE_SETTINGS,
    default_about_settings,
    default_header_settings,
    default_home_hero_settings,
    default_method_settings,
    default_publications_settings,
    default_promise_settings,
)


@override_settings(
    REST_FRAMEWORK={
        "DEFAULT_AUTHENTICATION_CLASSES": (
            "rest_framework_simplejwt.authentication.JWTAuthentication",
        ),
        "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.AllowAny",),
    }
)
class SiteSettingsApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.public_url = "/api/settings/"
        self.admin_url = "/api/settings/admin/"

        user = get_user_model().objects.create_user(
            username="settings-admin",
            password="settings-pass-123",
            is_staff=True,
        )
        token_res = self.client.post(
            "/api/auth/token/",
            {"username": user.username, "password": "settings-pass-123"},
            format="json",
        )
        self.assertEqual(token_res.status_code, status.HTTP_200_OK)
        self.token = token_res.data["access"]

    def test_public_endpoint_returns_defaults_without_existing_row(self):
        res = self.client.get(self.public_url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["header"], DEFAULT_HEADER_SETTINGS)
        self.assertEqual(res.data["homeHero"], DEFAULT_HOME_HERO_SETTINGS)
        self.assertEqual(res.data["about"], DEFAULT_ABOUT_SETTINGS)
        self.assertEqual(res.data["promise"], DEFAULT_PROMISE_SETTINGS)
        self.assertEqual(res.data["method"], DEFAULT_METHOD_SETTINGS)
        self.assertEqual(res.data["publications"], DEFAULT_PUBLICATIONS_SETTINGS)
        self.assertEqual(SiteSettings.objects.count(), 1)

    def test_public_endpoint_without_trailing_slash_returns_defaults(self):
        res = self.client.get("/api/settings")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["header"], DEFAULT_HEADER_SETTINGS)
        self.assertEqual(res.data["homeHero"], DEFAULT_HOME_HERO_SETTINGS)
        self.assertEqual(res.data["about"], DEFAULT_ABOUT_SETTINGS)
        self.assertEqual(res.data["promise"], DEFAULT_PROMISE_SETTINGS)
        self.assertEqual(res.data["method"], DEFAULT_METHOD_SETTINGS)
        self.assertEqual(res.data["publications"], DEFAULT_PUBLICATIONS_SETTINGS)

    def test_admin_put_updates_settings(self):
        payload = {
            "header": {
                "name": "Jane Doe",
                "title": "Coach Agile",
                "bookingUrl": "https://example.com/booking",
            },
            "homeHero": {
                "eyebrow": "Nouveau surtitre",
                "title": "Titre test",
                "subtitle": "Sous-titre test",
                "links": [
                    {"id": "services", "label": "Offres", "enabled": True},
                    {"id": "references", "label": "Cas clients", "enabled": True},
                ],
                "keywords": ["Clarte", "Focus"],
                "cards": [
                    {"id": "card-1", "title": "Carte A", "content": "Contenu A"},
                ],
            },
            "promise": {
                "title": "Titre positionnement",
                "subtitle": "Sous-titre positionnement",
                "cards": [
                    {
                        "id": "promise-card-1",
                        "title": "Encart A",
                        "content": "Contenu A",
                    }
                ],
            },
            "about": {
                "title": "A propos",
                "subtitle": "Une section plus personnelle.",
                "highlight": {
                    "intro": "Quelques lignes pour presenter la posture.",
                    "items": [
                        {"id": "about-item-1", "text": "Pragmatisme"},
                        {"id": "about-item-2", "text": "Cadence"},
                    ],
                },
            },
            "method": {
                "eyebrow": "Approche",
                "title": "Chemin de delivery",
                "subtitle": "Diagnostiquer, decider, stabiliser.",
                "steps": [
                    {
                        "id": "method-step-1",
                        "step": "01",
                        "title": "Observer",
                        "text": "Voir le systeme en entier",
                    }
                ],
            },
            "publications": {
                "title": "Publications",
                "subtitle": "Formats et contenus a la carte.",
                "highlight": {
                    "title": "En bref",
                    "content": "Point 1\nPoint 2",
                },
                "items": [
                    {
                        "id": "publication-1",
                        "title": "Publication A",
                        "content": "Element A\nElement B",
                        "links": [
                            {
                                "id": "publication-1-link-1",
                                "title": "Reference A",
                                "url": "https://example.com/reference-a",
                            }
                        ],
                    }
                ],
            },
        }

        res = self.client.put(
            self.admin_url,
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        settings = SiteSettings.get_solo()
        self.assertEqual(settings.header["name"], "Jane Doe")
        self.assertEqual(settings.home_hero["eyebrow"], "Nouveau surtitre")
        self.assertEqual(settings.about["title"], "A propos")
        self.assertEqual(settings.promise["title"], "Titre positionnement")
        self.assertEqual(settings.method["title"], "Chemin de delivery")
        self.assertEqual(settings.publications["title"], "Publications")
        self.assertEqual(
            settings.publications["items"][0]["links"][0]["title"], "Reference A"
        )

        public_res = self.client.get(self.public_url)
        self.assertEqual(public_res.status_code, status.HTTP_200_OK)
        self.assertEqual(public_res.data["header"]["name"], "Jane Doe")
        self.assertEqual(public_res.data["homeHero"]["eyebrow"], "Nouveau surtitre")
        self.assertEqual(public_res.data["about"]["title"], "A propos")
        self.assertEqual(public_res.data["promise"]["title"], "Titre positionnement")
        self.assertEqual(public_res.data["method"]["title"], "Chemin de delivery")
        self.assertEqual(public_res.data["publications"]["title"], "Publications")

    def test_admin_put_without_trailing_slash_updates_settings(self):
        payload = {
            "header": {
                "name": "Sans slash",
                "title": "Coach Agile",
                "bookingUrl": "https://example.com/booking",
            },
            "homeHero": DEFAULT_HOME_HERO_SETTINGS,
            "about": DEFAULT_ABOUT_SETTINGS,
            "promise": DEFAULT_PROMISE_SETTINGS,
            "method": DEFAULT_METHOD_SETTINGS,
            "publications": DEFAULT_PUBLICATIONS_SETTINGS,
        }

        res = self.client.put(
            "/api/settings/admin",
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        settings = SiteSettings.get_solo()
        self.assertEqual(settings.header["name"], "Sans slash")

    def test_admin_put_requires_authentication(self):
        res = self.client.put(
            self.admin_url,
            {
                "header": DEFAULT_HEADER_SETTINGS,
                "homeHero": DEFAULT_HOME_HERO_SETTINGS,
                "about": DEFAULT_ABOUT_SETTINGS,
                "promise": DEFAULT_PROMISE_SETTINGS,
                "method": DEFAULT_METHOD_SETTINGS,
                "publications": DEFAULT_PUBLICATIONS_SETTINGS,
            },
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_put_invalidates_public_cache(self):
        first_res = self.client.get(self.public_url)
        self.assertEqual(first_res.status_code, status.HTTP_200_OK)
        self.assertEqual(
            first_res.data["header"]["name"], DEFAULT_HEADER_SETTINGS["name"]
        )

        update_res = self.client.put(
            self.admin_url,
            {
                "header": {
                    "name": "Nom mis a jour",
                    "title": DEFAULT_HEADER_SETTINGS["title"],
                    "bookingUrl": DEFAULT_HEADER_SETTINGS["bookingUrl"],
                },
                "homeHero": DEFAULT_HOME_HERO_SETTINGS,
                "about": DEFAULT_ABOUT_SETTINGS,
                "promise": DEFAULT_PROMISE_SETTINGS,
                "method": DEFAULT_METHOD_SETTINGS,
                "publications": DEFAULT_PUBLICATIONS_SETTINGS,
            },
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertEqual(update_res.status_code, status.HTTP_200_OK, update_res.data)

        second_res = self.client.get(self.public_url)
        self.assertEqual(second_res.status_code, status.HTTP_200_OK)
        self.assertEqual(second_res.data["header"]["name"], "Nom mis a jour")

    def test_admin_put_limits_publications_and_links(self):
        payload = {
            "header": DEFAULT_HEADER_SETTINGS,
            "homeHero": DEFAULT_HOME_HERO_SETTINGS,
            "about": {
                "title": "  ",
                "subtitle": " Une approche claire ",
                "highlight": {
                    "intro": "  ",
                    "items": [
                        {"id": "about-item-1", "text": "  Clarte  "},
                        {"id": "", "text": "  Sans id  "},
                        {"id": "about-item-3", "text": "  "},
                        {"id": "about-item-4", "text": "  Durabilite  "},
                        {"id": "about-item-5", "text": "  Trop  "},
                    ],
                },
            },
            "promise": DEFAULT_PROMISE_SETTINGS,
            "method": DEFAULT_METHOD_SETTINGS,
            "publications": {
                "title": "Publications",
                "subtitle": "Sous-titre",
                "highlight": {
                    "title": "Encart",
                    "content": "Contenu",
                },
                "items": [
                    {
                        "id": f"publication-{index}",
                        "title": f"Publication {index}",
                        "content": f"Contenu {index}",
                        "links": [
                            {
                                "id": f"publication-{index}-link-{link_index}",
                                "title": f"Lien {link_index}",
                                "url": f"https://example.com/{index}/{link_index}",
                            }
                            for link_index in range(1, 6)
                        ],
                    }
                    for index in range(1, 7)
                ],
            },
        }

        res = self.client.put(
            self.admin_url,
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        settings = SiteSettings.get_solo()
        self.assertEqual(settings.about["title"], DEFAULT_ABOUT_SETTINGS["title"])
        self.assertEqual(settings.about["subtitle"], "Une approche claire")
        self.assertEqual(
            settings.about["highlight"]["intro"],
            DEFAULT_ABOUT_SETTINGS["highlight"]["intro"],
        )
        self.assertEqual(len(settings.about["highlight"]["items"]), 3)
        self.assertEqual(settings.about["highlight"]["items"][0]["text"], "Clarte")
        self.assertEqual(len(settings.publications["items"]), 4)
        self.assertEqual(len(settings.publications["items"][0]["links"]), 3)

    def test_admin_put_keeps_empty_publications_list_instead_of_restoring_defaults(
        self,
    ):
        payload = {
            "header": DEFAULT_HEADER_SETTINGS,
            "homeHero": DEFAULT_HOME_HERO_SETTINGS,
            "about": DEFAULT_ABOUT_SETTINGS,
            "promise": DEFAULT_PROMISE_SETTINGS,
            "method": DEFAULT_METHOD_SETTINGS,
            "publications": {
                "title": "Publications",
                "subtitle": "Sous-titre",
                "highlight": {
                    "title": "Encart",
                    "content": "Contenu",
                },
                "items": [],
            },
        }

        res = self.client.put(
            self.admin_url,
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        settings = SiteSettings.get_solo()
        self.assertEqual(settings.publications["items"], [])

        public_res = self.client.get(self.public_url)
        self.assertEqual(public_res.status_code, status.HTTP_200_OK)
        self.assertEqual(public_res.data["publications"]["items"], [])


class SiteSettingsModelTests(TestCase):
    def test_get_solo_returns_singleton_instance(self):
        first = SiteSettings.get_solo()
        second = SiteSettings.get_solo()

        self.assertEqual(first.pk, 1)
        self.assertEqual(second.pk, 1)
        self.assertEqual(SiteSettings.objects.count(), 1)


class SiteSettingsDefaultsTests(TestCase):
    def test_default_header_settings_returns_deep_copy(self):
        header = default_header_settings()

        header["name"] = "Changed name"

        self.assertEqual(DEFAULT_HEADER_SETTINGS["name"], "Garance Richard")

    def test_default_about_settings_returns_deep_copy(self):
        about = default_about_settings()

        about["highlight"]["intro"] = "Changed intro"
        about["highlight"]["items"][0]["text"] = "Changed item"

        self.assertEqual(
            DEFAULT_ABOUT_SETTINGS["highlight"]["intro"],
            "Intervenir avec sobriete, clarifier les priorites et aider les equipes a reprendre de l air sans theatre organisationnel.",
        )
        self.assertEqual(
            DEFAULT_ABOUT_SETTINGS["highlight"]["items"][0]["text"],
            "Pragmatisme ancre dans le terrain",
        )

    def test_default_home_hero_settings_returns_deep_copy(self):
        hero = default_home_hero_settings()

        hero["links"][0]["label"] = "Changed label"
        hero["keywords"].append("Nouveau")
        hero["cards"][0]["title"] = "Changed title"

        self.assertEqual(
            DEFAULT_HOME_HERO_SETTINGS["links"][0]["label"],
            "Voir les offres",
        )
        self.assertEqual(
            DEFAULT_HOME_HERO_SETTINGS["keywords"], ["Clarte", "Flux", "Ancrage"]
        )
        self.assertEqual(
            DEFAULT_HOME_HERO_SETTINGS["cards"][0]["title"],
            "Cadre d'intervention",
        )

    def test_default_promise_settings_returns_deep_copy(self):
        promise = default_promise_settings()

        promise["cards"][0]["title"] = "Changed title"

        self.assertEqual(
            DEFAULT_PROMISE_SETTINGS["cards"][0]["title"],
            "Diagnostic rapide",
        )

    def test_default_method_settings_returns_deep_copy(self):
        method = default_method_settings()

        method["steps"][0]["title"] = "Changed title"

        self.assertEqual(
            DEFAULT_METHOD_SETTINGS["steps"][0]["title"],
            "Observer",
        )

    def test_default_publications_settings_returns_deep_copy(self):
        publications = default_publications_settings()

        publications["highlight"]["title"] = "Changed highlight"
        publications["items"][0]["title"] = "Changed publication"
        publications["items"][0]["links"][0]["title"] = "Changed link"

        self.assertEqual(
            DEFAULT_PUBLICATIONS_SETTINGS["highlight"]["title"],
            "Format type",
        )
        self.assertEqual(
            DEFAULT_PUBLICATIONS_SETTINGS["items"][0]["title"],
            "Coaching Lean-Agile - transformation pragmatique",
        )
        self.assertEqual(
            DEFAULT_PUBLICATIONS_SETTINGS["items"][0]["links"][0]["title"],
            "Exemple de cadrage de transformation",
        )


class SiteSettingsCacheTests(TestCase):
    def setUp(self):
        cache.clear()

    def test_get_public_site_settings_cache_key_initializes_version(self):
        cache_key = get_public_site_settings_cache_key()

        self.assertEqual(cache_key, "site_settings:public:v1")
        self.assertEqual(cache.get(SITE_SETTINGS_CACHE_VERSION_KEY), 1)

    def test_bump_public_site_settings_cache_version_increments_existing_value(self):
        get_public_site_settings_cache_key()

        bump_public_site_settings_cache_version()

        self.assertEqual(cache.get(SITE_SETTINGS_CACHE_VERSION_KEY), 2)
        self.assertEqual(
            get_public_site_settings_cache_key(), "site_settings:public:v2"
        )

    def test_bump_public_site_settings_cache_version_initializes_missing_value_to_two(
        self,
    ):
        bump_public_site_settings_cache_version()

        self.assertEqual(cache.get(SITE_SETTINGS_CACHE_VERSION_KEY), 2)
        self.assertEqual(
            get_public_site_settings_cache_key(), "site_settings:public:v2"
        )
