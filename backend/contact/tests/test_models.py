from django.test import TestCase

from contact.models import ContactMessage, Reference, SiteSettings
from contact.site_settings_defaults import (
    DEFAULT_ABOUT_SETTINGS,
    DEFAULT_HEADER_SETTINGS,
    DEFAULT_HOME_HERO_SETTINGS,
    DEFAULT_METHOD_SETTINGS,
    DEFAULT_PROMISE_SETTINGS,
    DEFAULT_PUBLICATIONS_SETTINGS,
)


class ContactMessageModelTests(TestCase):
    def test_str_includes_name_email_and_subject(self):
        msg = ContactMessage.objects.create(
            name="Alice",
            email="alice@example.com",
            subject="Bonjour",
            message="Test",
            consent=True,
            source="tests",
        )

        rendered = str(msg)
        self.assertIn("Alice", rendered)
        self.assertIn("alice@example.com", rendered)
        self.assertIn("Bonjour", rendered)

    def test_str_truncates_subject_to_40_characters(self):
        subject = "x" * 45

        msg = ContactMessage.objects.create(
            name="Alice",
            email="alice@example.com",
            subject=subject,
            message="Test",
            consent=True,
        )

        self.assertEqual(str(msg), f"Alice <alice@example.com> - {'x' * 40}")


class ReferenceModelTests(TestCase):
    def test_defaults(self):
        ref = Reference.objects.create(
            reference="Ref",
            image="references/ref.webp",
            icon="",
        )

        self.assertEqual(ref.reference_short, "")
        self.assertEqual(ref.order_index, 0)
        self.assertEqual(ref.tasks, [])
        self.assertEqual(ref.actions, [])
        self.assertEqual(ref.results, [])

    def test_str_returns_reference_name(self):
        ref = Reference.objects.create(
            reference="Mission pilote",
            image="references/ref.webp",
            icon="",
        )

        self.assertEqual(str(ref), "Mission pilote")


class SiteSettingsModelTests(TestCase):
    def test_get_solo_creates_single_row_with_defaults(self):
        settings = SiteSettings.get_solo()

        self.assertEqual(settings.pk, 1)
        self.assertEqual(settings.header, DEFAULT_HEADER_SETTINGS)
        self.assertEqual(settings.home_hero, DEFAULT_HOME_HERO_SETTINGS)
        self.assertEqual(settings.about, DEFAULT_ABOUT_SETTINGS)
        self.assertEqual(settings.promise, DEFAULT_PROMISE_SETTINGS)
        self.assertEqual(settings.method, DEFAULT_METHOD_SETTINGS)
        self.assertEqual(settings.publications, DEFAULT_PUBLICATIONS_SETTINGS)
        self.assertEqual(SiteSettings.objects.count(), 1)

    def test_get_solo_reuses_existing_singleton_row(self):
        existing = SiteSettings.objects.create(pk=1, header={"name": "Custom"})

        fetched = SiteSettings.get_solo()

        self.assertEqual(fetched.pk, existing.pk)
        self.assertEqual(fetched.header["name"], "Custom")
        self.assertEqual(SiteSettings.objects.count(), 1)

    def test_save_pins_instance_to_singleton_primary_key(self):
        settings = SiteSettings(pk=99, header={"name": "Pinned"})

        settings.save()

        self.assertEqual(settings.pk, 1)
        self.assertEqual(SiteSettings.objects.count(), 1)
        self.assertEqual(SiteSettings.objects.get(pk=1).header["name"], "Pinned")

    def test_str_returns_human_readable_label(self):
        self.assertEqual(str(SiteSettings()), "Site settings")
