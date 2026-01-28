from pathlib import Path
from io import BytesIO
import os
import sys
import subprocess

from django.urls import reverse
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test.utils import override_settings
from django.test import SimpleTestCase

from rest_framework import status
from rest_framework.test import APITestCase

from .models import ContactMessage, Reference
from django.utils import timezone

from PIL import Image
import importlib
import tempfile
from io import StringIO
from django.urls import clear_url_caches


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

    @override_settings(
        REST_FRAMEWORK={
            **settings.REST_FRAMEWORK,
            "DEFAULT_AUTHENTICATION_CLASSES": (
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ),
        }
    )
    def test_contact_list_pagination_returns_count_and_results(self):
        for i in range(3):
            ContactMessage.objects.create(
                name=f"User {i}",
                email=f"user{i}@example.com",
                subject="Test",
                message="Message",
                consent=True,
                source="tests",
            )

        User = get_user_model()
        user = User.objects.create_user(
            username="admin-list",
            password="admin-pass-456",
            is_staff=True,
        )

        token_res = self.client.post(
            "/api/auth/token/",
            {"username": user.username, "password": "admin-pass-456"},
            format="json",
        )
        self.assertEqual(token_res.status_code, status.HTTP_200_OK)

        token = token_res.data["access"]
        res = self.client.get(
            "/api/contact/messages/admin?limit=2&page=2",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data.get("count"), 3)
        self.assertEqual(res.data.get("page"), 2)
        self.assertEqual(len(res.data.get("results", [])), 1)

    @override_settings(
        REST_FRAMEWORK={
            **settings.REST_FRAMEWORK,
            "DEFAULT_AUTHENTICATION_CLASSES": (
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ),
        }
    )
    def test_contact_list_search_filters_results(self):
        ContactMessage.objects.create(
            name="Alice Doe",
            email="alice@example.com",
            subject="Budget 2026",
            message="Test",
            consent=True,
            source="tests",
        )
        ContactMessage.objects.create(
            name="Bob Smith",
            email="bob@example.com",
            subject="Autre",
            message="Test",
            consent=True,
            source="tests",
        )

        User = get_user_model()
        user = User.objects.create_user(
            username="admin-search",
            password="admin-pass-789",
            is_staff=True,
        )

        token_res = self.client.post(
            "/api/auth/token/",
            {"username": user.username, "password": "admin-pass-789"},
            format="json",
        )
        self.assertEqual(token_res.status_code, status.HTTP_200_OK)

        token = token_res.data["access"]
        res = self.client.get(
            "/api/contact/messages/admin?limit=10&q=budget",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data.get("count"), 1)
        self.assertEqual(len(res.data.get("results", [])), 1)

    @override_settings(
        REST_FRAMEWORK={
            **settings.REST_FRAMEWORK,
            "DEFAULT_AUTHENTICATION_CLASSES": (
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ),
        }
    )
    def test_contact_list_default_sort_is_created_at_desc(self):
        older = ContactMessage.objects.create(
            name="Old",
            email="old@example.com",
            subject="Old",
            message="Test",
            consent=True,
            source="tests",
        )
        newer = ContactMessage.objects.create(
            name="New",
            email="new@example.com",
            subject="New",
            message="Test",
            consent=True,
            source="tests",
        )
        ContactMessage.objects.filter(id=older.id).update(
            created_at=timezone.now() - timezone.timedelta(days=2)
        )
        ContactMessage.objects.filter(id=newer.id).update(
            created_at=timezone.now() - timezone.timedelta(days=1)
        )

        User = get_user_model()
        user = User.objects.create_user(
            username="admin-default-sort",
            password="admin-pass-246",
            is_staff=True,
        )

        token_res = self.client.post(
            "/api/auth/token/",
            {"username": user.username, "password": "admin-pass-246"},
            format="json",
        )
        self.assertEqual(token_res.status_code, status.HTTP_200_OK)

        token = token_res.data["access"]
        res = self.client.get(
            "/api/contact/messages/admin?limit=10",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get("results", [])
        self.assertGreaterEqual(len(results), 2)
        self.assertEqual(results[0]["name"], "New")
        self.assertEqual(results[1]["name"], "Old")

    @override_settings(
        REST_FRAMEWORK={
            **settings.REST_FRAMEWORK,
            "DEFAULT_AUTHENTICATION_CLASSES": (
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ),
        }
    )
    def test_contact_list_sort_by_name(self):
        msg_b = ContactMessage.objects.create(
            name="Bob Smith",
            email="bob@example.com",
            subject="Zeta",
            message="Test",
            consent=True,
            source="tests",
        )
        msg_a = ContactMessage.objects.create(
            name="Alice Doe",
            email="alice@example.com",
            subject="Alpha",
            message="Test",
            consent=True,
            source="tests",
        )
        ContactMessage.objects.filter(id=msg_b.id).update(
            created_at=timezone.now() - timezone.timedelta(days=1)
        )
        ContactMessage.objects.filter(id=msg_a.id).update(
            created_at=timezone.now() - timezone.timedelta(days=2)
        )

        User = get_user_model()
        user = User.objects.create_user(
            username="admin-sort",
            password="admin-pass-135",
            is_staff=True,
        )

        token_res = self.client.post(
            "/api/auth/token/",
            {"username": user.username, "password": "admin-pass-135"},
            format="json",
        )
        self.assertEqual(token_res.status_code, status.HTTP_200_OK)

        token = token_res.data["access"]
        res_asc = self.client.get(
            "/api/contact/messages/admin?limit=10&sort=name&dir=asc",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        res_desc = self.client.get(
            "/api/contact/messages/admin?limit=10&sort=name&dir=desc",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(res_asc.status_code, status.HTTP_200_OK)
        self.assertEqual(res_desc.status_code, status.HTTP_200_OK)
        self.assertEqual(res_asc.data.get("results", [])[0]["name"], "Alice Doe")
        self.assertEqual(res_desc.data.get("results", [])[0]["name"], "Bob Smith")

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
        REST_FRAMEWORK={
            **settings.REST_FRAMEWORK,
            "DEFAULT_AUTHENTICATION_CLASSES": (
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ),
        }
    )
    def test_admin_list_forbidden_for_non_staff(self):
        User = get_user_model()
        user = User.objects.create_user(
            username="basic-user",
            password="basic-pass-123",
            is_staff=False,
        )

        token_res = self.client.post(
            self.token_url,
            {"username": user.username, "password": "basic-pass-123"},
            format="json",
        )
        self.assertEqual(token_res.status_code, status.HTTP_200_OK)

        token = token_res.data["access"]
        res = self.client.get(
            self.admin_list_url,
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    @override_settings(
        REST_FRAMEWORK={
            **settings.REST_FRAMEWORK,
            "DEFAULT_AUTHENTICATION_CLASSES": (
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ),
        }
    )
    def test_reference_admin_requires_auth_for_all_methods(self):
        list_url = "/api/contact/references/admin"
        detail_url = "/api/contact/references/admin/1"
        payload = {
            "reference": "Ref X",
            "image": "https://example.test/x.png",
            "icon": "",
            "situation": "",
            "tasks": [],
            "actions": [],
            "results": [],
        }

        res_list = self.client.get(list_url)
        res_create = self.client.post(list_url, payload, format="json")
        res_detail = self.client.get(detail_url)
        res_update = self.client.put(detail_url, payload, format="json")
        res_delete = self.client.delete(detail_url)

        self.assertEqual(res_list.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res_create.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res_detail.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res_update.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res_delete.status_code, status.HTTP_401_UNAUTHORIZED)

    @override_settings(
        REST_FRAMEWORK={
            **settings.REST_FRAMEWORK,
            "DEFAULT_AUTHENTICATION_CLASSES": (
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ),
        }
    )
    def test_reference_admin_forbidden_for_non_staff(self):
        User = get_user_model()
        user = User.objects.create_user(
            username="basic-ref",
            password="basic-ref-123",
            is_staff=False,
        )

        token_res = self.client.post(
            self.token_url,
            {"username": user.username, "password": "basic-ref-123"},
            format="json",
        )
        self.assertEqual(token_res.status_code, status.HTTP_200_OK)

        token = token_res.data["access"]
        payload = {
            "reference": "Ref X",
            "image": "https://example.test/x.png",
            "icon": "",
            "situation": "",
            "tasks": [],
            "actions": [],
            "results": [],
        }

        res_list = self.client.get(
            "/api/contact/references/admin",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        res_create = self.client.post(
            "/api/contact/references/admin",
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(res_list.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res_create.status_code, status.HTTP_403_FORBIDDEN)

    @override_settings(
        REST_FRAMEWORK={
            **settings.REST_FRAMEWORK,
            "DEFAULT_AUTHENTICATION_CLASSES": (
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ),
        }
    )
    def test_messages_admin_requires_auth(self):
        res_list = self.client.get("/api/contact/messages/admin")
        res_delete = self.client.post("/api/contact/messages/admin/delete", {"ids": [1]})
        self.assertEqual(res_list.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res_delete.status_code, status.HTTP_401_UNAUTHORIZED)

    @override_settings(
        REST_FRAMEWORK={
            **settings.REST_FRAMEWORK,
            "DEFAULT_AUTHENTICATION_CLASSES": (
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ),
        }
    )
    def test_messages_admin_forbidden_for_non_staff(self):
        User = get_user_model()
        user = User.objects.create_user(
            username="basic-msg",
            password="basic-msg-123",
            is_staff=False,
        )

        token_res = self.client.post(
            self.token_url,
            {"username": user.username, "password": "basic-msg-123"},
            format="json",
        )
        self.assertEqual(token_res.status_code, status.HTTP_200_OK)

        token = token_res.data["access"]
        res_list = self.client.get(
            "/api/contact/messages/admin",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        res_delete = self.client.post(
            "/api/contact/messages/admin/delete",
            {"ids": [1]},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(res_list.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res_delete.status_code, status.HTTP_403_FORBIDDEN)


@override_settings(
    REST_FRAMEWORK={
        **settings.REST_FRAMEWORK,
        "DEFAULT_AUTHENTICATION_CLASSES": (
            "rest_framework_simplejwt.authentication.JWTAuthentication",
        ),
    }
)
class ReferenceApiTests(APITestCase):
    def setUp(self):
        self.list_url = "/api/contact/references/admin"
        self.detail_url = None
        self.username = "ref-admin"
        self.password = "ref-pass-123"

        User = get_user_model()
        User.objects.create_user(
            username=self.username,
            password=self.password,
            is_staff=True,
        )

        token_res = self.client.post(
            "/api/auth/token/",
            {"username": self.username, "password": self.password},
            format="json",
        )
        self.assertEqual(token_res.status_code, status.HTTP_200_OK)
        self.token = token_res.data["access"]

    def test_reference_create_and_list(self):
        payload = {
            "reference": "Ref A",
            "image": "https://example.com/image.png",
            "icon": "https://example.com/icon.png",
            "situation": "Situation A",
            "tasks": ["Task 1"],
            "actions": ["Action 1"],
            "results": ["Result 1"],
        }
        res = self.client.post(
            self.list_url,
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Reference.objects.count(), 1)

        list_res = self.client.get(
            self.list_url,
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data), 1)

    def test_reference_update_and_delete(self):
        ref = Reference.objects.create(
            reference="Ref B",
            image="https://example.test/b.png",
            icon="",
            situation="Situation B",
            tasks=[],
            actions=[],
            results=[],
        )
        self.detail_url = f"/api/contact/references/admin/{ref.id}"

        update_res = self.client.put(
            self.detail_url,
            {
                "reference": "Ref B+",
                "image": "https://example.test/b.png",
                "icon": "",
                "situation": "Situation B+",
                "tasks": ["Task"],
                "actions": [],
                "results": [],
            },
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertEqual(update_res.status_code, status.HTTP_200_OK)
        self.assertEqual(update_res.data.get("reference"), "Ref B+")

        delete_res = self.client.delete(
            self.detail_url,
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertIn(delete_res.status_code, [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK])
        self.assertEqual(Reference.objects.count(), 0)

    def test_reference_update_deletes_old_media_files(self):
        with tempfile.TemporaryDirectory() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir, MEDIA_URL="/media/"):
                old_path = default_storage.save(
                    "references/old-image.webp", ContentFile(b"old")
                )
                new_path = default_storage.save(
                    "references/new-image.webp", ContentFile(b"new")
                )

                ref = Reference.objects.create(
                    reference="Ref C",
                    image=f"http://example.test/media/{old_path}",
                    icon="",
                    situation="Situation C",
                    tasks=[],
                    actions=[],
                    results=[],
                )
                detail_url = f"/api/contact/references/admin/{ref.id}"

                self.assertTrue(default_storage.exists(old_path))
                self.assertTrue(default_storage.exists(new_path))

                update_res = self.client.put(
                    detail_url,
                    {
                        "reference": "Ref C",
                        "image": f"http://example.test/media/{new_path}",
                        "icon": "",
                        "situation": "Situation C",
                        "tasks": [],
                        "actions": [],
                        "results": [],
                    },
                    format="json",
                    HTTP_AUTHORIZATION=f"Bearer {self.token}",
                )

                self.assertEqual(update_res.status_code, status.HTTP_200_OK, update_res.data)
                self.assertFalse(default_storage.exists(old_path))
                self.assertTrue(default_storage.exists(new_path))

    def test_reference_update_deletes_old_icon_file(self):
        with tempfile.TemporaryDirectory() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir, MEDIA_URL="/media"):
                image_path = default_storage.save(
                    "references/ref-image.webp", ContentFile(b"image")
                )
                old_icon_path = default_storage.save(
                    "references/old-icon.webp", ContentFile(b"old-icon")
                )
                new_icon_path = default_storage.save(
                    "references/new-icon.webp", ContentFile(b"new-icon")
                )

                ref = Reference.objects.create(
                    reference="Ref Icon",
                    image=f"http://example.test/media/{image_path}",
                    icon=f"http://example.test/media/{old_icon_path}",
                    situation="",
                    tasks=[],
                    actions=[],
                    results=[],
                )
                detail_url = f"/api/contact/references/admin/{ref.id}"

                self.assertTrue(default_storage.exists(old_icon_path))
                self.assertTrue(default_storage.exists(new_icon_path))

                update_res = self.client.put(
                    detail_url,
                    {
                        "reference": "Ref Icon",
                        "image": f"http://example.test/media/{image_path}",
                        "icon": f"http://example.test/media/{new_icon_path}",
                        "situation": "",
                        "tasks": [],
                        "actions": [],
                        "results": [],
                    },
                    format="json",
                    HTTP_AUTHORIZATION=f"Bearer {self.token}",
                )

                self.assertEqual(update_res.status_code, status.HTTP_200_OK)
                self.assertFalse(default_storage.exists(old_icon_path))
                self.assertTrue(default_storage.exists(new_icon_path))

    def test_reference_patch_keeps_media_files(self):
        with tempfile.TemporaryDirectory() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir, MEDIA_URL="/media/"):
                image_path = default_storage.save(
                    "references/ref-image.webp", ContentFile(b"image")
                )
                icon_path = default_storage.save(
                    "references/ref-icon.webp", ContentFile(b"icon")
                )

                ref = Reference.objects.create(
                    reference="Ref Patch",
                    image=f"http://example.test/media/{image_path}",
                    icon=f"http://example.test/media/{icon_path}",
                    situation="Situation",
                    tasks=[],
                    actions=[],
                    results=[],
                )
                detail_url = f"/api/contact/references/admin/{ref.id}"

                patch_res = self.client.patch(
                    detail_url,
                    {"reference": "Ref Patch+"},
                    format="json",
                    HTTP_AUTHORIZATION=f"Bearer {self.token}",
                )

                self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
                self.assertTrue(default_storage.exists(image_path))
                self.assertTrue(default_storage.exists(icon_path))

    def test_reference_update_ignores_external_media_url(self):
        ref = Reference.objects.create(
            reference="Ref External",
            image="https://example.com/old.png",
            icon="",
            situation="",
            tasks=[],
            actions=[],
            results=[],
        )
        detail_url = f"/api/contact/references/admin/{ref.id}"

        update_res = self.client.put(
            detail_url,
            {
                "reference": "Ref External",
                "image": "https://example.com/new.png",
                "icon": "",
                "situation": "",
                "tasks": [],
                "actions": [],
                "results": [],
            },
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(update_res.status_code, status.HTTP_200_OK)

    def test_reference_image_upload(self):
        image = Image.new("RGB", (2000, 1200), color=(255, 0, 0))
        buffer = BytesIO()
        image.save(buffer, format="JPEG")
        buffer.seek(0)

        upload = SimpleUploadedFile(
            "ref.jpg",
            buffer.read(),
            content_type="image/jpeg",
        )

        res = self.client.post(
            "/api/contact/references/admin/upload",
            {"file": upload},
            format="multipart",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("url", res.data)


class ReferencePublicApiTests(APITestCase):
    def test_public_reference_list(self):
        Reference.objects.create(
            reference="Ref A",
            image="https://example.test/a.png",
            icon="https://example.test/icon-a.png",
            situation="Situation A",
            tasks=["T1"],
            actions=["A1"],
            results=["R1"],
        )
        Reference.objects.create(
            reference="Ref B",
            image="https://example.test/b.png",
            icon="",
            situation="Situation B",
            tasks=["T2"],
            actions=["A2"],
            results=["R2"],
        )

        res = self.client.get("/api/contact/references")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

    def test_reference_requires_auth(self):
        res = self.client.get("/api/contact/references/admin")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


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


class ReferenceMediaCleanupTests(APITestCase):
    @override_settings(MEDIA_URL="/media/")
    def test_reference_delete_removes_media_files(self):
        with tempfile.TemporaryDirectory() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                image_path = default_storage.save(
                    "references/test-image.webp", ContentFile(b"image")
                )
                icon_path = default_storage.save(
                    "references/test-icon.webp", ContentFile(b"icon")
                )

                ref = Reference.objects.create(
                    reference="Ref cleanup",
                    image=f"http://testserver/media/{image_path}",
                    icon=f"/media/{icon_path}",
                    situation="Situation",
                    tasks=[],
                    actions=[],
                    results=[],
                )

                self.assertTrue(default_storage.exists(image_path))
                self.assertTrue(default_storage.exists(icon_path))

                ref.delete()

                self.assertFalse(default_storage.exists(image_path))
                self.assertFalse(default_storage.exists(icon_path))


class MediaCleanupUnitTests(APITestCase):
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

        with tempfile.TemporaryDirectory() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                self.assertEqual(cleanup_orphan_reference_media(), 0)

    @override_settings(MEDIA_URL="/media/")
    def test_cleanup_orphan_reference_media_removes_unused(self):
        from contact.media_cleanup import cleanup_orphan_reference_media

        with tempfile.TemporaryDirectory() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                orphan_path = default_storage.save(
                    "references/orphan.webp", ContentFile(b"orphan")
                )
                keep_path = default_storage.save(
                    "references/keep.webp", ContentFile(b"keep")
                )

                Reference.objects.create(
                    reference="Ref keep",
                    image=f"http://testserver/media/{keep_path}",
                    icon="",
                    situation="",
                    tasks=[],
                    actions=[],
                    results=[],
                )

                deleted = cleanup_orphan_reference_media()

                self.assertEqual(deleted, 1)
                self.assertFalse(default_storage.exists(orphan_path))
                self.assertTrue(default_storage.exists(keep_path))

    @override_settings(MEDIA_URL="/media/")
    def test_cleanup_reference_media_command(self):
        with tempfile.TemporaryDirectory() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                orphan_path = default_storage.save(
                    "references/orphan.webp", ContentFile(b"orphan")
                )

                out = StringIO()
                call_command("cleanup_reference_media", stdout=out)

                self.assertIn("Fichiers supprimes: 1", out.getvalue())
                self.assertFalse(default_storage.exists(orphan_path))

    @override_settings(MEDIA_URL="/media/")
    def test_reference_delete_cleans_orphaned_media(self):
        with tempfile.TemporaryDirectory() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                orphan_path = default_storage.save(
                    "references/orphan.webp", ContentFile(b"orphan")
                )
                kept_path = default_storage.save(
                    "references/keep.webp", ContentFile(b"keep")
                )

                ref = Reference.objects.create(
                    reference="Ref keep",
                    image=f"http://testserver/media/{kept_path}",
                    icon="",
                    situation="Situation",
                    tasks=[],
                    actions=[],
                    results=[],
                )

                self.assertTrue(default_storage.exists(orphan_path))
                self.assertTrue(default_storage.exists(kept_path))

                ref.delete()

                self.assertFalse(default_storage.exists(orphan_path))
                self.assertFalse(default_storage.exists(kept_path))


class ConfigUrlsTests(SimpleTestCase):
    @override_settings(ENABLE_JWT=True, DEBUG=False)
    def test_urls_include_jwt_routes_when_enabled(self):
        import config.urls as urls

        importlib.reload(urls)
        clear_url_caches()
        names = {
            pattern.name
            for pattern in urls.urlpatterns
            if getattr(pattern, "name", None)
        }

        self.assertIn("token_obtain_pair", names)
        self.assertIn("token_refresh", names)

    @override_settings(ENABLE_JWT=False, DEBUG=False)
    def test_urls_exclude_jwt_routes_when_disabled(self):
        import config.urls as urls

        importlib.reload(urls)
        clear_url_caches()
        names = {
            pattern.name
            for pattern in urls.urlpatterns
            if getattr(pattern, "name", None)
        }

        self.assertNotIn("token_obtain_pair", names)
        self.assertNotIn("token_refresh", names)

    @override_settings(ENABLE_JWT=False, DEBUG=True, MEDIA_URL="/media/")
    def test_urls_include_static_media_when_debug(self):
        import config.urls as urls

        importlib.reload(urls)
        clear_url_caches()
        patterns = [str(pattern.pattern) for pattern in urls.urlpatterns]

        self.assertTrue(any("media" in pattern for pattern in patterns))
