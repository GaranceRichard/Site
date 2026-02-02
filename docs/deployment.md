# Deploiement (production / staging)

## Prerequis
- Docker + Docker Compose sur le serveur.
- Un fichier `.env.prod` sur le serveur (ne pas versionner).
- Acces SSH pour le pipeline CD (cle privee).

Exemple: voir `docs/env.prod.example`.

## Deploiement local (prod-like)
```bash
cp docs/env.prod.example .env.prod
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

## Observabilite (Prometheus + Grafana)
Fichiers utilises:
- `docker-compose.monitoring.yml`
- `monitoring/prometheus/prometheus.yml`

Demarrage (stack app + monitoring):
```bash
docker compose \
  -f docker-compose.prod.yml \
  -f docker-compose.monitoring.yml \
  --env-file .env.prod up -d
```

Acces local serveur:
- Prometheus: `http://127.0.0.1:9090`
- Grafana: `http://127.0.0.1:3001`
- Datasource Grafana `Prometheus` preconfiguree (URL interne `http://prometheus:9090`).

Important:
- Les ports sont bindes sur `127.0.0.1` pour eviter une exposition publique directe.
- Mettre Grafana derriere un reverse proxy authentifie (ou VPN) si acces distant.
- Changer `GRAFANA_ADMIN_PASSWORD` dans `.env.prod`.

## CD GitHub Actions (staging)
Le workflow `deploy.yml`:
1) Build & push des images vers GHCR.
2) Deploiement automatique vers staging (merge/push sur `main`).
3) Smoke tests post-deploiement.

### Secrets requis (GitHub Actions)
Configurer dans Settings -> Secrets -> Actions:
- `STAGING_HOST`
- `STAGING_USER`
- `STAGING_SSH_KEY`
- `STAGING_SSH_PORT` (optionnel, defaut 22)
- `STAGING_PATH` (ex: `/home/ubuntu/mon-site`)
- `STAGING_BASE_URL` (ex: `https://staging.example.com`)
- `REGISTRY_USER` (utilisateur GHCR ou PAT)
- `REGISTRY_TOKEN` (token GHCR avec `read:packages`)

Le serveur doit contenir `docker-compose.prod.yml`, `docker-compose.monitoring.yml`,
`nginx/prod.conf` et `.env.prod`.

## CDN / stockage medias (S3 + CloudFront)
Pour activer le stockage S3:
1) Renseigner les variables AWS dans `.env.prod` (voir `docs/env.prod.example`).
2) Optionnel: configurer un domaine CDN (CloudFront) via `AWS_S3_CUSTOM_DOMAIN`.
3) Verifier que `MEDIA_URL` pointe bien vers le CDN.

## Antivirus (optionnel)
Si necessaire, ajouter un scan ClamAV cote serveur ou dans un service dedie avant
d'accepter les uploads.

## Rollback
1) Choisir un tag d'image stable (SHA precedent).
2) Sur le serveur:
```bash
cd /chemin/vers/deploy
export BACKEND_IMAGE=ghcr.io/<owner>/<repo>-backend:<sha-precedent>
export FRONTEND_IMAGE=ghcr.io/<owner>/<repo>-frontend:<sha-precedent>
docker compose -f docker-compose.prod.yml --env-file .env.prod pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

## Monitoring post-deploiement
Recommande:
- Healthcheck externe sur `GET /api/health` et `GET /api/health/ready`.
- Alertes (Uptime Kuma/UptimeRobot/Better Uptime) si timeout ou statut non 200.
- Dashboard Grafana branche sur Prometheus (datasource: `http://prometheus:9090`).

## Cron cleanup medias
Configurer un cron serveur pour supprimer les medias orphelins:
```bash
# Tous les jours a 03:15
15 3 * * * cd /chemin/vers/deploy/backend && docker compose -f /chemin/vers/deploy/docker-compose.prod.yml --env-file /chemin/vers/deploy/.env.prod exec -T backend python manage.py cleanup_reference_media
```

## Smoke tests
Apres deploiement:
```bash
curl -fsS https://<domaine>/api/health
curl -fsS https://<domaine>/
```
