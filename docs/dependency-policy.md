# Politique de versions

Pour reduire les regressions liees aux versions recentes:

- Backend Python: versions exactes dans `backend/requirements.txt`.
- Frontend runtime: versions exactes dans `frontend/package.json` pour `next`, `react`, `react-dom`.
- Mises a jour par lot planifie (hebdomadaire ou bi-mensuel), pas en continu.
- Chaque lot de MAJ passe par CI complete + smoke E2E.
- En cas d'incident: rollback sur le commit precedent stable.

## Detection des mises a jour

La detection n'est plus manuelle.

- Dependabot surveille automatiquement `backend/requirements.txt` via l'ecosysteme `pip` dans `backend/`.
- Dependabot surveille automatiquement `frontend/package.json` et `frontend/package-lock.json` via l'ecosysteme `npm` dans `frontend/`.
- Une verification hebdomadaire ouvre au plus une PR groupee par ecosysteme.
- Les alertes de securite utilisent le meme mecanisme: une PR Dependabot est ouverte des qu'un correctif applicable existe.

## Process de mise a jour
1. Laisser Dependabot ouvrir une PR sur sa branche dediee pour `pip` ou `npm`.
2. Verifier que la PR correspond a un lot coherent et ajuster manuellement si necessaire.
3. Executer la CI complete requise par le projet et verifier les resultats.
4. Merger uniquement si la CI est verte.

## Role de l'humain

Dependabot automatise la surveillance et la proposition de mise a jour.

L'equipe conserve la decision de merge:

- revue du contenu de la PR;
- validation de la CI;
- verification fonctionnelle si le lot touche un chemin critique;
- merge seulement sur un etat stable.
