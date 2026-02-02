param(
    [int]$MonitorIntervalSeconds = 30,
    [switch]$NoMonitor
)

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$backend = Join-Path $repoRoot "backend"
$frontend = Join-Path $repoRoot "frontend"
$monitor = Join-Path $repoRoot "scripts\\monitor-local.ps1"

Start-Process powershell -WorkingDirectory $backend -ArgumentList "-NoExit", "-Command", "if (Test-Path .\\.venv\\Scripts\\Activate.ps1) { .\\.venv\\Scripts\\Activate.ps1 }; python manage.py runserver"
Start-Process powershell -WorkingDirectory $frontend -ArgumentList "-NoExit", "-Command", "npm run dev"

if (-not $NoMonitor -and (Test-Path $monitor)) {
    Start-Process powershell -WorkingDirectory $repoRoot -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $monitor, "-Loop", "-IntervalSeconds", "$MonitorIntervalSeconds"
}
