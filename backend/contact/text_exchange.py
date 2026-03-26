from __future__ import annotations

import json
import tomllib
from io import BytesIO
from uuid import uuid4

from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.validators import URLValidator
from django.db import transaction
from django.utils.text import slugify
from PIL import Image, ImageDraw, ImageFont
from rest_framework import serializers

from .media_cleanup import media_relative_path
from .models import Reference, SiteSettings
from .serializers import SiteSettingsSerializer

EXPORT_FILENAME = "backoffice-exchange-export.toml"
TEMPLATE_FILENAME = "backoffice-exchange-template.toml"


class TextExchangeError(serializers.ValidationError):
    pass


VALID_HERO_LINK_TARGETS = {
    "promise",
    "about",
    "services",
    "method",
    "references",
    "message",
}


def _toml_string(value: str) -> str:
    if "\n" in value:
        escaped = value.replace('"""', '\\"""')
        return f'"""\n{escaped}\n"""'
    return json.dumps(value, ensure_ascii=False)


def _dump_list(values: list[str]) -> str:
    return (
        "[" + ", ".join(json.dumps(value, ensure_ascii=False) for value in values) + "]"
    )


def _require_table(data: dict, key: str) -> dict:
    value = data.get(key)
    if not isinstance(value, dict):
        raise TextExchangeError({key: "Section obligatoire ou invalide."})
    return value


def _require_string(table: dict, key: str, section: str) -> str:
    value = table.get(key)
    if not isinstance(value, str):
        raise TextExchangeError({section: f"`{key}` doit etre une chaine."})
    return value


def _optional_string(table: dict, key: str, default: str = "") -> str:
    value = table.get(key, default)
    if value is None:
        return default
    if not isinstance(value, str):
        raise TextExchangeError({key: "La valeur doit etre une chaine."})
    return value


def _string_list(table: dict, key: str, section: str) -> list[str]:
    value = table.get(key, [])
    if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
        raise TextExchangeError({section: f"`{key}` doit etre une liste de chaines."})
    return value


def _bool_value(table: dict, key: str, section: str) -> bool:
    value = table.get(key)
    if not isinstance(value, bool):
        raise TextExchangeError({section: f"`{key}` doit etre un booleen."})
    return value


def _table_list(data: dict, key: str, section: str) -> list[dict]:
    value = data.get(key, [])
    if not isinstance(value, list) or any(not isinstance(item, dict) for item in value):
        raise TextExchangeError({section: f"`{key}` doit etre une liste de sections."})
    return value


def _validate_url(value: str, field_name: str) -> str:
    trimmed = value.strip()
    if not trimmed:
        return ""
    try:
        URLValidator(schemes=["http", "https"])(trimmed)
    except DjangoValidationError as exc:
        raise TextExchangeError({field_name: "URL invalide."}) from exc
    return trimmed


def _reference_rows() -> list[Reference]:
    return list(Reference.objects.all().order_by("order_index", "id"))


def build_exchange_template() -> str:
    return """format_version = 1

[header]
name = "Nom affiche"
title = "Titre affiche"
booking_url = "https://example.com/booking"

[home_hero]
eyebrow = "Surtitre"
title = "Titre principal"
subtitle = "Sous-titre"
keywords = ["Mot-cle 1", "Mot-cle 2", "Mot-cle 3"]

[[home_hero.links]]
target = "services"
label = "Voir les offres"
enabled = true

[[home_hero.cards]]
title = "Carte 1"
content = "Contenu de la carte 1"

[about]
title = "Titre a propos"
subtitle = "Sous-titre a propos"
highlight_intro = "Introduction courte"
highlight_items = ["Point 1", "Point 2", "Point 3"]

[promise]
title = "Titre positionnement"
subtitle = "Sous-titre positionnement"

[[promise.cards]]
title = "Carte promesse 1"
content = "Contenu carte promesse 1"

[method]
eyebrow = "Approche"
title = "Titre approche"
subtitle = "Sous-titre approche"

[[method.steps]]
step = "01"
title = "Etape 1"
text = "Description etape 1"

[publications]
title = "Titre publications"
subtitle = "Sous-titre publications"
highlight_title = "Titre encart"
highlight_content = "Contenu encart"

[[publications.items]]
title = "Publication 1"
content = "Contenu publication 1"

[[publications.items.links]]
title = "Lien publication 1"
url = "https://example.com/publication-1"

[[references]]
reference = "Nom de la reference"
reference_short = "Nom court"
icon = "https://example.com/icon.png"
situation = "Contexte ou situation"
tasks = ["Tache 1", "Tache 2"]
actions = ["Action 1", "Action 2"]
results = ["Resultat 1", "Resultat 2"]
"""


