# Backend et API

## Stack

- Django
- Django REST Framework
- SQLite en dev
- PostgreSQL et Redis en configuration plus complete

## Surfaces principales

### Contact

Endpoint :
- `POST /api/contact/messages`

Champs attendus :
- `name`
- `email`
- `subject` optionnel
- `message`
- `consent` doit etre `true`
- `source` optionnel

Protection :
- honeypot cote front
- throttling cote API

### Settings et contenus

- `GET /api/settings/`
- `PUT /api/settings/admin/`

### Messages admin

- `GET /api/contact/messages/admin`
- `POST /api/contact/messages/admin/delete`

Parametres utiles :
- `page`
- `limit`
- `q`
- `sort`
- `dir`

### References

Public :
- `GET /api/contact/references`

Admin :
- `GET /api/contact/references/admin`
- `POST /api/contact/references/admin`
- `GET /api/contact/references/admin/<id>`
- `PUT /api/contact/references/admin/<id>`
- `DELETE /api/contact/references/admin/<id>`
- `POST /api/contact/references/admin/upload`

### Chargeur / extracteur

- `GET /api/contact/exchange/admin/template`
- `GET /api/contact/exchange/admin/export`
- `POST /api/contact/exchange/admin/import`

Guide detaille :
- `docs/content-exchange.md`

## Documentation OpenAPI

- Swagger UI : `http://127.0.0.1:8000/api/docs/`
- Redoc : `http://127.0.0.1:8000/api/redoc/`
- Schema JSON : `http://127.0.0.1:8000/api/schema/`

Validation :

```powershell
cd backend
python manage.py spectacular --validate --fail-on-warn
```

## Tests backend

Tous les tests :

```powershell
cd backend
python manage.py test
```

Couverture :

```powershell
python -m coverage run manage.py test
python -m coverage report --fail-under=80
python -m coverage html
```

Lint / format :

```powershell
python -m ruff check .
python -m black --check .
```

## Fichiers utiles

- `backend/contact/views.py`
- `backend/contact/urls.py`
- `backend/contact/text_exchange.py`
- `backend/contact/tests/test_text_exchange_api.py`
- `backend/scripts/check_vitals_coverage.py`
