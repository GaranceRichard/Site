$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$script = Join-Path $root "scripts" "pre-commit-full.ps1"

if (-not (Test-Path $script)) {
  throw "Missing script: $script"
}

powershell -NoProfile -ExecutionPolicy Bypass -File $script