def _append_table(
    lines: list[str], table_name: str, fields: list[tuple[str, str]]
) -> None:
    lines.append(f"[{table_name}]")
    for key, value in fields:
        lines.append(f"{key} = {value}")
    lines.append("")


def _append_array_table(
    lines: list[str],
    table_name: str,
    items: list[dict],
    field_builder,
) -> None:
    for item in items:
        lines.append(f"[[{table_name}]]")
        for key, value in field_builder(item):
            lines.append(f"{key} = {value}")
        lines.append("")


def _export_header(lines: list[str], settings: SiteSettings) -> None:
    _append_table(
        lines,
        "header",
        [
            ("name", _toml_string(settings.header["name"])),
            ("title", _toml_string(settings.header["title"])),
            ("booking_url", _toml_string(settings.header["bookingUrl"])),
        ],
    )


def _export_home_hero(lines: list[str], settings: SiteSettings) -> None:
    _append_table(
        lines,
        "home_hero",
        [
            ("eyebrow", _toml_string(settings.home_hero["eyebrow"])),
            ("title", _toml_string(settings.home_hero["title"])),
            ("subtitle", _toml_string(settings.home_hero["subtitle"])),
            ("keywords", _dump_list(settings.home_hero["keywords"])),
        ],
    )
    _append_array_table(
        lines,
        "home_hero.links",
        settings.home_hero["links"],
        lambda link: [
            ("target", _toml_string(link["id"])),
            ("label", _toml_string(link["label"])),
            ("enabled", str(bool(link["enabled"])).lower()),
        ],
    )
    _append_array_table(
        lines,
        "home_hero.cards",
        settings.home_hero["cards"],
        lambda card: [
            ("title", _toml_string(card["title"])),
            ("content", _toml_string(card["content"])),
        ],
    )


def _export_about(lines: list[str], settings: SiteSettings) -> None:
    _append_table(
        lines,
        "about",
        [
            ("title", _toml_string(settings.about["title"])),
            ("subtitle", _toml_string(settings.about["subtitle"])),
            ("highlight_intro", _toml_string(settings.about["highlight"]["intro"])),
            (
                "highlight_items",
                _dump_list(
                    [item["text"] for item in settings.about["highlight"]["items"]]
                ),
            ),
        ],
    )


def _export_promise(lines: list[str], settings: SiteSettings) -> None:
    _append_table(
        lines,
        "promise",
        [
            ("title", _toml_string(settings.promise["title"])),
            ("subtitle", _toml_string(settings.promise["subtitle"])),
        ],
    )
    _append_array_table(
        lines,
        "promise.cards",
        settings.promise["cards"],
        lambda card: [
            ("title", _toml_string(card["title"])),
            ("content", _toml_string(card["content"])),
        ],
    )


def _export_method(lines: list[str], settings: SiteSettings) -> None:
    _append_table(
        lines,
        "method",
        [
            ("eyebrow", _toml_string(settings.method["eyebrow"])),
            ("title", _toml_string(settings.method["title"])),
            ("subtitle", _toml_string(settings.method["subtitle"])),
        ],
    )
    _append_array_table(
        lines,
        "method.steps",
        settings.method["steps"],
        lambda step: [
            ("step", _toml_string(step["step"])),
            ("title", _toml_string(step["title"])),
            ("text", _toml_string(step["text"])),
        ],
    )


