STATS_SUMMARY_CACHE_VERSION = 1
STATS_SUMMARY_CACHE_TTL_SECONDS = 3600
STATS_SUMMARY_LAST_SUCCESS_TTL_SECONDS = 60 * 60 * 24 * 7


def get_stats_summary_cache_key() -> str:
    return f"stats:summary:v{STATS_SUMMARY_CACHE_VERSION}:fresh"


def get_stats_summary_last_success_cache_key() -> str:
    return f"stats:summary:v{STATS_SUMMARY_CACHE_VERSION}:last_success"
