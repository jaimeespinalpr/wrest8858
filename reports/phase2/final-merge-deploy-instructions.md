# Phase 2 Final Merge / Deploy Instructions

Generated: 2026-05-10 03:41 America/New_York
Branch: `ardi/phase2-lazy-domains`
Base: `main`
Latest verified branch commit before this document: `b82a49b`

## What changed

- Routed pages now prune inactive panels instead of keeping every visited route mounted in the DOM.
- Messages domain code was moved behind a guarded lazy-load boundary in `messages-domain.js`.
- Route pages cache-bust `app.js` / `route-loader.js` with `20260510-phase2-msg1` so browsers request compatible assets together.
- Verification and measurement artifacts are stored under `reports/phase2/`.

## Verification completed locally

- `node --check app.js`
- `node --check messages-domain.js`
- `node --check route-loader.js`
- `node reports/phase2/verify-messages-lazy-boundary.js`
- `node reports/phase2/verify-ui-smoke.js`
- `node reports/phase2/measure-route-metrics.js`

Latest measurement summary from `reports/phase2/post-lazy-route-metrics.md`:

- 19 routes measured.
- 0 same-origin request failures.
- 0 page errors.
- Non-message routes avoid `messages-domain.js`.
- Non-message routes save about 215,597 same-origin script bytes versus the pre-split baseline.
- `/messages/` loads `messages-domain.js` as expected.

## Known limitations before production deploy

- Local verification did not use real Firebase credentials or authenticated user data.
- Real login/register writes, live plans/messages/assignments data, and production Firebase behavior still need post-merge validation by an authorized operator.
- No Firebase deploy was performed from this session.
- GitHub CLI is unavailable here, so PR creation may need GitHub web UI/API credentials.

## Recommended merge path

1. Open a PR in GitHub:
   - Base: `main`
   - Compare: `ardi/phase2-lazy-domains`
   - Use `reports/phase2/pr-body.md` as the starting PR body, then add the latest verification notes from this document.
2. Review the diff with special attention to:
   - `app.js`
   - `messages-domain.js`
   - `route-loader.js`
   - all routed `index.html` cache-bust references
3. Confirm branch checks are green or manually run the local checks listed above.
4. Merge to `main` only after review.

## Recommended deploy path after merge

Do not deploy until the PR has been reviewed and merged.

If Firebase deploy is authorized, use the existing Spark-safe deploy script from the merged `main` branch:

```bash
./scripts/deploy-spark.sh
```

If a Firebase project must be specified explicitly:

```bash
./scripts/deploy-spark.sh <firebase-project-id>
```

This script deploys Firestore rules and Hosting. Storage rules deploy only runs when `DEPLOY_STORAGE_RULES=1` is explicitly set.

## Post-deploy smoke checklist

After deploy, verify in the live site:

1. `/` loads without console errors.
2. `/home/`, `/plans/`, `/training/`, `/media/`, and `/messages/` load directly and by navigation.
3. Login/register controls are visible and usable.
4. Authenticated user can open dashboard/home.
5. Plans and assignments render existing data.
6. Training view renders existing data.
7. Messages view opens and loads conversation UI.
8. Message attachment/media-related flows still work where applicable.
9. Browser Network tab confirms `messages-domain.js` loads on `/messages/` and not on unrelated route initial loads.
10. No Firebase permission errors, missing asset 404s, or uncaught page errors appear.

## Rollback note

If production issues appear after deploy, roll back Firebase Hosting to the previous release from the Firebase Console or CLI, then revert the merge commit from `main` if code rollback is needed.
