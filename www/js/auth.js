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

  // Update UI based on auth state
  function updateAuthUI(user) {
    const button = document.getElementById('accountButton');
    const label = document.getElementById('accountButtonLabel');
    const greeting = document.getElementById('headerGreeting');
    
    if (user) {
      // Signed in
      if (label) label.textContent = user.displayName || user.email || 'Signed In';
      if (button) {
        button.title = 'Sign Out';
        button.dataset.state = 'signed-in';
      }
      if (greeting) {
        greeting.innerHTML = `<div><strong>${user.displayName || 'User'}</strong><div class="snark">welcome back, legend ✨</div></div>`;
      }
    } else {
      // Signed out
      if (label) label.textContent = 'Sign In';
      if (button) {
        button.title = 'Sign In';
        button.dataset.state = 'signed-out';
      }
      if (greeting) {
        greeting.textContent = '';
      }
    }
  }

  // Listen for auth state changes
  async function setupAuthListener() {
    try {
      if (!window.firebaseAuth) await window.__FIREBASE_READY__;
      const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js");
      onAuthStateChanged(window.firebaseAuth, (user) => {
        log("auth state changed:", user ? "signed-in" : "signed-out");
        updateAuthUI(user);
      });
    } catch (e) {
      warn("auth listener setup failed:", e?.message || e);
    }
  }

  // Initialize auth listener when Firebase is ready
  if (window.__FIREBASE_READY__) {
    window.__FIREBASE_READY__.then(setupAuthListener);
  } else {
    window.addEventListener('firebase:ready', setupAuthListener);
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