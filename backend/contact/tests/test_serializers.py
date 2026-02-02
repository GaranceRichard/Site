import tempfile
from io import BytesIO
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.test import TestCase
from django.test.utils import override_settings
from rest_framework import serializers
from rest_framework.test import APIRequestFactory
from PIL import Image

from contact.models import Reference
from contact.serializers import ContactMessageSerializer, MediaPathField, ReferenceSerializer


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

    def test_media_path_field_accepts_empty_string(self):
        field = MediaPathField()
        self.assertEqual(field.to_internal_value("  "), "")

    @override_settings(MEDIA_ROOT=None)
    def test_media_path_field_accepts_uploaded_file(self):
        buffer = BytesIO()
        Image.new("RGB", (2, 2), color="white").save(buffer, format="PNG")
        buffer.seek(0)
        payload = {
            "reference": "Ref upload",
            "image": SimpleUploadedFile(
                "tiny.png",
                buffer.getvalue(),
                content_type="image/png",
            ),
            "icon": "",
            "situation": "",
            "tasks": [],
            "actions": [],
            "results": [],
        }

        serializer = ReferenceSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    @override_settings(MEDIA_URL="/media/")
    def test_media_path_field_representation_with_and_without_request(self):
        class DummySerializer(serializers.Serializer):
            image = MediaPathField()

        request = APIRequestFactory().get("/api/contact/references")
        serializer_with_request = DummySerializer(context={"request": request})
        field_with_request = serializer_with_request.fields["image"]
        self.assertEqual(
            field_with_request.to_representation("references/sample.webp"),
            "http://testserver/media/references/sample.webp",
        )

        serializer_without_request = DummySerializer()
        field_without_request = serializer_without_request.fields["image"]
        self.assertEqual(
            field_without_request.to_representation("references/sample.webp"),
            "/media/references/sample.webp",
        )
        self.assertEqual(field_without_request.to_representation(""), "")

    def test_media_path_field_representation_with_url_attribute(self):
        class DummySerializer(serializers.Serializer):
            image = MediaPathField()

        class DummyValue:
            def __init__(self, url):
                self.url = url

        request = APIRequestFactory().get("/api/contact/references")
        serializer_with_request = DummySerializer(context={"request": request})
        field_with_request = serializer_with_request.fields["image"]
        self.assertEqual(
            field_with_request.to_representation(DummyValue("/media/references/from-attr.webp")),
            "http://testserver/media/references/from-attr.webp",
        )

        serializer_without_request = DummySerializer()
        field_without_request = serializer_without_request.fields["image"]
        self.assertEqual(
            field_without_request.to_representation(DummyValue("https://cdn.example.com/img.webp")),
            "https://cdn.example.com/img.webp",
        )

    def test_delete_media_if_changed_skips_non_local_paths(self):
        serializer = ReferenceSerializer()
        self.assertEqual(serializer._as_str(None), "")

        with patch("contact.serializers.default_storage.delete") as delete_mock:
            changed = serializer._delete_media_if_changed(
                "https://example.com/image.png",
                "/media/references/next.webp",
            )
            self.assertTrue(changed)
            delete_mock.assert_not_called()

    @override_settings(MEDIA_URL="/media/")
    def test_update_deletes_old_thumbnail_and_icon(self):
        with tempfile.TemporaryDirectory() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                image_path = default_storage.save("references/base.webp", ContentFile(b"base"))
                old_thumb = default_storage.save("references/thumbs/old.webp", ContentFile(b"old-thumb"))
                old_icon = default_storage.save("references/old-icon.webp", ContentFile(b"old-icon"))

                ref = Reference.objects.create(
                    reference="Ref media update",
                    image=image_path,
                    image_thumb=old_thumb,
                    icon=f"https://example.com/media/{old_icon}",
                    situation="",
                    tasks=[],
                    actions=[],
                    results=[],
                )

                serializer = ReferenceSerializer(
                    instance=ref,
                    data={
                        "image_thumb": "/media/references/thumbs/new.webp",
                        "icon": "https://example.com/media/references/new-icon.webp",
                    },
                    partial=True,
                )
                self.assertTrue(serializer.is_valid(), serializer.errors)
                serializer.save()

                self.assertFalse(default_storage.exists(old_thumb))
                self.assertFalse(default_storage.exists(old_icon))
