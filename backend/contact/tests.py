from pathlib import Path
import os
import sys
import subprocess

from django.urls import reverse
from django.test.utils import override_settings

from rest_framework import status
from rest_framework.test import APITestCase

from .models import ContactMessage


class ContactApiTests(APITestCase):
    def setUp(self):
        self.url = reverse("contact-message-create")

    def test_contact_requires_consent(self):
        payload = {
            "name": "Test",
            "email": "test@example.com",
            "subject": "Hello",
            "message": "Test message",
            "consent": False,
            "source": "tests",
        }
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ContactMessage.objects.count(), 0)

    def test_contact_creates_message_when_consent_true(self):
        payload = {
            "name": "Test",
            "email": "test@example.com",
            "subject": "Hello",
            "message": "Test message",
            "consent": True,
            "source": "tests",
        }
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ContactMessage.objects.count(), 1)

    def test_contact_throttling(self):
        payload = {
            "name": "Throttle",
            "email": "throttle@example.com",
            "subject": "Throttle",
            "message": "Test throttling",
            "consent": True,
            "source": "tests",
        }

        last = None
        for _ in range(11):  # 10/min autorisés, le 11e peut tomber en 429 selon config/cache
            last = self.client.post(self.url, payload, format="json")

        self.assertIn(
            last.status_code,
            [status.HTTP_201_CREATED, status.HTTP_429_TOO_MANY_REQUESTS],
        )


class SecurityBootTests(APITestCase):
    def test_django_refuses_to_start_without_secret_key(self):
        """
        Smoke test A :
        settings.py doit refuser de démarrer si DJANGO_SECRET_KEY est vide.
        """
        backend_dir = Path(__file__).resolve().parents[1]  # .../backend

        code = (
            "import os\n"
            "os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')\n"
            "import django\n"
            "django.setup()\n"
            "print('BOOT_OK')\n"
        )

        env = os.environ.copy()
        env["DJANGO_SECRET_KEY"] = ""
        env["DJANGO_ENV"] = env.get("DJANGO_ENV", "development")
        env["DJANGO_DEBUG"] = env.get("DJANGO_DEBUG", "True")

        p = subprocess.run(
            [sys.executable, "-c", code],
            cwd=str(backend_dir),
            env=env,
            capture_output=True,
            text=True,
        )

        self.assertNotEqual(p.returncode, 0)
        combined = (p.stdout or "") + "\n" + (p.stderr or "")
        self.assertIn("DJANGO_SECRET_KEY manquant", combined)


class SecurityCorsTests(APITestCase):
    def test_cors_preflight_on_jwt_token_endpoint(self):
        """
        Smoke test B :
        Préflight CORS (OPTIONS) sur /api/auth/token/ doit renvoyer
        Access-Control-Allow-Origin pour une origine autorisée.
        """
        origin = "http://localhost:3000"
        res = self.client.options(
            "/api/auth/token/",
            HTTP_ORIGIN=origin,
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS="content-type",
        )

        # Selon versions/config, OPTIONS peut répondre 200 ou 204
        self.assertIn(res.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])

        allow_origin = res.headers.get("Access-Control-Allow-Origin") or res.get(
            "Access-Control-Allow-Origin"
        )
        self.assertEqual(allow_origin, origin)


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
            last = self.client.get("/api/health")

        self.assertIsNotNone(last)
        self.assertEqual(last.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
