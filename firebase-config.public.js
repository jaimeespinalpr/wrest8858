window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyCmXGX7g0w865bdOZSVdlHed2Km2N7RJ-E",
  authDomain: "gary-test-c557f.firebaseapp.com",
  projectId: "gary-test-c557f",
  storageBucket: "gary-test-c557f.firebasestorage.app",
  messagingSenderId: "48604096321",
  appId: "1:48604096321:web:cbf9b632c16c7f98e963c0",
  measurementId: "G-8VGT08KXVZ"
};

// User profiles are always stored in the canonical "users" collection.
window.FIREBASE_USERS_COLLECTION = "users";
window.FIREBASE_SHARED_COLLECTION = "shared_app";
window.FIREBASE_MEDIA_TREE_DOC = "media_tree";
window.WPL_MEDIA_UPLOADS_ROOT = "media_uploads";
window.WPL_MEDIA_BASE_URL = "";

(function loadPlansPolishStyles() {
  const id = "wpl-plans-polish-css";
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = "plans-polish.css?v=20260524-plans-polish1";
  document.head.appendChild(link);
}());
