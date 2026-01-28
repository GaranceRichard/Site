from urllib.parse import urlparse

from django.conf import settings
from django.core.files.storage import default_storage
from django.db.models.signals import pre_delete
from django.dispatch import receiver

from .models import Reference


def _media_relative_path(url: str) -> str | None:
    if not url:
        return None

    parsed = urlparse(url)
    path = parsed.path or ""
    if not path:
        return None

    media_url = settings.MEDIA_URL or "/media/"
    media_path = urlparse(media_url).path or media_url
    if not media_path.endswith("/"):
        media_path = f"{media_path}/"

    if not path.startswith(media_path):
        return None

    rel_path = path[len(media_path) :]
    return rel_path or None


@receiver(pre_delete, sender=Reference)
def delete_reference_files(sender, instance: Reference, **kwargs):
    for url in (instance.image, instance.icon):
        rel_path = _media_relative_path(url)
        if rel_path:
            default_storage.delete(rel_path)
