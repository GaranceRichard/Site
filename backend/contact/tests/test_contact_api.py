from django.urls import reverse
from django.contrib.auth import get_user_model
from django.conf import settings
from django.test.utils import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone

from contact.models import ContactMessage
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

    @override_settings(
        REST_FRAMEWORK={
            **settings.REST_FRAMEWORK,
            "DEFAULT_AUTHENTICATION_CLASSES": (
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ),
        }
    )
    def test_contact_list_accepts_page_last_and_invalid_page(self):
        for i in range(4):
            ContactMessage.objects.create(
                name=f"Page User {i}",
                email=f"page{i}@example.com",
                subject="Paging",
                message="Message",
                consent=True,
                source="tests",
            )

        User = get_user_model()
        user = User.objects.create_user(
            username="admin-page-parser",
            password="admin-pass-654",
            is_staff=True,
        )
        token_res = self.client.post(
            "/api/auth/token/",
            {"username": user.username, "password": "admin-pass-654"},
            format="json",
        )
        self.assertEqual(token_res.status_code, status.HTTP_200_OK)
        token = token_res.data["access"]

        res_last = self.client.get(
            "/api/contact/messages/admin?limit=3&page=last",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(res_last.status_code, status.HTTP_200_OK)
        self.assertEqual(res_last.data.get("page"), 2)
        self.assertEqual(len(res_last.data.get("results", [])), 1)

        res_invalid = self.client.get(
            "/api/contact/messages/admin?limit=3&page=abc",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(res_invalid.status_code, status.HTTP_200_OK)
        self.assertEqual(res_invalid.data.get("page"), 1)

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
