from io import BytesIO
from unittest.mock import Mock, patch

from PIL import Image

from django.test import SimpleTestCase

from contact.image_upload import (
    LocalUploadStrategy,
    OvhS3UploadStrategy,
    UploadStrategy,
    get_upload_strategy,
)


class MinimalUploadStrategy(UploadStrategy):
    def save_reference_images(self, **kwargs):
        return super().save_reference_images(**kwargs)


class UploadStrategyTests(SimpleTestCase):
    def test_get_upload_strategy_defaults_to_local(self):
        with patch.dict("os.environ", {}, clear=True):
            strategy = get_upload_strategy()
            self.assertIsInstance(strategy, LocalUploadStrategy)

    def test_get_upload_strategy_supports_ovh_alias(self):
        with patch.dict("os.environ", {"CONTACT_UPLOAD_STRATEGY": "ovh_s3"}, clear=False):
            strategy = get_upload_strategy()
            self.assertIsInstance(strategy, OvhS3UploadStrategy)

    def test_ovh_strategy_applies_prefix(self):
        with patch.dict("os.environ", {"OVH_UPLOAD_PREFIX": "ovh/custom-prefix"}, clear=False):
            strategy = OvhS3UploadStrategy()
            self.assertEqual(strategy.image_prefix, "ovh/custom-prefix")
            self.assertEqual(strategy.thumb_prefix, "ovh/custom-prefix/thumbs")

    def test_process_reference_image_rejects_unsupported_format(self):
        image_buffer = BytesIO()
        Image.new("RGB", (32, 32), color="red").save(image_buffer, format="BMP")
        image_buffer.seek(0)

        with self.assertRaisesMessage(ValueError, "unsupported_format"):
            UploadStrategy.process_reference_image(image_buffer)

    def test_process_reference_image_returns_webp_full_and_thumbnail(self):
        image_buffer = BytesIO()
        Image.new("RGBA", (1200, 800), color=(10, 20, 30, 128)).save(image_buffer, format="PNG")
        image_buffer.seek(0)

        image_bytes, thumb_bytes = UploadStrategy.process_reference_image(image_buffer)

        self.assertGreater(len(image_bytes), 0)
        self.assertGreater(len(thumb_bytes), 0)

        with Image.open(BytesIO(image_bytes)) as full_image:
            self.assertEqual(full_image.format, "WEBP")
            self.assertLessEqual(full_image.width, 1200)
            self.assertLessEqual(full_image.height, 800)

        with Image.open(BytesIO(thumb_bytes)) as thumb_image:
            self.assertEqual(thumb_image.format, "WEBP")
            self.assertLessEqual(thumb_image.width, 640)
            self.assertLessEqual(thumb_image.height, 360)

    @patch("contact.image_upload.default_storage.save")
    def test_local_strategy_saves_full_and_thumbnail(self, save_mock):
        save_mock.side_effect = [
            "references/full.webp",
            "references/thumbs/thumb.webp",
        ]
        request = Mock()
        request.build_absolute_uri.side_effect = lambda path: f"https://example.test{path}"

        payload = LocalUploadStrategy().save_reference_images(
            image_bytes=b"image-bytes",
            thumb_bytes=b"thumb-bytes",
            request=request,
        )

        self.assertEqual(payload["url"], "https://example.test/media/references/full.webp")
        self.assertEqual(payload["thumbnail_url"], "https://example.test/media/references/thumbs/thumb.webp")
        self.assertTrue(save_mock.call_args_list[0].args[0].startswith("references/"))
        self.assertTrue(save_mock.call_args_list[1].args[0].startswith("references/thumbs/"))

    def test_base_strategy_save_reference_images_raises(self):
        strategy = MinimalUploadStrategy()

        with self.assertRaises(NotImplementedError):
            strategy.save_reference_images(
                image_bytes=b"image-bytes",
                thumb_bytes=b"thumb-bytes",
                request=Mock(),
            )
