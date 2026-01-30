# Déploiement (production / staging)

## Prérequis
- Docker + Docker Compose sur le serveur.
- Un fichier `.env.prod` sur le serveur (ne pas versionner).
- Accès SSH pour le pipeline CD (clé privée).

Exemple: voir `docs/env.prod.example`.

## Déploiement local (prod-like)
```bash
cp docs/env.prod.example .env.prod
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

## CD GitHub Actions (staging)
Le workflow `deploy.yml` :
1) Build & push des images vers GHCR.
2) Déploiement automatique vers staging (merge/push sur `main`).
3) Smoke tests post-déploiement.

### Secrets requis (GitHub Actions)
Configurer dans Settings → Secrets → Actions:
- `STAGING_HOST`
- `STAGING_USER`
- `STAGING_SSH_KEY`
- `STAGING_SSH_PORT` (optionnel, défaut 22)
- `STAGING_PATH` (ex: `/home/ubuntu/mon-site`)
- `STAGING_BASE_URL` (ex: `https://staging.example.com`)
- `REGISTRY_USER` (utilisateur GHCR ou PAT)
- `REGISTRY_TOKEN` (token GHCR avec read:packages)

Le serveur doit contenir `docker-compose.prod.yml`, `nginx/prod.conf` et `.env.prod`.
Le workflow copie automatiquement `docker-compose.prod.yml` et `nginx/prod.conf`.

## Rollback
1) Choisir un tag d’image stable (SHA précédent).
2) Sur le serveur:
```bash
cd /chemin/vers/deploy
export BACKEND_IMAGE=ghcr.io/<owner>/<repo>-backend:<sha-precedent>
export FRONTEND_IMAGE=ghcr.io/<owner>/<repo>-frontend:<sha-precedent>
docker compose -f docker-compose.prod.yml --env-file .env.prod pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

## Monitoring post-déploiement
Recommandé:
- Healthcheck externe sur `GET /api/health` et `GET /api/health/ready`.
- UptimeRobot / Better Uptime / Datadog (alerte si 5xx/timeout).

## Smoke tests
Après déploiement:
```bash
curl -fsS https://<domaine>/api/health
curl -fsS https://<domaine>/
```
