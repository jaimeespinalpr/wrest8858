# Phase 2 Optimization Plan

Owner: Jaime
Repo: jaimeespinalpr/wrest8858
Branch: ardi/phase2-lazy-domains
Started: 2026-05-10 00:06 America/New_York

## Operating rules
- Work in small safe steps, not all at once.
- Keep at least 5 minutes between major steps; scheduled runs are 30 minutes apart.
- Verify before claiming success.
- Do not expose Firebase/service-account secrets.
- Preserve login, auth, Firebase reads/writes, coach planner, assignments, training, messages.
- Prefer branch commits; do not deploy to Firebase unless explicitly safe and verified.
- If a step is risky, stop and document blocker.

## Already completed
- [x] Phase 2.1: routed DOM pruning prototype implemented.
- [x] Local checks passed for `/`, `/plans/`, `/messages/`, `/home/`, `/training/`.
- [x] Branch pushed: `ardi/phase2-lazy-domains`.
- [x] Commit pushed: `c8cbc25 Optimize routed pages by pruning inactive panels`.

## Next step queue
1. [x] Re-check branch state and remote; prepare PR body manually or via API if token is available.
   - 2026-05-10 00:11 America/New_York: branch `ardi/phase2-lazy-domains` re-checked and aligned with `origin/ardi/phase2-lazy-domains` at `c8cbc25` after `git fetch origin`.
   - GitHub CLI is unavailable and no GitHub token was detected in environment variables, so API/CLI PR creation is blocked here.
   - Manual PR body saved at `reports/phase2/pr-body.md`; use base `main` and compare `ardi/phase2-lazy-domains`.
2. [x] Measure baseline payload/DOM/script counts for root and routed pages; save results under `reports/phase2/`.
   - 2026-05-10 00:43 America/New_York: measured current branch locally with Playwright/static server for `/` plus routed pages.
   - Results saved to `reports/phase2/baseline-route-metrics.md` and `reports/phase2/baseline-route-metrics.json`.
   - Verification: 19 routes measured, 0 failed same-origin requests in the report; routed pages show panel pruning active.
3. [x] Audit `app.js` dependencies around `messages` and `media`; identify the lowest-risk real JS split candidate.
   - 2026-05-10 01:11 America/New_York: audited `app.js` messages/media dependencies and saved findings to `reports/phase2/js-split-audit.md`.
   - Lowest-risk real split candidate: guarded Messages domain lazy split using app-level wrappers plus a lazily loaded `messages-domain.js` registered as `window.WPLMessagesDomain`.
   - Media whole-domain split is not the next safest candidate because media tree/upload helpers are reused by assignments, parent/athlete uploads, coach workspace sync, and message attachment save-to-media.
4. [x] Implement one guarded lazy-load boundary only if safe; otherwise document exact blockers.
   - Next safe step: add the Messages domain lazy-load boundary/wrappers first, without changing Firebase schemas, upload helpers, auth, or routes.
   - 2026-05-10 01:52 America/New_York: implemented guarded Messages lazy boundary. The concentrated Messages domain was moved to `messages-domain.js`; `app.js` now keeps loader/wrapper entry points for render, realtime sync, direct-open, append, and route-open prep. Firebase schemas, upload helpers, auth paths, and route URLs were not changed.
   - Cache-busted app/domain asset version to `20260510-phase2-msg1` so browsers request the updated app shell and lazy domain file together.
   - Verification: `node --check app.js`, `node --check messages-domain.js`, and `node reports/phase2/verify-messages-lazy-boundary.js` passed. Local Playwright route smoke confirmed `/messages/` loads `messages-domain.js`, while `/`, `/plans/`, `/training/`, `/home/`, and `/media/` did not request it; 0 same-origin failures and 0 page errors in the report.
