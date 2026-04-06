# Backend Storage Map (Current Web Platform)

## Firebase project currently configured

- `projectId`: `gary-test-c557f`
- `authDomain`: `gary-test-c557f.firebaseapp.com`
- `storageBucket`: `gary-test-c557f.firebasestorage.app`

Source: `firebase-config.public.js`.

## Where data is stored

- Users and sign-in identities:
  - Firebase Authentication (`email/password` login).
  - Passwords are managed by Firebase Auth, not stored in Firestore documents by this app.
- User profiles and app metadata:
  - Firestore collection: `users`.
- Direct messages:
  - Firestore collection: `message_threads`.
  - Messages per thread: `message_threads/{threadId}/messages/{messageId}`.
- Training logs:
  - Firestore: `coach_workspaces/{coachUid}/training_logs/{logId}`.
- Shared media metadata:
  - Firestore: `shared_app/media_tree` and related workspace media metadata in
    `coach_workspaces/{coachUid}/media_assets/{mediaAssetId}`.
- Uploaded video/photo files:
  - Firebase Storage path root: `media_uploads/{uid}/...`.
  - Rules currently allow only authenticated owner UID to read/write under that UID path.

## Security rules

- Firestore ACL/authorization logic: `firestore.rules`.
- Storage ACL/authorization logic: `storage.rules`.

