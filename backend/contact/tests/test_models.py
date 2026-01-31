from django.test import TestCase

from contact.models import ContactMessage, Reference


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
