# Phase 2 Post-Lazy Route Metrics Comparison

Measured: 2026-05-10T07:18:43.172Z
Branch: ardi/phase2-lazy-domains
Commit: e35177d

Compared against `reports/phase2/baseline-route-metrics.json` from before the guarded Messages lazy split.

## Summary

- Routes measured: 19
- Same-origin request failures: 0
- messages-domain.js loaded on /messages/: yes
- messages-domain.js loaded on non-message routes: 0

## Route comparison

| Route | DOM Δ | Same-origin script bytes Δ | Same-origin payload bytes Δ | Messages domain loaded | Failures |
|---|---:|---:|---:|---|---:|
| / | 89 | -215,597 B | -215,603 B | no | 0 |
| /today/ | 0 | -215,597 B | -215,603 B | no | 0 |
| /home/ | 0 | -215,597 B | -215,603 B | no | 0 |
| /plans/ | 0 | -215,597 B | -215,603 B | no | 0 |
| /messages/ | 1 | +2,174 B | +2,168 B | yes | 0 |
| /training/ | 0 | -215,597 B | -215,603 B | no | 0 |
| /media/ | 0 | -215,597 B | -215,603 B | no | 0 |
| /athletes/ | 0 | -215,597 B | -215,603 B | no | 0 |
| /calendar/ | 0 | -215,597 B | -215,603 B | no | 0 |
| /profile/ | 0 | -215,597 B | -215,603 B | no | 0 |
| /journal/ | 0 | -215,597 B | -215,603 B | no | 0 |
| /favorites/ | 0 | -215,597 B | -215,603 B | no | 0 |
| /announcements/ | 0 | -215,597 B | -215,603 B | no | 0 |
| /competition/ | 0 | -215,597 B | -215,603 B | no | 0 |
| /tournament/ | 0 | -215,597 B | -215,603 B | no | 0 |
| /parent/ | 0 | -215,597 B | -215,603 B | no | 0 |
| /scouting/ | 0 | -215,597 B | -215,603 B | no | 0 |
| /coach-profile/ | 0 | -215,597 B | -215,603 B | no | 0 |
| /permissions/ | 0 | -215,597 B | -215,603 B | no | 0 |

## Notes

- Expected result after the split: non-message routes should avoid loading `messages-domain.js`; `/messages/` should load it.
- This is a local static Playwright measurement only; authenticated Firebase data flows and deploy behavior were not exercised.
