# GaranceRichard — Site (Frontend Next.js + Backend Django/DRF)
![CI](https://github.com/GaranceRichard/Site/actions/workflows/ci.yml/badge.svg)

Site vitrine avec page de contact.
- Frontend : Next.js (App Router)
- Backend : Django + Django REST Framework
- Fonctionnalité : formulaire /contact → API /api/contact/messages → stockage en base + consultation via admin Django

## Fonctionnalités
- Page d’accueil (vitrine)
- Page /contact avec formulaire
- API POST /api/contact/messages (Django REST Framework)
- Stockage des messages en base (SQLite en dev)
- Consultation via l’admin Django
- Anti-spam : honeypot côté front + throttling côté API

## Structure du projet
garancerichard-site/
- docker-compose.yml (PostgreSQL + Redis pour dev)
- Makefile (raccourcis commandes dev)
- backend/ (Django + API REST)
- frontend/ (Next.js)
- frontend/src/app/backoffice/ (page, sectionStore, composants UI)
- frontend/src/app/backoffice/components/HomeSettingsManager.tsx
- frontend/src/app/backoffice/components/HeaderSettingsManager.tsx
- frontend/src/app/content/homeHeroSettings.ts
- frontend/src/app/content/headerSettings.ts
- frontend/src/app/components/home/ (Hero, sections, references, footer)
- frontend/tests/ (Playwright: backoffice, references, contact, admin-home-header)
- frontend/tests/helpers.ts (helpers E2E partages)
- frontend/scripts/e2e-coverage-report.mjs (agregation coverage E2E)

## CI (GitHub Actions)
- PR et main : tests unitaires backend + frontend + lint + build front
- Nightly (02:00 UTC) : E2E Playwright
- main seulement : build des images Docker (sans push registry)


## Quality & CI
- Pull requests: lint + tests + coverage gates avant merge.
- Front quality gate: npm run test:coverage avec seuil 80% (lines/statements/branches/functions) dans Vitest.
- Back quality gate: coverage report --fail-under=80.
- Sur main: tests/build puis build Docker backend + frontend.
- Nightly (02:00 UTC): suite E2E Playwright complete.
- Push sur `main`: E2E smoke rapide (contact + login invalide backoffice).
- En cas d'echec E2E: logs serveurs + traces/screenshots Playwright en artifacts.
- CI optimisee par chemins: jobs front/back declenches selon les fichiers modifies.

## Prérequis
- Node.js (LTS recommandé)
- Python (version compatible avec backend/requirements.txt)
- Git

## Démarrage rapide (développement)
### Docker Compose (PostgreSQL + Redis)
Depuis la racine du repo :
```powershell
docker compose up -d
```

Puis dans `backend/.env`, ajouter :
```ini
DATABASE_URL=postgresql://dev:dev@127.0.0.1:5432/garancerichard_dev
REDIS_URL=redis://127.0.0.1:6379/0
```

Ensuite lancer les migrations :
```powershell
cd backend
python manage.py migrate
```

### Backend (Django)
- Dans un terminal :
```powershell
cd backend
```

(optionnel) créer un venv :
```powershell
python -m venv .venv
```

Activer le venv :

- Windows PowerShell :
```powershell
.\.venv\Scripts\Activate.ps1
```

- macOS/Linux :
```bash
source .venv/bin/activate
```

Installer les dépendances :
```powershell
python -m pip install -r requirements.txt
```

Migrations + admin :
```powershell
python manage.py migrate
python manage.py createsuperuser
```

Lancer le serveur :
```powershell
python manage.py runserver
```

Backend : http://127.0.0.1:8000
Admin : http://127.0.0.1:8000/admin/

### Frontend (Next.js)

Dans un second terminal :

```powershell
cd frontend
npm install
npm run dev
```

Frontend : http://localhost:3000

### Lancer backend + frontend (Windows)
Depuis la racine du repo :
```powershell
.\scripts\dev-all.ps1
```

Avec audit perf Lighthouse en boucle (toutes les 10 min) :
```powershell
.\scripts\dev-all.ps1 -PerfLoop
```

Intervalle personnalisable (en secondes) :
```powershell
.\scripts\dev-all.ps1 -PerfLoop -PerfIntervalSeconds 900
```

### Lancer backend + frontend (VS Code)
Utiliser les tasks VS Code :
1) Ouvrir la palette de commandes (Ctrl+Shift+P)
2) "Tasks: Run Task"
3) Choisir `dev:all`
   - inclut backend, frontend, monitoring local et audit perf Lighthouse en boucle

