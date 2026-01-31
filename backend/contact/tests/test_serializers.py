from django.test import TestCase

from contact.models import Reference
from contact.serializers import ContactMessageSerializer, ReferenceSerializer


class ContactMessageSerializerTests(TestCase):
    def test_consent_is_required(self):
        payload = {
            "name": "Test",
            "email": "test@example.com",
            "subject": "Bonjour",
            "message": "Message",
            "consent": False,
            "source": "tests",
        }

        serializer = ContactMessageSerializer(data=payload)
        self.assertFalse(serializer.is_valid())
        self.assertIn("consent", serializer.errors)


class ReferenceSerializerTests(TestCase):
    def test_order_index_auto_increments(self):
        payload = {
            "reference": "Ref A",
            "image": "/media/references/a.webp",
            "icon": "",
            "situation": "",
            "tasks": [],
            "actions": [],
            "results": [],
        }

        serializer = ReferenceSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        ref = serializer.save()
        self.assertEqual(ref.order_index, 1)

        payload_b = {
            "reference": "Ref B",
            "image": "/media/references/b.webp",
            "icon": "",
            "situation": "",
            "tasks": [],
            "actions": [],
            "results": [],
            "order_index": 0,
        }

        serializer_b = ReferenceSerializer(data=payload_b)
        self.assertTrue(serializer_b.is_valid(), serializer_b.errors)
        ref_b = serializer_b.save()
        self.assertEqual(ref_b.order_index, 2)

    def test_order_index_preserves_explicit_value(self):
        payload = {
            "reference": "Ref C",
            "image": "/media/references/c.webp",
            "icon": "",
            "situation": "",
            "tasks": [],
            "actions": [],
            "results": [],
            "order_index": 7,
        }

        serializer = ReferenceSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        ref = serializer.save()
        self.assertEqual(ref.order_index, 7)

    def test_rejects_external_image_url(self):
        payload = {
            "reference": "Ref External",
            "image": "https://example.com/a.png",
            "icon": "",
            "situation": "",
            "tasks": [],
            "actions": [],
            "results": [],
        }

        serializer = ReferenceSerializer(data=payload)
        self.assertFalse(serializer.is_valid())
        self.assertIn("image", serializer.errors)
