# Gate

Ce repo applique un gate de finalisation strict.

## Regle

Avant toute finalisation de tache demandee, la task VS Code `Tests` doit etre executee.

Avant cette execution, `BLOCKERS.md` doit etre relu et ses decisions durables doivent etre appliquees.

La tache n'est pas consideree comme finalisee si un seul check de cette task est en echec.

## Contenu du gate `Tests`

- `Test coverage Backend`
- `Test integration`
- `Test coverage frontend`
- `Test coverage e2e`
- `Vitals compliance`
- `npm lint`
- `npm build`

## Politique de cloture

- Pas de message de fin de tache tant que le gate `Tests` n'est pas vert.
- Tout echec de test est bloquant.
- Le travail continue jusqu'a correction puis reexecution du gate.
- Chaque nouveau blocage significatif doit etre ajoute a `BLOCKERS.md`.

## Note pratique

Si une modification touche la base de donnees, les migrations correspondantes doivent etre creees, verifiees et incluses avant validation finale.
