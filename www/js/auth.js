(function () {
  const NS = '[auth]';
  const log = (...a) => console.log(NS, ...a);
  const warn = (...a) => console.warn(NS, ...a);
  const err = (...a) => console.error(NS, ...a);

  async function startSignIn() {
    try {
      // Set flag to indicate sign-in attempt is in progress
      window.__SIGN_IN_ATTEMPTED__ = true;
      log('🚀 Starting sign-in process...');

      // Wait for Firebase to be ready
      if (!window.firebaseApp || !window.firebaseAuth) {
        log('waiting for Firebase ready...');
        await window.__FIREBASE_READY__;
      }

      const { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } = await import(
        'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js'
      );
      const app = window.firebaseApp;
      if (!app) {
        warn('firebaseApp missing');
        return;
      }
      const auth = window.firebaseAuth || getAuth(app);
      const provider = new GoogleAuthProvider();

      // Use redirect method instead of popup to avoid blocking issues
      log('using redirect method for sign in');
      await signInWithRedirect(auth, provider);
    } catch (e) {
      err('signIn bootstrap failed:', e);
    }
  }

  // Handle redirect result when user returns from Google sign-in
  async function handleRedirectResult() {
    try {
      // Only check for redirect result if sign-in was attempted
      if (!window.__SIGN_IN_ATTEMPTED__) {
        log('ℹ️ No sign-in attempt detected, skipping redirect result check');
        return;
      }

      log('🔍 Checking for redirect result...');
      log('🔍 Current URL:', window.location.href);
      log('🔍 URL search:', window.location.search);
      log('🔍 URL hash:', window.location.hash);
      log('🔍 Referrer:', document.referrer);

      if (!window.firebaseApp || !window.firebaseAuth) {
        log('waiting for Firebase ready...');
        await window.__FIREBASE_READY__;
      }

      const { getAuth, getRedirectResult } = await import(
        'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js'
      );
      const app = window.firebaseApp;
      const auth = window.firebaseAuth || getAuth(app);

      log('🔍 Calling getRedirectResult...');
      const result = await getRedirectResult(auth);
      log('🔍 Redirect result:', result);

      if (result) {
        log('✅ redirect sign-in successful');
        updateAuthUI(result.user);

        // Clear the sign-in attempt flag
        window.__SIGN_IN_ATTEMPTED__ = false;

        // Trigger data sync after successful sign-in
        if (typeof window.DataInit?.trySync === 'function') {
          log('🔄 triggering data sync after redirect sign-in');
          await window.DataInit.trySync('redirect-sign-in');
        }
      } else {
        log('ℹ️ no redirect result - user not returning from sign-in');
        // Clear the flag if no result found
        window.__SIGN_IN_ATTEMPTED__ = false;
      }
    } catch (e) {
      err('❌ redirect result handling failed:', e);
      // Clear the flag on error
      window.__SIGN_IN_ATTEMPTED__ = false;
    }
  }

  // Update UI based on auth state
  function updateAuthUI(user) {
    const button = document.getElementById('accountBtn');
    const label = document.getElementById('accountButtonLabel');
    const greeting = document.getElementById('headerGreeting');

    if (user) {
      // Signed in
      if (button) {
        const displayName = user.displayName || user.email?.split('@')[0] || 'User';
        button.innerHTML = `👤 ${displayName}`;
        button.title = `Signed in as ${user.email}. Click to sign out.`;
        button.dataset.state = 'signed-in';
      }
      if (label) label.textContent = user.displayName || user.email || 'Signed In';
      if (greeting) {
        greeting.innerHTML = `<div><strong>${user.displayName || 'User'}</strong><div class="snark">welcome back, legend ✨</div></div>`;
      }

      // Update FlickletApp currentUser
      if (window.FlickletApp) {
        window.FlickletApp.currentUser = user;
      }
      window.currentUser = user;

      log('UI updated for signed-in user:', user.email);
    } else {
      // Signed out
      if (button) {
        button.innerHTML = '🔑 Sign In';
        button.title = 'Click to sign in';
        button.dataset.state = 'signed-out';
      }
      if (label) label.textContent = 'Sign In';
      if (greeting) {
        greeting.textContent = '';
      }

      // Clear FlickletApp currentUser
      if (window.FlickletApp) {
        window.FlickletApp.currentUser = null;
      }
      window.currentUser = null;

      log('UI updated for signed-out state');
    }
  }

  // DEPRECATED: Auth listener now handled by AuthManager
  async function setupAuthListener() {
    console.warn('[auth] DEPRECATED: setupAuthListener() - use AuthManager instead');
    // No-op: AuthManager owns the single auth listener
  }

  // Initialize auth listener when Firebase is ready
  if (window.__FIREBASE_READY__) {
    window.__FIREBASE_READY__.then(setupAuthListener);
  } else {
    window.addEventListener('firebase:ready', setupAuthListener);
  }

  // DEPRECATED: Forward to AuthManager
  window.startSignIn = () => {
    console.warn('[auth] DEPRECATED: startSignIn() - use AuthManager.startLogin() instead');
    if (window.AuthManager) {
      window.AuthManager.startLogin(window.AuthManager.PROVIDERS.GOOGLE);
    }
  };

  window.handleRedirectResult = () => {
    console.warn('[auth] DEPRECATED: handleRedirectResult() - handled by AuthManager');
    // No-op: AuthManager handles redirect results
  };

  window.startSignOut = async () => {
    console.warn('[auth] DEPRECATED: startSignOut() - use AuthManager.signOut() instead');
    if (window.AuthManager) {
      await window.AuthManager.signOut();
    }
  };

  // DEPRECATED: Redirect handling now done by AuthManager
  async function initRedirectHandler() {
    console.warn('[auth] DEPRECATED: initRedirectHandler() - handled by AuthManager');
    // No-op: AuthManager handles redirect results with proper flag checking
  }

  // Disable automatic redirect handling
  // AuthManager will handle this with proper flag checking
})();