### Makefile (raccourcis)
Depuis la racine du repo :
- `make install` : installe les dépendances backend + frontend
- `make test` : tests backend + frontend
- `make dev` : docker-compose + dev-all
- `make coverage` : couverture backend + frontend

## Configuration des variables d’environnement
### Backend — backend/.env (local)
Créer un fichier backend/.env (non versionné) avec :

```ini
DJANGO_SECRET_KEY=dev-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
DJANGO_CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
DJANGO_ENABLE_JWT=true
# Mode E2E: relaxe le throttling pour eviter les faux positifs.
DJANGO_E2E_MODE=false
# (Optionnel) Headers de sécurité
# DJANGO_SECURITY_CSP=default-src 'self'; ...
# DJANGO_PERMISSIONS_POLICY=geolocation=(), camera=(), microphone=(), ...
# Throttling global (optionnel en dev, recommande en prod)
DJANGO_GLOBAL_ANON_THROTTLE_RATE=120/min
DJANGO_GLOBAL_USER_THROTTLE_RATE=600/min
```

### Frontend — frontend/.env.local (local)
Créer un fichier frontend/.env.local (non versionné) avec :

```ini
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_BACKOFFICE_ENABLED=true
NEXT_PUBLIC_SENTRY_DSN=
```

### Backoffice (JWT + comptes admin)
Le backoffice utilise JWT. Pour se connecter :
- Activer `DJANGO_ENABLE_JWT=true` côté backend.
- Utiliser un compte Django `is_staff` ou `is_superuser` (via `python manage.py createsuperuser`).
- Vérifier que `NEXT_PUBLIC_API_BASE_URL` pointe bien vers le backend.

Flux de connexion :
1) Aller sur la page d'accueil.
2) Cliquer sur le logo backoffice (footer).
3) Saisir l'identifiant et le mot de passe admin.
4) Redirection vers `/backoffice` et chargement des messages.

