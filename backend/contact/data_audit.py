from __future__ import annotations

from collections import Counter

from .media_cleanup import audit_reference_media
from .models import ContactMessage, Reference, SiteSettings
from .serializers import SiteSettingsSerializer
from .site_settings_defaults import (
    DEFAULT_ABOUT_SETTINGS,
    DEFAULT_HEADER_SETTINGS,
    DEFAULT_HOME_HERO_SETTINGS,
    DEFAULT_METHOD_SETTINGS,
    DEFAULT_PUBLICATIONS_SETTINGS,
    DEFAULT_PROMISE_SETTINGS,
)


def _site_settings_payload(instance: SiteSettings) -> dict:
    return {
        "header": instance.header,
        "homeHero": instance.home_hero,
        "about": instance.about,
        "promise": instance.promise,
        "method": instance.method,
        "publications": instance.publications,
    }


def audit_site_settings() -> dict:
    rows = list(SiteSettings.objects.all())
    problems: list[str] = []
    details: dict = {
        "row_count": len(rows),
        "singleton_ids": [row.pk for row in rows],
        "matches_default_header": False,
        "matches_default_home_hero": False,
        "matches_default_about": False,
        "matches_default_promise": False,
        "matches_default_method": False,
        "matches_default_publications": False,
        "serializer_valid": False,
        "serializer_errors": {},
    }

    if len(rows) != 1:
        problems.append("site_settings_row_count_invalid")
        return {"summary": details, "problems": problems}

    instance = rows[0]
    payload = _site_settings_payload(instance)
    serializer = SiteSettingsSerializer(data=payload)
    is_valid = serializer.is_valid()

    details.update(
        {
            "singleton_ids": [instance.pk],
            "matches_default_header": instance.header == DEFAULT_HEADER_SETTINGS,
            "matches_default_home_hero": instance.home_hero
            == DEFAULT_HOME_HERO_SETTINGS,
            "matches_default_about": instance.about == DEFAULT_ABOUT_SETTINGS,
            "matches_default_promise": instance.promise == DEFAULT_PROMISE_SETTINGS,
            "matches_default_method": instance.method == DEFAULT_METHOD_SETTINGS,
            "matches_default_publications": instance.publications
            == DEFAULT_PUBLICATIONS_SETTINGS,
            "serializer_valid": is_valid,
            "serializer_errors": serializer.errors if not is_valid else {},
        }
    )

    if instance.pk != 1:
        problems.append("site_settings_pk_not_one")
    if not is_valid:
        problems.append("site_settings_serializer_invalid")

    return {"summary": details, "problems": problems}


def audit_references() -> dict:
    rows = list(
        Reference.objects.all().values(
            "id",
            "reference",
            "reference_short",
            "order_index",
            "image",
            "image_thumb",
            "icon",
            "tasks",
            "actions",
            "results",
        )
    )
    order_counts = Counter(row["order_index"] for row in rows)

    duplicate_order_indexes = sorted(
        order for order, count in order_counts.items() if count > 1
    )
    non_list_fields: list[dict] = []
    blank_required_fields: list[dict] = []

    for row in rows:
        for field in ("tasks", "actions", "results"):
            if not isinstance(row[field], list):
                non_list_fields.append(
                    {
                        "id": row["id"],
                        "reference": row["reference"],
                        "field": field,
                        "value_type": type(row[field]).__name__,
                    }
                )

        missing_fields = [
            field
            for field in ("reference", "image")
            if not str(row[field] or "").strip()
        ]
        if missing_fields:
            blank_required_fields.append(
                {
                    "id": row["id"],
                    "reference": row["reference"],
                    "fields": missing_fields,
                }
            )

    return {
        "summary": {
            "reference_count": len(rows),
            "duplicate_order_index_count": len(duplicate_order_indexes),
            "non_list_json_field_count": len(non_list_fields),
            "blank_required_reference_count": len(blank_required_fields),
        },
        "duplicate_order_indexes": duplicate_order_indexes,
        "non_list_json_fields": non_list_fields,
        "blank_required_references": blank_required_fields,
    }


def audit_contact_messages() -> dict:
    rows = list(
        ContactMessage.objects.all().values(
            "id",
            "name",
            "email",
            "subject",
            "consent",
            "source",
        )
    )

    probable_test_messages: list[dict] = []
    consent_false_ids: list[int] = []

    for row in rows:
        haystacks = [
            str(row["name"] or "").lower(),
            str(row["email"] or "").lower(),
            str(row["subject"] or "").lower(),
            str(row["source"] or "").lower(),
        ]
        if (
            "e2e" in " ".join(haystacks)
            or row["email"].endswith("@example.com")
            or row["email"].endswith("@example.test")
        ):
            probable_test_messages.append(
                {
                    "id": row["id"],
                    "name": row["name"],
                    "email": row["email"],
                    "subject": row["subject"],
                    "source": row["source"],
                }
            )

        if row["consent"] is not True:
            consent_false_ids.append(row["id"])

    return {
        "summary": {
            "message_count": len(rows),
            "probable_test_message_count": len(probable_test_messages),
            "consent_false_count": len(consent_false_ids),
        },
        "probable_test_messages": probable_test_messages,
        "consent_false_ids": consent_false_ids,
    }


def audit_project_data_integrity() -> dict:
    reference_media = audit_reference_media()
    references = audit_references()
    site_settings = audit_site_settings()
    contact_messages = audit_contact_messages()

    return {
        "summary": {
            "reference_media_broken_references": reference_media["summary"][
                "references_with_broken_media"
            ],
            "reference_media_missing_files": reference_media["summary"][
                "missing_media_files"
            ],
            "reference_duplicate_order_indexes": references["summary"][
                "duplicate_order_index_count"
            ],
            "reference_non_list_json_fields": references["summary"][
                "non_list_json_field_count"
            ],
            "site_settings_problems": len(site_settings["problems"]),
            "probable_test_messages": contact_messages["summary"][
                "probable_test_message_count"
            ],
            "messages_without_consent": contact_messages["summary"][
                "consent_false_count"
            ],
        },
        "reference_media": reference_media,
        "references": references,
        "site_settings": site_settings,
        "contact_messages": contact_messages,
    }
