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

## 2026-03-19 - Presence d'une venv backend non utilisee assez tot
- Contexte: une verification backend a d'abord ete declaree non executable a cause du `python` global.
- Symptomes: justification erronee du type "pas de python" alors qu'une venv projet etait disponible.
- Cause racine: verification initiale faite sur le shim Python global Windows Store au lieu de chercher immediatement l'environnement du repo.
- Decision durable: sur ce repo, toute impossibilite apparente d'executer Python doit d'abord etre re-verifiee contre `backend/.venv`; l'absence de Python global n'est pas un motif valable tant que cette venv existe.
- Verification demandee: pour tout test backend, utiliser en priorite `backend/.venv/Scripts/python.exe` ou la task/documentation repo equivalente.

## 2026-03-19 - Sous-correctif annonce trop tot comme tache terminee
- Contexte: le fail backend initial etait corrige, mais un autre check du gate restait rouge cote frontend coverage.
- Symptomes: formulation trop large laissant entendre que la tache etait finie alors que `npm run test:coverage` echouait encore.
- Cause racine: confusion entre resolution du probleme initialement observe et validation complete de la demande dans le gate reel.
- Decision durable: une correction locale ou partielle doit etre annoncee comme telle; les termes "fini", "termine" ou equivalent sont interdits tant que tous les checks pertinents demandes par la tache ne sont pas verts.
- Verification demandee: avant toute formulation de cloture, verifier explicitement l'etat de tous les checks concernes et annoncer les zones encore rouges si elles existent.

## 2026-03-19 - Regle binaire de statut de travail
- Contexte: une reponse a introduit un etat intermediaire ambigu entre "fini" et "je continue".
- Symptomes: confusion sur le fait d'arreter ou de poursuivre le travail.
- Cause racine: formulation nuancée alors qu'une regle explicite avait ete donnee.
- Decision durable: sur ce repo, le statut a annoncer est strictement binaire.
  Soit c'est fini: j'arrete de travailler.
  Soit ce n'est pas fini: je finis le travail.
- Verification demandee: ne jamais presenter une troisieme option, un entre-deux, ou une cloture partielle quand cette regle s'applique.

## 2026-03-19 - Interdiction des arrets intempestifs et des statuts passifs
- Contexte: le travail s'est arrete sans fin de tache ni question bloquante strictement necessaire.
- Symptomes: besoin pour l'utilisateur de demander "que fais-tu ?" ou de constater "tu ne travailles pas".
- Cause racine: interruption non justifiee de l'execution au lieu de poursuivre jusqu'au critere de fin ou jusqu'a un vrai blocage informationnel.
- Decision durable: soit la tache est finie et cela est annonce, soit une information necessaire et bloquante est demandee explicitement, soit le travail continue sans pause passive.
- Verification demandee: aucun arret, aucune attente, aucun message intermediaire passif ne sont acceptables sans fin de tache ou question strictement necessaire.

## 2026-03-19 - Rupture de confiance liee aux constats "tu ne travailles pas"
- Contexte: l'utilisateur a indique que devoir constater une inaction non justifiee rompt le pacte de confiance de la collaboration.
- Symptomes: degradation immediate de la confiance et de la collaboration.
- Cause racine: manque d'endurance d'execution et absence de signal clair "fini" ou "question bloquante".
- Decision durable: eviter absolument toute situation ou l'utilisateur doit diagnostiquer lui-meme l'inaction; maintenir un flux d'execution continu jusqu'a la fin ou jusqu'a une question necessaire.
- Verification demandee: la collaboration ne doit exposer que deux etats visibles: "travail en cours" ou "fini", sauf question bloquante indispensable.
