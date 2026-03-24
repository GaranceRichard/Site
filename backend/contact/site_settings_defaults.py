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


DEFAULT_ABOUT_SETTINGS = {
    "title": "Une posture de service, un cadre exigeant",
    "subtitle": (
        "Un accompagnement qui respecte les contraintes du terrain, tout en "
        "ouvrant des marges de manoeuvre."
    ),
    "highlight": {
        "intro": (
            "Intervenir avec sobriete, clarifier les priorites et aider les "
            "equipes a reprendre de l air sans theatre organisationnel."
        ),
        "items": [
            {"id": "about-item-1", "text": "Pragmatisme ancre dans le terrain"},
            {"id": "about-item-2", "text": "Cadence soutenable"},
            {"id": "about-item-3", "text": "Decision plus lisible"},
            {"id": "about-item-4", "text": "Transmission durable"},
        ],
    },
}


def default_about_settings():
    return deepcopy(DEFAULT_ABOUT_SETTINGS)


DEFAULT_PROMISE_SETTINGS = {
    "title": "Un accompagnement serieux, sobre, oriente resultats",
    "subtitle": (
        "Vous gardez l essentiel : une approche structuree, respectueuse du "
        "contexte, qui securise la livraison et renforce l autonomie."
    ),
    "cards": [
        {
            "id": "promise-card-1",
            "title": "Diagnostic rapide",
            "content": (
                "Observer le flux, clarifier les irritants, choisir peu "
                "d actions a fort effet."
            ),
        },
        {
            "id": "promise-card-2",
            "title": "Cadre de pilotage",
            "content": (
                "Quelques metriques utiles, un rythme de revue, une "
                "decision plus fluide."
            ),
        },
        {
            "id": "promise-card-3",
            "title": "Qualite",
            "content": (
                "Stabiliser l execution : limiter le WIP, reduire les "
                "reprises, securiser le done."
            ),
        },
        {
            "id": "promise-card-4",
            "title": "Transfert",
            "content": (
                "Rendre l organisation autonome : pratiques, supports, "
                "routine d amelioration."
            ),
        },
    ],
}


def default_promise_settings():
    return deepcopy(DEFAULT_PROMISE_SETTINGS)


DEFAULT_METHOD_SETTINGS = {
    "eyebrow": "Approche",
    "title": "Un chemin clair, etape par etape",
    "subtitle": (
        "Diagnostiquer, decider, mettre en oeuvre, stabiliser - avec rigueur "
        "et sobriete."
    ),
    "steps": [
        {
            "id": "method-step-1",
            "step": "01",
            "title": "Observer",
            "text": (
                "Cartographier le flux, clarifier les irritants, comprendre "
                "les contraintes."
            ),
        },
        {
            "id": "method-step-2",
            "step": "02",
            "title": "Choisir",
            "text": (
                "Definir 2-3 leviers maximum : priorisation, WIP, qualite, "
                "gouvernance."
            ),
        },
        {
            "id": "method-step-3",
            "step": "03",
            "title": "Executer",
            "text": (
                "Mettre en place des routines utiles, ajuster, renforcer l "
                "autonomie."
            ),
        },
        {
            "id": "method-step-4",
            "step": "04",
            "title": "Ancrer",
            "text": (
                "Stabiliser : standards legers, suivi, transfert et montee "
                "en competence."
            ),
        },
    ],
}


def default_method_settings():
    return deepcopy(DEFAULT_METHOD_SETTINGS)


DEFAULT_PUBLICATIONS_SETTINGS = {
    "title": "Trois formats, une meme exigence",
    "subtitle": (
        "Des interventions calibrees : utiles, lisibles, et soutenables "
        "dans la duree."
    ),
    "highlight": {
        "title": "Format type",
        "content": (
            "Diagnostic & cadrage\n"
            "Accompagnement (4 a 12 semaines)\n"
            "Restitution & plan d'ancrage"
        ),
    },
    "items": [
        {
            "id": "publication-1",
            "title": "Coaching Lean-Agile - transformation pragmatique",
            "content": (
                "Cadrage : objectifs, perimetre, gouvernance legere\n"
                "Coaching d'equipes : rituels, flux, qualite, amelioration continue\n"
                "Accompagnement des leaders : posture, decision, pilotage"
            ),
            "links": [
                {
                    "id": "publication-1-link-1",
                    "title": "Exemple de cadrage de transformation",
                    "url": "https://example.com/publications/cadrage-transformation",
                }
            ],
        },
        {
            "id": "publication-2",
            "title": "Facilitation - ateliers decisifs et alignement",
            "content": (
                "Ateliers d'alignement (vision, priorites, arbitrages)\n"
                "Resolution structuree de problemes (A3, 5 Why, etc.)\n"
                "Conception de parcours d'ateliers (du diagnostic a l'action)"
            ),
            "links": [
                {
                    "id": "publication-2-link-1",
                    "title": "Note sur les ateliers d'alignement",
                    "url": "https://example.com/publications/ateliers-alignement",
                }
            ],
        },
        {
            "id": "publication-3",
            "title": "Formation - bases solides, ancrage durable",
            "content": (
                "Lean / Agile : fondamentaux, pratiques, anti-patterns\n"
                "Pilotage par la valeur : priorisation, metriques, flow\n"
                "Transfert : supports, exercices, plan d'ancrage"
            ),
            "links": [
                {
                    "id": "publication-3-link-1",
                    "title": "Programme de formation Lean-Agile",
                    "url": "https://example.com/publications/formation-lean-agile",
                }
            ],
        },
    ],
}


def default_publications_settings():
    return deepcopy(DEFAULT_PUBLICATIONS_SETTINGS)
