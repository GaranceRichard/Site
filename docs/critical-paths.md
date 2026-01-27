# Points vitaux (Critical Paths)

Ces points vitaux doivent viser une couverture élevée (objectif 95 %) et des tests explicites.

## 1. Authentification backoffice (JWT)
- Activation/désactivation via `DJANGO_ENABLE_JWT`.
- Login `/api/auth/token/` : succès, échec, erreurs réseau.
- Accès admin protégé : refus sans token / avec token invalide / expiré.

## 2. Formulaire de contact (entrée principale)
- Validation serveur (champs requis, formats, consentement).
- Création en base (succès) et non-création (échec).
- Réponses d’erreur stables et compréhensibles.

## 3. Backoffice admin (lecture / suppression)
- Liste admin : pagination, tri, recherche, bornes (`limit`, `page`).
- Suppression admin : validation des `ids`, refus des entrées invalides.
- Accès strictement réservé aux admins/staff.

## 4. Sécurité de configuration (settings)
- `DJANGO_SECRET_KEY` requis hors tests / override explicite.
- `DJANGO_ALLOWED_HOSTS` correct en prod.
- CORS / CSRF : origines autorisées seulement, pas de wildcard.

## 5. Rate limiting / throttling
- Throttling global actif (anon + user).
- Throttling spécifique : contact + health.
- Comportement cohérent avec le cache (Redis en prod).

## 6. Contrats API critiques
- Endpoints clés : codes HTTP, schémas JSON, champs attendus.
- Compatibilité des réponses utilisées par le frontend.

## 7. Variables d’environnement essentielles
- Présence + validation des variables critiques.
- `.env.example` à jour et aligné avec le code.

## 8. Santé applicative / observabilité minimale
- Health check `/api/health/` fiable.
- Logs utiles en cas d’erreur sur les chemins critiques.

