# Engineering Lifecycle Gate

Ce document formalise la discipline d'execution attendue sur ce repo.

## Sequence obligatoire avant finalisation

1. Relire `BLOCKERS.md`.
2. Appliquer les decisions durables qui concernent la tache en cours.
3. Executer la task VS Code `Tests`.
4. Si un seul check est rouge, continuer le travail jusqu'au vert complet.
5. Finaliser uniquement apres gate vert.

## Regles permanentes

- Un blocage deja rencontre n'est pas un incident neuf: c'est une contrainte de projet.
- Une correction locale ne suffit pas si le gate reel du repo n'est pas vert.
- Toute modification de schema DB implique verification des migrations avant validation finale.
- Toute modification qui touche les zones de couverture doit etre verifiee avec la commande de coverage correspondante.

## Artefacts de reference

- Gate principal: `GATE.md`
- Journal des blocages: `BLOCKERS.md`
- Definition of Done: `docs/Definition-of-Done.md`
