// www/js/firebase-init.js
// Must be loaded AFTER firebase-config.js
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

(function () {
  async function init() {
    const cfg = window.firebaseConfig;
    if (!cfg) {
      console.warn("[firebase-init] No firebaseConfig yet; waiting for event…");
      await new Promise(resolve => {
        const h = () => { window.removeEventListener("firebase:config", h); resolve(); };
        window.addEventListener("firebase:config", h, { once: true });
      });
    }

    const config = window.firebaseConfig;
    if (!config) {
      console.error("[firebase-init] Missing firebaseConfig after wait");
      return;
    }

    let app = getApps().length ? getApp() : initializeApp(config);
    const auth = getAuth(app);
    const db   = getFirestore(app);

    // Sticky local persistence
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (e) {
      console.warn("[firebase-init] setPersistence failed:", e?.message || e);
    }

    // Expose bridge
    window.firebaseApp  = app;
    window.firebaseAuth = auth;
    window.firebaseDb   = db;
    window.__FIREBASE_MODULAR__ = true;

    // Notify listeners
    try {
      window.dispatchEvent(new CustomEvent("firebase:ready", {
        detail: { projectId: app.options.projectId }
      }));
    } catch {}

    // Optional: debug
    onAuthStateChanged(auth, (u) => {
      console.log("[firebase-init] auth state:", u ? u.uid : null);
    });

    console.log("[firebase-init] ready:", app.options.projectId);
  }

  // Kick off init (no top-level `return`)
  init().catch(e => console.error("[firebase-init] fatal:", e));
})();