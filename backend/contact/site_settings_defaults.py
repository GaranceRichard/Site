from copy import deepcopy

DEFAULT_HEADER_SETTINGS = {
    "name": "Garance Richard",
    "title": "Coach Lean-Agile",
    "bookingUrl": "https://calendar.app.google/hYgX38RpfWiu65Vh8",
}


def default_header_settings():
    return deepcopy(DEFAULT_HEADER_SETTINGS)


DEFAULT_HOME_HERO_SETTINGS = {
    "eyebrow": "Lean-Agile - transformation pragmatique, ancree dans le reel",
    "title": "Des equipes plus sereines.\nDes livraisons plus fiables.",
    "subtitle": (
        "Accompagnement oriente resultats : clarifier la priorite, stabiliser le "
        "flux, renforcer l autonomie - sans surcouche inutile."
    ),
    "links": [
        {"id": "services", "label": "Voir les offres", "enabled": True},
        {"id": "references", "label": "Exemples d'impact", "enabled": True},
        {"id": "promise", "label": "Promesse", "enabled": False},
        {"id": "about", "label": "A propos", "enabled": False},
        {"id": "method", "label": "Methode", "enabled": False},
        {"id": "message", "label": "Message", "enabled": False},
    ],
    "keywords": ["Clarte", "Flux", "Ancrage"],
    "cards": [
        {
            "id": "card-1",
            "title": "Cadre d'intervention",
            "content": (
                "Diagnostic court -> 2-3 leviers -> routines utiles -> "
                "stabilisation -> transfert.\n\nConcret - Mesurable - Durable"
            ),
        },
        {
            "id": "card-2",
            "title": "Ce que vous obtenez",
            "content": (
                "- Une priorite explicite\n- Un flux plus stable\n"
                "- Une cadence soutenable"
            ),
        },
    ],
}


def default_home_hero_settings():
    return deepcopy(DEFAULT_HOME_HERO_SETTINGS)
