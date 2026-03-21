import json

from django.core.management.base import BaseCommand

from contact.media_cleanup import audit_reference_media


class Command(BaseCommand):
    help = "Audite les medias des References et signale les chemins casses/orphelins."

    def add_arguments(self, parser):
        parser.add_argument(
            "--format",
            choices=["text", "json"],
            default="text",
            help="Format de sortie du rapport.",
        )

    def handle(self, *args, **options):
        report = audit_reference_media()

        if options["format"] == "json":
            self.stdout.write(json.dumps(report, indent=2, ensure_ascii=False))
            return

        summary = report["summary"]
        self.stdout.write("Audit Reference media")
        self.stdout.write(f"- Références totales: {summary['references_total']}")
        self.stdout.write(
            f"- Références avec média cassé: {summary['references_with_broken_media']}"
        )
        self.stdout.write(f"- Champs cassés: {summary['broken_field_count']}")
        self.stdout.write(
            f"- Chemins média référencés: {summary['referenced_media_paths']}"
        )
        self.stdout.write(f"- Fichiers média présents: {summary['stored_media_files']}")
        self.stdout.write(
            f"- Chemins référencés manquants: {summary['missing_media_files']}"
        )
        self.stdout.write(
            f"- Fichiers orphelins sur disque: {summary['orphan_media_files']}"
        )

        if report["broken_references"]:
            self.stdout.write("\nRéférences cassées:")
            for item in report["broken_references"]:
                broken = ", ".join(
                    f"{field['field']} -> {field['relative_path']}"
                    for field in item["broken_fields"]
                )
                self.stdout.write(f"- #{item['id']} {item['reference']}: {broken}")

        if report["missing_media_files"]:
            self.stdout.write("\nChemins référencés absents du disque:")
            for path in report["missing_media_files"]:
                self.stdout.write(f"- {path}")

        if report["orphan_media_files"]:
            self.stdout.write("\nFichiers orphelins sur disque:")
            for path in report["orphan_media_files"]:
                self.stdout.write(f"- {path}")
