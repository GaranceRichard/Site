from __future__ import annotations

from django.core.cache import cache


SITE_SETTINGS_CACHE_VERSION_KEY = "site_settings:public:version"
SITE_SETTINGS_CACHE_TTL_SECONDS = 300


def _get_site_settings_cache_version() -> int:
    version = cache.get(SITE_SETTINGS_CACHE_VERSION_KEY)
    if version is None:
        cache.set(SITE_SETTINGS_CACHE_VERSION_KEY, 1, None)
        return 1
    return int(version)


def get_public_site_settings_cache_key() -> str:
    version = _get_site_settings_cache_version()
    return f"site_settings:public:v{version}"


def bump_public_site_settings_cache_version() -> None:
    try:
        cache.incr(SITE_SETTINGS_CACHE_VERSION_KEY)
    except ValueError:
        cache.set(SITE_SETTINGS_CACHE_VERSION_KEY, 2, None)
