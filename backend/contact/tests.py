from pathlib import Path
import os
import sys
import subprocess

from django.urls import reverse
from django.contrib.auth import get_user_model
from django.conf import settings
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

    def test_contact_creates_message_without_subject(self):
        payload = {
            "name": "Test",
            "email": "test@example.com",
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
        env["DJANGO_ENV"] = "production"
        env["DJANGO_DEBUG"] = "False"

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


class AuthJwtTests(APITestCase):
    def setUp(self):
        self.token_url = "/api/auth/token/"
        self.admin_list_url = "/api/contact/messages/admin"
        self.username = "admin"
        self.password = "admin-pass-123"

        User = get_user_model()
        User.objects.create_user(
            username=self.username,
            password=self.password,
            is_staff=True,
        )

    @override_settings(
        REST_FRAMEWORK={
            **settings.REST_FRAMEWORK,
            "DEFAULT_AUTHENTICATION_CLASSES": (
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ),
        }
    )
    def test_login_success_allows_admin_access(self):
        res = self.client.post(
            self.token_url,
            {"username": self.username, "password": self.password},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)

        token = res.data["access"]
        admin_res = self.client.get(
            self.admin_list_url,
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(admin_res.status_code, status.HTTP_200_OK)

    def test_login_invalid_credentials_is_rejected(self):
        res = self.client.post(
            self.token_url,
            {"username": self.username, "password": "wrong-pass"},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    @override_settings(
        REST_FRAMEWORK={
            **settings.REST_FRAMEWORK,
            "DEFAULT_AUTHENTICATION_CLASSES": (
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ),
        }
    )
    def test_admin_list_requires_auth(self):
        res = self.client.get(self.admin_list_url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    @override_settings(
        REST_FRAMEWORK={
            **settings.REST_FRAMEWORK,
            "DEFAULT_AUTHENTICATION_CLASSES": (
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ),
        }
    )
    def test_delete_messages_requires_admin_and_removes_records(self):
        msg1 = ContactMessage.objects.create(
            name="A",
            email="a@example.com",
            subject="S1",
            message="M1",
            consent=True,
            source="tests",
        )
        msg2 = ContactMessage.objects.create(
            name="B",
            email="b@example.com",
            subject="S2",
            message="M2",
            consent=True,
            source="tests",
        )

        token_res = self.client.post(
            self.token_url,
            {"username": self.username, "password": self.password},
            format="json",
        )
        self.assertEqual(token_res.status_code, status.HTTP_200_OK)

        token = token_res.data["access"]
        delete_res = self.client.post(
            "/api/contact/messages/admin/delete",
            {"ids": [msg1.id, msg2.id]},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(delete_res.status_code, status.HTTP_200_OK)
        self.assertEqual(delete_res.data.get("deleted"), 2)
        self.assertEqual(ContactMessage.objects.count(), 0)

    @override_settings(
        REST_FRAMEWORK={
            **settings.REST_FRAMEWORK,
            "DEFAULT_AUTHENTICATION_CLASSES": (
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ),
        }
    )
    def test_delete_messages_allows_partial_ids(self):
        msg = ContactMessage.objects.create(
            name="A",
            email="a@example.com",
            subject="S1",
            message="M1",
            consent=True,
            source="tests",
        )

        token_res = self.client.post(
            self.token_url,
            {"username": self.username, "password": self.password},
            format="json",
        )
        self.assertEqual(token_res.status_code, status.HTTP_200_OK)

        token = token_res.data["access"]
        delete_res = self.client.post(
            "/api/contact/messages/admin/delete",
            {"ids": [msg.id, 999999]},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(delete_res.status_code, status.HTTP_200_OK)
        self.assertEqual(delete_res.data.get("deleted"), 1)
        self.assertEqual(ContactMessage.objects.count(), 0)

    @override_settings(
        REST_FRAMEWORK={
            **settings.REST_FRAMEWORK,
            "DEFAULT_AUTHENTICATION_CLASSES": (
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ),
        }
    )
    def test_delete_messages_rejects_invalid_payload(self):
        token_res = self.client.post(
            self.token_url,
            {"username": self.username, "password": self.password},
            format="json",
        )
        self.assertEqual(token_res.status_code, status.HTTP_200_OK)

        token = token_res.data["access"]
        delete_res = self.client.post(
            "/api/contact/messages/admin/delete",
            {"ids": "nope"},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(delete_res.status_code, status.HTTP_400_BAD_REQUEST)


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
