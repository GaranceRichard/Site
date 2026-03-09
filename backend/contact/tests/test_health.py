from unittest.mock import patch

from django.test.utils import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from config.views import HealthAnonThrottle


class HealthChecksTests(APITestCase):
    @override_settings(HEALTH_THROTTLE_RATE="12/min")
    def test_health_throttle_uses_django_setting(self):
        self.assertEqual(HealthAnonThrottle().get_rate(), "12/min")

    @override_settings()
    def test_health_throttle_defaults_when_setting_missing(self):
        self.assertEqual(HealthAnonThrottle().get_rate(), "60/min")

    @override_settings(REDIS_URL="")
    def test_health_endpoint_is_ok_when_dependencies_are_ready(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data.get("ok"), True)
        self.assertEqual(res.data["db"].get("ok"), True)
        self.assertEqual(res.data["redis"].get("skipped"), True)

    def test_health_live_is_ok(self):
        res = self.client.get("/api/health/live")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data.get("ok"), True)
        self.assertEqual(res.data.get("live"), True)

    @override_settings(REDIS_URL="")
    def test_health_ready_skips_redis_when_unset(self):
        res = self.client.get("/api/health/ready")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data.get("ok"), True)
        self.assertEqual(res.data["redis"].get("skipped"), True)

    @override_settings(REDIS_URL="redis://127.0.0.1:6390/0")
    def test_health_ready_reports_redis_failure(self):
        with self.assertLogs("django.request", level="ERROR"):
            res = self.client.get("/api/health/ready")
        self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(res.data.get("ok"), False)
        self.assertEqual(res.data["redis"].get("ok"), False)

    @override_settings(REDIS_URL="")
    def test_health_ready_reports_db_failure(self):
        with patch("django.db.connection.cursor", side_effect=Exception("boom")):
            with self.assertLogs("django.request", level="ERROR"):
                res = self.client.get("/api/health/ready")
        self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(res.data.get("ok"), False)
        self.assertEqual(res.data["db"].get("ok"), False)
