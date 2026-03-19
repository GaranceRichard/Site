# Deploiement (production / staging)

## Prerequis
- Docker + Docker Compose sur le serveur.
- Un fichier `.env.prod` sur le serveur (ne pas versionner).
- Acces SSH pour le pipeline CD (cle privee).
- Un certificat TLS et sa cle privee accessibles par Docker.

Exemple: voir `docs/env.prod.example`.

## Installation serveur pas a pas
1) Copier les fichiers de deploiement sur le serveur dans un dossier dedie, par exemple `/home/ubuntu/mon-site`.
2) Se placer dans ce dossier:
```bash
cd /home/ubuntu/mon-site
```
3) Creer le fichier `.env.prod` a partir du modele versionne:
```bash
cp docs/env.prod.example .env.prod
```
4) Ouvrir `.env.prod` et remplacer tous les placeholders `<change-me>` par des valeurs reelles.
5) Verifier au minimum ces variables avant le premier demarrage:
   - `DJANGO_SECRET_KEY`
   - `DJANGO_ALLOWED_HOSTS`
   - `DJANGO_CORS_ALLOWED_ORIGINS`
   - `DJANGO_CSRF_TRUSTED_ORIGINS`
   - `DATABASE_URL`
   - `REDIS_URL`
   - `NEXT_PUBLIC_API_BASE_URL`
   - `BACKEND_IMAGE`
   - `FRONTEND_IMAGE`
   - `NGINX_SSL_CERTIFICATE`
   - `NGINX_SSL_CERTIFICATE_KEY`
   - `NGINX_SSL_CERTIFICATE_PATH`
   - `NGINX_SSL_CERTIFICATE_KEY_PATH`
6) Verifier que les certificats existent bien sur le serveur aux chemins indiques dans `.env.prod`.
7) Valider la configuration Docker Compose avant demarrage:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod config
```
8) Demarrer la stack:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```
9) Verifier que les conteneurs sont sains:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f nginx backend frontend
```

## Deploiement local (prod-like)
```bash
cp docs/env.prod.example .env.prod
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

## Contenu minimal de `.env.prod`
Variables indispensables au premier deploiement:
- `DJANGO_SECRET_KEY`: cle secrete Django forte et unique.
- `DJANGO_ALLOWED_HOSTS`: domaine(s) publics autorises, par exemple `example.com,www.example.com`.
- `DJANGO_CORS_ALLOWED_ORIGINS`: origines frontend autorisees, en HTTPS.
- `DJANGO_CSRF_TRUSTED_ORIGINS`: origines CSRF de confiance, en HTTPS.
- `DATABASE_URL`: connexion PostgreSQL de production.
- `REDIS_URL`: connexion Redis de production.
- `NEXT_PUBLIC_API_BASE_URL`: URL publique du site, idealement `https://<domaine>`.
- `BACKEND_IMAGE` et `FRONTEND_IMAGE`: images a lancer en production.
- `NGINX_SSL_CERTIFICATE_PATH` et `NGINX_SSL_CERTIFICATE_KEY_PATH`: chemins reels sur le serveur.

Si une de ces variables est absente ou incorrecte, le demarrage peut echouer ou l'application peut rester joignable de facon partielle.

## HTTPS / TLS
- `nginx/prod.conf` force la redirection `80 -> 443` et termine TLS sur Nginx.
- Le certificat et la cle sont injectes via `.env.prod`:
  - `NGINX_SSL_CERTIFICATE_PATH`
  - `NGINX_SSL_CERTIFICATE_KEY_PATH`
  - `NGINX_SSL_CERTIFICATE`
  - `NGINX_SSL_CERTIFICATE_KEY`
- Django reste aligne cote application avec `DJANGO_SECURE_SSL_REDIRECT=true` et `DJANGO_SECURE_HSTS_SECONDS=31536000`.
- Exemple Let's Encrypt:
```bash
NGINX_SSL_CERTIFICATE=/etc/nginx/ssl/fullchain.pem
NGINX_SSL_CERTIFICATE_KEY=/etc/nginx/ssl/privkey.pem
NGINX_SSL_CERTIFICATE_PATH=/etc/letsencrypt/live/example.com/fullchain.pem
NGINX_SSL_CERTIFICATE_KEY_PATH=/etc/letsencrypt/live/example.com/privkey.pem
```
- Interpretation:
  - `NGINX_SSL_CERTIFICATE_PATH` et `NGINX_SSL_CERTIFICATE_KEY_PATH` designent les fichiers existants sur l'hote.
  - `NGINX_SSL_CERTIFICATE` et `NGINX_SSL_CERTIFICATE_KEY` designent les chemins de montage dans le conteneur Nginx.
- Si vous utilisez un certificat fourni par un hebergeur au lieu de Let's Encrypt, adaptez simplement `*_PATH` vers les bons fichiers.
- Exemple de renouvellement automatique Let's Encrypt sur le serveur:
```bash
0 4 * * * certbot renew --quiet && cd /chemin/vers/deploy && docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T nginx nginx -s reload
```

## Observabilite (Prometheus + Grafana)
Fichiers utilises:
- `docker-compose.monitoring.yml`
- `monitoring/prometheus/prometheus.yml`
- `monitoring/blackbox/blackbox.yml`
- `monitoring/grafana/provisioning/alerting/contact-points.yml`
- `monitoring/grafana/provisioning/alerting/notification-policies.yml`
- `monitoring/grafana/provisioning/alerting/rules.yml`

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
- Dashboard Grafana `Mon Site - Overview` provisionne automatiquement depuis `monitoring/grafana/provisioning/dashboards/`.
- Alertes Grafana provisionnees automatiquement pour les metriques critiques backend.

Important:
- Les ports sont bindes sur `127.0.0.1` pour eviter une exposition publique directe.
- Mettre Grafana derriere un reverse proxy authentifie (ou VPN) si acces distant.
- Changer `GRAFANA_ADMIN_PASSWORD` dans `.env.prod`.
- Renseigner `GRAFANA_ALERT_WEBHOOK_URL` dans `.env.prod` pour recevoir les notifications Grafana (Slack, ntfy, PagerDuty webhook, etc.).

## CD GitHub Actions (staging)
Le workflow `deploy.yml`:
1) Build & push des images vers GHCR.
2) Deploiement automatique vers staging (merge/push sur `main`) uniquement si la variable de repo `ENABLE_STAGING_DEPLOY=true`.
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
- Alerting Grafana provisionne depuis le repo:
  - taux de reponses HTTP 5xx > 1 % sur 5 min
  - latence P95 > 2 s sur `POST /api/contact/messages`
  - health `/api/health` en echec via blackbox exporter

## Cron cleanup medias
Configurer un cron serveur pour supprimer les medias orphelins:
```bash
# Tous les jours a 03:15
15 3 * * * cd /chemin/vers/deploy/backend && docker compose -f /chemin/vers/deploy/docker-compose.prod.yml --env-file /chemin/vers/deploy/.env.prod exec -T backend python manage.py cleanup_reference_media
```

## Smoke tests
Apres deploiement:
```bash
curl -I http://<domaine>
curl -fsS https://<domaine>/api/health
curl -fsS https://<domaine>/
```

Resultat attendu:
- `http://<domaine>` repond avec une redirection `301` vers `https://<domaine>`.
- `https://<domaine>/api/health` repond en `200`.
- `https://<domaine>/` renvoie le frontend public.
