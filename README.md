# GaranceRichard — Site (Frontend Next.js + Backend Django/DRF)
![CI](https://github.com/GaranceRichard/Site/actions/workflows/ci.yml/badge.svg)

## Démo publique

Le frontoffice du produit est disponible en version de démonstration statique sur GitHub Pages à l’adresse suivante :
https://garancerichard.github.io/Site/

Cette démo présente le frontoffice public du produit.
Le backend, le backoffice et les fonctions d’administration ne sont pas exposés dans cette version.
Pour le premier déploiement, GitHub Pages doit être activé une fois dans les réglages du dépôt avec la source `GitHub Actions`.

Site vitrine avec page de contact.
- Frontend : Next.js (App Router)
- Backend : Django + Django REST Framework
- Fonctionnalité : formulaire /contact → API /api/contact/messages → stockage en base + consultation via admin Django

## Fonctionnalités
- Page d’accueil (vitrine)
- Section `Publications` : cartes cliquables ouvrant une modale de detail avec fermeture au clic hors modale
- Page /contact avec formulaire
- Backoffice : chargeur / extracteur TOML pour exporter le contenu et reimporter un fichier valide
- API POST /api/contact/messages (Django REST Framework)
- Stockage des messages en base (SQLite en dev)
- Consultation via l’admin Django
- Anti-spam : honeypot côté front + throttling côté API

## Structure du projet
garancerichard-site/
- docker-compose.yml (PostgreSQL + Redis pour dev)
- Makefile (raccourcis commandes dev)
- backend/ (Django + API REST)
- backend/contact/text_exchange.py (format TOML, export, import, images factices)
- backend/contact/tests/test_text_exchange_api.py (tests du flux chargeur / extracteur)
- frontend/ (Next.js)
- frontend/src/app/backoffice/ (page, sectionStore, composants UI)
- frontend/src/app/backoffice/components/ContentExchangeManager.tsx
- frontend/src/app/backoffice/components/ContentExchangeManager.test.tsx
- frontend/src/app/backoffice/components/HomeSettingsManager.tsx
- frontend/src/app/backoffice/components/HeaderSettingsManager.tsx
- frontend/src/app/backoffice/components/AboutSettingsManager.tsx
- frontend/src/app/content/homeHeroSettings.ts
- frontend/src/app/content/headerSettings.ts
- frontend/src/app/content/aboutSettings.ts
- frontend/src/app/components/home/ (Hero, sections, references, footer)
- frontend/src/app/api-proxy/media/[...path]/route.ts (proxy same-origin des medias backend)
- frontend/src/app/lib/media.ts (normalisation/proxy des URLs media backend cote frontend)
- frontend/tests/ (Playwright: backoffice, references, contact, admin-home-header)
- frontend/tests/helpers.ts (helpers E2E partages)
- frontend/scripts/e2e-coverage-report.mjs (agregation coverage E2E)

## CI / CD (GitHub Actions)

### Ce qui se passe selon le contexte
- Pull request vers `main` : CI selective par chemins. Les jobs backend, frontend et CI ne tournent que si leurs fichiers ont change.
- Push sur `main` : la CI rejoue les checks applicatifs, lance le smoke E2E, puis construit les images Docker.
- Nightly a `02:00 UTC` et declenchement manuel : la suite E2E complete tourne en plus.
- CD separe : le workflow `.github/workflows/deploy.yml` pousse toujours les images sur GHCR, mais ne deploie vers staging que si `ENABLE_STAGING_DEPLOY=true`.

### Checks couverts par la CI
- Backend unit : `coverage run manage.py test` puis seuil global `>= 80%`.
- Backend lint : `ruff` + `black --check`.
- Backend integration : Django sur Postgres + Redis reels.
- Frontend : `npm run lint`, `npm run test:coverage`, `npm run typecheck`, `npm run build`.
- E2E smoke sur push : `contact.spec.ts` + login backoffice invalide.
- E2E full sur nightly / manuel : `npm run test:e2e`.
- Docker build sur `main` : build image backend et frontend.

### A retenir
- Un merge dans `main` ne deploie pas automatiquement en staging par defaut.
- Le deploiement staging est garde par une variable GitHub de repo.
- Si le staging est desactive, le CD continue quand meme a publier les images GHCR.
- En cas d'echec E2E, la CI publie les logs serveur et les artefacts Playwright.

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

Tasks de verification utiles :
- `Tests` : lance les couvertures backend, integration, frontend, E2E, `Vitals compliance`, `npm lint` et `npm build`.
  Les runs backend de cette task utilisent chacun un `COVERAGE_FILE` dedie pour eviter les collisions de `.coverage` quand les checks tournent en parallele.
  La task est volontairement sequencee pour eviter les faux rouges Windows lies aux spawns Node/esbuild pendant les checks frontend/vitals.
  Si `Test coverage frontend` laisse des lignes rouges sur la zone demandee, alors le check est considere rouge.
- Regle de completion : aucune tache n'est consideree complete tant que la task VS Code `Tests` n'a pas ete relancee en entier et tout au vert dans la session courante.
- `Vitals compliance` : valide la couverture vitale frontend (`95/95/95/95` avec `perFile`) puis la couverture d'integration backend avec un seuil global backend de `95%` et un controle backend vital par fichier.

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
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_BOOKING_URL=https://example.com/booking
NEXT_DEV_ALLOWED_ORIGINS=
NEXT_PUBLIC_BACKOFFICE_ENABLED=false
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
- Settings de site :
  - GET /api/settings/ (public: header + hero + about)
  - PUT /api/settings/admin/ (admin uniquement)
- GET /api/contact/messages/admin (liste, admin uniquement)
  - Parametres : page (defaut 1), limit (defaut 50, max 200), q (nom/email/sujet), sort (created_at|name|email|subject), dir (asc|desc)
- POST /api/contact/messages/admin/delete (supprime une liste d'IDs, admin uniquement)
- Références :
  - GET /api/contact/references (liste publique)
  - Les endpoints `/api/contact/references/admin*` ci-dessous sont admin uniquement.
  - POST /api/contact/references/admin/upload (upload image)
  - GET /api/contact/references/admin (liste)
  - POST /api/contact/references/admin (création)
  - GET /api/contact/references/admin/<id> (détail)
  - PUT /api/contact/references/admin/<id> (mise à jour)
  - DELETE /api/contact/references/admin/<id> (suppression)
  - Le frontend remappe les URLs locales `/media/...` vers un proxy same-origin Next (`/api-proxy/media/...`) pour fiabiliser le chargement des médias et des icônes de références en dev, CI et E2E.

- Chargeur / extracteur :
  - GET /api/contact/exchange/admin/template (canevas TOML)
  - GET /api/contact/exchange/admin/export (export de l'etat courant)
  - POST /api/contact/exchange/admin/import (import UTF-8 valide, references recreees avec images factices)

## Documentation chargeur / extracteur
- Guide dedie : `docs/content-exchange.md`
- Le format supporte est TOML en UTF-8, editable a la main.
- L'import met a jour `SiteSettings`, remplace les references et regenere les images placeholder cote backend.
- Dans le backoffice, l'entree `Chargeur / extracteur` est placee juste au-dessus de `Rafraichir`.

## Tests (socle minimal)
### Backend (Django)
Depuis `backend/` :
- Lancer tous les tests :
```powershell
python manage.py test
```
- Isolation media de test :
  les runs `manage.py test` utilisent un `MEDIA_ROOT` dedie sous `backend/.test-media/`, afin de proteger `backend/media/`.
  Un override explicite reste possible via `DJANGO_TEST_MEDIA_ROOT`.
- Couverture :
```powershell
python -m coverage run manage.py test
python -m coverage report --fail-under=80
python -m coverage html
```
- Si un test backend valide volontairement une reponse HTTP d'erreur attendue, le bruit de log associe doit etre capture ou neutralise dans le test pour ne pas polluer un run vert.
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
 - Rapport HTML explicite :
```powershell
npm run test:coverage:html
```

### E2E (Playwright)
Depuis `frontend/` :
- Installer les navigateurs (une seule fois) :
```powershell
npx playwright install
```
- Lancer les tests E2E :
```powershell
$env:E2E_ADMIN_USER="votre_admin"
$env:E2E_ADMIN_PASS="votre_mdp"
npm run test:e2e
```
- Isolation automatique :
- les E2E demarrent un backend Django dedie sur `127.0.0.1:8100` avec une DB SQLite et des medias sous `frontend/.e2e-virtual/`.
- les E2E demarrent aussi un frontend dedie sur `127.0.0.1:3100` avec un dossier Next distinct de `.next/`.
- le bootstrap backend E2E passe par `frontend/scripts/start-e2e-backend.mjs`, afin de rester compatible Windows et Linux.
- le backend de dev (`backend/db.sqlite3`, `backend/media/`) n'est plus partage avec la suite E2E.
- les variables d'environnement heritees potentiellement dangereuses (`DATABASE_URL`, `DJANGO_MEDIA_ROOT`, `E2E_API_BASE_URL`, ports `3000/8000`) sont ecrasees par la config E2E pour imposer la sandbox.
- Alternative locale (sans retaper) :
  Creer `frontend/.env.e2e.local` (non versionne) :
```ini
E2E_ADMIN_USER=votre_admin
E2E_ADMIN_PASS=votre_mdp
# Optionnel :
# E2E_FRONTEND_PORT=3100
# E2E_BACKEND_PORT=8100
# E2E_API_BASE_URL=http://127.0.0.1:8100
# E2E_SANDBOX_ROOT=.e2e-virtual
```
- Couverture E2E (collecte brute) :
```powershell
$env:E2E_COVERAGE="true"
$env:E2E_ADMIN_USER="votre_admin"
$env:E2E_ADMIN_PASS="votre_mdp"
npm run test:e2e:coverage
```
- Smoke rapide :
```powershell
npm run test:e2e:smoke
```
- Suite exhaustive hors KPI coverage :
```powershell
npm run test:e2e:full
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
- `npm run test:coverage` est la commande stable pour CLI/VS Code. Le HTML est volontairement sorti dans `npm run test:coverage:html`. Le wrapper nettoie `frontend/coverage/` avant chaque run pour eviter les etats de coverage stale entre executions.
- Si `npm run test:coverage` affiche encore des lignes rouges sur la zone demandee, le sujet n'est pas considere valide.
- Les commandes Vitest frontend stables (`npm run test`, `npm run test:coverage`, `npm run test:coverage:html`) prechargent `frontend/scripts/vite-child-process-patch.mjs` pour neutraliser un faux `EPERM` Windows observe pendant l'initialisation Vite/Vitest.
- Les tests E2E nécessitent un compte admin `is_staff` et un backend en cours d'exécution.
- CI GitHub Actions : definir les secrets `E2E_ADMIN_USER` et `E2E_ADMIN_PASS`.
- Couverture E2E KPI : parcours browser critiques du front visible. Le backoffice detaille reste principalement couvert par Vitest.

## Maintenance
Nettoyer les medias orphelins des references :
```powershell
cd backend
python manage.py cleanup_reference_media
```

Auditer l'integrite des medias references :
```powershell
cd backend
python manage.py audit_reference_media --format=json
```

Auditer l'integrite locale plus large du projet :
```powershell
cd backend
python manage.py audit_project_data --format=json
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
- Certificat TLS monte dans le conteneur Nginx + redirection 80 -> 443
- Sauvegardes DB + logs centralisés
- (Optionnel) SENTRY_DSN pour monitoring

## Déploiement (à minima)
- DJANGO_DEBUG=False
- DJANGO_SECRET_KEY fort
- DJANGO_ALLOWED_HOSTS et DJANGO_CORS_ALLOWED_ORIGINS alignés avec le domaine
- Base de données de production (PostgreSQL recommandé)
- Redis en production (recommandé pour le throttling)
- HTTPS en frontal

## Deploiement accessible

### Ce que le repo fait automatiquement
1. Un push sur `main` lance `.github/workflows/deploy.yml`.
2. Le job `build_push` construit puis pousse deux images GHCR :
   - backend : `ghcr.io/<owner>/<repo>-backend:<sha>`
   - frontend : `ghcr.io/<owner>/<repo>-frontend:<sha>`
3. Si `ENABLE_STAGING_DEPLOY=true`, le job `deploy_staging` envoie les fichiers de compose/config sur le serveur, relance la stack et execute deux smoke tests:
   - `GET <STAGING_BASE_URL>/api/health`
   - `GET <STAGING_BASE_URL>/`

### Ce qu'il faut preparer avant le premier deploiement
- Un serveur avec Docker et Docker Compose.
- Un dossier de deploiement contenant `.env.prod`.
- Les secrets GitHub Actions requis:
  - `STAGING_HOST`
  - `STAGING_USER`
  - `STAGING_SSH_KEY`
  - `STAGING_PATH`
  - `STAGING_BASE_URL`
  - `REGISTRY_USER`
  - `REGISTRY_TOKEN`
  - `STAGING_SSH_PORT` en option
- La variable GitHub `ENABLE_STAGING_DEPLOY=true` si l'on veut activer le staging automatique.
- Un certificat TLS accessible par Nginx.

### Ou lire la suite
- Pas-a-pas complet : `docs/deployment.md`
- Source de verite CI : `.github/workflows/ci.yml`
- Source de verite CD : `.github/workflows/deploy.yml`

## Standards d'ingenierie (DoD)
- Discipline d'execution : `docs/engineering-lifecycle-gate.md`
- Definition of Done stricte : `docs/Definition-of-Done.md`
- Points vitaux (couverture cible 95 %) : `docs/critical-paths.md`
- Guide du chargeur / extracteur : `docs/content-exchange.md`
- Controle backend vital par fichier : `backend/scripts/check_vitals_coverage.py`
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
- Alerting Grafana provisionne en YAML (`monitoring/grafana/provisioning/alerting/`) avec notifications webhook via `GRAFANA_ALERT_WEBHOOK_URL`.
- Ports utilises:
- App locale: `http://127.0.0.1:8000` (API), `http://127.0.0.1:3000` (front).
- Monitoring local serveur: `http://127.0.0.1:9090` (Prometheus), `http://127.0.0.1:3001` (Grafana).
- Prerequis:
- Dev: Node.js LTS, Python, Docker (pour postgres/redis).
- Staging/Prod: Docker + Docker Compose, `.env.prod`, acces SSH pour CD.

### 2) Deploiement
- Workflow recommande:
- `main` -> workflow `.github/workflows/deploy.yml` -> build/push GHCR -> deploiement staging optionnel -> smoke tests.
- Le job de deploiement staging est garde par la variable GitHub `ENABLE_STAGING_DEPLOY=true`.
- Commandes locales "prod-like":
```bash
cp docs/env.prod.example .env.prod
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```
- Mise en place detaillee:
- Suivre le pas-a-pas de `docs/deployment.md`, notamment la creation de `.env.prod`, le parametrage TLS et la validation `docker compose ... config`.
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
- Variables clefs E2E local:
- `E2E_ADMIN_USER`, `E2E_ADMIN_PASS`, `E2E_FRONTEND_PORT`, `E2E_BACKEND_PORT`, `E2E_API_BASE_URL`, `E2E_SANDBOX_ROOT`.
- Variables clefs proxy TLS:
- `NGINX_SSL_CERTIFICATE`, `NGINX_SSL_CERTIFICATE_KEY`, `NGINX_SSL_CERTIFICATE_PATH`, `NGINX_SSL_CERTIFICATE_KEY_PATH`.
- Variables observabilite:
- `SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE`, `GRAFANA_ADMIN_USER`, `GRAFANA_ADMIN_PASSWORD`, `PROMETHEUS_RETENTION_DAYS`, `GRAFANA_ALERT_WEBHOOK_URL`.
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
- 3. Grafana pour la vue consolidee et l'alerting (datasource `Prometheus` preconfiguree, contact point webhook provisionne).
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

## Notes de maintenance recentes
- La section `Publications` n'utilise plus de panneaux deployants : chaque titre ouvre maintenant une modale de detail fermee par clic exterieur ou via `Escape`.
- Le store frontend `SiteSettings` tente maintenant `/api-proxy` puis bascule sur `NEXT_PUBLIC_API_BASE_URL` pour charger et enregistrer les reglages si le proxy navigateur n'est pas disponible.
- Les tests unitaires des managers de reglages backoffice neutralisent desormais `NEXT_PUBLIC_API_BASE_URL` quand ils moquent un seul appel `fetch`, afin d'eviter les faux echecs CI lies au fallback reseau.
- Le backend expose maintenant des `SiteSettings` publics/admin pour piloter le header et le hero de la page d'accueil.
- Le schema `SiteSettings` inclut maintenant un bloc `about` admin/public, avec migration Django appliquee et normalisation frontend dediee.
- Le backoffice permet maintenant d'editer la section `A propos` (titre, sous-titre, encart, jusqu'a 4 encadres) et le menu de gauche place cette section apres `References`.
- La task VS Code `Test integration` inclut les tests backend `SiteSettings` et `test_models`, afin d'aligner la couverture d'integration avec le seuil global a `95%`.
- `npm run test:coverage` cote frontend utilise un wrapper plus robuste: nettoyage du dossier `coverage/`, tolerance du faux echec Windows lie a `coverage/.tmp`, et retry automatique en cas de faux depart Vitest/Vite/esbuild.
- Les scripts frontend de test/coverage reposent maintenant sur `vitest.config.mjs`, `vitest.config.vitals.mjs` et un prechargement `vite-child-process-patch.mjs` pour stabiliser les runs Windows.
- Le rapport texte de coverage frontend force une largeur d'affichage plus confortable pour eviter les noms de fichiers tronques dans le terminal.
- Une ligne rouge restante dans le rapport de coverage frontend sur la zone demandee garde le check au rouge, meme si le seuil global est passe.
- Les tests backend utilisent maintenant un `MEDIA_ROOT` dedie (`backend/.test-media/`) pour ne plus jamais toucher aux medias locaux du projet pendant `manage.py test`.
- Les tests backend qui valident un `503` attendu sur `/api/stats/summary/` capturent maintenant le log `django.request` associe pour garder des runs lisibles.
- Le backend E2E Playwright est maintenant demarre via un lanceur Node multiplateforme, pour que le smoke CI fonctionne aussi sous Linux sans dependre de PowerShell.
- Les médias locaux des références passent désormais par un proxy Next same-origin (`frontend/src/app/api-proxy/media/[...path]/route.ts`) pour éviter les flakes de chargement d'icônes/images entre frontend et backend en E2E/CI.
