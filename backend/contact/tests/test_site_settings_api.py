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
    DEFAULT_HEADER_SETTINGS,
    DEFAULT_HOME_HERO_SETTINGS,
    DEFAULT_PROMISE_SETTINGS,
    default_header_settings,
    default_home_hero_settings,
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
        self.assertEqual(res.data["promise"], DEFAULT_PROMISE_SETTINGS)
        self.assertEqual(SiteSettings.objects.count(), 1)

    def test_public_endpoint_without_trailing_slash_returns_defaults(self):
        res = self.client.get("/api/settings")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["header"], DEFAULT_HEADER_SETTINGS)
        self.assertEqual(res.data["homeHero"], DEFAULT_HOME_HERO_SETTINGS)
        self.assertEqual(res.data["promise"], DEFAULT_PROMISE_SETTINGS)

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
        self.assertEqual(settings.promise["title"], "Titre positionnement")

        public_res = self.client.get(self.public_url)
        self.assertEqual(public_res.status_code, status.HTTP_200_OK)
        self.assertEqual(public_res.data["header"]["name"], "Jane Doe")
        self.assertEqual(public_res.data["homeHero"]["eyebrow"], "Nouveau surtitre")
        self.assertEqual(public_res.data["promise"]["title"], "Titre positionnement")

    def test_admin_put_without_trailing_slash_updates_settings(self):
        payload = {
            "header": {
                "name": "Sans slash",
                "title": "Coach Agile",
                "bookingUrl": "https://example.com/booking",
            },
            "homeHero": DEFAULT_HOME_HERO_SETTINGS,
            "promise": DEFAULT_PROMISE_SETTINGS,
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
                "promise": DEFAULT_PROMISE_SETTINGS,
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
                "promise": DEFAULT_PROMISE_SETTINGS,
            },
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertEqual(update_res.status_code, status.HTTP_200_OK, update_res.data)

        second_res = self.client.get(self.public_url)
        self.assertEqual(second_res.status_code, status.HTTP_200_OK)
        self.assertEqual(second_res.data["header"]["name"], "Nom mis a jour")


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
