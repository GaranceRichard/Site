# Points vitaux (Critical Paths)

Ces points vitaux doivent viser une couverture elevee (objectif 95 %) et des tests explicites.

## 1. Authentification backoffice (JWT)
- Activation/desactivation via `DJANGO_ENABLE_JWT`.
- Login `/api/auth/token/` : succes, echec, erreurs reseau.
- Acces admin protege : refus sans token / avec token invalide / expire.

## 2. Formulaire de contact (entree principale)
- Validation serveur (champs requis, formats, consentement).
- Creation en base (succes) et non-creation (echec).
- Reponses d'erreur stables et comprehensibles.

## 3. Backoffice admin (lecture / suppression)
- Liste admin : pagination, tri, recherche, bornes (`limit`, `page`).
- Suppression admin : validation des `ids`, refus des entrees invalides.
- Acces strictement reserve aux admins/staff.

## 4. Securite de configuration (settings)
- `DJANGO_SECRET_KEY` requis hors tests / override explicite.
- `DJANGO_ALLOWED_HOSTS` correct en prod.
- CORS / CSRF : origines autorisees seulement, pas de wildcard.

## 5. Rate limiting / throttling
- Throttling global actif (anon + user).
- Throttling specifique : contact + health.
- Comportement coherent avec le cache (Redis en prod).

## 6. Contrats API critiques
- Endpoints cles : codes HTTP, schemas JSON, champs attendus.
- Compatibilite des reponses utilisees par le frontend.

## 7. Settings publics/admin du site
- `GET /api/settings/` : fallback fiable et payload compatible avec le frontend.
- `PUT /api/settings/admin/` : acces admin strict, validation du schema et persistance.
- Coherence entre `SiteSettings`, defaults backend et normalisation frontend.

## 8. Variables d'environnement essentielles
- Presence + validation des variables critiques.
- `.env.example` a jour et aligne avec le code.

## 9. Sante applicative / observabilite minimale
- Health check `/api/health/` fiable.
- Logs utiles en cas d'erreur sur les chemins critiques.
