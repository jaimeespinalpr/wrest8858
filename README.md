# Wrestling Performance Lab

Static landing experience centered on athlete, coach, and administrative views.

## Deploy to GitHub Pages

1. **Push the repo to GitHub.** Make sure the default branch (`main` or `master`) contains your latest commits.
2. **Add a GitHub Action.** Create `.github/workflows/deploy.yml` (see below) so GitHub can publish the static files.
3. **Enable GitHub Pages.**
   - Go to `Settings > Pages`.
   - Under “Source,” select “gh-pages branch” (the action creates it automatically).
   - Save; GitHub will publish the site at `https://<your-org>.github.io/<repo>/`.
4. **Share the published URL** with teammates whenever you want someone to preview the project without cloning.

### Recommended workflow file

Create `.github/workflows/deploy.yml` with the following content:

```yaml
name: Deploy GH Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_branch: gh-pages
          publish_dir: ./
```

This action publishes the repository root directly, which works because the project is already a static HTML/CSS/JS bundle.

After the workflow finishes, GitHub Pages will serve the site from the `gh-pages` branch automatically. If you rename the default branch or add a custom domain later, just update the Pages settings accordingly.

## Security model (Firebase only)

This project uses Firebase as the only security and identity layer:

- Firebase Auth for sign-in and credential handling.
- Firestore/Storage rules for access control.
- Client app + Firestore rules as the default trusted path (Spark-compatible).

No local backend auth/storage API is required.

## Spark-safe deploy flow (no Functions)

Use the scripts in `/Users/jaimeespinalpr/Documents/wrestling-coaching-experience/scripts`:

```bash
./scripts/check-spark-ready.sh
./scripts/deploy-spark.sh
```

Optional:

- Deploy to a specific project:
  ```bash
  ./scripts/deploy-spark.sh wrestling-app-dev
  ```
- Try Storage rules too (if a bucket exists):
  ```bash
  DEPLOY_STORAGE_RULES=1 ./scripts/deploy-spark.sh
  ```

## Firebase Auth onboarding

The onboarding overlay now prioritizes log in / create account so athletes and coaches authenticate before seeing the app. To wire it up:

1. **Set up a Firebase project.**
   - Go to the Firebase console, create a project (or reuse one), and enable **Email/Password** sign in under Authentication > Sign-in method.
   - Provision a Firestore database (mode: Production or Test) so user metadata can be stored. The app writes to the `users` collection by default.
2. **Provide your config.**
   - For hosted environments (including GitHub Pages), keep Firebase web config in `firebase-config.public.js` so it is versioned and deployed.
   - If you want local overrides, copy `firebase-config.example.js` to `firebase-config.js` and change values there. `firebase-config.js` is ignored by git. To load it, open the app with `?firebaseConfig=local` or set `localStorage.wplFirebaseConfigOverride = "local"` before reloading.
   - Optionally override `window.FIREBASE_USERS_COLLECTION` inside that file if you prefer a different collection name.
3. **Answer onboarding questions.**
   - The create-account form now asks for preferred move(s), years of experience, stance, weight class, and a short notes field; that metadata gets stored in your Firestore `users` document alongside the standard profile fields so you can target the experience later.
4. **Deploy.**
   - Serve the updated repo (with `firebase-config.public.js`) from your hosting provider.
   - When the site loads, onboarding uses Firebase Auth and stores user metadata in Firestore.

## Firebase Storage

- **Users:** authentication and profile metadata live in Firebase (`Auth` + Firestore `users` collection).
- **Media:** photos, videos, audio, and generated thumbnails now upload directly to Firebase Storage and store tokenized download URLs in Firestore/shared media state.
- **Rules:** Storage access is defined in `/Users/jaimeespinalpr/Documents/wrestling-coaching-experience/storage.rules` and deployed through `firebase.json`.
- **CORS:** the applied bucket policy is tracked in `/Users/jaimeespinalpr/Documents/wrestling-coaching-experience/firebase-storage-cors.json`.

### Required setup

1. Keep the Firebase web config in `/Users/jaimeespinalpr/Documents/wrestling-coaching-experience/firebase-config.public.js`.
2. Provision a default Firebase Storage bucket for the project. New buckets require the project to be on the Blaze plan.
3. Deploy Storage rules with `firebase deploy --only storage`.
4. Reapply CORS to the bucket if origins change. The JSON in `/Users/jaimeespinalpr/Documents/wrestling-coaching-experience/firebase-storage-cors.json` is the source of truth used by the app.

## Messaging workspace (Chats / Calls / Contacts / Share)

The messaging area now uses a 4-tab workspace while keeping the same app color system:

- **Chats:** direct real-time threads with media attachments (conversation list first, similar to WhatsApp flow).
- **Calls:** quick voice/video call-request actions that log request history and send a request into the chat thread.
- **Contacts:** grouped directories (Coaches, Athletes, Parents) collapsed by default and expandable on tap/click.
- **Share:** social-share tools for media URLs (native share when supported, plus Facebook/Instagram/TikTok/YouTube entry points).

Additional UX behavior:
- In compact/mobile layout, Chats opens as a two-step flow: thread list first, then full thread view with a Back button.
- Athlete contacts were moved out of the Chats list and kept in the Contacts tab.

Notes:
- Social apps differ in web share APIs. Facebook supports direct URL share links; Instagram/TikTok/YouTube flows open their upload/app entry and the app can copy the media URL for paste.
- Message media upload is optimized for mobile performance (lite video preview on smaller/low-memory devices).

## Invite email behavior (Spark-compatible)

- Default behavior is client-side and does not require Cloud Functions:
  - Coach taps Invite Athlete.
  - App opens device mail composer (`mailto:`) with a prefilled invite.
  - App URL is included automatically.
- Optional server endpoint:
  - If you explicitly set `window.WPL_INVITE_EMAIL_ENDPOINT`, the app will attempt direct API delivery first.
  - If it fails, it automatically falls back to `mailto:`.
