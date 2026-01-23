$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "..\\backend"
$frontend = Join-Path $root "..\\frontend"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$backend`"; if (Test-Path .\\.venv\\Scripts\\Activate.ps1) { .\\.venv\\Scripts\\Activate.ps1 }; python manage.py runserver"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$frontend`"; npm run dev"
