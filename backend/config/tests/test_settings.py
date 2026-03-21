import importlib
from pathlib import Path
from unittest.mock import patch

from django.test import SimpleTestCase

from config.settings import base as base_settings


class TestSettingsMediaRootTests(SimpleTestCase):
    def test_uses_dedicated_media_root_during_tests(self):
        self.assertTrue(base_settings.IS_TEST)
        self.assertEqual(base_settings.MEDIA_ROOT, base_settings.BASE_DIR / ".test-media")

    def test_test_media_root_override_is_supported(self):
        with patch.dict("os.environ", {"DJANGO_TEST_MEDIA_ROOT": "/tmp/test-media"}):
            reloaded = importlib.reload(base_settings)
            self.assertEqual(reloaded.MEDIA_ROOT, Path("/tmp/test-media"))

        restored = importlib.reload(base_settings)
        self.assertEqual(restored.MEDIA_ROOT, restored.BASE_DIR / ".test-media")
