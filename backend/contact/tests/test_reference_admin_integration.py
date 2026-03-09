from unittest.mock import Mock, patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from contact.models import Reference


class ReferenceAdminIntegrationTests(APITestCase):
    def setUp(self):
        self.username = "ref-int-admin"
        self.password = "ref-int-pass-123"

        User = get_user_model()
        user = User.objects.create_user(
            username=self.username,
            password=self.password,
            is_staff=True,
        )

        token_res = self.client.post(
            "/api/auth/token/",
            {"username": user.username, "password": self.password},
            format="json",
        )
        self.assertEqual(token_res.status_code, status.HTTP_200_OK)
        self.token = token_res.data["access"]

    def auth_headers(self):
        return {"HTTP_AUTHORIZATION": f"Bearer {self.token}"}

    def test_reference_admin_create_list_update_and_delete(self):
        create_res = self.client.post(
            "/api/contact/references/admin",
            {
                "reference": "Ref Integration",
                "image": "/media/references/ref.webp",
                "icon": "",
                "situation": "Situation",
                "tasks": ["Task"],
                "actions": ["Action"],
                "results": ["Result"],
            },
            format="json",
            **self.auth_headers(),
        )
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED, create_res.data)

        list_res = self.client.get(
            "/api/contact/references/admin",
            **self.auth_headers(),
        )
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data), 1)

        ref_id = create_res.data["id"]
        update_res = self.client.put(
            f"/api/contact/references/admin/{ref_id}",
            {
                "reference": "Ref Integration+",
                "image": "/media/references/ref.webp",
                "icon": "",
                "situation": "Situation+",
                "tasks": ["Task"],
                "actions": [],
                "results": [],
            },
            format="json",
            **self.auth_headers(),
        )
        self.assertEqual(update_res.status_code, status.HTTP_200_OK, update_res.data)
        self.assertEqual(update_res.data["reference"], "Ref Integration+")

        delete_res = self.client.delete(
            f"/api/contact/references/admin/{ref_id}",
            **self.auth_headers(),
        )
        self.assertEqual(delete_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Reference.objects.count(), 0)

    def test_reference_image_upload_requires_a_file(self):
        res = self.client.post(
            "/api/contact/references/admin/upload",
            {},
            format="multipart",
            **self.auth_headers(),
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["detail"], "Aucun fichier fourni.")

    @patch("contact.views.get_upload_strategy")
    def test_reference_image_upload_rejects_unsupported_format(self, get_upload_strategy_mock):
        strategy = Mock()
        strategy.process_reference_image.side_effect = ValueError("unsupported")
        get_upload_strategy_mock.return_value = strategy

        upload = self.client.post(
            "/api/contact/references/admin/upload",
            {"file": self._fake_upload("image/webp", 128)},
            format="multipart",
            **self.auth_headers(),
        )

        self.assertEqual(upload.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Format non support", upload.data["detail"])

    @patch("contact.views.get_upload_strategy")
    def test_reference_image_upload_rejects_processing_failures(self, get_upload_strategy_mock):
        strategy = Mock()
        strategy.process_reference_image.side_effect = RuntimeError("boom")
        get_upload_strategy_mock.return_value = strategy

        upload = self.client.post(
            "/api/contact/references/admin/upload",
            {"file": self._fake_upload("image/webp", 128)},
            format="multipart",
            **self.auth_headers(),
        )

        self.assertEqual(upload.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(upload.data["detail"], "Impossible de traiter l'image.")

    @patch("contact.views.get_upload_strategy")
    def test_reference_image_upload_returns_saved_payload(self, get_upload_strategy_mock):
        strategy = Mock()
        strategy.process_reference_image.return_value = (b"image", b"thumb")
        strategy.save_reference_images.return_value = {
            "url": "https://example.test/ref.webp",
            "thumbnail_url": "https://example.test/thumb.webp",
        }
        get_upload_strategy_mock.return_value = strategy

        upload = self.client.post(
            "/api/contact/references/admin/upload",
            {"file": self._fake_upload("image/webp", 128)},
            format="multipart",
            **self.auth_headers(),
        )

        self.assertEqual(upload.status_code, status.HTTP_201_CREATED, upload.data)
        self.assertEqual(upload.data["url"], "https://example.test/ref.webp")
        self.assertEqual(upload.data["thumbnail_url"], "https://example.test/thumb.webp")
        strategy.save_reference_images.assert_called_once()

    @staticmethod
    def _fake_upload(content_type: str, size: int):
        from django.core.files.uploadedfile import SimpleUploadedFile

        return SimpleUploadedFile("ref.webp", b"x" * size, content_type=content_type)
