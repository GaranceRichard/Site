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

## 2026-03-21 - Les E2E ne doivent jamais reutiliser la DB ou les medias de dev
- Contexte: la suite Playwright pouvait demarrer sur le backend de developpement et alterer les donnees locales du site.
- Symptomes: creations/suppressions visibles dans `backend/db.sqlite3` et `backend/media` apres les tests E2E.
- Cause racine: backend E2E lance sans isolation explicite de la DB, des medias et des ports.
- Decision durable: les E2E doivent toujours utiliser un backend dedie avec DB/media dans le workspace (`frontend/.e2e-virtual/`) et des ports distincts du dev local.
- Verification demandee: aucun run E2E ne doit ecrire dans `backend/db.sqlite3`, `backend/media/` ou reutiliser un serveur local partage.

## 2026-03-21 - Les runners E2E frontend doivent isoler leur dossier Next et eviter les helpers non compatibles Playwright
- Contexte: apres isolation des E2E, le gate a bute sur un lock `.next/dev` partage et sur un helper TS charge differemment par Vitest et Playwright.
- Symptomes: erreur `Unable to acquire lock ... .next\\dev\\lock` puis erreur `exports is not defined in ES module scope` pendant le chargement de `playwright.config.ts`.
- Cause racine: partage du meme `distDir` que le frontend de dev et usage de primitives module (`import.meta`) non robustes dans un helper importe par des loaders differents.
- Decision durable: un frontend E2E doit utiliser un `NEXT_DIST_DIR` dedie; tout helper partage entre Vitest et Playwright doit rester compatible avec leurs modes de chargement respectifs.
- Verification demandee: `npm run test:e2e` et `npm run test:e2e:coverage:report` doivent passer sans lock `.next` ni erreur de module.

## 2026-03-21 - Les nouvelles zones backend couvertes doivent etre rattachees aux suites integration et vitals
- Contexte: de nouveaux modules backend d'audit etaient testes localement, mais restaient a `0%` dans le gate.
- Symptomes: `Test integration` et `Vitals compliance` rouges alors que les tests cibles passaient et que la couverture globale backend etait verte.
- Cause racine: la task VS Code d'integration/vitals utilisait une liste statique de modules de test qui n'incluait pas `contact.tests.test_media_cleanup`.
- Decision durable: toute nouvelle zone backend ajoutee pour satisfaire le gate doit etre reliee explicitement aux commandes `Test integration` et `Vitals compliance` si ces commandes filtrent les modules de test.
- Verification demandee: apres ajout d'un nouveau module de test backend, relancer les commandes integration/vitals reelles du repo et verifier que les nouveaux fichiers n'apparaissent pas a `0%`.

## 2026-03-21 - Les E2E ne doivent jamais honorer des overrides d'environnement qui pointent vers la DB ou les medias locaux
- Contexte: une suite E2E a de nouveau laisse les references locales avec des chemins medias morts.
- Symptomes: apres `playwright test` ou `test:e2e:coverage:report`, les references locales existent encore en base mais `backend/media/references` est vide.
- Cause racine: la config E2E acceptait encore des overrides herites (`DATABASE_URL`, `DJANGO_MEDIA_ROOT`, `E2E_API_BASE_URL`, ports dev) au lieu d'imposer strictement la sandbox.
- Decision durable: les runners E2E doivent ecraser ces variables avec des valeurs isolees et refuser les ports/URLs de dev partages (`3000`/`8000`).
- Verification demandee: relancer les tests de config E2E et les commandes E2E reelles avec la sandbox imposee; aucun run ne doit pouvoir cibler `backend/db.sqlite3` ou `backend/media`.

## 2026-03-21 - Aucun statut ou reassurance ne doit remplacer le rerun du check source de verite
- Contexte: plusieurs reponses ont laisse entendre qu'un sujet etait regle alors que le check reel du gate n'avait pas encore ete rejoue ou etait encore rouge.
- Symptomes: l'utilisateur a du controler lui-meme la couverture, relever les rouges restants et corriger le pilotage de l'execution.
- Cause racine: ecart de discipline d'execution; des validations locales ou des lectures partielles ont ete traitees comme suffisantes a la place du rerun systematique de la commande qui fait foi.
- Decision durable: sur ce repo, aucune reassurance, aucun "ok", aucun statut de fin ou de conformite n'est autorise sans sortie verte du check source de verite correspondant, relance dans la session courante.
- Verification demandee: toute reponse de statut doit citer explicitement la commande relancee et son resultat binaire (`vert` ou `rouge`); si c'est rouge, le travail continue sans conclusion.

