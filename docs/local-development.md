# Installation locale

## Prerequis

- Node.js LTS
- Python compatible avec `backend/requirements.txt`
- Git
- Docker si vous utilisez PostgreSQL + Redis en local

## Demarrage rapide

### Option Docker Compose

Depuis la racine :

```powershell
docker compose up -d
```

Puis dans `backend/.env` :

```ini
DATABASE_URL=postgresql://dev:dev@127.0.0.1:5432/garancerichard_dev
REDIS_URL=redis://127.0.0.1:6379/0
```

Ensuite :

```powershell
cd backend
python manage.py migrate
```

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Backend :
- `http://127.0.0.1:8000`
- admin Django : `http://127.0.0.1:8000/admin/`

### Frontend

Dans un second terminal :

```powershell
cd frontend
npm install
npm run dev
```

Frontend :
- `http://localhost:3000`

Comportement public :
- hors mode demo, le frontoffice public lit maintenant les settings publics depuis le backend des le rendu serveur
- si le backend n'est pas lance, le front retombe sur les valeurs par defaut normalisees
- pour verifier les contenus reels et eviter les flashes de contenu historique, lancez donc backend + frontend ensemble en local

## Lancement combine

### Windows

```powershell
.\scripts\dev-all.ps1
```

Avec boucle Lighthouse :

```powershell
.\scripts\dev-all.ps1 -PerfLoop
```

### VS Code

Task principale :
- `dev:all`

Task de verification :
- `Tests`

Regle repo :
- aucune tache n'est consideree complete tant que la task `Tests` n'a pas ete relancee en entier et tout au vert dans la session courante

## Makefile

- `make install` : dependances backend + frontend
- `make test` : tests backend + frontend
- `make dev` : docker-compose + dev-all
- `make coverage` : couverture backend + frontend
