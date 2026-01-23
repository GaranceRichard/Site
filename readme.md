# GaranceRichard — Site (Frontend Next.js + Backend Django/DRF)

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
- backend/ (Django + API REST)
- frontend/ (Next.js)

## Prérequis
- Node.js (LTS recommandé)
- Python (version compatible avec backend/requirements.txt)
- Git

## Démarrage rapide (développement)
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

### Lancer backend + frontend (VS Code)
Utiliser les tasks VS Code :
1) Ouvrir la palette de commandes (Ctrl+Shift+P)
2) "Tasks: Run Task"
3) Choisir `dev:all`

## Configuration des variables d’environnement
### Backend — backend/.env (local)
Créer un fichier backend/.env (non versionné) avec :

```ini
DJANGO_SECRET_KEY=dev-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:3000
DJANGO_ENABLE_JWT=true
```

### Frontend — frontend/.env.local (local)
Créer un fichier frontend/.env.local (non versionné) avec :

```ini
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_BACKOFFICE_ENABLED=true
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

## Tests (socle minimal)
### Backend (Django)
Depuis `backend/` :
- Lancer tous les tests :
```powershell
python manage.py test
```

### Frontend (Next.js)
Depuis `frontend/` :
- Lancer les tests unitaires (Vitest) :
```powershell
npm run test
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
- HTTPS en frontal + DJANGO_SECURE_SSL_REDIRECT=True
- Sauvegardes DB + logs centralisés
- (Optionnel) SENTRY_DSN pour monitoring

## Déploiement (à minima)
- DJANGO_DEBUG=False
- DJANGO_SECRET_KEY fort
- DJANGO_ALLOWED_HOSTS et DJANGO_CORS_ALLOWED_ORIGINS alignés avec le domaine
- Base de données de production (PostgreSQL recommandé)
- HTTPS en frontal
