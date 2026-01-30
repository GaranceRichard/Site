from unittest.mock import patch

from django.test.utils import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
class HealthChecksTests(APITestCase):
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
