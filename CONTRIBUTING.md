# Contribuer

Merci de contribuer. Ce guide standardise l'onboarding, le workflow et la qualite.

## Setup rapide (Docker)

Prerequis:
- Docker + Docker Compose
- Node.js (LTS)
- Python (version compatible avec `backend/requirements.txt`)

Demarrage:
```powershell
docker compose up -d
```

Configurer `backend/.env`:
```ini
DJANGO_SECRET_KEY=dev-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
DJANGO_CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
DJANGO_ENABLE_JWT=true
DATABASE_URL=postgresql://dev:dev@127.0.0.1:5432/garancerichard_dev
REDIS_URL=redis://127.0.0.1:6379/0
```

Installer les dependances:
```powershell
make install
```

Lancer les migrations:
```powershell
cd backend
python manage.py migrate
```

Lancer le dev:
```powershell
make dev
```

## Workflow de branche

Creer une branche dediee:
- `feature/mon-sujet`
- `fix/bug-critique`
- `chore/maintenance`

Gardez la branche a jour avec `main` si le travail s'etale.

## Format des commits (Conventional Commits)

Format attendu:
```
type(scope): sujet court
```

Exemples:
- `feat(backoffice): add reference ordering`
- `fix(api): handle upload errors`
- `test(e2e): cover references modal`
- `docs: update docker setup`

Types usuels:
`feat`, `fix`, `test`, `docs`, `refactor`, `chore`.

## Pre-commit (hooks)

Installation (une fois):
```powershell
python -m pip install pre-commit
pre-commit install
```

Le hook lance la suite complete (backend + frontend + E2E).
Prerequis E2E: fichier `frontend/.env.e2e.local` avec `E2E_ADMIN_USER` et `E2E_ADMIN_PASS`.
Note: le hook peut etre long a executer.

Execution manuelle:
```powershell
pre-commit run --all-files
```

## Checklist PR

- [ ] Description claire du besoin / du bug
- [ ] Pas de regressions visibles
- [ ] Tests OK (unit + lint + build)
- [ ] E2E si impact front / backoffice
- [ ] Couverture maintenue (cible 95% sur points vitaux)
- [ ] Screenshots/video si UI
- [ ] Migrations incluses si modele change
- [ ] Notes de deploy/rollback si migration non triviale

## Standards de tests

Backend:
- `python manage.py test`
- `coverage run --rcfile=.coveragerc manage.py test`
- `coverage report -m`
  - Verifier que le seuil est >= 80%

Frontend:
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run test:coverage`
  - Verifier que le seuil est >= 80%

E2E:
- `npm run test:e2e`
- Utiliser `E2E_ADMIN_USER` et `E2E_ADMIN_PASS`

CI (GitHub Actions):
- Ajouter les secrets `E2E_ADMIN_USER` et `E2E_ADMIN_PASS` dans le repo GitHub.
- Settings -> Secrets and variables -> Actions -> New repository secret.

## Documentation utile

- Strategie de migrations: `docs/migrations.md`
- Politique de versions: `docs/dependency-policy.md`
