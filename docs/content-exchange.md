# Chargeur / Extracteur

Le backoffice propose un flux `Chargeur / extracteur` pour manipuler tout le contenu editorial du site a partir d'un fichier texte unique.

## Objectif

- Offrir un support d'echange editable hors interface.
- Exporter l'etat courant du contenu depuis le backoffice.
- Reimporter un fichier controle sans saisir chaque bloc a la main.
- Recreer automatiquement les references importees avec des images factices cote backend.

## Emplacement dans le backoffice

- Menu : `Chargeur / extracteur`
- Position : juste au-dessus de `Rafraichir`
- Ecran frontend : `frontend/src/app/backoffice/components/ContentExchangeManager.tsx`

## Endpoints

- `GET /api/contact/exchange/admin/template`
  Retourne le canevas TOML de depart.
- `GET /api/contact/exchange/admin/export`
  Retourne l'etat courant des contenus.
- `POST /api/contact/exchange/admin/import`
  Attend un fichier TOML ou texte en UTF-8 et applique l'import si tout est valide.

## Format de fichier

Le format officiel est TOML en UTF-8.

Sections couvertes :

- `header`
- `home_hero`
- `about`
- `promise`
- `method`
- `publications`
- `references`

Exemple minimal :

```toml
format_version = 1

[header]
name = "Nom affiche"
title = "Titre affiche"
booking_url = "https://example.com/booking"

[home_hero]
eyebrow = "Surtitre"
title = "Titre principal"
subtitle = "Sous-titre"
keywords = ["Mot-cle 1", "Mot-cle 2"]

[[home_hero.links]]
target = "services"
label = "Voir les offres"
enabled = true

[[home_hero.cards]]
title = "Carte 1"
content = "Contenu 1"

[about]
title = "Titre a propos"
subtitle = "Sous-titre a propos"
highlight_intro = "Introduction courte"
highlight_items = ["Point 1", "Point 2"]

[promise]
title = "Titre positionnement"
subtitle = "Sous-titre positionnement"

[[promise.cards]]
title = "Promesse 1"
content = "Contenu promesse"

[method]
eyebrow = "Approche"
title = "Titre methode"
subtitle = "Sous-titre methode"

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
title = "Lien 1"
url = "https://example.com/publication-1"

[[references]]
reference = "Nom de la reference"
reference_short = "Nom court"
icon = "https://example.com/icon.png"
situation = "Contexte"
tasks = ["Tache 1"]
actions = ["Action 1"]
results = ["Resultat 1"]
```

## Regles de validation

- `format_version` doit valoir `1`.
- Le fichier doit etre decode en UTF-8.
- Les sections obligatoires doivent etre presentes et bien types.
- Les URLs externes de type `icon` doivent etre valides en `http` ou `https`.
- Les listes TOML doivent contenir le bon type d'entrees.
- Si une seule section est invalide, aucun changement n'est applique.

## Effets de l'import

- `SiteSettings` est mis a jour de maniere atomique.
- Les references existantes sont supprimees puis recreees.
- Chaque reference importee recoit une image principale et une miniature generees automatiquement.
- Les caches publics des settings et des references sont invalides apres succes.

## Conseils d'usage

- Partir du canevas telecharge depuis le backoffice.
- Garder l'ordre des blocs `[[references]]` si l'ordre d'affichage compte.
- Utiliser l'export courant comme base quand on veut modifier un existant.
- Eviter les copier-coller depuis des sources qui changent l'encodage.

## Fichiers techniques lies

- `backend/contact/text_exchange.py`
- `backend/contact/views.py`
- `backend/contact/tests/test_text_exchange_api.py`
- `frontend/src/app/backoffice/components/ContentExchangeManager.tsx`
- `frontend/src/app/backoffice/components/ContentExchangeManager.test.tsx`
