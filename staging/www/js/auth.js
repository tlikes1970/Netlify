/**
 * Auth Profile ViewModel - Single Observer Pattern
 * Ensures exactly one auth observer and provides clear DOM markers
 */

// Import Firestore functions
let doc, setDoc;
if (typeof window !== 'undefined' && window.firebaseDb) {
  import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js').then(({ doc: docFn, setDoc: setDocFn }) => {
    doc = docFn;
    setDoc = setDocFn;
  });
}

// ---- Auth Bridge + Singleton Observer ----
(function initAuthBridge() {
  if (window.__authBridgeReady) return;
  
  // Export Firebase globals
  if (window.firebaseApp) {
    window.firebaseApp = window.firebaseApp;
  }
  if (window.firebaseAuth) {
    window.firebaseAuth = window.firebaseAuth;
  }
  if (window.firebaseDb) {
    window.firebaseDb = window.firebaseDb;
  }
  
  if (!window.auth || !window.onAuthStateChanged || !window.setPersistence) {
    console.warn('AuthBridge: Firebase APIs not on window yet.');
    return;
  }
  window.__authBridgeReady = true;

  // Persistence is handled by main Firebase initialization in index.html
  // No need to set it again here to avoid conflicts

  // Single observer
  if (!window.__authObserverRegistered) {
    window.__authObserverRegistered = true;
    window.__authObserverCount = 1;
    window.onAuthStateChanged(window.auth, (user) => {
      window.__authReady = true;
      console.log('🔥 Auth state changed:', user ? `User: ${user.email}` : 'No user');
      
      // Update global currentUser references
      if (window.FlickletApp) {
        window.FlickletApp.currentUser = user;
      }
      window.currentUser = user;
      
      // Update UserViewModel
      if (window.UserViewModel) {
        window.UserViewModel.update(user);
      }
      
      // Update auth UI
      updateAuthUI(user);
      
      // Update account button
      if (window.FlickletApp && typeof window.FlickletApp.updateAccountButton === 'function') {
        window.FlickletApp.updateAccountButton();
      }
      
      // Process user sign-in if user exists and FlickletApp is available
      if (user && window.FlickletApp && typeof window.FlickletApp.processUserSignIn === 'function') {
        console.log('🔄 Processing user sign-in...');
        try {
          window.FlickletApp.processUserSignIn(user);
        } catch (error) {
          console.error('❌ Error in processUserSignIn:', error);
        }
      } else if (!user) {
        console.log('🔄 User signed out, clearing state...');
        // Clear any cached data when user signs out
        if (window.FlickletApp && typeof window.FlickletApp.clearUserData === 'function') {
          window.FlickletApp.clearUserData();
        }
      }
    });
  }
})();

// ---- Minimal UI binder: toggles markers + updates header/snark ----
function setAuthUI(isIn, displayName) {
  // Ensure DOM is ready before updating UI elements
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setAuthUI(isIn, displayName));
    return;
  }

  // Update auth visibility with error handling
  try {
    document.querySelectorAll('[data-auth="signed-in-visible"]').forEach(el => el.hidden = !isIn);
    document.querySelectorAll('[data-auth="signed-out-visible"]').forEach(el => el.hidden = isIn);
  } catch (e) {
    console.warn('Auth UI: Failed to update visibility elements', e);
  }

  // Gate Settings (optional) with error handling
  try {
    document.querySelectorAll('[data-requires-auth]').forEach(el => {
      el.disabled = !isIn;
      el.setAttribute('aria-disabled', String(!isIn));
    });
  } catch (e) {
    console.warn('Auth UI: Failed to update auth-gated elements', e);
  }

  const nameEl  = document.querySelector('#usernameDisplay, [data-username-display]');
  const snarkEl = document.querySelector('.snark, [data-snark]');
  if (nameEl)  nameEl.textContent  = isIn ? (displayName || 'You') : '';
  if (snarkEl) snarkEl.textContent = isIn ? (window.makeSnark?.(displayName) || `Welcome back, ${displayName || 'friend'}.`) : '';
}

// ---- (Optional) call after successful username edit to live-update header ----
// setAuthUI(true, newDisplayName);

// Expose globally for manual updates (e.g., username changes)
window.setAuthUI = setAuthUI;

