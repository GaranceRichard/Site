from django.core.files.storage import default_storage
from django.db.models.signals import post_delete, pre_delete
from django.dispatch import receiver

from .models import Reference
from .media_cleanup import cleanup_orphan_reference_media as cleanup_orphan_reference_media_files
from .media_cleanup import media_relative_path


@receiver(pre_delete, sender=Reference)
def delete_reference_files(sender, instance: Reference, **kwargs):
    for url in (instance.image, instance.icon):
        rel_path = media_relative_path(url)
        if rel_path:
            default_storage.delete(rel_path)


@receiver(post_delete, sender=Reference)
def cleanup_orphan_reference_media(sender, instance: Reference, **kwargs):
    cleanup_orphan_reference_media_files()
