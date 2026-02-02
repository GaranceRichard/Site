# Strategie de migrations

Ce projet suit une strategie simple pour eviter les regressions de schema et de donnees.

## Regles
- Une migration par changement de modele (pas de migration "fourre-tout").
- Toute migration non triviale inclut une note de rollback dans la PR.
- Les migrations de donnees doivent etre idempotentes et testees.
- En prod: backup DB avant `migrate`.

## Workflow
1. Modifier les modeles Django.
2. Generer: `python manage.py makemigrations`.
3. Verifier le SQL: `python manage.py sqlmigrate <app> <migration>`.
4. Tester localement: `python manage.py migrate` puis `python manage.py test`.
5. Ajouter une note "Plan de deploy / rollback" dans la PR.

## Rollback
- Si une migration est reversible: `python manage.py migrate <app> <migration_precedente>`.
- Si irreversible: restaurer la sauvegarde DB puis redeployer la version precedente.

## Checks CI recommandes
- `python manage.py makemigrations --check --dry-run`
- `python manage.py migrate --plan`