def _export_publications(lines: list[str], settings: SiteSettings) -> None:
    _append_table(
        lines,
        "publications",
        [
            ("title", _toml_string(settings.publications["title"])),
            ("subtitle", _toml_string(settings.publications["subtitle"])),
            (
                "highlight_title",
                _toml_string(settings.publications["highlight"]["title"]),
            ),
            (
                "highlight_content",
                _toml_string(settings.publications["highlight"]["content"]),
            ),
        ],
    )
    for item in settings.publications["items"]:
        lines.append("[[publications.items]]")
        lines.append(f"title = {_toml_string(item['title'])}")
        lines.append(f"content = {_toml_string(item['content'])}")
        for link in item.get("links", []):
            lines.append("[[publications.items.links]]")
            lines.append(f"title = {_toml_string(link['title'])}")
            lines.append(f"url = {_toml_string(link['url'])}")
        lines.append("")


def _export_references(lines: list[str], references: list[Reference]) -> None:
    _append_array_table(
        lines,
        "references",
        references,
        lambda reference: [
            ("reference", _toml_string(reference.reference)),
            ("reference_short", _toml_string(reference.reference_short)),
            ("icon", _toml_string(reference.icon)),
            ("situation", _toml_string(reference.situation)),
            ("tasks", _dump_list(reference.tasks)),
            ("actions", _dump_list(reference.actions)),
            ("results", _dump_list(reference.results)),
        ],
    )


def export_exchange_text() -> str:
    """Serialize current settings and references into the exchange TOML format."""
    settings = SiteSettings.get_solo()
    references = _reference_rows()
    lines: list[str] = ["format_version = 1", ""]
    _export_header(lines, settings)
    _export_home_hero(lines, settings)
    _export_about(lines, settings)
    _export_promise(lines, settings)
    _export_method(lines, settings)
    _export_publications(lines, settings)
    _export_references(lines, references)

    return "\n".join(lines).strip() + "\n"


def _parse_header_payload(header: dict) -> dict:
    return {
        "header": {
            "name": _require_string(header, "name", "header"),
            "title": _require_string(header, "title", "header"),
            "bookingUrl": _require_string(header, "booking_url", "header"),
        }
    }


def _parse_home_hero_payload(home_hero: dict) -> dict:
    links_payload = []
    for index, link in enumerate(
        _table_list(home_hero, "links", "home_hero.links"), start=1
    ):
        target = _require_string(link, "target", f"home_hero.links[{index}]").strip()
        if target not in VALID_HERO_LINK_TARGETS:
            raise TextExchangeError(
                {f"home_hero.links[{index}]": "`target` invalide pour le lien."}
            )
        links_payload.append(
            {
                "id": target,
                "label": _require_string(link, "label", f"home_hero.links[{index}]"),
                "enabled": _bool_value(link, "enabled", f"home_hero.links[{index}]"),
            }
        )

    cards_payload = []
    for index, card in enumerate(
        _table_list(home_hero, "cards", "home_hero.cards"), start=1
    ):
        cards_payload.append(
            {
                "id": f"card-{index}",
                "title": _require_string(card, "title", f"home_hero.cards[{index}]"),
                "content": _require_string(
                    card, "content", f"home_hero.cards[{index}]"
                ),
            }
        )

    return {
        "homeHero": {
            "eyebrow": _require_string(home_hero, "eyebrow", "home_hero"),
            "title": _require_string(home_hero, "title", "home_hero"),
            "subtitle": _require_string(home_hero, "subtitle", "home_hero"),
            "keywords": _string_list(home_hero, "keywords", "home_hero"),
            "links": links_payload,
            "cards": cards_payload,
        }
    }


