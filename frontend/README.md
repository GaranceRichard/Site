# Frontend (Next.js)

## Commandes utiles

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## Audit de performance local

Le kit local repose sur Lighthouse CI.

```bash
# 1) Installer les deps (incluant @lhci/cli)
npm ci

# 2) Lancer l'audit (build + Lighthouse)
npm run perf:local
```

Ce que fait `perf:local`:
- build de l'app
- démarrage local (`next start` sur le port 3000)
- 3 runs Lighthouse sur `/` et `/contact`
- assertions de budget (LCP, FCP, TBT, CLS, score perf)
- rapports HTML/JSON générés dans `frontend/.lighthouseci/`

Config: `frontend/lighthouserc.json`.

Audit sur serveur `next dev` déjà lancé:
```bash
npm run perf:dev
```