## 2026-03-21 - Toute completion de travail exige le lancement prealable de la task complete `Tests`
- Contexte: une exigence explicite a ete formulee pour supprimer toute ambiguite sur le critere de fin.
- Symptomes: des validations partielles ont oblige l'utilisateur a recontroler lui-meme l'etat reel du repo avant completion.
- Cause racine: execution de checks isoles a la place de la task de reference complete du projet.
- Decision durable: avant toute completion de travail, la task VS Code `Tests` doit etre lancee dans son ensemble; tous ses checks doivent etre verts dans la session courante.
- Verification demandee: aucune completion n'est autorisee sans mention explicite du lancement de la task complete `Tests` et de son resultat integralement vert.

## 2026-03-21 - Les tests backend ne doivent jamais utiliser `backend/media`
- Contexte: `python -m coverage run manage.py test` pouvait encore vider ou remplacer les medias locaux alors meme que les E2E etaient isoles.
- Symptomes: apres `Test coverage Backend`, l'audit media passait de vert a rouge et `backend/media/` se retrouvait vide alors que la base locale pointait encore vers des chemins existants avant le run.
- Cause racine: en mode test Django utilisait encore le `MEDIA_ROOT` par defaut du projet pour les tests qui ne surchargeaient pas explicitement ce setting.
- Decision durable: en mode test, le backend doit utiliser un `MEDIA_ROOT` dedie (`backend/.test-media/`) ou un override explicite de test; `backend/media/` est interdit pour tout run `manage.py test`.
- Verification demandee: apres tout changement touchant aux tests backend ou au stockage media, relancer `Test coverage Backend` puis `audit_reference_media --format=json` pour verifier que les medias locaux restent intacts.

## 2026-03-21 - Le boot backend E2E doit etre multiplateforme
- Contexte: le job CI `e2e smoke` tournait sous Linux et ne pouvait pas demarrer le backend Playwright.
- Symptomes: `powershell: not found` puis echec immediat de `config.webServer` avec code `127`.
- Cause racine: `playwright.config.ts` dependait d'un script `start-e2e-backend.ps1` Windows-only.
- Decision durable: le demarrage backend E2E doit passer par un lanceur portable (`node`/`python`) compatible Windows et Linux; aucun binaire shell specifique a un OS ne doit etre requis dans `webServer.command`.
- Verification demandee: relancer les commandes Playwright reelles du repo sur la task complete `Tests`; le smoke E2E doit pouvoir demarrer sans PowerShell.

## 2026-03-22 - Une ligne rouge de coverage frontend rend le test rouge
- Contexte: un statut a ete donne trop tot alors que le coverage frontend affichait encore des lignes rouges dans un fichier cible.
- Symptomes: `npm run test:coverage` ou un rerun cible pouvait sembler acceptable globalement alors qu'un fichier frontend restait partiellement non couvert.
- Cause racine: interpretation trop large du vert global au lieu de traiter les lignes rouges comme un echec de verification sur la zone demandee.
- Decision durable: sur ce repo, si une ligne de coverage frontend est rouge dans la zone testee, alors le test est considere rouge et le travail continue.
- Verification demandee: pour toute dette de coverage frontend, verifier explicitement l'absence de lignes rouges sur le fichier ou la zone demandee avant de conclure.

## 2026-03-23 - Les tests unitaires des managers backoffice doivent neutraliser le fallback `NEXT_PUBLIC_API_BASE_URL`
- Contexte: plusieurs suites Vitest de managers backoffice ont casse en CI apres ajout du fallback `/api-proxy` -> `NEXT_PUBLIC_API_BASE_URL` dans `siteSettingsStore`.
- Symptomes: erreurs de test du type `Cannot read properties of undefined (reading 'ok')` sur les cas d'echec de sauvegarde, alors que les assertions attendaient `Erreur API` ou un message metier.
- Cause racine: en CI, `NEXT_PUBLIC_API_BASE_URL` est defini; les suites qui moquaient un seul appel reseau voyaient partir un second `fetch` de fallback, ce qui epuisait le mock et detruisait les assertions.
- Decision durable: toute suite unitaire de manager backoffice qui moque `fetch` pour un seul endpoint de reglages doit neutraliser explicitement `process.env.NEXT_PUBLIC_API_BASE_URL` dans son setup/teardown, sauf si le test couvre volontairement le fallback.
- Verification demandee: apres tout changement sur `siteSettingsStore` ou sur un manager de reglages, relancer `npm run test:coverage` avec l'environnement CI et verifier que les cas d'erreur affichent bien le message attendu au lieu d'une erreur technique `reading 'ok'`.

