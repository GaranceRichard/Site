from unittest.mock import patch

from django.test import SimpleTestCase

from contact.image_upload import LocalUploadStrategy, OvhS3UploadStrategy, get_upload_strategy


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
