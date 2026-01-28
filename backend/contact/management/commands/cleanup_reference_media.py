from django.core.management.base import BaseCommand

from contact.media_cleanup import cleanup_orphan_reference_media


class Command(BaseCommand):
    help = "Supprime les fichiers medias references/* non lies a une Reference."

    def handle(self, *args, **options):
        deleted = cleanup_orphan_reference_media()
        self.stdout.write(self.style.SUCCESS(f"Fichiers supprimes: {deleted}"))
