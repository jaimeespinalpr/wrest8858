param(
  [switch]$SkipFunctionsInstall
)

$ErrorActionPreference = "Stop"

Write-Host "Preparing local environment..."

if (-not $SkipFunctionsInstall) {
  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm is required to install Cloud Functions dependencies."
  }

  Push-Location (Join-Path $PSScriptRoot "..\functions")
  try {
    npm ci
  } finally {
    Pop-Location
  }
}

Write-Host "Local setup complete."
