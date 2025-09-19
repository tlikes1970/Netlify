// www/js/firebase-init.js
// Modular-only bridge. No compat. Safe to re-run.

import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Expect window.firebaseConfig to be defined earlier
const cfg = window.firebaseConfig;
if (!cfg) {
  console.error("[firebase-init] Missing window.firebaseConfig");
  // Set fallback flags to prevent crashes
  window.__FIREBASE_MODULAR__ = false;
  window.__NO_FIREBASE__ = true;
  return;
}

try {
  // Reuse if exists
  const app = getApps().length ? getApp() : initializeApp(cfg);

  // Expose modular handles globally for legacy code paths
  window.firebaseApp  = app;
  window.firebaseAuth = getAuth(app);
  window.firebaseDb   = getFirestore(app);

  // Useful diag flags
  window.__FIREBASE_MODULAR__ = true;
  window.__NO_FIREBASE__ = false;

  // Optional helper for consumers that need a ready callback
  window.onAuthStateChanged = async (callback) => {
    const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js");
    return onAuthStateChanged(window.firebaseAuth, callback);
  };

  console.log("[firebase-init] Modular bridge ready", {
    projectId: app?.options?.projectId,
    hasAuth: !!window.firebaseAuth,
    hasDb: !!window.firebaseDb
  });
} catch (error) {
  console.error("[firebase-init] Failed to initialize modular bridge:", error);
  // Set fallback flags to prevent crashes
  window.__FIREBASE_MODULAR__ = false;
  window.__NO_FIREBASE__ = true;
}