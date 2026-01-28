# Contribuer

Merci de contribuer ! Ce guide standardise l'onboarding, le workflow et la qualité.

## Setup rapide (Docker)

Prérequis :
- Docker + Docker Compose
- Node.js (LTS)
- Python (version compatible avec `backend/requirements.txt`)

Démarrage :
```powershell
docker compose up -d
```

Configurer `backend/.env` :
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

Installer les dépendances :
```powershell
make install
```

Lancer les migrations :
```powershell
cd backend
python manage.py migrate
```

Lancer le dev :
```powershell
make dev
```

## Workflow de branche

Créer une branche dédiée :
- `feature/mon-sujet`
- `fix/bug-critique`
- `chore/maintenance`

Gardez la branche à jour avec `main` si le travail s’étale.

## Format des commits (Conventional Commits)

Format attendu :
```
type(scope): sujet court
```

Exemples :
- `feat(backoffice): add reference ordering`
- `fix(api): handle upload errors`
- `test(e2e): cover references modal`
- `docs: update docker setup`

Types usuels :
`feat`, `fix`, `test`, `docs`, `refactor`, `chore`.

## Checklist PR

- [ ] Description claire du besoin / du bug
- [ ] Pas de régressions visibles
- [ ] Tests OK (unit + lint + build)
- [ ] E2E si impact front / backoffice
- [ ] Couverture maintenue (cible 95% sur points vitaux)
- [ ] Screenshots/vidéo si UI
- [ ] Migrations incluses si modèle changé

## Standards de tests

Backend :
- `python manage.py test`
- `coverage run --rcfile=.coveragerc manage.py test`
- `coverage report -m`
  - Vérifier que le seuil est >= 80%

Frontend :
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run test:coverage`
  - Vérifier que le seuil est >= 80%

E2E :
- `npm run test:e2e`
- Utiliser `E2E_ADMIN_USER` et `E2E_ADMIN_PASS`
