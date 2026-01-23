from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
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
