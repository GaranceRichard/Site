# Configuration et exploitation

## Variables d'environnement

### Backend - `backend/.env`

```ini
DJANGO_SECRET_KEY=dev-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
DJANGO_CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
DJANGO_ENABLE_JWT=true
DJANGO_E2E_MODE=false
DJANGO_GLOBAL_ANON_THROTTLE_RATE=120/min
DJANGO_GLOBAL_USER_THROTTLE_RATE=600/min
```

### Frontend - `frontend/.env.local`

```ini
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_BOOKING_URL=https://example.com/booking
NEXT_DEV_ALLOWED_ORIGINS=
NEXT_PUBLIC_BACKOFFICE_ENABLED=false
NEXT_PUBLIC_SENTRY_DSN=
```

### E2E local - `frontend/.env.e2e.local`

```ini
E2E_ADMIN_USER=votre_admin
E2E_ADMIN_PASS=votre_mdp
# E2E_FRONTEND_PORT=3100
# E2E_BACKEND_PORT=8100
# E2E_API_BASE_URL=http://127.0.0.1:8100
# E2E_SANDBOX_ROOT=.e2e-virtual
```

## Backoffice

Conditions :
- `DJANGO_ENABLE_JWT=true`
- un compte Django `is_staff` ou `is_superuser`
- `NEXT_PUBLIC_API_BASE_URL` pointe vers le backend

Flux :
1. aller sur la page d'accueil
2. cliquer sur l'entree backoffice
3. saisir les identifiants admin
4. ouvrir `/backoffice`

## Health checks

- `GET /api/health` : readiness globale
- `GET /api/health/live` : liveness
- `GET /api/health/ready` : readiness explicite

Exemple de reponse degradee :

```json
{
  "ok": false,
  "db": { "ok": true },
  "redis": { "ok": false, "error": "Connection refused" }
}
```

## Maintenance

Nettoyage des medias orphelins :

```powershell
cd backend
python manage.py cleanup_reference_media
```

Audit des medias references :

```powershell
cd backend
python manage.py audit_reference_media --format=json
```

Audit plus large :

```powershell
cd backend
python manage.py audit_project_data --format=json
```

## Bonnes pratiques

Ne pas committer :
- `backend/.venv/`
- `frontend/node_modules/`
- les fichiers `.env*`
