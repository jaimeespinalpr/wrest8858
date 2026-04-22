param(
  [int]$Port = 5500,
  [switch]$UseLocalFirebaseConfig
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

if ($UseLocalFirebaseConfig -and -not (Test-Path (Join-Path $repoRoot "firebase-config.js"))) {
  Copy-Item (Join-Path $repoRoot "firebase-config.example.js") (Join-Path $repoRoot "firebase-config.js")
  Write-Host "Created firebase-config.js from firebase-config.example.js"
}

$url = "http://localhost:$Port/index.html"
if ($UseLocalFirebaseConfig) {
  $url += "?firebaseConfig=local"
}

Start-Process $url

Push-Location $repoRoot
try {
  if (Get-Command python -ErrorAction SilentlyContinue) {
    python -m http.server $Port
  } elseif (Get-Command py -ErrorAction SilentlyContinue) {
    py -m http.server $Port
  } else {
    throw "Python is required to run a local static server."
  }
} finally {
  Pop-Location
}