Depannage (modal qui reapparait / 401 / 403) :
- `DJANGO_ENABLE_JWT=true` + serveur backend redemarre.
- Compte admin avec `is_staff` ou `is_superuser`.
- `NEXT_PUBLIC_API_BASE_URL` correct (par defaut http://127.0.0.1:8000).

Notes securite / configuration :
- En production, `DJANGO_SECRET_KEY` est obligatoire.
- En production, `REDIS_URL` est requis pour un throttling global coherent (sauf override explicite).
- En developpement, CORS/CSRF sont limites aux origines locales par defaut.

## API — Contact
Endpoint : POST /api/contact/messages

Champs attendus (JSON) :

- name : chaîne
- email : chaîne (email)
- subject : chaîne (optionnel)
- message : chaîne
- consent : booléen (doit être true)
- source : chaîne (optionnel, ex. contact-page)

Notes :

- consent doit être true (validation backend)
- anti-spam : honeypot côté front + throttling côté API

## Documentation API (OpenAPI)
- Swagger UI: http://127.0.0.1:8000/api/docs/
- Redoc: http://127.0.0.1:8000/api/redoc/
- OpenAPI schema (JSON): http://127.0.0.1:8000/api/schema/

Schema validation (CI / local):
```powershell
cd backend
python manage.py spectacular --validate --fail-on-warn
```

## Health checks
- GET /api/health : readiness (DB + Redis si configuré) → 200 ou 503
- GET /api/health/live : liveness (app up) → 200
- GET /api/health/ready : readiness explicite (même logique que /api/health)


### Bonus : alerting
Objectif : détecter rapidement les pannes partielles (app up mais DB/Redis down).

- UptimeRobot : ping GET /api/health toutes les 5 min (alerte si 503).
- Better Uptime : alerte si statut HTTP != 200 ou si ok=false.
- Datadog / New Relic : parser le JSON pour extraire db.ok, redis.ok et créer des monitors.

Exemple réponse :
```json
{
  "ok": false,
  "db": { "ok": true },
  "redis": { "ok": false, "error": "Connection refused" }
}
```

## API — Backoffice
- GET /api/contact/messages/admin (liste, admin uniquement)
  - Parametres : page (defaut 1), limit (defaut 50, max 200), q (nom/email/sujet), sort (created_at|name|email|subject), dir (asc|desc)
- POST /api/contact/messages/admin/delete (supprime une liste d'IDs, admin uniquement)
- Références (admin uniquement) :
  - GET /api/contact/references (liste publique)
  - POST /api/contact/references/admin/upload (upload image)
  - GET /api/contact/references/admin (liste)
  - POST /api/contact/references/admin (création)
  - GET /api/contact/references/admin/<id> (détail)
  - PUT /api/contact/references/admin/<id> (mise à jour)
  - DELETE /api/contact/references/admin/<id> (suppression)

## Tests (socle minimal)
### Backend (Django)
Depuis `backend/` :
- Lancer tous les tests :
```powershell
python manage.py test
```
- Couverture :
```powershell
python -m coverage run manage.py test
python -m coverage report --fail-under=80
python -m coverage html
```
- Lint/format Python :
```powershell
python -m ruff check .
python -m black --check .
```

### Frontend (Next.js)
Depuis `frontend/` :
- Lancer les tests unitaires (Vitest) :
```powershell
npm run test
```
- Typecheck strict TypeScript :
```powershell
npm run typecheck
```
 - Couverture :
```powershell
npm run test:coverage
```

### E2E (Playwright)
Depuis `frontend/` :
- Installer les navigateurs (une seule fois) :
```powershell
npx playwright install
```
- Pre-requis backend (dans `backend/.env`) :
```ini
DJANGO_ENABLE_JWT=true
DJANGO_E2E_MODE=true
```
- Lancer les tests E2E :
```powershell
$env:E2E_ADMIN_USER="votre_admin"
$env:E2E_ADMIN_PASS="votre_mdp"
npm run test:e2e
```
- Alternative locale (sans retaper) :
  Creer `frontend/.env.e2e.local` (non versionne) :
```ini
E2E_ADMIN_USER=votre_admin
E2E_ADMIN_PASS=votre_mdp
```
- Couverture E2E (collecte brute) :
```powershell
$env:E2E_COVERAGE="true"
$env:E2E_ADMIN_USER="votre_admin"
$env:E2E_ADMIN_PASS="votre_mdp"
npm run test:e2e:coverage
```
- Couverture E2E + rapport agrege (text-summary + json + html) :
```powershell
$env:E2E_ADMIN_USER="votre_admin"
$env:E2E_ADMIN_PASS="votre_mdp"
npm run test:e2e:coverage:report
```
  Rapports generes dans `frontend/coverage-e2e-report/`.

Notes tests :
- Les tests unitaires front ne scannent que `src/**/*.test.*`.
- Les tests E2E nécessitent un compte admin `is_staff` et un backend en cours d'exécution.
- CI GitHub Actions : definir les secrets `E2E_ADMIN_USER` et `E2E_ADMIN_PASS`.
- Couverture E2E : backoffice, references, formulaire de contact.

## Maintenance
Nettoyer les medias orphelins des references :
```powershell
cd backend
python manage.py cleanup_reference_media
```

## Test rapide (curl)
### Windows PowerShell (2 lignes) :

$body = '{"name":"Test","email":"test@example.com","subject":"Hello","message":"Test","consent":true,"source":"curl"}'
curl -i -X POST "http://127.0.0.1:8000/api/contact/messages" -H "Content-Type: application/json" -d $body

## Bonnes pratiques repo
Ne pas committer :

- backend/.venv/
- frontend/node_modules/
- fichiers .env*

## Checklist production (socle sain)
- DJANGO_DEBUG=False
- DJANGO_SECRET_KEY fort
- DJANGO_ALLOWED_HOSTS configuré (domaines réels)
- DJANGO_CORS_ALLOWED_ORIGINS + DJANGO_CSRF_TRUSTED_ORIGINS alignés avec le domaine
- DATABASE_URL configurée (PostgreSQL recommandé)
- REDIS_URL configuré (throttling global cohérent)
- CSP + Permissions-Policy configurées
- HTTPS en frontal + DJANGO_SECURE_SSL_REDIRECT=True
- Sauvegardes DB + logs centralisés
- (Optionnel) SENTRY_DSN pour monitoring

## Déploiement (à minima)
- DJANGO_DEBUG=False
- DJANGO_SECRET_KEY fort
- DJANGO_ALLOWED_HOSTS et DJANGO_CORS_ALLOWED_ORIGINS alignés avec le domaine
- Base de données de production (PostgreSQL recommandé)
- Redis en production (recommandé pour le throttling)
- HTTPS en frontal

## Standards d'ingenierie (DoD)
- Definition of Done stricte : `docs/Definition-of-Done.md`
- Points vitaux (couverture cible 95 %) : `docs/critical-paths.md`
- CI GitHub Actions (checks bloquants) : `.github/workflows/ci.yml`
- Guide de contribution : `CONTRIBUTING.md`
- Hooks pre-commit : `.pre-commit-config.yaml`

## Gouvernance technique
- Strategie de migrations : `docs/migrations.md`
- Politique de versions et cadence de mise a jour : `docs/dependency-policy.md`

## RUN / Exploitation
### 1) Service overview
- Composants:
- Frontend: Next.js (`frontend`) sert le site sur le port `3000` en dev.
- Backend: Django/DRF (`backend`) sert l'API et l'admin sur le port `8000`.
- DB: PostgreSQL (`db` en prod compose, `postgres` en dev compose) sur `5432`.
- Cache/rate-limit: Redis (`redis`) sur `6379`.
- Monitoring: Prometheus (`9090`) + Grafana (`3001`) via `docker-compose.monitoring.yml`.
- Ports utilises:
- App locale: `http://127.0.0.1:8000` (API), `http://127.0.0.1:3000` (front).
- Monitoring local serveur: `http://127.0.0.1:9090` (Prometheus), `http://127.0.0.1:3001` (Grafana).
- Prerequis:
- Dev: Node.js LTS, Python, Docker (pour postgres/redis).
- Staging/Prod: Docker + Docker Compose, `.env.prod`, acces SSH pour CD.

### 2) Deploiement
- Workflow recommande:
- `main` -> workflow `.github/workflows/deploy.yml` -> build/push GHCR -> deploiement staging -> smoke tests.
- Commandes locales "prod-like":
```bash
cp docs/env.prod.example .env.prod
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```
- Commandes avec monitoring:
```bash
docker compose -f docker-compose.prod.yml -f docker-compose.monitoring.yml --env-file .env.prod up -d
```
- Configuration par environnement:
- `dev`: `backend/.env` + `frontend/.env.local`, execution locale (`runserver` + `npm run dev`).
- `staging`: compose prod + monitoring, images GHCR taggees par SHA, deploy auto via GitHub Actions.
- `prod`: meme stack que staging, mais secrets et endpoints de prod dans `.env.prod`.

### 3) Configuration & secrets
- Variables clefs backend:
- `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DATABASE_URL`, `REDIS_URL`.
- Variables clefs frontend:
- `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SENTRY_DSN`.
- Variables observabilite:
- `SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE`, `GRAFANA_ADMIN_USER`, `GRAFANA_ADMIN_PASSWORD`, `PROMETHEUS_RETENTION_DAYS`.
- Stockage des secrets:
- Local: `backend/.env`, `frontend/.env.local`, `frontend/.env.e2e.local` (non versionnes).
- Serveur: `.env.prod` hors git.
- CI/CD: GitHub Secrets (`STAGING_*`, `REGISTRY_*`).
- Interdits:
- Ne jamais committer `.env*`, tokens, mots de passe, clefs privees.
- Ne jamais publier `GRAFANA_ADMIN_PASSWORD`, `SENTRY_DSN` prive, credentials DB/Redis.

### 4) Supervision / Observabilite
- Quoi regarder en premier:
- 1. `GET /api/health` et `GET /api/health/ready` (etat global app/DB/Redis).
- 2. Prometheus (`/metrics` scrape sur `backend:8000`) pour erreurs HTTP, latence, disponibilite.
- 3. Grafana pour la vue consolidee (datasource `Prometheus` preconfiguree).
- 4. En local: `./scripts/monitor-local.ps1 -Loop`.
- Sentry (priorisation):
- Sev1: erreurs massives ou indisponibilite (500 en rafale, auth/admin KO global, crash frontend bloque).
- Sev2: erreur partielle degradee (route/feature critique partiellement indisponible).
- Sev3: erreur isolee ou non bloquante.
- Ownership (par defaut):
- Backend/API, DB, Redis: owner backend.
- Frontend UX/runtime: owner frontend.
- Infra deploy/compose/nginx/monitoring: owner ops.

### 5) Incidents
- Triage en 5 etapes:
- 1. Symptome: identifier impact utilisateur (page KO, API KO, lenteur, erreurs 5xx).
- 2. Logs: verifier logs runtime (`docker compose logs -f backend frontend nginx redis db` ou terminaux dev).
- 3. Metriques: verifier tendance erreurs/latence dans Prometheus/Grafana.
- 4. Sentry: isoler type d'exception, volume, endpoint ecrase, release concernee.
- 5. Hypotheses: formuler 1-2 causes probables, tester rapidement, appliquer correctif ou rollback.
- Ou trouver les logs:
- Dev: sortie terminal `python manage.py runserver` et `npm run dev`.
- Compose: `docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f <service>`.
- Reproduction:
- Utiliser endpoint minimal (`/api/health`, `/api/contact/messages`) puis reproduire sur route cible.
- Capturer timestamp + route + payload + user impacte (si dispo) pour correler avec Sentry/metriques.
- Severite minimale:
- Sev1: indisponibilite totale ou perte fonction coeur metier.
- Sev2: degradation majeure avec contournement possible.
- Sev3: bug mineur, impact limite, pas de blocage global.

### 6) Rollback / reprise
- Rollback applicatif (images precedentes):
```bash
cd /chemin/vers/deploy
export BACKEND_IMAGE=ghcr.io/<owner>/<repo>-backend:<sha-precedent>
export FRONTEND_IMAGE=ghcr.io/<owner>/<repo>-frontend:<sha-precedent>
docker compose -f docker-compose.prod.yml -f docker-compose.monitoring.yml --env-file .env.prod pull
docker compose -f docker-compose.prod.yml -f docker-compose.monitoring.yml --env-file .env.prod up -d
```
- Si incident DB lie a migration irreversible:
- Restaurer la sauvegarde DB puis redeployer la version precedente (voir `docs/migrations.md`).
- Checks de reprise (obligatoires):
- `curl -fsS https://<domaine>/api/health`
- `curl -fsS https://<domaine>/api/health/ready`
- `curl -fsS https://<domaine>/`
- Verifier baisse des erreurs Sentry + retour des metriques a la normale (latence/5xx).
