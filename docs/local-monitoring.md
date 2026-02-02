# Monitoring local leger (sans Docker)

Objectif: verifier rapidement que le frontend et le backend repondent en local, avec un mode continu.

## Script

Depuis la racine du repo:

```powershell
.\scripts\monitor-local.ps1
```

Le script checke:

- `http://127.0.0.1:8000/api/health` (OK si `200`)
- `http://127.0.0.1:3000` (OK si `2xx`/`3xx`)

## Mode continu

```powershell
.\scripts\monitor-local.ps1 -Loop -IntervalSeconds 30
```

- Intervalle configurable
- Bip si un service passe KO

## Sortie JSON

```powershell
.\scripts\monitor-local.ps1 -AsJson
```

Pratique pour integration avec un script d'alerte local.

## Parametres utiles

```powershell
.\scripts\monitor-local.ps1 `
  -BackendHealthUrl "http://127.0.0.1:8000/api/health" `
  -FrontendUrl "http://127.0.0.1:3000" `
  -TimeoutSeconds 5
```
