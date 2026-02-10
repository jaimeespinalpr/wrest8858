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

## Backend storage for local development

The PHP API under `api/` already knows how to save users and related data. By default it still targets the existing MySQL credentials in `api/config.php`, but you can point it at a SQLite database for quick local testing.

### Use SQLite instead of MySQL

1. Set the environment variables before starting PHP so the router drives a local file:
   ```bash
   export WPL_DB_DRIVER=sqlite
   export WPL_COOKIE_SECURE=false
   ```
2. Start the PHP built-in server from the repo root so `index.html`, `assets/` and `api/` share the same origin:
   ```bash
   php -S localhost:8000
   ```
3. The first request will auto-create `api/data/wpl.sqlite` (schema taken from `api/schema-sqlite.sql`)
   and enable foreign keys. You can override the path with `WPL_SQLITE_PATH`, or
   point to a different schema with `WPL_SQLITE_SCHEMA`.
4. Visit `http://localhost:8000` in Chrome – the frontend loads from the same host that serves `api/`, so the `fetch("api/...")` calls work without CORS.

### Switch back to MySQL / production

If you have a MySQL/MariaDB instance, export the following before starting PHP so the API connects to that server:

```bash
export WPL_DB_DRIVER=mysql
export WPL_DB_HOST=...
export WPL_DB_NAME=...
export WPL_DB_USER=...
export WPL_DB_PASS=...
```

The defaults in `api/config.php` still match the original production credentials, so you only need to override what changes.

## Firebase Auth onboarding

The onboarding overlay now prioritizes log in / create account so athletes and coaches authenticate before seeing the app. To wire it up:

1. **Set up a Firebase project.**
   - Go to the Firebase console, create a project (or reuse one), and enable **Email/Password** sign in under Authentication > Sign-in method.
   - Provision a Firestore database (mode: Production or Test) so user metadata can be stored. The app writes to the `users` collection by default.
2. **Provide your config.**
   - For hosted environments (including GitHub Pages), keep Firebase web config in `firebase-config.public.js` so it is versioned and deployed.
   - If you want local overrides, copy `firebase-config.example.js` to `firebase-config.js` and change values there. `firebase-config.js` is ignored by git and loads after the public file.
   - Optionally override `window.FIREBASE_USERS_COLLECTION` inside that file if you prefer a different collection name.
3. **Answer onboarding questions.**
   - The create-account form now asks for preferred move(s), years of experience, stance, weight class, and a short notes field; that metadata gets stored in your Firestore `users` document alongside the standard profile fields so you can target the experience later.
4. **Deploy.**
   - Serve the updated repo (with `firebase-config.public.js`) from your hosting provider along with the PHP API. The frontend needs access to Firebase Auth and Firestore; the backend still supports the existing storage endpoints for other bits of state.
   - When the site loads, the onboarding modal now renders the log in / create account forms powered by Firebase Auth. Successful sign-in stores the profile locally but keeps credentials and metadata in Firebase services.

If you later need to revert to MySQL-backed auth, remove or empty `firebase-config.public.js` (and any local `firebase-config.js`) so the Firebase scripts skip initialization, and switch the app back to the PHP storage API as documented above.

## Storage strategy (users in Firebase, media in NAS)

- **Users (now):** authentication and user profile metadata are persisted in Firebase (`Auth` + Firestore `users` collection).
- **Media (future):** videos/photos/audio can move to your NAS and the app can store only metadata/URLs in Firebase or local state.
- Recommended next step for NAS integration: define a base URL (or signed URL service) and add media item fields like `assetUrl`, `thumbnailUrl`, and `duration`.

### NAS rollout checklist

1. Expose media through HTTPS from your NAS (reverse proxy or web server).
2. Decide one public base URL, e.g. `https://nas.example.com/media`.
3. Set `window.WPL_MEDIA_BASE_URL` in `firebase-config.public.js` (or local `firebase-config.js`) to that base URL.
4. In **Media > Add Video**, save:
   - `NAS path or URL`: `wrestling/drills/double-leg.mp4` (or full URL).
   - `Thumbnail path`: optional image path.
   - `Duration`: optional display value (`03:45`).
5. Keep write access private: uploads should go through a backend service, not direct unauthenticated NAS writes from browser clients.
6. Store only metadata in app/Firebase (paths, labels, assignments); files remain in NAS storage.
