from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test.utils import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from contact.ga4 import GA4FetchError
from contact.stats_cache import (
    get_stats_summary_cache_key,
    get_stats_summary_last_success_cache_key,
)


@override_settings(
    REST_FRAMEWORK={
        "DEFAULT_AUTHENTICATION_CLASSES": (
            "rest_framework_simplejwt.authentication.JWTAuthentication",
        ),
        "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.AllowAny",),
    }
)
class StatsSummaryApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.url = "/api/stats/summary/"
        user = get_user_model().objects.create_user(
            username="stats-admin",
            password="stats-pass-123",
            is_staff=True,
        )
        token_res = self.client.post(
            "/api/auth/token/",
            {"username": user.username, "password": "stats-pass-123"},
            format="json",
        )
        self.assertEqual(token_res.status_code, status.HTTP_200_OK)
        self.token = token_res.data["access"]

    def auth_get(self):
        return self.client.get(self.url, HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_requires_authentication(self):
        res = self.client.get(self.url)

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    @override_settings(GA4_PROPERTY_ID="", GA4_SERVICE_ACCOUNT_KEY_JSON="")
    def test_returns_not_configured_when_ga4_is_missing(self):
        res = self.auth_get()

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, {"configured": False})

    @override_settings(
        GA4_PROPERTY_ID="123456",
        GA4_SERVICE_ACCOUNT_KEY_JSON='{"client_email":"bot@example.com"}',
    )
    def test_returns_summary_and_populates_cache(self):
        payload = {
            "cachedAt": "2026-03-19T12:00:00+00:00",
            "data": {
                "visitors30d": {
                    "total": 42,
                    "trend": [{"date": "2026-03-19", "value": 42}],
                },
                "topCtas": [{"label": "Contact", "location": "hero", "clicks": 9}],
                "topReferences": [{"name": "Beneva", "opens": 5}],
                "contactFormCompletion": {
                    "attempts": 4,
                    "successes": 3,
                    "completionRate": 75.0,
                },
            },
        }

        with patch(
            "contact.views.fetch_ga4_summary", return_value=payload
        ) as fetch_mock:
            res = self.auth_get()

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["configured"], True)
        self.assertEqual(res.data["data"]["visitors30d"]["total"], 42)
        fetch_mock.assert_called_once()
        self.assertIsNotNone(cache.get(get_stats_summary_cache_key()))
        self.assertIsNotNone(cache.get(get_stats_summary_last_success_cache_key()))

    @override_settings(
        GA4_PROPERTY_ID="123456",
        GA4_SERVICE_ACCOUNT_KEY_JSON='{"client_email":"bot@example.com"}',
    )
    def test_uses_fresh_cache_without_calling_ga4_again(self):
        cached_payload = {
            "configured": True,
            "stale": False,
            "cachedAt": "2026-03-19T12:00:00+00:00",
            "data": {
                "visitors30d": {"total": 10, "trend": []},
                "topCtas": [],
                "topReferences": [],
                "contactFormCompletion": {
                    "attempts": 0,
                    "successes": 0,
                    "completionRate": 0.0,
                },
            },
        }
        cache.set(get_stats_summary_cache_key(), cached_payload, 3600)

        with patch("contact.views.fetch_ga4_summary") as fetch_mock:
            res = self.auth_get()

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["data"]["visitors30d"]["total"], 10)
        fetch_mock.assert_not_called()

    @override_settings(
        GA4_PROPERTY_ID="123456",
        GA4_SERVICE_ACCOUNT_KEY_JSON='{"client_email":"bot@example.com"}',
    )
    def test_returns_last_success_cache_when_ga4_errors(self):
        stale_payload = {
            "configured": True,
            "stale": False,
            "cachedAt": "2026-03-18T12:00:00+00:00",
            "data": {
                "visitors30d": {"total": 15, "trend": []},
                "topCtas": [{"label": "Contact", "location": "footer", "clicks": 2}],
                "topReferences": [{"name": "Castas", "opens": 1}],
                "contactFormCompletion": {
                    "attempts": 2,
                    "successes": 1,
                    "completionRate": 50.0,
                },
            },
        }
        cache.set(get_stats_summary_last_success_cache_key(), stale_payload, 3600)

        with patch(
            "contact.views.fetch_ga4_summary",
            side_effect=GA4FetchError("ga down"),
        ):
            res = self.auth_get()

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["stale"], True)
        self.assertEqual(res.data["cachedAt"], "2026-03-18T12:00:00+00:00")
        self.assertEqual(res.data["warning"], "ga down")
