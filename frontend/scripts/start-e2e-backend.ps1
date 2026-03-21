$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Split-Path -Parent $scriptDir
$repoRoot = Split-Path -Parent $frontendDir
$backendDir = Join-Path $repoRoot "backend"

$sandboxRoot = $env:E2E_SANDBOX_ROOT
if (-not $sandboxRoot) {
  $sandboxRoot = Join-Path $frontendDir ".e2e-virtual"
}

$backendSandbox = Join-Path $sandboxRoot "backend"
$databasePath = Join-Path $backendSandbox "db.sqlite3"
$mediaRoot = Join-Path $backendSandbox "media"

New-Item -ItemType Directory -Force -Path $backendSandbox | Out-Null
New-Item -ItemType Directory -Force -Path $mediaRoot | Out-Null

if (-not $env:E2E_BACKEND_PORT) {
  $env:E2E_BACKEND_PORT = "8100"
}

$env:DJANGO_ENABLE_JWT = "true"
$env:DJANGO_E2E_MODE = "true"
$env:DJANGO_ALLOW_INSECURE_SECRET_KEY = "true"
$env:DJANGO_MEDIA_ROOT = $mediaRoot

$sqlitePath = $databasePath -replace "\\", "/"
if ($sqlitePath -match "^[A-Za-z]:/") {
  $sqlitePath = "/$sqlitePath"
}
$env:DATABASE_URL = "sqlite:///$sqlitePath"

$frontendPort = if ($env:E2E_FRONTEND_PORT) { $env:E2E_FRONTEND_PORT } else { "3100" }
$frontendOrigins = @(
  "http://127.0.0.1:$frontendPort",
  "http://localhost:$frontendPort"
) -join ","

$env:DJANGO_CORS_ALLOWED_ORIGINS = $frontendOrigins
$env:DJANGO_CSRF_TRUSTED_ORIGINS = $frontendOrigins

$venvPython = Join-Path $backendDir ".venv\Scripts\python.exe"
$python = if (Test-Path $venvPython) { $venvPython } else { "python" }

Push-Location $backendDir
try {
  & $python manage.py migrate --noinput

  if ($env:E2E_ADMIN_USER -and $env:E2E_ADMIN_PASS) {
    @'
from django.contrib.auth import get_user_model
import os

User = get_user_model()
username = os.environ["E2E_ADMIN_USER"]
password = os.environ["E2E_ADMIN_PASS"]
email = f"{username}@example.test"

user, _ = User.objects.get_or_create(
    username=username,
    defaults={"email": email, "is_staff": True, "is_superuser": True},
)
user.email = email
user.is_staff = True
user.is_superuser = True
user.set_password(password)
user.save()
'@ | & $python manage.py shell
  }

  & $python manage.py runserver "127.0.0.1:$($env:E2E_BACKEND_PORT)" --noreload
}
finally {
  Pop-Location
}