def _parse_about_payload(about: dict) -> dict:
    return {
        "about": {
            "title": _require_string(about, "title", "about"),
            "subtitle": _require_string(about, "subtitle", "about"),
            "highlight": {
                "intro": _require_string(about, "highlight_intro", "about"),
                "items": [
                    {"id": f"about-item-{index}", "text": value}
                    for index, value in enumerate(
                        _string_list(about, "highlight_items", "about"), start=1
                    )
                ],
            },
        }
    }


def _parse_promise_payload(promise: dict) -> dict:
    promise_cards = []
    for index, card in enumerate(
        _table_list(promise, "cards", "promise.cards"), start=1
    ):
        promise_cards.append(
            {
                "id": f"promise-card-{index}",
                "title": _require_string(card, "title", f"promise.cards[{index}]"),
                "content": _require_string(card, "content", f"promise.cards[{index}]"),
            }
        )

    return {
        "promise": {
            "title": _require_string(promise, "title", "promise"),
            "subtitle": _require_string(promise, "subtitle", "promise"),
            "cards": promise_cards,
        }
    }


def _parse_method_payload(method: dict) -> dict:
    method_steps = []
    for index, step in enumerate(_table_list(method, "steps", "method.steps"), start=1):
        method_steps.append(
            {
                "id": f"method-step-{index}",
                "step": _require_string(step, "step", f"method.steps[{index}]"),
                "title": _require_string(step, "title", f"method.steps[{index}]"),
                "text": _require_string(step, "text", f"method.steps[{index}]"),
            }
        )

    return {
        "method": {
            "eyebrow": _require_string(method, "eyebrow", "method"),
            "title": _require_string(method, "title", "method"),
            "subtitle": _require_string(method, "subtitle", "method"),
            "steps": method_steps,
        }
    }


def _parse_publications_payload(publications: dict) -> dict:
    publication_items = []
    for item_index, item in enumerate(
        _table_list(publications, "items", "publications.items"),
        start=1,
    ):
        links = []
        for link_index, link in enumerate(item.get("links", []), start=1):
            if not isinstance(link, dict):
                raise TextExchangeError(
                    {
                        f"publications.items[{item_index}]": "`links` doit contenir des sections."
                    }
                )
            links.append(
                {
                    "id": f"publication-{item_index}-link-{link_index}",
                    "title": _require_string(
                        link,
                        "title",
                        f"publications.items[{item_index}].links[{link_index}]",
                    ),
                    "url": _require_string(
                        link,
                        "url",
                        f"publications.items[{item_index}].links[{link_index}]",
                    ),
                }
            )
        publication_items.append(
            {
                "id": f"publication-{item_index}",
                "title": _require_string(
                    item, "title", f"publications.items[{item_index}]"
                ),
                "content": _require_string(
                    item, "content", f"publications.items[{item_index}]"
                ),
                "links": links,
            }
        )

    return {
        "publications": {
            "title": _require_string(publications, "title", "publications"),
            "subtitle": _require_string(publications, "subtitle", "publications"),
            "highlight": {
                "title": _require_string(
                    publications, "highlight_title", "publications"
                ),
                "content": _require_string(
                    publications, "highlight_content", "publications"
                ),
            },
            "items": publication_items,
        }
    }


def _parse_settings_payload(data: dict) -> dict:
    """Parse each settings section independently to keep validation localized."""
    header = _require_table(data, "header")
    home_hero = _require_table(data, "home_hero")
    about = _require_table(data, "about")
    promise = _require_table(data, "promise")
    method = _require_table(data, "method")
    publications = _require_table(data, "publications")

    return (
        _parse_header_payload(header)
        | _parse_home_hero_payload(home_hero)
        | _parse_about_payload(about)
        | _parse_promise_payload(promise)
        | _parse_method_payload(method)
        | _parse_publications_payload(publications)
    )


