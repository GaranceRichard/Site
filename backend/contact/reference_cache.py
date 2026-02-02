from __future__ import annotations

from django.core.cache import cache


REFERENCE_CACHE_VERSION_KEY = "references:public:version"
REFERENCE_CACHE_TTL_SECONDS = 300


def _get_reference_cache_version() -> int:
    version = cache.get(REFERENCE_CACHE_VERSION_KEY)
    if version is None:
        cache.set(REFERENCE_CACHE_VERSION_KEY, 1, None)
        return 1
    return int(version)


def get_public_references_cache_key(host: str) -> str:
    version = _get_reference_cache_version()
    return f"references:public:v{version}:{host}"


def bump_public_references_cache_version() -> None:
    try:
        cache.incr(REFERENCE_CACHE_VERSION_KEY)
    except ValueError:
        cache.set(REFERENCE_CACHE_VERSION_KEY, 2, None)
