$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"
$backendLog = Join-Path $root "backend-server.log"
$backendErr = Join-Path $root "backend-server.err.log"
$frontendLog = Join-Path $root "frontend-server.log"
$frontendErr = Join-Path $root "frontend-server.err.log"

$backendProc = $null
$frontendProc = $null

function Stop-Proc($proc) {
  if ($null -ne $proc -and -not $proc.HasExited) {
    try { $proc.Kill() } catch { }
  }
}

function Wait-Url([string]$url, [int]$timeoutSec = 60) {
  $start = Get-Date
  while (((Get-Date) - $start).TotalSeconds -lt $timeoutSec) {
    try {
      $res = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 -Uri $url
      if ($res.StatusCode -eq 200) { return }
    } catch {
      Start-Sleep -Seconds 2
    }
  }
  throw "Server not ready: $url"
}

try {
  Write-Host "==> Backend tests + coverage"
  Push-Location $backendDir
  python -m coverage run manage.py test
  python -m coverage report --fail-under=80
  python manage.py spectacular --validate --fail-on-warn
  Pop-Location

  Write-Host "==> Frontend lint + unit tests + coverage + build"
  Push-Location $frontendDir
  npm run lint
  npm run test
  npx vitest run --coverage `
    --coverage.thresholds.lines=80 `
    --coverage.thresholds.branches=80 `
    --coverage.thresholds.functions=80 `
    --coverage.thresholds.statements=80
  npm run build
  Pop-Location

  Write-Host "==> E2E setup"
  $env:DJANGO_ENV = "development"
  $env:DJANGO_DEBUG = "false"
  $env:DJANGO_ENABLE_JWT = "true"
  $env:DJANGO_E2E_MODE = "true"

  $envFile = Join-Path $frontendDir ".env.e2e.local"
  if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
      if ($_ -match "^\s*#") { return }
      if ($_ -match "^\s*$") { return }
      $parts = $_.Split("=", 2)
      if ($parts.Count -eq 2) {
        $name = $parts[0].Trim()
        $value = $parts[1].Trim()
        Set-Item -Path "Env:$name" -Value $value
      }
    }
  }

  if (-not $env:E2E_ADMIN_USER -or -not $env:E2E_ADMIN_PASS) {
    throw "E2E_ADMIN_USER/E2E_ADMIN_PASS must be set in frontend/.env.e2e.local"
  }

  Write-Host "==> Start backend server"
  Push-Location $backendDir
  python manage.py migrate
  $adminScript = Join-Path $backendDir ".tmp_e2e_admin.py"
  @'
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django
django.setup()
from django.contrib.auth import get_user_model

user, _ = get_user_model().objects.get_or_create(
    username=os.environ["E2E_ADMIN_USER"],
    defaults={"is_staff": True, "is_superuser": True},
)
user.is_staff = True
user.is_superuser = True
user.set_password(os.environ["E2E_ADMIN_PASS"])
user.save()
print("E2E admin ready:", user.username)
'@ | Set-Content -Path $adminScript -Encoding ASCII
  python $adminScript
  Remove-Item $adminScript -Force
  $backendProc = Start-Process -FilePath "python" -ArgumentList "manage.py runserver 127.0.0.1:8000" -RedirectStandardOutput $backendLog -RedirectStandardError $backendErr -PassThru
  Pop-Location

  Write-Host "==> Start frontend server"
  Push-Location $frontendDir
  $frontendProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run start -- --hostname 127.0.0.1 --port 3000" -RedirectStandardOutput $frontendLog -RedirectStandardError $frontendErr -PassThru
  Pop-Location

  Write-Host "==> Wait for servers"
  Wait-Url "http://127.0.0.1:8000/api/health"
  Wait-Url "http://127.0.0.1:3000"

  Write-Host "==> E2E tests"
  Push-Location $frontendDir
  npm run test:e2e
  Pop-Location
} finally {
  Stop-Proc $frontendProc
  Stop-Proc $backendProc
}
