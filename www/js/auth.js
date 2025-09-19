// www/js/auth.js
// Hardened auth flow: popup first; on error → redirect fallback.
// Minimal diagnostics; no noisy logs.

(async () => {
  const { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, setPersistence, browserLocalPersistence } =
    await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js");

  const app = window.firebaseApp;
  if (!app) {
    console.warn("[auth] firebaseApp missing");
    return;
  }

  const auth = window.firebaseAuth || getAuth(app);
  try { await setPersistence(auth, browserLocalPersistence); } catch {}

  const accountBtn = document.getElementById("accountButton");
  const urlForcesRedirect = /[?&]auth=redirect\b/i.test(location.search);

  const provider = new GoogleAuthProvider();

  function setSignedOutUI() {
    if (accountBtn) {
      accountBtn.textContent = "👤 Sign In";
      accountBtn.title = "Sign in with Google";
      accountBtn.dataset.state = "signed-out";
    }
  }

  function setSignedInUI(user) {
    const label = user?.displayName || user?.email || "Sign Out";
    if (accountBtn) {
      accountBtn.textContent = "👤 Sign Out";
      accountBtn.title = label;
      accountBtn.dataset.state = "signed-in";
    }
  }

  async function beginRedirect() {
    try {
      await signInWithRedirect(auth, provider);
    } catch (err) {
      console.warn("[auth] redirect failed", compactError(err));
    }
  }

  function compactError(err) {
    return {
      code: err?.code || null,
      msg: err?.message || String(err || ""),
      origin: location.origin,
      cookieEnabled: navigator.cookieEnabled
    };
  }

  async function handleSignIn() {
    if (urlForcesRedirect) return beginRedirect();

    // Try popup first
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      const code = err?.code || "";
      console.warn("[auth] popup failed", compactError(err));
      // Common popup/cookie/CSP failures → redirect fallback
      if (
        code.includes("popup-") ||
        code === "auth/network-request-failed" ||
        code === "auth/unauthorized-domain"
      ) {
        return beginRedirect();
      }
      // Unknown error: still try redirect as last resort
      return beginRedirect();
    }
  }

  async function handleSignOut() {
    try { await signOut(auth); } catch (err) {
      console.warn("[auth] signOut failed", compactError(err));
    }
  }

  // Button behavior
  if (accountBtn) {
    accountBtn.addEventListener("click", async () => {
      if (auth.currentUser) {
        await handleSignOut();
      } else {
        accountBtn.textContent = "Signing in…";
        await handleSignIn();
      }
    });
  }

  // One-time redirect result (post-redirect landing)
  try {
    const res = await getRedirectResult(auth);
    if (res && res.user) {
      console.info("[auth] redirect success");
    }
  } catch (err) {
    console.warn("[auth] redirect result error", compactError(err));
  }

  // Keep UI synced
  onAuthStateChanged(auth, (user) => {
    if (user) setSignedInUI(user); else setSignedOutUI();
    window.firebaseAuth = auth; // ensure global stays current
  });

  // Initialize UI state
  if (auth.currentUser) setSignedInUI(auth.currentUser); else setSignedOutUI();
})();