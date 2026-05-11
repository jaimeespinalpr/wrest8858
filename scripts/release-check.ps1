param(
  [string]$BaseUrl = "http://localhost:5173"
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Push-Location $repoRoot

try {
  Write-Host "[release-check] 1) Git working tree"
  git status -sb

  Write-Host "[release-check] 2) JavaScript syntax"
  node --check .\app.js

  Write-Host "[release-check] 3) Required static files"
  $requiredFiles = @(
    "index.html",
    "app.js",
    "styles.css",
    "route-loader.js",
    "firebase-config.public.js",
    "firestore.rules",
    "storage.rules"
  )
  foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
      throw "Missing required file: $file"
    }
  }

  Write-Host "[release-check] 4) Routed sections"
  $routes = @(
    "today",
    "athletes",
    "plans",
    "competition",
    "messages",
    "tournament",
    "parent",
    "scouting",
    "permissions"
  )
  foreach ($route in $routes) {
    $routeIndex = Join-Path $route "index.html"
    if (-not (Test-Path $routeIndex)) {
      throw "Missing route index: $routeIndex"
    }
    $content = Get-Content -Raw $routeIndex
    if ($content -notmatch "route-loader\.js\?v=") {
      throw "Route does not load shared route-loader with a version: $routeIndex"
    }
  }

  Write-Host "[release-check] 5) Firebase public config shape"
  $publicConfig = Get-Content -Raw .\firebase-config.public.js
  foreach ($token in @("apiKey", "authDomain", "projectId", "storageBucket", "appId")) {
    if ($publicConfig -notmatch $token) {
      throw "firebase-config.public.js is missing $token"
    }
  }

  Write-Host "[release-check] 6) Optional local URL smoke target"
  Write-Host "Open and verify: $BaseUrl/competition/"
  Write-Host "Open and verify: $BaseUrl/athletes/"

  Write-Host "[release-check] PASS"
} finally {
  Pop-Location
}
