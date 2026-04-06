#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[check-spark-ready] 1) Syntax check"
node --check app.js

echo "[check-spark-ready] 2) Ensure firebase.json does not include Cloud Functions deploy target"
node <<'NODE'
const fs = require('fs');
const path = require('path');
const configPath = path.join(process.cwd(), 'firebase.json');
const raw = fs.readFileSync(configPath, 'utf8');
const parsed = JSON.parse(raw);
if (parsed.functions) {
  console.error('[check-spark-ready] FAIL: firebase.json still contains a "functions" section.');
  process.exit(1);
}
console.log('[check-spark-ready] OK: no functions section in firebase.json');
NODE

echo "[check-spark-ready] 3) Ensure app has no hard-coded Cloud Functions endpoint fallback"
if rg -n "cloudfunctions\\.net" app.js index.html >/dev/null; then
  echo "[check-spark-ready] FAIL: Found hard-coded cloudfunctions.net usage."
  rg -n "cloudfunctions\\.net" app.js index.html
  exit 1
fi

echo "[check-spark-ready] 4) Firestore rules compile/deploy smoke"
firebase deploy --only firestore:rules

echo "[check-spark-ready] PASS"
