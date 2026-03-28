import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from contact.models import Reference, SiteSettings
from contact.serializers import ReferenceSerializer, SiteSettingsSerializer


class Command(BaseCommand):
    help = "Export a static demo snapshot from the current database content."

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            default="../frontend/src/app/content/demoSnapshot.json",
            help="Output path for the generated JSON snapshot.",
        )

    def handle(self, *args, **options):
        output = Path(options["output"]).expanduser()
        if not output.is_absolute():
            output = Path.cwd() / output

        snapshot = {
            "settings": SiteSettingsSerializer(SiteSettings.get_solo()).data,
            "references": ReferenceSerializer(
                Reference.objects.all().order_by("order_index", "id"),
                many=True,
            ).data,
        }

        output.parent.mkdir(parents=True, exist_ok=True)
        try:
            output.write_text(
                json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
        except OSError as exc:
            raise CommandError(f"Unable to write snapshot: {exc}") from exc
