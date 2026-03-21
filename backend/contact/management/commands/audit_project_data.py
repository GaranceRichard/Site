import json

from django.core.management.base import BaseCommand

from contact.data_audit import audit_project_data_integrity


class Command(BaseCommand):
    help = "Audite l'intégrité des données locales du projet."

    def add_arguments(self, parser):
        parser.add_argument(
            "--format",
            choices=["text", "json"],
            default="text",
            help="Format de sortie du rapport.",
        )

    def handle(self, *args, **options):
        report = audit_project_data_integrity()

        if options["format"] == "json":
            self.stdout.write(json.dumps(report, indent=2, ensure_ascii=False))
            return

        summary = report["summary"]
        self.stdout.write("Audit project data")
        self.stdout.write(
            f"- Références avec média cassé: {summary['reference_media_broken_references']}"
        )
        self.stdout.write(
            f"- Fichiers média référencés manquants: {summary['reference_media_missing_files']}"
        )
        self.stdout.write(
            f"- Ordres de référence dupliqués: {summary['reference_duplicate_order_indexes']}"
        )
        self.stdout.write(
            f"- Champs JSON de référence invalides: {summary['reference_non_list_json_fields']}"
        )
        self.stdout.write(
            f"- Problèmes de site settings: {summary['site_settings_problems']}"
        )
        self.stdout.write(
            f"- Messages probablement issus de tests: {summary['probable_test_messages']}"
        )
        self.stdout.write(
            f"- Messages sans consentement: {summary['messages_without_consent']}"
        )

        if report["site_settings"]["problems"]:
            self.stdout.write("\nSite settings:")
            for item in report["site_settings"]["problems"]:
                self.stdout.write(f"- {item}")

        if report["references"]["duplicate_order_indexes"]:
            self.stdout.write("\nOrder indexes dupliqués:")
            for item in report["references"]["duplicate_order_indexes"]:
                self.stdout.write(f"- {item}")

        if report["contact_messages"]["probable_test_messages"]:
            self.stdout.write("\nMessages probablement issus de tests:")
            for item in report["contact_messages"]["probable_test_messages"][:20]:
                self.stdout.write(
                    f"- #{item['id']} {item['name']} <{item['email']}> source={item['source']}"
                )

        if report["reference_media"]["broken_references"]:
            self.stdout.write("\nRéférences avec chemins cassés:")
            for item in report["reference_media"]["broken_references"]:
                broken = ", ".join(
                    f"{field['field']} -> {field['relative_path']}"
                    for field in item["broken_fields"]
                )
                self.stdout.write(f"- #{item['id']} {item['reference']}: {broken}")
