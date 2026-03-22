# Frontend (Next.js)

## Commandes utiles

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run test:coverage:html
npm run test:e2e
npm run test:e2e:smoke
npm run test:e2e:coverage
npm run test:e2e:coverage:report
npm run test:e2e:full
npm run build
```

## Coverage frontend

- `npm run test:coverage` : coverage CLI stable pour le terminal et les tasks VS Code.
- Le script passe par [run-vitest-coverage.mjs](/c:/Users/garan/Desktop/Projets/Mon%20site/frontend/scripts/run-vitest-coverage.mjs) pour tolerer le faux echec Windows lie a `coverage/.tmp` et repartir d'un dossier `coverage/` propre a chaque run.
- Reporters actifs par defaut : `text` + `lcov`.
- `npm run test:coverage` impose `80/80/80/80` avec `perFile: true` sur les fichiers couverts par la config standard.
- `npm run test:coverage:vitals` : meme commande frontend, mais avec des seuils `95/95/95/95` sur le sous-ensemble aligne avec `docs/critical-paths.md` : `app/backoffice`, `contact/ContactForm`, `BackofficeModal`, `components/backoffice` et `lib/backoffice`.
- `npm run test:coverage:html` : generation explicite du rapport HTML si besoin.

## E2E coverage

- Les E2E utilisent un sandbox local dedie: backend sur `127.0.0.1:8100`, frontend sur `127.0.0.1:3100`, DB/media dans `frontend/.e2e-virtual/`.
- Le script [start-e2e-backend.mjs](/c:/Users/garan/Desktop/Projets/Mon%20site/frontend/scripts/start-e2e-backend.mjs) prepare la DB, les medias et l'admin E2E sans toucher au backend de dev, avec un lancement compatible Windows et Linux.
- La config E2E ecrase volontairement les overrides d'environnement dangereux (`DATABASE_URL`, `DJANGO_MEDIA_ROOT`, `E2E_API_BASE_URL`, ports `3000/8000`) pour empecher tout retour vers `backend/db.sqlite3` ou `backend/media`.
- `frontend/.env.e2e.local` peut contenir `E2E_ADMIN_USER`, `E2E_ADMIN_PASS` et, si besoin, `E2E_FRONTEND_PORT`, `E2E_BACKEND_PORT`, `E2E_API_BASE_URL`, `E2E_SANDBOX_ROOT`.
- `npm run test:e2e:smoke` : filet rapide des parcours critiques transverses.
- `npm run test:e2e:coverage` : KPI browser court, limite au front visible (`ContactForm`, `ReferenceModal`) et collecte brute V8 dans `coverage-e2e/`.
- `npm run test:e2e:coverage:report` : collecte + aggregation Istanbul (text/json/html) dans `coverage-e2e-report/`.
- `npm run test:e2e:full` : suite Playwright exhaustive, hors KPI coverage.
- Les medias backend exposes via `/media/...` sont remappes cote frontend vers `/api-proxy/media/...` pour garder un chargement same-origin fiable dans la modale de references et en CI.

## Pyramide de tests

- Vitest couvre la logique fine front, les branches d'erreur et le backoffice detaille.
- Les tests d'integration backend couvrent les endpoints DRF, l'auth, le throttling et la securite.
- Les E2E couvrent seulement les parcours utilisateur critiques visibles dans le navigateur, sans redoubler les branches deja protegees en unitaire.

## Tasks VS Code

- `dev:all` : lance `Backend`, `Frontend`, `Monitor` et `Perf Loop` dans 4 terminaux distincts.
- `Tests` : lance `Test coverage Backend`, `Test integration`, `Test coverage frontend`, `Test coverage e2e`, `Vitals compliance`, `npm lint` et `npm build`.
- Regle de completion du repo : aucune tache n'est complete tant que la task complete `Tests` n'a pas ete relancee et integralement verte dans la session courante.
- `Vitals compliance` : combine le coverage frontend vital (`95/95/95/95` avec `perFile: true` sur le sous-ensemble explicite defini dans `vitest.config.vitals.ts`, aligne avec `docs/critical-paths.md`) et le coverage d'integration backend avec seuil global `95%` puis controle backend vital par fichier via `backend/scripts/check_vitals_coverage.py`.

## Notes recentes

- `npm run test:coverage` passe par [run-vitest-coverage.mjs](/c:/Users/garan/Desktop/Projets/Mon%20site/frontend/scripts/run-vitest-coverage.mjs), qui nettoie `coverage/`, tolere le faux echec `coverage/.tmp` sous Windows et retente une fois si Vitest/Vite/esbuild echoue au demarrage.
- Le reporter texte de coverage force une largeur d'affichage plus grande pour limiter les chemins tronques du type `....quechose.ts`.
- Les nouveaux tests `siteSettingsStore.test.ts` couvrent les branches de fallback et d'erreur du store de settings public/admin.
- Le bootstrap backend Playwright ne depend plus de PowerShell: le smoke E2E et la suite complete demarrent maintenant avec le meme lanceur Node portable en local et en CI Linux.
- Les references publiques utilisent maintenant `src/app/lib/media.ts` et `src/app/api-proxy/media/[...path]/route.ts` pour proxifier les medias backend locaux et stabiliser l'affichage des icones/images en E2E.

## Audit de performance local

Le kit local repose sur Lighthouse CI.

```bash
# 1) Installer les deps (incluant @lhci/cli)
npm ci

# 2) Lancer l'audit (build + Lighthouse)
npm run perf:local
```

Ce que fait `perf:local` :
- build de l'app
- demarrage local (`next start` sur le port 3000)
- 3 runs Lighthouse sur `/` et `/contact`
- assertions de budget (LCP, FCP, TBT, CLS, score perf)
- rapports HTML/JSON generes dans `frontend/.lighthouseci/`

Config : `frontend/lighthouserc.json`.

Audit sur serveur `next dev` deja lance :

```bash
npm run perf:dev
```
