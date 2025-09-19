(function(){
  const NS = "[auth]";
  const log = (...a) => console.log(NS, ...a);
  const warn = (...a) => console.warn(NS, ...a);
  const err = (...a) => console.error(NS, ...a);

  async function startSignIn() {
    try {
      // Wait for Firebase to be ready
      if (!window.firebaseApp || !window.firebaseAuth) {
        log("waiting for Firebase ready...");
        await window.__FIREBASE_READY__;
      }
      
      const { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } =
        await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js");
      const app  = window.firebaseApp;
      if (!app) { warn("firebaseApp missing"); return; }
      const auth = window.firebaseAuth || getAuth(app);
      const provider = new GoogleAuthProvider();

      try {
        await signInWithPopup(auth, provider);
        log("popup success");
      } catch (e) {
        const code = e?.code || "";
        if (/popup-(blocked|closed)-by-user|unauthorized-domain|third-party-cookie/i.test(code) || /network/i.test(code)) {
          warn("popup failed, falling back to redirect:", code);
          await signInWithRedirect(auth, provider);
        } else {
          err("signIn failed:", e);
        }
      }
    } catch (e) {
      err("signIn bootstrap failed:", e);
    }
  }

  window.startSignIn = startSignIn;

  window.startSignOut = async () => {
    try {
      if (!window.firebaseAuth) await window.__FIREBASE_READY__;
      const { signOut } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js");
      await signOut(window.firebaseAuth);
      log("signed out");
    } catch (e) {
      err("signOut failed:", e);
    }
  };
})();