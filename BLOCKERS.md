# Blockers Log

Journal des blocages rencontres sur ce repo.

## Regle d'usage

- Chaque blocage significatif rencontre pendant une tache doit etre ajoute ici.
- Avant toute action importante ou finalisation, ce log doit etre relu et pris en compte.
- Un blocage deja connu doit etre traite comme une contrainte persistante du projet.
- Si un blocage impose une regle durable, cette regle doit etre appliquee par defaut sur les taches suivantes.

## Format d'entree

```md
## YYYY-MM-DD - Titre court
- Contexte:
- Symptomes:
- Cause racine:
- Decision durable:
- Verification demandee:
```

---

## 2026-03-19 - Gate de tests non execute avant finalisation
- Contexte: plusieurs taches ont ete annoncees comme terminees alors que tout le gate de verification du repo n'avait pas ete execute.
- Symptomes: des regressions ou des tests rouges ont ete decouverts apres annonce de fin de tache.
- Cause racine: validation partielle prise a tort comme preuve suffisante de stabilite.
- Decision durable: aucune tache n'est finalisee sans execution prealable de la task VS Code `Tests`.
- Verification demandee: si un seul check du gate est rouge, la tache reste ouverte et le travail continue.

## 2026-03-19 - Echecs repetes non transformes en contraintes de projet
- Contexte: certains murs connus ont ete re-rencontres plusieurs fois.
- Symptomes: repetition de corrections similaires au lieu d'anticiper les memes risques.
- Cause racine: blocages traites comme incidents locaux plutot que comme invariants a memoriser.
- Decision durable: tout blocage significatif est logge ici et relu avant de poursuivre ou de finaliser.
- Verification demandee: les decisions durables du log doivent etre appliquees explicitement pendant l'execution.

## 2026-03-19 - Tests backend fichiers instables avec les repertoires temporaires Windows
- Contexte: les tests backend manipulant des fichiers media ont echoue pendant le gate complet.
- Symptomes: `PermissionError [WinError 5]` lors des acces a des dossiers temporaires et lors du nettoyage.
- Cause racine: usage de repertoires temporaires Windows inadaptés a l'environnement d'execution courant.
- Decision durable: pour les tests fichiers backend sur ce repo, utiliser des repertoires temporaires sous le workspace plutot que les repertoires temporaires systeme.
- Verification demandee: tout nouveau test backend qui ecrit sur disque doit utiliser un emplacement temporaire controle dans le repo.

## 2026-03-19 - Couverture partielle prise pour validation suffisante
- Contexte: des tests cibles passaient alors que la couverture globale ou integration restait insuffisante.
- Symptomes: fichiers encore rouges apres validation locale partielle.
- Cause racine: verification trop etroite par rapport aux gates reels du projet.
- Decision durable: un correctif sur la couverture doit etre verifie par la commande de couverture/gate concernee, pas seulement par des tests cibles.
- Verification demandee: pour une dette de coverage, relancer la commande coverage effective du repo avant de conclure.

## 2026-03-19 - Runner de tests alternatif reutilise a tort
- Contexte: un outil de test non standard du repo a ete repropose ou reutilise plusieurs fois malgre les tasks et scripts deja en place.
- Symptomes: perte de temps, confusion sur la source de verite et verification decalee par rapport au gate reel du projet.
- Cause racine: reflexe de tooling generique applique a la place des commandes natives du repo.
- Decision durable: privilegier d'abord les tasks VS Code, scripts `npm run ...` et commandes backend documentees dans le projet; ne pas introduire un runner alternatif par habitude.
- Verification demandee: avant de lancer des tests, verifier que la commande choisie correspond bien au workflow documente du repo.
