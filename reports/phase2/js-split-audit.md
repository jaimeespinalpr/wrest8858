# Phase 2 JS Split Audit: Messages + Media

Measured/audited: 2026-05-10 01:11 America/New_York
Branch: `ardi/phase2-lazy-domains`

## Goal

Audit `app.js` dependencies around `messages` and `media`, then identify the lowest-risk real JavaScript split candidate for the next safe implementation step.

## Current state

- `app.js` is still the dominant initial script: 36,053 lines / ~1.5 MB on disk.
- Routed pages already prune inactive DOM panels, but every route still downloads/evaluates `app.js`.
- Existing lazy infrastructure is available:
  - `loadScriptOnce(src, { globalCheck })`
  - `runWhenBrowserIsIdle(callback)`
  - `ensureCoachPlannerDomainLoaded()` already loads `coach-planner.js` lazily.
- `/messages/` and `/media/` routed shells set `window.WPL_ROUTE_TAB` and load `route-loader.js`, which then loads the full app shell.

## Media dependency findings

Primary media domain block:

- DOM refs and copy start around `app.js:21547`.
- Media state/functions start around `app.js:21841`.
- Media render entry point: `renderMedia()` at `app.js:23257`.
- Shared media sync entry points:
  - `ensureMediaDomainSyncNow()` at `app.js:140`
  - `startMediaDomainSyncWhenIdle()` at `app.js:132`
  - shared Firestore helpers at `app.js:7189`-`7231`

Important cross-domain dependencies:

- Assignment/match relationship sync calls `getMediaNodes()` before the media block is declared (`app.js:6611`, `app.js:6729`). This is safe today because functions are only invoked after full script parse, but a split must preserve a synchronous/lightweight media API or guard those callers.
- Coach workspace realtime refreshes media from non-media snapshots (`renderMedia()` at `app.js:7022`, `app.js:7116`).
- Athlete portal/parent/media upload flows reuse media upload helpers (`uploadMediaAssetBundleToFirebase()` at `app.js:22346`; referenced again at `app.js:27028`, `app.js:31218`).
- Messages can save attachments into Media through `saveMessageAttachmentToMedia()` (`app.js:31295`) and uses `getMediaNodes()`/`setMediaNodes()`.

Media split risk:

- Splitting the whole Media domain now is moderate/high risk because Media is both a visible route and a shared data/attachment service for assignments, athlete/parent uploads, and messages.
- A safer later approach would be to first extract only upload/thumbnail helpers behind explicit async wrappers, but that still touches message sending and parent scouting upload paths.

## Messages dependency findings

Primary messages domain block:

- DOM refs and copy start around `app.js:30302`.
- Messages state starts around `app.js:30697`.
- Realtime entry point: `startMessagesRealtimeSync()` at `app.js:32999`.
- Render entry point: `renderMessages()` at `app.js:34914`.
- Composer submit starts at `app.js:35080`.

Important cross-domain dependencies:

- Profile/login starts messages realtime lazily through `startMessagesRealtimeWhenIdle()` (`app.js:124`, called from `applyProfile()` around `app.js:1820`).
- Route opening calls `startMessagesRealtimeSync()` when the Messages panel is visible (`app.js:10608`).
- Launch config can open a contact directly via `openDirectMessageThreadWithRetry()` (`app.js:10454`).
- Assignments/training/coach flows can post to messages through `appendMessageToThread()`:
  - assignment discussion: `app.js:18676`
  - assignment completed: `app.js:18729`
  - training/progress share: `app.js:24525`, `app.js:35580`
- Coach athlete cards call `messageCoachAthlete()` (`app.js:27549`, used later around `app.js:28453`, `app.js:29778`).
- Message attachment upload/save relies on Media helpers (`uploadMediaAssetBundleToFirebase()`, `registerMediaAssetInWorkspace()`, `saveMessageAttachmentToMedia()`).

Messages split risk:

- Splitting the entire Messages block is feasible but needs an app-level async bridge for these existing call sites:
  - `renderMessages()`
  - `startMessagesRealtimeSync(options)`
  - `openDirectMessageThreadWithRetry(contactUid, attempts)`
  - `appendMessageToThread(payload)`
  - `messageCoachAthlete(name)`
  - `sendMessageCallRequestToContact(contact, type)` if calls remain reachable outside the block
- The safest bridge pattern is to leave tiny wrapper functions in `app.js` and move the domain implementation to a new lazy script that registers `window.WPLMessagesDomain`.
- The split can be guarded so no external behavior changes if the lazy script fails: wrappers log/set status and preserve current UI instead of throwing through unrelated routes.

## Lowest-risk real split candidate

Recommended next implementation candidate: **Messages domain lazy split with app-level wrappers.**

Why this is lower risk than Media:

1. Messages already has explicit lazy/realtime entry points and route gating.
2. Most of the large Messages code is concentrated in one contiguous lower section of `app.js`.
3. Non-message pages can keep small no-op/loader wrappers without needing the full message UI immediately.
4. Media is a shared service used by messages, assignments, parent/athlete upload paths, and coach workspace sync, making a whole Media split riskier.

Recommended guarded boundary for step 4:

- Add `MESSAGES_DOMAIN_SRC = new URL(\`messages-domain.js?v=${DOMAIN_ASSET_VERSION}\`, APP_ASSET_BASE_URL).href`.
- Add `ensureMessagesDomainLoaded()` using `loadScriptOnce()` and `globalCheck: () => Boolean(window.WPLMessagesDomain)`.
- Keep minimal wrappers in `app.js` for current external call sites:
  - `renderMessages()`
  - `startMessagesRealtimeSync(options)`
  - `openDirectMessageThreadWithRetry(contactUid, attempts)`
  - `appendMessageToThread(payload)`
  - `messageCoachAthlete(name)`
- Move the Messages implementation block to `messages-domain.js` only after wrappers are in place.
- First implementation should not change message data schemas, Firebase paths, upload helpers, auth, or route URLs.

## Verification required after implementation

Minimum local verification after the guarded split:

- `/` login/register inputs still render and remain interactive.
- `/messages/` loads the Messages panel and does not throw before auth.
- `/media/` still renders with existing media tree behavior.
- `/plans/`, `/training/`, `/home/` still route-load without same-origin request failures.
- Static check confirms `messages-domain.js` is requested only when messages are opened or when profile/login starts messages idle sync.

## Explicit non-candidates for the next step

- Whole Media domain split: blocked by cross-domain usage of media tree and upload helpers.
- Firebase SDK split: risky because auth/profile boot and multiple realtime paths assume Firebase compat globals are available early.
- Route-specific HTML-only changes: already completed by routed DOM pruning and would not reduce the full `app.js` payload.
