(function () {
  "use strict";

  var config = {
    apiKey: "AIzaSyCmXGX7g0w865bdOZSVdlHed2Km2N7RJ-E",
    authDomain: "gary-test-c557f.firebaseapp.com",
    projectId: "gary-test-c557f",
    storageBucket: "gary-test-c557f.appspot.com",
    messagingSenderId: "48604096321",
    appId: "1:48604096321:web:cbf9b632c16c7f98e963c0",
    measurementId: "G-8VGT08KXVZ"
  };

  window.FIREBASE_CONFIG = window.FIREBASE_CONFIG || config;
  window.firebaseConfig = window.firebaseConfig || window.FIREBASE_CONFIG;
  window.WPL_FIREBASE_CONFIG = window.WPL_FIREBASE_CONFIG || window.FIREBASE_CONFIG;
  window.wplFirebaseConfig = window.wplFirebaseConfig || window.FIREBASE_CONFIG;

  window.FIREBASE_USERS_COLLECTION = window.FIREBASE_USERS_COLLECTION || "users";
  window.FIREBASE_SHARED_COLLECTION = window.FIREBASE_SHARED_COLLECTION || "shared_app";
  window.FIREBASE_MEDIA_TREE_DOC = window.FIREBASE_MEDIA_TREE_DOC || "media_tree";
  window.FIREBASE_PUBLIC_COMPETITION_SHARES_COLLECTION = window.FIREBASE_PUBLIC_COMPETITION_SHARES_COLLECTION || "public_competition_shares";
  window.WPL_MEDIA_UPLOADS_ROOT = window.WPL_MEDIA_UPLOADS_ROOT || "media_uploads";
  window.WPL_MEDIA_BASE_URL = window.WPL_MEDIA_BASE_URL || "";
}());
