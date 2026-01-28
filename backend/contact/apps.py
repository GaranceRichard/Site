from django.apps import AppConfig


class ContactConfig(AppConfig):
    name = "contact"

    def ready(self):
        # Register signal handlers.
        from . import signals  # noqa: F401
