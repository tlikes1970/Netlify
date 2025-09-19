// www/js/firebase-init.js
// Modular-only Firebase bridge. No compat. Safe to re-run.
// If this file already exists, replace its contents with the IIFE below.

(async () => {
  try {
    const { initializeApp, getApp, getApps } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js");
    const { getAuth, onAuthStateChanged }   = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js");
    const { getFirestore }                  = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js");

    const cfg = window.firebaseConfig;
    if (!cfg) {
      console.error("[firebase-init] Missing window.firebaseConfig");
      // Don't 'return' at top level; just mark not ready and exit IIFE
      window.__FIREBASE_MODULAR__ = false;
      return;
    }

    const app = getApps().length ? getApp() : initializeApp(cfg);
    const auth = getAuth(app);
    const db   = getFirestore(app);

    // Expose handles for legacy code (no compat!)
    window.firebaseApp  = app;
    window.firebaseAuth = auth;
    window.firebaseDb   = db;
    window.__FIREBASE_MODULAR__ = true;

    // Provide a simple ready event for any code that needs to wait
    window.dispatchEvent(new CustomEvent("firebase:ready", {
      detail: { projectId: app?.options?.projectId }
    }));

    // Optional convenience
    window.onAuthStateChanged = (cb) => onAuthStateChanged(auth, cb);

    // Helper for legacy code that needs to wait for Firebase
    window.whenFirebaseReady = (fn) => {
      if (window.__FIREBASE_MODULAR__ && window.firebaseApp && window.firebaseAuth && window.firebaseDb) {
        fn();
      } else {
        const onReady = () => { window.removeEventListener("firebase:ready", onReady); fn(); };
        window.addEventListener("firebase:ready", onReady);
      }
    };

    console.log("[firebase-init] Modular bridge ready", {
      projectId: app?.options?.projectId,
      hasAuth: !!auth,
      hasDb:   !!db
    });
  } catch (e) {
    console.error("[firebase-init] Failed to initialize:", e);
    window.__FIREBASE_MODULAR__ = false;
  }
})();