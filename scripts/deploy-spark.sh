#!/usr/bin/env bash
set -euo pipefail

PROJECT="${1:-${FIREBASE_PROJECT:-}}"

echo "[deploy-spark] Deploying Firestore rules + Hosting (Spark-safe)"
if [[ -n "$PROJECT" ]]; then
  firebase deploy --only firestore:rules,hosting --project "$PROJECT"
else
  firebase deploy --only firestore:rules,hosting
fi

if [[ "${DEPLOY_STORAGE_RULES:-0}" == "1" ]]; then
  echo "[deploy-spark] DEPLOY_STORAGE_RULES=1 -> attempting Storage rules"
  if [[ -n "$PROJECT" ]]; then
    if ! firebase deploy --only storage --project "$PROJECT"; then
      echo "[deploy-spark] Storage rules deploy skipped (bucket not configured or not available on current plan)."
    fi
  else
    if ! firebase deploy --only storage; then
      echo "[deploy-spark] Storage rules deploy skipped (bucket not configured or not available on current plan)."
    fi
  fi
fi

echo "[deploy-spark] Done."
