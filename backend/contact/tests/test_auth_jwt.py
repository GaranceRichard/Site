from django.contrib.auth import get_user_model
from django.conf import settings
from django.test.utils import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from contact.models import ContactMessage


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
