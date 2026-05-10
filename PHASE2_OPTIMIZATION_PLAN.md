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
4. [ ] Implement one guarded lazy-load boundary only if safe; otherwise document exact blockers.
   - Next safe step: add the Messages domain lazy-load boundary/wrappers first, without changing Firebase schemas, upload helpers, auth, or routes.
5. [ ] Verify login/register inputs, route loading, plans, assignments, messages, and training locally with Playwright.
6. [ ] Commit/push the next safe improvement.
7. [ ] Repeat measurement and compare with baseline.
8. [ ] If branch is stable, prepare final merge/deploy instructions for Jaime.
9. [ ] If Firebase service key file still exists locally, delete local copy after confirming no more deploy actions are needed; do not print contents.
10. [ ] Final status: notify Jaime. Email is only possible if a configured mail sender/tool exists; otherwise report that email delivery is blocked and send Telegram completion.

## Current blocker notes
- GitHub CLI (`gh`) is not installed, so PR creation may need GitHub web/API credentials or manual link.
- Revoking Firebase service account key from this session is blocked by IAM: missing `iam.serviceAccountKeys.delete`.
- Email sending is not yet verified in this environment; must check for a configured safe mail path before claiming email sent.
