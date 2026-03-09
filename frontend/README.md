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

- `npm run test:e2e:smoke` : filet rapide des parcours critiques transverses.
- `npm run test:e2e:coverage` : KPI browser court, limite au front visible (`ContactForm`, `ReferenceModal`) et collecte brute V8 dans `coverage-e2e/`.
- `npm run test:e2e:coverage:report` : collecte + aggregation Istanbul (text/json/html) dans `coverage-e2e-report/`.
- `npm run test:e2e:full` : suite Playwright exhaustive, hors KPI coverage.

## Pyramide de tests

- Vitest couvre la logique fine front, les branches d'erreur et le backoffice detaille.
- Les tests d'integration backend couvrent les endpoints DRF, l'auth, le throttling et la securite.
- Les E2E couvrent seulement les parcours utilisateur critiques visibles dans le navigateur, sans redoubler les branches deja protegees en unitaire.

## Tasks VS Code

- `dev:all` : lance `Backend`, `Frontend`, `Monitor` et `Perf Loop` dans 4 terminaux distincts.
- `Tests` : lance `Test coverage Backend`, `Test integration`, `Test coverage frontend`, `Test coverage e2e`, `Vitals compliance`, `npm lint` et `npm build`.
- `Vitals compliance` : combine le coverage frontend vital (`95/95/95/95` avec `perFile: true` sur le sous-ensemble explicite defini dans `vitest.config.vitals.ts`, aligne avec `docs/critical-paths.md`) et le coverage d'integration backend avec seuil global `95%` puis controle backend vital par fichier via `backend/scripts/check_vitals_coverage.py`.

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
