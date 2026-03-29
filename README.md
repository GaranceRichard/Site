# GaranceRichard - Site
![CI](https://github.com/GaranceRichard/Site/actions/workflows/ci.yml/badge.svg)

## Projet

Ce depot contient un site vitrine professionnel avec formulaire de contact, backoffice de gestion de contenu et backend d'administration.

La base produit est :
- un frontoffice public en Next.js
- un backend Django / DRF
- un backoffice applicatif pour piloter les contenus
- une chaine de qualite avec tests backend, frontend, E2E et CI/CD

## Demo publique

Version accessible :
[https://garancerichard.github.io/Site/](https://garancerichard.github.io/Site/)

Ce que la demo montre :
- le frontoffice public
- la structure du site et les contenus visibles cote visiteur
- les references, publications et parcours de navigation publics

Ce que la demo ne montre pas :
- le backend Django / DRF
- le backoffice
- les fonctions d'administration
- le flux complet du formulaire de contact avec persistance en base

La GitHub Page est donc une vitrine statique du frontoffice, pas le produit complet en execution.

## Produit complet

Le produit complet ajoute a cette demo :
- une API Django / DRF pour le contact, les settings et les references
- un backoffice JWT pour administrer les contenus
- un export / import TOML des contenus
- une administration Django
- des checks qualite et de deploiement automatises

## Architecture

- `frontend/` : Next.js App Router
- `backend/` : Django + Django REST Framework
- `docs/` : documentation detaillee
- `.github/workflows/` : CI, CD et GitHub Pages

## Documentation

- Installation locale : [docs/local-development.md](docs/local-development.md)
- Configuration et exploitation : [docs/configuration-and-operations.md](docs/configuration-and-operations.md)
- CI/CD : [docs/ci-cd.md](docs/ci-cd.md)
- Backend et endpoints : [docs/backend-and-api.md](docs/backend-and-api.md)
- Backoffice : [docs/backoffice.md](docs/backoffice.md)

## Documentation existante

- Deploiement detaille : [docs/deployment.md](docs/deployment.md)
- Chargeur / extracteur : [docs/content-exchange.md](docs/content-exchange.md)
- Discipline d'execution : [docs/engineering-lifecycle-gate.md](docs/engineering-lifecycle-gate.md)
- Definition of Done : [docs/Definition-of-Done.md](docs/Definition-of-Done.md)
- Points vitaux : [docs/critical-paths.md](docs/critical-paths.md)
- Politique de dependances : [docs/dependency-policy.md](docs/dependency-policy.md)
- Strategie de migrations : [docs/migrations.md](docs/migrations.md)
- Contribution : [CONTRIBUTING.md](CONTRIBUTING.md)
