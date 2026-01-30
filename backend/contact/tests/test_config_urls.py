import importlib

from django.test import SimpleTestCase
from django.test.utils import override_settings
from django.urls import clear_url_caches
class ConfigUrlsTests(SimpleTestCase):
    @override_settings(ENABLE_JWT=True, DEBUG=False)
    def test_urls_include_jwt_routes_when_enabled(self):
        import config.urls as urls

        importlib.reload(urls)
        clear_url_caches()
        names = {
            pattern.name
            for pattern in urls.urlpatterns
            if getattr(pattern, "name", None)
        }

        self.assertIn("token_obtain_pair", names)
        self.assertIn("token_refresh", names)

    @override_settings(ENABLE_JWT=False, DEBUG=False)
    def test_urls_exclude_jwt_routes_when_disabled(self):
        import config.urls as urls

        importlib.reload(urls)
        clear_url_caches()
        names = {
            pattern.name
            for pattern in urls.urlpatterns
            if getattr(pattern, "name", None)
        }

        self.assertNotIn("token_obtain_pair", names)
        self.assertNotIn("token_refresh", names)

    @override_settings(ENABLE_JWT=False, DEBUG=True, MEDIA_URL="/media/")
    def test_urls_include_static_media_when_debug(self):
        import config.urls as urls

        importlib.reload(urls)
        clear_url_caches()
        patterns = [str(pattern.pattern) for pattern in urls.urlpatterns]

        self.assertTrue(any("media" in pattern for pattern in patterns))
