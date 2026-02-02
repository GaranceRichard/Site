from __future__ import annotations

from io import BytesIO
from uuid import uuid4

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from PIL import Image


MAX_UPLOAD_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}


def process_reference_image(file) -> tuple[bytes, bytes]:
    image = Image.open(file)
    if image.format not in ALLOWED_IMAGE_FORMATS:
        raise ValueError("unsupported_format")

    has_alpha = "A" in image.getbands() or image.mode in ("RGBA", "LA", "PA")
    image = image.convert("RGBA" if has_alpha else "RGB")
    image.thumbnail((1920, 1080), Image.LANCZOS)

    full_buffer = BytesIO()
    image.save(full_buffer, format="WEBP", quality=85, method=6)
    full_buffer.seek(0)

    thumb = image.copy()
    thumb.thumbnail((640, 360), Image.LANCZOS)
    thumb_buffer = BytesIO()
    thumb.save(thumb_buffer, format="WEBP", quality=85, method=6)
    thumb_buffer.seek(0)

    return full_buffer.read(), thumb_buffer.read()


def save_reference_images(
    *,
    image_bytes: bytes,
    thumb_bytes: bytes,
    request,
) -> dict[str, str]:
    filename = f"references/{uuid4().hex}.webp"
    saved_path = default_storage.save(filename, ContentFile(image_bytes))
    url = request.build_absolute_uri(f"{settings.MEDIA_URL}{saved_path}")

    thumb_name = f"references/thumbs/{uuid4().hex}.webp"
    thumb_path = default_storage.save(thumb_name, ContentFile(thumb_bytes))
    thumb_url = request.build_absolute_uri(f"{settings.MEDIA_URL}{thumb_path}")

    return {"url": url, "thumbnail_url": thumb_url}
