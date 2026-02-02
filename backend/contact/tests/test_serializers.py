import tempfile

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.test import TestCase
from django.test.utils import override_settings

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

    @override_settings(MEDIA_URL="/media/")
    def test_update_image_deletes_old_image_and_thumbnail(self):
        with tempfile.TemporaryDirectory() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                old_image = default_storage.save("references/old.webp", ContentFile(b"old-image"))
                old_thumb = default_storage.save("references/thumbs/old.webp", ContentFile(b"old-thumb"))

                ref = Reference.objects.create(
                    reference="Ref update",
                    image=old_image,
                    image_thumb=old_thumb,
                    icon="",
                    situation="",
                    tasks=[],
                    actions=[],
                    results=[],
                )

                self.assertTrue(default_storage.exists(old_image))
                self.assertTrue(default_storage.exists(old_thumb))

                serializer = ReferenceSerializer(
                    instance=ref,
                    data={"image": "/media/references/new.webp"},
                    partial=True,
                )
                self.assertTrue(serializer.is_valid(), serializer.errors)
                serializer.save()

                self.assertFalse(default_storage.exists(old_image))
                self.assertFalse(default_storage.exists(old_thumb))

    @override_settings(MEDIA_URL="/media/")
    def test_update_same_image_keeps_existing_files(self):
        with tempfile.TemporaryDirectory() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                old_image = default_storage.save("references/same.webp", ContentFile(b"same-image"))
                old_thumb = default_storage.save("references/thumbs/same.webp", ContentFile(b"same-thumb"))

                ref = Reference.objects.create(
                    reference="Ref unchanged",
                    image=old_image,
                    image_thumb=old_thumb,
                    icon="",
                    situation="",
                    tasks=[],
                    actions=[],
                    results=[],
                )

                serializer = ReferenceSerializer(
                    instance=ref,
                    data={"image": f"/media/{old_image}"},
                    partial=True,
                )
                self.assertTrue(serializer.is_valid(), serializer.errors)
                serializer.save()

                self.assertTrue(default_storage.exists(old_image))
                self.assertTrue(default_storage.exists(old_thumb))
