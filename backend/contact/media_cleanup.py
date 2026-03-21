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


def _storage_exists(path: str) -> bool:
    try:
        return default_storage.exists(path)
    except Exception:
        return False


def _storage_files(prefix: str) -> list[str]:
    try:
        _, files = default_storage.listdir(prefix)
    except Exception:
        return []
    return [f"{prefix}/{name}" for name in files]


def audit_reference_media() -> dict:
    referenced_paths = referenced_media_paths()
    stored_paths = set(_storage_files("references")) | set(
        _storage_files("references/thumbs")
    )

    broken_references: list[dict] = []
    for ref in Reference.objects.all().only(
        "id",
        "reference",
        "image",
        "image_thumb",
        "icon",
    ):
        fields: list[dict] = []
        for field_name in ("image", "image_thumb", "icon"):
            raw_value = getattr(ref, field_name)
            rel_path = media_relative_path(raw_value)
            if not rel_path:
                continue
            if not _storage_exists(rel_path):
                fields.append(
                    {
                        "field": field_name,
                        "value": _as_str(raw_value),
                        "relative_path": rel_path,
                    }
                )
        if fields:
            broken_references.append(
                {
                    "id": ref.id,
                    "reference": ref.reference,
                    "broken_fields": fields,
                }
            )

    orphan_files = sorted(stored_paths - referenced_paths)
    missing_files = sorted(referenced_paths - stored_paths)

    return {
        "summary": {
            "references_total": Reference.objects.count(),
            "references_with_broken_media": len(broken_references),
            "broken_field_count": sum(
                len(item["broken_fields"]) for item in broken_references
            ),
            "referenced_media_paths": len(referenced_paths),
            "stored_media_files": len(stored_paths),
            "missing_media_files": len(missing_files),
            "orphan_media_files": len(orphan_files),
        },
        "broken_references": broken_references,
        "missing_media_files": missing_files,
        "orphan_media_files": orphan_files,
    }


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
