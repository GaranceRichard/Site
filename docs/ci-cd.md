# CI/CD

## CI GitHub Actions

### Selon le contexte

- Pull request vers `main` : CI selective par chemins
- Push sur `main` : checks applicatifs, smoke E2E, build Docker
- Nightly et manuel : suite E2E complete en plus

### Checks couverts

- Backend unit : `coverage run manage.py test` puis seuil global `>= 80%`
- Backend lint : `ruff` + `black --check`
- Backend integration : Django sur Postgres + Redis reels
- Frontend : `npm run lint`, `npm run test:coverage`, `npm run typecheck`, `npm run build`
- E2E smoke sur push
- E2E full sur nightly / manuel
- Build images Docker sur `main`

## Gate local

Task VS Code source de verite :
- `Tests`

Ordre :
1. `Test coverage Backend`
2. `Test integration`
3. `Test coverage frontend`
4. `Test coverage e2e`
5. `Vitals compliance`
6. `npm lint`
7. `npm build`

Regle de completion :
- une tache n'est pas terminee tant que `Tests` n'a pas ete relancee en entier et tout au vert dans la session courante

## CD

Workflow :
- `.github/workflows/deploy.yml`

Ce que le repo fait automatiquement :
1. build et push des images GHCR backend et frontend
2. deploiement staging si `ENABLE_STAGING_DEPLOY=true`
3. smoke tests sur `/api/health` et `/`

GitHub Pages :
- `.github/workflows/github-pages-demo.yml`
- deploie la demo statique issue de `frontend/out`

## Secrets et variables

Secrets GitHub utilises pour le staging :
- `STAGING_HOST`
- `STAGING_USER`
- `STAGING_SSH_KEY`
- `STAGING_PATH`
- `STAGING_BASE_URL`
- `REGISTRY_USER`
- `REGISTRY_TOKEN`
- `STAGING_SSH_PORT` en option

Variable GitHub :
- `ENABLE_STAGING_DEPLOY=true` pour activer le staging automatique

## A lire ensuite

- Deploiement detaille : `docs/deployment.md`
- Gate d'ingenierie : `docs/engineering-lifecycle-gate.md`
- Definition of Done : `docs/Definition-of-Done.md`