5. [x] Verify login/register inputs, route loading, plans, assignments, messages, and training locally with Playwright.
   - Next safe step: run the broader authenticated/UI smoke where possible, including login/register controls, messages open state, plans/assignments panels, training, and route loading after the lazy split.
   - 2026-05-10 02:13 America/New_York: added and ran `reports/phase2/verify-ui-smoke.js` locally with Playwright after the guarded Messages lazy split.
   - Verification covered login inputs, register modal controls, route loading for `/`, `/home/`, `/plans/`, `/messages/`, `/training/`, and `/media/`, expected panels for plans/assignments/messages/training/media/home-dashboard, and same-origin/page-error checks.
   - Result saved to `reports/phase2/verify-ui-smoke.json` and summarized in `reports/phase2/verify-ui-smoke.md`: 0 failures, 0 same-origin request failures, 0 page errors. `messages-domain.js` loaded only on `/messages/`.
   - Limitation: real authenticated Firebase login/register/plans/messages writes were not exercised because no test credentials/secrets are available here; no Firebase deploy was attempted.
6. [x] Commit/push the next safe improvement.
   - Next safe step: commit and push the verified lazy-boundary verification artifacts and plan update only if branch state remains clean/stable.
   - 2026-05-10 02:41 America/New_York: re-ran `node --check reports/phase2/verify-ui-smoke.js` and `node reports/phase2/verify-ui-smoke.js`; UI smoke passed again with 6 routes and 0 failures. Ready to commit/push the plan update plus `verify-ui-smoke` script/report artifacts.
7. [x] Repeat measurement and compare with baseline.
   - Next safe step: re-run route metrics after the Messages lazy boundary and compare against `reports/phase2/baseline-route-metrics.json`.
   - 2026-05-10 03:18 America/New_York: added and ran `reports/phase2/measure-route-metrics.js` locally with Playwright/static server after the Messages lazy split.
   - Results saved to `reports/phase2/post-lazy-route-metrics.json` and `reports/phase2/post-lazy-route-metrics.md`: 19 routes measured, 0 same-origin request failures, 0 page errors.
   - Comparison result: non-message routes avoided `messages-domain.js` and each saved about 215,597 same-origin script bytes versus baseline; `/messages/` loaded `messages-domain.js` as expected and changed by +2,174 same-origin script bytes versus baseline.
   - Limitation: local static measurement only; authenticated Firebase data flows and deploy behavior were not exercised.
8. [x] If branch is stable, prepare final merge/deploy instructions for Jaime.
   - Next safe step: prepare final merge/deploy instructions for Jaime without deploying to Firebase.
   - 2026-05-10 03:41 America/New_York: prepared final merge/deploy instructions at `reports/phase2/final-merge-deploy-instructions.md`. No Firebase deploy was performed.
   - Instructions include PR/merge path, authorized deploy command, post-deploy smoke checklist, known limitations, and rollback note.
9. [x] If Firebase service key file still exists locally, delete local copy after confirming no more deploy actions are needed; do not print contents.
   - Next safe step: check for a local Firebase service key file without printing contents; delete only if confirmed no more deploy actions are needed.
   - 2026-05-10 04:11 America/New_York: checked for local Firebase service-account/key files by filename and secret markers without printing any file contents. No local Firebase service key file was found, so no deletion was needed. No Firebase deploy was performed.
10. [x] Final status: notify Jaime. Email is only possible if a configured mail sender/tool exists; otherwise report that email delivery is blocked and send Telegram completion.
   - 2026-05-10 04:41 America/New_York: no configured email sender/tool is available in this session, so email delivery is blocked here. Telegram completion will be sent instead. No Firebase deploy was performed.
11. [x] Scheduled continuation safety check: confirm whether any unchecked safe Phase 2 step remains.
   - 2026-05-10 05:11 America/New_York: reviewed this plan and branch state. No unchecked safe step remains in the Phase 2 queue, so no code, config, secret, or Firebase deploy action was taken.
   - Next action for Jaime: open/merge the PR from `ardi/phase2-lazy-domains` into `main` when ready, then deploy only after explicit authorization using the checklist in `reports/phase2/final-merge-deploy-instructions.md`.

## Current blocker notes
- GitHub CLI (`gh`) is not installed, so PR creation may need GitHub web/API credentials or manual link.
- Revoking Firebase service account key from this session is blocked by IAM: missing `iam.serviceAccountKeys.delete`.
- Email sending is not yet verified in this environment; must check for a configured safe mail path before claiming email sent.
