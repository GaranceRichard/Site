from django.test import SimpleTestCase

from contact.stats_cache import (
    STATS_SUMMARY_CACHE_VERSION,
    get_stats_summary_cache_key,
    get_stats_summary_last_success_cache_key,
)


class StatsCacheTests(SimpleTestCase):
    def test_get_stats_summary_cache_key(self):
        self.assertEqual(
            get_stats_summary_cache_key(),
            f"stats:summary:v{STATS_SUMMARY_CACHE_VERSION}:fresh",
        )

    def test_get_stats_summary_last_success_cache_key(self):
        self.assertEqual(
            get_stats_summary_last_success_cache_key(),
            f"stats:summary:v{STATS_SUMMARY_CACHE_VERSION}:last_success",
        )
