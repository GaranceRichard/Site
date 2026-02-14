# Frontend (Next.js)

## Commandes utiles

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run test:e2e
npm run test:e2e:coverage
npm run test:e2e:coverage:report
npm run build
```

## E2E coverage

- `npm run test:e2e:coverage` : collecte brute V8 dans `coverage-e2e/`.
- `npm run test:e2e:coverage:report` : collecte + aggregation Istanbul (text/json/html) dans `coverage-e2e-report/`.

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
