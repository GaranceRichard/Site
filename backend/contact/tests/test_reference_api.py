from io import BytesIO
import tempfile
from io import BytesIO

from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test.utils import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from PIL import Image

from contact.models import Reference


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
        with tempfile.TemporaryDirectory() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir, MEDIA_URL="/media/"):
                image_path = default_storage.save(
                    "references/ref-a.webp", ContentFile(b"image")
                )
                payload = {
                    "reference": "Ref A",
                    "image": f"/media/{image_path}",
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
                self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
                self.assertEqual(Reference.objects.count(), 1)

                list_res = self.client.get(
                    self.list_url,
                    HTTP_AUTHORIZATION=f"Bearer {self.token}",
                )
                self.assertEqual(list_res.status_code, status.HTTP_200_OK)
                self.assertEqual(len(list_res.data), 1)

    def test_reference_update_and_delete(self):
        with tempfile.TemporaryDirectory() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir, MEDIA_URL="/media/"):
                image_path = default_storage.save(
                    "references/ref-b.webp", ContentFile(b"image")
                )
                ref = Reference.objects.create(
                    reference="Ref B",
                    image=image_path,
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
                        "image": f"/media/{image_path}",
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
                old_thumb = default_storage.save(
                    "references/thumbs/old-image.webp", ContentFile(b"old-thumb")
                )
                new_thumb = default_storage.save(
                    "references/thumbs/new-image.webp", ContentFile(b"new-thumb")
                )

                ref = Reference.objects.create(
                    reference="Ref C",
                    image=old_path,
                    image_thumb=old_thumb,
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
                        "image": f"/media/{new_path}",
                        "image_thumb": f"/media/{new_thumb}",
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
                self.assertFalse(default_storage.exists(old_thumb))
                self.assertTrue(default_storage.exists(new_path))
                self.assertTrue(default_storage.exists(new_thumb))

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
                    image=image_path,
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
                        "image": f"/media/{image_path}",
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
                    image=image_path,
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
        with tempfile.TemporaryDirectory() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir, MEDIA_URL="/media/"):
                image_path = default_storage.save(
                    "references/ref-ext.webp", ContentFile(b"image")
                )
                ref = Reference.objects.create(
                    reference="Ref External",
                    image=image_path,
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

                self.assertEqual(update_res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reference_image_upload(self):
        with tempfile.TemporaryDirectory() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir, MEDIA_URL="/media/"):
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
                self.assertIn("thumbnail_url", res.data)

    def test_reference_image_upload_rejects_invalid_format(self):
        upload = SimpleUploadedFile(
            "ref.txt",
            b"not-an-image",
            content_type="text/plain",
        )

        res = self.client.post(
            "/api/contact/references/admin/upload",
            {"file": upload},
            format="multipart",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reference_image_upload_rejects_large_file(self):
        payload = b"x" * (5 * 1024 * 1024 + 1)
        upload = SimpleUploadedFile(
            "ref.jpg",
            payload,
            content_type="image/jpeg",
        )

        res = self.client.post(
            "/api/contact/references/admin/upload",
            {"file": upload},
            format="multipart",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
