// www/js/auth.js
// Hardened auth flow: popup first; on error → redirect fallback.
// Minimal diagnostics; no noisy logs.

(function () {
  const boot = () => {
    if (!window.firebaseApp || !window.firebaseAuth) {
      console.warn("[auth] firebaseApp missing at boot, deferring…");
      return false;
    }
    try {
      // your existing setup: bind account button, onAuthStateChanged, etc.
      const { firebaseApp, firebaseAuth } = window;
      // onAuthStateChanged(firebaseAuth, ...);
      console.log("[auth] ready with", firebaseApp.options?.projectId);
      return true;
    } catch (e) {
      console.error("[auth] init error", e);
      return false;
    }
  };

  // If ready, boot immediately; otherwise, subscribe and also wait on the promise
  if (!boot()) {
    const onReady = () => { window.removeEventListener("firebase:ready", onReady); boot(); };
    window.addEventListener("firebase:ready", onReady);
    if (window.__FIREBASE_READY__) {
      window.__FIREBASE_READY__.then(() => boot()).catch(()=>{});
    }
  }

  // Public, robust sign-in API (does nothing until ready)
  window.startSignIn = async () => {
    try {
      if (!window.firebaseAuth) {
        await window.__FIREBASE_READY__;
      }
      const { getAuth, GoogleAuthProvider, signInWithPopup } =
        await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js");
      const auth = window.firebaseAuth || getAuth(window.firebaseApp);
      const provider = new GoogleAuthProvider();

      // prefer popup; caller can fall back to redirect if needed
      await signInWithPopup(auth, provider);
      console.log("[auth] sign-in OK");
    } catch (e) {
      console.error("[auth] signIn failed:", e);
      // optional: fallback to redirect only on specific errors
      // if (e?.code === 'auth/popup-blocked') { await signInWithRedirect(auth, provider); }
    }
  };

  window.startSignOut = async () => {
    try {
      if (!window.firebaseAuth) await window.__FIREBASE_READY__;
      await window.firebaseAuth.signOut();
      console.log("[auth] signed out");
    } catch (e) {
      console.error("[auth] signOut failed:", e);
    }
  };
})();