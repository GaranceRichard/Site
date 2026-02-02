# Politique de versions

Pour reduire les regressions liees aux versions recentes:

- Backend Python: versions exactes dans `backend/requirements.txt`.
- Frontend runtime: versions exactes dans `frontend/package.json` pour `next`, `react`, `react-dom`.
- Mises a jour par lot planifie (hebdomadaire ou bi-mensuel), pas en continu.
- Chaque lot de MAJ passe par CI complete + smoke E2E.
- En cas d'incident: rollback sur le commit precedent stable.

## Process de mise a jour
1. Ouvrir une branche `chore/deps-YYYY-MM-DD`.
2. Mettre a jour un groupe coherent (framework, test, tooling).
3. Executer tests + build + e2e smoke.
4. Merger uniquement si la CI est verte.