## 2026-03-23 - Les couvertures backend paralleles ne doivent jamais partager le meme fichier `.coverage`
- Contexte: la task VS Code `Tests` lance en parallele `Test coverage Backend`, `Test integration` et `Vitals compliance`.
- Symptomes: `Vitals compliance` pouvait echouer avec `No data to report.` alors que les tests backend passes juste avant dans la meme commande.
- Cause racine: plusieurs commandes `coverage run` backend ecrivaient simultanement dans le meme fichier `.coverage`, ce qui provoquait des collisions et des rapports vides.
- Decision durable: chaque commande backend de coverage lancee en parallele doit definir un `COVERAGE_FILE` dedie avant `coverage run`/`report`/`json`.
- Verification demandee: relancer la task complete `Tests`; aucun check backend parallele ne doit echouer avec `No data to report.` ou un rapport vide.

## 2026-03-23 - Les commandes Vitest stables du repo ne doivent pas dependre d'un config TypeScript charge via esbuild
- Contexte: apres plusieurs relances du gate frontend/vitals sous Windows, Vitest ne parvenait plus a charger `vitest.config.ts` ou `vitest.config.vitals.ts`.
- Symptomes: echec immediat `failed to load config ... Startup Error ... Error: spawn EPERM` avant tout test.
- Cause racine: le chargement d'un config Vitest en `.ts` depend du spawn d'esbuild; dans cet environnement Windows, ce spawn peut tomber en `EPERM` et rendre le gate aleatoirement rouge.
- Decision durable: les commandes frontend stables du repo (`npm run test`, `npm run test:coverage`, `npm run test:coverage:vitals`, wrappers/pre-commit associes) doivent pointer vers des configs Vitest ESM `.mjs` pour eviter ce bootstrap esbuild.
- Verification demandee: relancer `npm run test`, `npm run test:coverage` et `npm run test:coverage:vitals`; aucun run ne doit echouer sur `failed to load config` ou `spawn EPERM`.

## 2026-03-23 - La task `Tests` ne doit pas lancer les checks frontend lourds en parallele sur Windows
- Contexte: meme apres passage des configs Vitest en `.mjs`, `Vitals compliance` pouvait encore echouer aleatoirement quand il demarrait en meme temps que `test:coverage`, `test:e2e:coverage:report` ou `npm build`.
- Symptomes: `spawnSync C:\Program Files\nodejs\node.exe EPERM` sur `npm run test:coverage:vitals` uniquement dans le gate complet parallelise, alors que le check passait seul.
- Cause racine: contention environnementale Windows lors des spawns Node/esbuild de plusieurs checks frontend lourds lances simultanement.
- Decision durable: la task VS Code `Tests` doit etre sequencee; les checks frontend/vitals/build ne doivent pas etre consideres fiables si lances tous en parallele dans ce repo.
- Verification demandee: relancer la task complete `Tests` apres modification; tous les checks doivent passer dans l'ordre configure, sans `spawnSync ... EPERM`.

## 2026-03-23 - Les commandes Vitest frontend Windows doivent precharger un patch Vite cible
- Contexte: meme avec des configs Vitest `.mjs`, certains runs Windows continuaient a tomber en `EPERM` tres tot pendant l'initialisation Vite.
- Symptomes: `spawnSync C:\Program Files\nodejs\node.exe EPERM` ou `failed to load config` avant les tests, y compris hors gate parallele.
- Cause racine: Vite declenchait encore un sous-processus Windows non essentiel pendant sa resolution initiale, ce qui rendait Vitest aleatoirement rouge dans cet environnement.
- Decision durable: les commandes frontend stables du repo qui lancent Vitest doivent precharger `frontend/scripts/vite-child-process-patch.mjs`; ne pas revenir a un lancement Vitest nu tant que ce faux `EPERM` Windows reste present.
- Verification demandee: relancer `npm run test`, `npm run test:coverage` et `npm run test:coverage:vitals`; aucun run ne doit echouer sur `spawnSync ... EPERM` ou `failed to load config`.
