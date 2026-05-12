# PR: Phase 2 routed DOM pruning optimization

## Summary
- Prunes inactive routed page panels so only the active route keeps its DOM mounted.
- Preserves routed page loading behavior while reducing inactive page DOM retained after navigation.
- Keeps changes scoped to the Phase 2 lazy domains branch.

## Verification so far
- Local checks previously passed for `/`, `/plans/`, `/messages/`, `/home/`, and `/training/`.
- Branch re-checked against remote on 2026-05-10 00:11 America/New_York: `ardi/phase2-lazy-domains` is aligned with `origin/ardi/phase2-lazy-domains` at `c8cbc25`.

## Notes / blockers
- GitHub CLI is not installed in this environment.
- No GitHub token was detected in environment variables, so PR creation via API is blocked here.
- Manual PR creation can use this body with base `main` and compare branch `ardi/phase2-lazy-domains`.

## Next Phase 2 step
- Measure baseline payload/DOM/script counts for root and routed pages; save results under `reports/phase2/`.
