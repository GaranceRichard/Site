$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$backend = Join-Path $repoRoot "backend"
$frontend = Join-Path $repoRoot "frontend"

Start-Process powershell -WorkingDirectory $backend -ArgumentList "-NoExit", "-Command", "if (Test-Path .\\.venv\\Scripts\\Activate.ps1) { .\\.venv\\Scripts\\Activate.ps1 }; python manage.py runserver"
Start-Process powershell -WorkingDirectory $frontend -ArgumentList "-NoExit", "-Command", "npm run dev"
