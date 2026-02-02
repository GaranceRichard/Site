import tempfile
from io import StringIO

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management import call_command
from django.test.utils import override_settings
from rest_framework.test import APITestCase

from contact.models import Reference


class ReferenceMediaCleanupTests(APITestCase):
    @override_settings(MEDIA_URL="/media/")
    def test_reference_delete_removes_media_files(self):
        with tempfile.TemporaryDirectory() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                image_path = default_storage.save(
                    "references/test-image.webp", ContentFile(b"image")
                )
                icon_path = default_storage.save(
                    "references/test-icon.webp", ContentFile(b"icon")
                )
                thumb_path = default_storage.save(
                    "references/thumbs/test-image.webp", ContentFile(b"thumb")
                )

                ref = Reference.objects.create(
                    reference="Ref cleanup",
                    image=image_path,
                    image_thumb=thumb_path,
                    icon=f"/media/{icon_path}",
                    situation="Situation",
                    tasks=[],
                    actions=[],
                    results=[],
                )

                self.assertTrue(default_storage.exists(image_path))
                self.assertTrue(default_storage.exists(icon_path))
                self.assertTrue(default_storage.exists(thumb_path))

                ref.delete()

                self.assertFalse(default_storage.exists(image_path))
                self.assertFalse(default_storage.exists(icon_path))
                self.assertFalse(default_storage.exists(thumb_path))
class MediaCleanupUnitTests(APITestCase):
    def test_media_relative_path_variants(self):
        from contact.media_cleanup import media_relative_path

        self.assertIsNone(media_relative_path(""))
        self.assertIsNone(media_relative_path("http://example.com"))
        self.assertIsNone(media_relative_path("https://example.com/other.png"))
        self.assertEqual(
            media_relative_path("http://testserver/media/references/a.webp"),
            "references/a.webp",
        )
        self.assertEqual(
            media_relative_path("/media/references/b.webp"),
            "references/b.webp",
        )
        self.assertEqual(media_relative_path("references/c.webp"), "references/c.webp")

    @override_settings(MEDIA_URL="/media/")
    def test_cleanup_orphan_reference_media_handles_missing_dir(self):
        from contact.media_cleanup import cleanup_orphan_reference_media

        with tempfile.TemporaryDirectory() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                self.assertEqual(cleanup_orphan_reference_media(), 0)

    @override_settings(MEDIA_URL="/media/")
    def test_cleanup_orphan_reference_media_removes_unused(self):
        from contact.media_cleanup import cleanup_orphan_reference_media

        with tempfile.TemporaryDirectory() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                orphan_path = default_storage.save(
                    "references/orphan.webp", ContentFile(b"orphan")
                )
                orphan_thumb = default_storage.save(
                    "references/thumbs/orphan.webp", ContentFile(b"orphan-thumb")
                )
                keep_path = default_storage.save(
                    "references/keep.webp", ContentFile(b"keep")
                )
                keep_thumb = default_storage.save(
                    "references/thumbs/keep.webp", ContentFile(b"keep-thumb")
                )

                Reference.objects.create(
                    reference="Ref keep",
                    image=keep_path,
                    image_thumb=keep_thumb,
                    icon="",
                    situation="",
                    tasks=[],
                    actions=[],
                    results=[],
                )

                deleted = cleanup_orphan_reference_media()

                self.assertEqual(deleted, 2)
                self.assertFalse(default_storage.exists(orphan_path))
                self.assertFalse(default_storage.exists(orphan_thumb))
                self.assertTrue(default_storage.exists(keep_path))
                self.assertTrue(default_storage.exists(keep_thumb))

    @override_settings(MEDIA_URL="/media/")
    def test_cleanup_reference_media_command(self):
        with tempfile.TemporaryDirectory() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                orphan_path = default_storage.save(
                    "references/orphan.webp", ContentFile(b"orphan")
                )
                orphan_thumb = default_storage.save(
                    "references/thumbs/orphan.webp", ContentFile(b"orphan-thumb")
                )

                out = StringIO()
                call_command("cleanup_reference_media", stdout=out)

                self.assertIn("Fichiers supprimes: 2", out.getvalue())
                self.assertFalse(default_storage.exists(orphan_path))
                self.assertFalse(default_storage.exists(orphan_thumb))

    @override_settings(MEDIA_URL="/media/")
    def test_reference_delete_cleans_orphaned_media(self):
        with tempfile.TemporaryDirectory() as tempdir:
            with override_settings(MEDIA_ROOT=tempdir):
                orphan_path = default_storage.save(
                    "references/orphan.webp", ContentFile(b"orphan")
                )
                orphan_thumb = default_storage.save(
                    "references/thumbs/orphan.webp", ContentFile(b"orphan-thumb")
                )
                kept_path = default_storage.save(
                    "references/keep.webp", ContentFile(b"keep")
                )
                kept_thumb = default_storage.save(
                    "references/thumbs/keep.webp", ContentFile(b"keep-thumb")
                )

                ref = Reference.objects.create(
                    reference="Ref keep",
                    image=kept_path,
                    image_thumb=kept_thumb,
                    icon="",
                    situation="Situation",
                    tasks=[],
                    actions=[],
                    results=[],
                )

                self.assertTrue(default_storage.exists(orphan_path))
                self.assertTrue(default_storage.exists(orphan_thumb))
                self.assertTrue(default_storage.exists(kept_path))
                self.assertTrue(default_storage.exists(kept_thumb))

                ref.delete()

                self.assertFalse(default_storage.exists(orphan_path))
                self.assertFalse(default_storage.exists(orphan_thumb))
                self.assertFalse(default_storage.exists(kept_path))
                self.assertFalse(default_storage.exists(kept_thumb))
