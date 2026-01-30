from django.test.utils import override_settings
from rest_framework import status
from rest_framework.test import APITestCase


@override_settings(
    # Cache persistant pour que DRF puisse compter les hits
    CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}},
    # Rate dédié à /api/health (lu par HealthAnonThrottle.get_rate())
    HEALTH_THROTTLE_RATE="3/min",
)
class SecurityGlobalThrottleTests(APITestCase):
    def test_global_rate_limit_applies_to_health_endpoint(self):
        """
        Smoke test C :
        /api/health doit être limité.
        Pré-requis: HealthView utilise HealthAnonThrottle (rate via HEALTH_THROTTLE_RATE).
        Après 3 requêtes, la 4e doit finir en 429.
        """
        last = None
        for _ in range(4):
            last = self.client.get("/api/health", REMOTE_ADDR="127.0.0.1")

        self.assertIsNotNone(last)
        self.assertEqual(last.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
