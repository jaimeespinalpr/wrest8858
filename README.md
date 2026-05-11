# Wrestling Performance Lab

Static web experience centered on athlete, coach, and admin workflows.

## Quick Start (Local)

1. Prepare local dependencies:
   ```powershell
   .\scripts\setup-local.ps1
   ```
2. Start local server:
   ```powershell
   .\scripts\start-local.ps1
   ```
3. Optional local Firebase override:
   ```powershell
   .\scripts\start-local.ps1 -UseLocalFirebaseConfig
   ```

Notes:
- `start-local.ps1` opens your browser and serves the repository root with Python `http.server`.
- When `-UseLocalFirebaseConfig` is used and `firebase-config.js` does not exist, it is created from `firebase-config.example.js`.
- `firebase-config.js` is ignored by git.

## GitHub Pages Deploy

This repository already includes:
- `.github/workflows/static.yml`

Flow:
1. Push changes to `main`.
2. The workflow stamps static asset URLs with the commit SHA so browsers do not keep old `app.js`, `styles.css`, or route-loader files.
3. Verify Pages is set to `GitHub Actions` in repository settings.
4. Check the workflow run in the Actions tab.

## Release Checklist

Before publishing an important change:

```powershell
.\scripts\release-check.ps1 -BaseUrl "http://localhost:5173"
```

Manual smoke test:

- Open `/competition/` and confirm the athlete list loads.
- Open `/athletes/` and confirm roster/profile data loads.
- Test login or guest coach access.
- Test profile photo edit/save if the change touched profiles.
- Test messages if the change touched chat, users, or Firebase rules.

After pushing:

- Confirm the GitHub Actions deploy finished successfully.
- Open the GitHub Pages URL with a hard refresh.
- If production still looks old, confirm the public page is loading the latest commit-stamped asset version.

## Client Error Log

The app keeps a small local browser error log for troubleshooting production issues.

Open DevTools console and run:

```js
JSON.parse(localStorage.getItem("wpl_client_error_log") || "[]")
```

This log stays in the user's browser only and keeps the latest 25 client errors.

Optional repository secrets for production Firebase config:
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`

If all required Firebase secrets are present, the workflow generates `firebase-config.public.js` during deploy. If not, it falls back to the committed `firebase-config.public.js`.

## Security Model (Firebase Only)

- Firebase Auth handles sign in and credentials.
- Firestore and Storage rules enforce data access.
- Client app + rules is the default trusted path (Spark-compatible).

No local backend auth/storage API is required for the standard flow.

## Spark-Safe Deploy Flow (No Functions)

Use scripts in `scripts/`:

```bash
./scripts/check-spark-ready.sh
./scripts/deploy-spark.sh
```

Optional:

- Deploy to a specific project:
  ```bash
  ./scripts/deploy-spark.sh wrestling-app-dev
  ```
- Include Storage rules deploy:
  ```bash
  DEPLOY_STORAGE_RULES=1 ./scripts/deploy-spark.sh
  ```

## Firebase Auth Onboarding

1. Set up Firebase project:
   - Enable Email/Password in Auth.
   - Create Firestore database.
2. Provide config:
   - Hosted environments use `firebase-config.public.js`.
   - Local override uses `firebase-config.js` (ignored by git).
   - Enable local override with `?firebaseConfig=local` or:
     ```js
     localStorage.wplFirebaseConfigOverride = "local";
     ```
3. Deploy static app.

## Firebase Storage

- Rules file: `storage.rules`
- CORS source of truth: `firebase-storage-cors.json`
- Firebase deploy config: `firebase.json`

Required setup:
1. Keep valid web config in `firebase-config.public.js`.
2. Provision default Firebase Storage bucket.
3. Deploy rules:
   ```bash
   firebase deploy --only storage
   ```
4. Reapply CORS if allowed origins change.

## Messaging Workspace (Chats / Calls / Contacts / Share)

- Chats: real-time direct threads with media attachments.
- Calls: voice/video request actions with history.
- Contacts: grouped directories for coaches, athletes, and parents.
- Share: social-share entry points for media URLs.

Mobile behavior:
- Compact layout uses two-step chats flow (thread list -> thread view with back button).

## Invite Email Behavior (Spark-Compatible)

- Default path is client-side `mailto:` invite.
- Optional server endpoint:
  - Define `window.WPL_INVITE_EMAIL_ENDPOINT`.
  - If endpoint fails, app falls back to `mailto:`.