def _parse_references_payload(data: dict) -> list[dict]:
    references = _table_list(data, "references", "references")
    payload: list[dict] = []
    for index, item in enumerate(references, start=1):
        reference = _require_string(item, "reference", f"references[{index}]").strip()
        if not reference:
            raise TextExchangeError(
                {f"references[{index}]": "`reference` est obligatoire."}
            )
        payload.append(
            {
                "reference": reference,
                "reference_short": _optional_string(item, "reference_short").strip(),
                "icon": _validate_url(
                    _optional_string(item, "icon"), f"references[{index}].icon"
                ),
                "situation": _optional_string(item, "situation").strip(),
                "tasks": [
                    entry.strip()
                    for entry in _string_list(item, "tasks", f"references[{index}]")
                    if entry.strip()
                ],
                "actions": [
                    entry.strip()
                    for entry in _string_list(item, "actions", f"references[{index}]")
                    if entry.strip()
                ],
                "results": [
                    entry.strip()
                    for entry in _string_list(item, "results", f"references[{index}]")
                    if entry.strip()
                ],
                "order_index": index,
            }
        )
    return payload


def parse_exchange_text(raw_text: str) -> tuple[dict, list[dict]]:
    """Read an exchange file and return validated settings plus references payloads."""
    try:
        data = tomllib.loads(raw_text)
    except tomllib.TOMLDecodeError as exc:
        raise TextExchangeError({"detail": f"Fichier TOML invalide: {exc}"}) from exc

    if data.get("format_version") != 1:
        raise TextExchangeError({"format_version": "Version de format non supportee."})

    return _parse_settings_payload(data), _parse_references_payload(data)


def _placeholder_bytes(title: str, size: tuple[int, int]) -> bytes:
    image = Image.new("RGB", size, color=(234, 179, 8))
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    caption = (title or "Reference").strip()[:42]
    subtitle = "Image generee automatiquement"

    draw.rounded_rectangle(
        (30, 30, size[0] - 30, size[1] - 30), radius=28, fill=(17, 24, 39)
    )
    draw.text((70, 90), caption, fill=(255, 255, 255), font=font)
    draw.text((70, 130), subtitle, fill=(209, 213, 219), font=font)

    buffer = BytesIO()
    image.save(buffer, format="WEBP", quality=85, method=6)
    buffer.seek(0)
    return buffer.read()


def _save_placeholder_images(title: str) -> tuple[str, str]:
    slug = slugify(title) or "reference"
    image_name = f"references/{slug}-{uuid4().hex}.webp"
    thumb_name = f"references/thumbs/{slug}-{uuid4().hex}.webp"
    image_path = default_storage.save(
        image_name,
        ContentFile(_placeholder_bytes(title, (1600, 900))),
    )
    thumb_path = default_storage.save(
        thumb_name,
        ContentFile(_placeholder_bytes(title, (640, 360))),
    )
    return image_path, thumb_path


def _delete_reference_media(reference: Reference) -> None:
    for raw_value in (reference.image, reference.image_thumb, reference.icon):
        rel_path = media_relative_path(str(raw_value or "").strip())
        if rel_path:
            default_storage.delete(rel_path)


@transaction.atomic
def import_exchange_text(raw_text: str) -> dict:
    settings_payload, references_payload = parse_exchange_text(raw_text)

    settings_instance = SiteSettings.get_solo()
    settings_serializer = SiteSettingsSerializer(
        settings_instance, data=settings_payload
    )
    settings_serializer.is_valid(raise_exception=True)

    existing_references = _reference_rows()
    settings_serializer.save()

    for reference in existing_references:
        _delete_reference_media(reference)
    Reference.objects.all().delete()

    created_references = []
    for entry in references_payload:
        image_path, thumb_path = _save_placeholder_images(entry["reference"])
        created_references.append(
            Reference.objects.create(
                reference=entry["reference"],
                reference_short=entry["reference_short"],
                order_index=entry["order_index"],
                image=image_path,
                image_thumb=thumb_path,
                icon=entry["icon"],
                situation=entry["situation"],
                tasks=entry["tasks"],
                actions=entry["actions"],
                results=entry["results"],
            )
        )

    return {
        "settings": SiteSettingsSerializer(SiteSettings.get_solo()).data,
        "references_count": len(created_references),
    }
