from urllib.parse import urlparse

from django.conf import settings
from django.core.files.storage import default_storage

from .models import Reference


def _as_str(value) -> str:
    if value is None:
        return ""
    return str(getattr(value, "name", value) or "")


def media_relative_path(url) -> str | None:
    url = _as_str(url)
    if not url:
        return None

    parsed = urlparse(url)
    path = parsed.path or ""
    if not path:
        path = url

    media_url = settings.MEDIA_URL or "/media/"
    media_path = urlparse(media_url).path or media_url
    if not media_path.endswith("/"):
        media_path = f"{media_path}/"

    if not path.startswith(media_path):
        normalized = path.lstrip("/")
        if normalized.startswith("references/"):
            return normalized
        return None

    rel_path = path[len(media_path) :]
    return rel_path or None


def referenced_media_paths() -> set[str]:
    paths: set[str] = set()
    for ref in Reference.objects.all().only("image", "image_thumb", "icon"):
        for url in (ref.image, ref.image_thumb, ref.icon):
            rel_path = media_relative_path(url)
            if rel_path:
                paths.add(rel_path)
    return paths


def cleanup_orphan_reference_media() -> int:
    used = referenced_media_paths()
    deleted = 0

    def _cleanup_dir(prefix: str) -> int:
        try:
            _, files = default_storage.listdir(prefix)
        except Exception:
            return 0
        if not files:
            return 0
        removed = 0
        for name in files:
            path = f"{prefix}/{name}"
            if path not in used:
                default_storage.delete(path)
                removed += 1
        return removed

    deleted += _cleanup_dir("references")
    deleted += _cleanup_dir("references/thumbs")
    return deleted
