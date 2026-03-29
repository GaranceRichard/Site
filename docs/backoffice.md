# Backoffice

## Role

Le backoffice permet d'administrer les contenus du site sans passer par le code :
- header
- hero
- a propos
- promesse
- methode
- publications
- references
- messages recus
- chargeur / extracteur TOML

## Acces

Pre requis :
- backend JWT actif
- compte Django `is_staff` ou `is_superuser`

Parcours :
1. ouvrir le site
2. acceder a l'entree backoffice
3. se connecter
4. administrer `/backoffice`

## Perimetre fonctionnel

- edition des reglages de site
- consultation et suppression de messages
- CRUD des references et de leurs medias
- export / import du contenu courant

## Organisation du code

- `frontend/src/app/backoffice/`
- `frontend/src/app/backoffice/components/`
- `frontend/src/app/backoffice/components/references/`
- `frontend/src/app/content/siteSettingsStore.ts`

## Tests

Unitaires frontend :

```powershell
cd frontend
npm run test
npm run test:coverage
```

E2E :

```powershell
cd frontend
npm run test:e2e
```

## Notes de fonctionnement

- le backoffice utilise JWT
- le frontend sait passer par `/api-proxy` puis basculer vers `NEXT_PUBLIC_API_BASE_URL`
- les medias locaux des references passent par un proxy same-origin Next pour fiabiliser le chargement en dev, CI et E2E
