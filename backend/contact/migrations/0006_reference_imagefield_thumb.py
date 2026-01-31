from __future__ import annotations

from urllib.parse import urlparse

from django.conf import settings
from django.db import migrations, models


def _media_relative_path(value: str) -> str | None:
    if value is None:
        return None
    value = str(getattr(value, "name", value) or "")
    if not value:
        return None
    parsed = urlparse(value)
    path = parsed.path or ""
    if not path:
        path = value

    media_url = settings.MEDIA_URL or "/media/"
    media_path = urlparse(media_url).path or media_url
    if not media_path.endswith("/"):
        media_path = f"{media_path}/"

    if path.startswith(media_path):
        rel_path = path[len(media_path) :]
        return rel_path or None

    normalized = path.lstrip("/")
    if normalized.startswith("references/"):
        return normalized
    return None


def migrate_reference_images(apps, schema_editor):
    Reference = apps.get_model("contact", "Reference")
    for ref in Reference.objects.all().only("id", "image"):
        raw = ref.image or ""
        rel_path = _media_relative_path(raw)
        if rel_path:
            ref.image = rel_path
        else:
            # External/invalid URLs are cleared to avoid invalid ImageField values.
            ref.image = ""
        ref.save(update_fields=["image"])


class Migration(migrations.Migration):
    dependencies = [
        ("contact", "0005_alter_reference_image_alter_reference_situation"),
    ]

    operations = [
        migrations.AddField(
            model_name="reference",
            name="image_thumb",
            field=models.ImageField(
                blank=True,
                max_length=500,
                null=True,
                upload_to="references/thumbs/",
            ),
        ),
        migrations.AlterField(
            model_name="reference",
            name="image",
            field=models.ImageField(max_length=500, upload_to="references/"),
        ),
        migrations.RunPython(migrate_reference_images, migrations.RunPython.noop),
    ]