// ---- New updateAuthUI function for hotfix ----
function updateAuthUI(user) {
  // Ensure DOM is ready before updating UI elements
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => updateAuthUI(user));
    return;
  }

  const accountBtn = document.getElementById('accountButton');
  const greetingName = document.getElementById('greetingName');
  const greetingSnark = document.getElementById('greetingSnark');

  if (!accountBtn) {
    console.warn('updateAuthUI: accountButton not found, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', () => updateAuthUI(user));
    return;
  }

  if (user) {
    // User is signed in
    const displayName = user.displayName || user.email?.split('@')[0] || 'Travis Likes';
    accountBtn.textContent = displayName;
    accountBtn.setAttribute('aria-label', `Signed in as ${user.email}. Click to sign out.`);
    
    // Show greeting elements
    if (greetingName) {
      greetingName.textContent = displayName;
      greetingName.style.display = 'block';
    }
    if (greetingSnark) {
      const snarks = [
        `Ready to discover, ${displayName}?`,
        `Let's find your next favorite show, ${displayName}!`,
        `Welcome back, ${displayName}!`
      ];
      greetingSnark.textContent = snarks[Math.floor(Math.random() * snarks.length)];
      greetingSnark.style.display = 'block';
    }
    
    // Write username to Firestore settings
    if (window.firebaseDb && user.uid) {
      try {
        const settingsRef = doc(window.firebaseDb, 'users', user.uid, 'settings', 'app');
        setDoc(settingsRef, { username: displayName }, { merge: true });
      } catch (error) {
        console.warn('Failed to update Firestore username:', error);
      }
    }
  } else {
    // User is signed out
    accountBtn.textContent = '👤 Sign In';
    accountBtn.setAttribute('aria-label', 'Click to sign in');
    
    // Hide greeting elements
    if (greetingName) {
      greetingName.style.display = 'none';
    }
    if (greetingSnark) {
      greetingSnark.style.display = 'none';
    }
  }
}

// Expose updateAuthUI globally
window.updateAuthUI = updateAuthUI;

// wire-01: resilient click delegation for accountButton
document.addEventListener('click', (e) => {
  const el = e.target.closest('#accountButton');
  if (!el) return;
  e.preventDefault();
  try {
    const auth = window.auth || window.firebase?.auth?.();
    const currentUser = auth?.currentUser;
    
    if (!currentUser) {
      // Signed out → sign in
      if (typeof window.login === 'function') return window.login();
      // Fallback to Google Auth popup
      if (auth && window.GoogleAuthProvider) {
        const provider = new window.GoogleAuthProvider();
        return auth.signInWithPopup(provider);
      }
      console.warn('[AUTH] login() not found');
    } else {
      // Signed in → sign out
      const confirmOut = window.confirm('Sign out now?');
      if (!confirmOut) return;
      if (typeof window.logout === 'function') return window.logout();
      if (auth?.signOut) return auth.signOut();
      console.warn('[AUTH] signOut() not available');
    }
  } catch (err) {
    console.error('[AUTH] click handler failed:', err);
  }
});

// Logout handler
(function wireLogout(){
  const btn = document.getElementById('logoutBtn');
  if (btn && window.signOut && window.auth) {
    btn.onclick = async () => {
      try { await window.signOut(window.auth); } catch(e) { console.warn('logout failed', e); }
    };
  }
})();

// Simple account menu toggle
(function wireAccountMenu(){
  const btn = document.getElementById('accountMenuBtn');
  const menu = document.getElementById('accountMenu');
  if (!btn || !menu) return;
  const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded','false'); };
  btn.addEventListener('click', () => {
    const open = menu.hidden;
   menu.hidden = !open; btn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => { if (!menu.hidden && !menu.contains(e.target) && e.target !== btn) close(); });
})();

// When auth state sets signed in, also set initial & ensure visibility
(function enhanceSetAuthUI(){
  const orig = window.setAuthUI;
  window.setAuthUI = function(isIn, displayName){
    if (typeof orig === 'function') orig(isIn, displayName);
    const init = (displayName||'').trim();
    const initials = init ? init[0].toUpperCase() : 'U';
    const initialEl = document.querySelector('.user-initial');
    if (initialEl) initialEl.textContent = initials;
  };
})();
