// auth.js — hardened modal + login flows
(function () {
  if (window.__authInit__) return;
  window.__authInit__ = true;

  function getCurrentModal() {
    return (
      document.querySelector('[data-modal="login"]') ||
      document.querySelector('.modal-backdrop[data-testid="modal-backdrop"]')
    );
  }

  function getCurrentModalBody() {
    const modal = getCurrentModal();
    return modal?.querySelector('[data-modal-body]') || modal?.querySelector('.modal');
  }

  function getMsgElement() {
    const modal = getCurrentModal();
    let el = modal?.querySelector('[data-auth-msg]');
    if (!el && modal) {
      el = document.createElement('div');
      el.setAttribute('data-auth-msg', '');
      el.style.marginTop = '8px';
      el.style.color = 'var(--color-error,#b00020)';
      modal.querySelector('[data-modal-actions]')?.insertAdjacentElement('beforebegin', el);
    }
    return el;
  }

  function getButton(buttonId) {
    return document.getElementById(buttonId);
  }

  function setBusy(buttonId, on, labelIdle) {
    const btn = getButton(buttonId);
    if (!btn) return;
    btn.disabled = !!on;
    if (on) btn.dataset._label = btn.textContent;
    btn.textContent = on ? 'Working…' : labelIdle || btn.dataset._label || btn.textContent;
  }

  function ensureFirebase() {
    const ok = !!(window.firebase && window.firebaseInitialized);
    if (!ok) {
      const error = 'Firebase not properly initialized. Please refresh the page and try again.';
      console.error('❌ Firebase check failed:', error);
      showInlineError(error);

      // Show a more user-friendly notification
      if (window.showNotification) {
        window.showNotification(
          'Authentication system is not ready. Please refresh the page.',
          'error',
        );
      }

      throw new Error(error);
    }
    return true;
  }

  function showInlineError(text) {
    const el = getMsgElement();
    if (el) {
      el.textContent = text !== undefined ? text : 'Something went wrong.';
      console.log('🔍 Error message set:', text !== undefined ? text : 'Something went wrong.');
    } else {
      console.error('❌ Could not find error message element');
      // Fallback: try to show notification instead
      if (typeof showNotification === 'function') {
        showNotification(text || 'Something went wrong.', 'error');
      } else {
        console.log('🔍 Error (no UI element available):', text || 'Something went wrong.');
      }
    }
  }

  function closeAuthModal() {
    console.log('🚪 closeAuthModal called');

    // First try to close the injected signInModal
    const injectedModal = document.getElementById('signInModal');
    if (injectedModal) {
      console.log('🚪 Closing injected signInModal');
      hideSignInModal();
      return;
    }

    // Prefer the handle if we kept it
    if (window.__currentAuthModal?.isConnected) {
      console.log('🚪 Closing auth modal via global handle');
      window.__currentAuthModal.remove();
      window.__currentAuthModal = null;
      return;
    }

    // Otherwise select by attribute, NOT by generic modal-backdrop
    const authModals = document.querySelectorAll('.modal-backdrop[data-modal="login"]');
    console.log('🔍 Found auth modals by data-modal="login":', authModals.length);
    authModals.forEach((modal) => {
      console.log('🚪 Removing auth modal:', modal);
      modal.remove();
    });

    // Clear the global handle if it exists but is disconnected
    if (window.__currentAuthModal && !window.__currentAuthModal.isConnected) {
      window.__currentAuthModal = null;
    }
  }

  async function loginWithGoogle() {
    console.log('🔐 loginWithGoogle called');
    setBusy('googleBtn', true);
    try {
      console.log('🔐 Checking Firebase...');
      ensureFirebase();
      console.log('🔐 Firebase OK, creating provider...');
      const provider = new firebase.auth.GoogleAuthProvider();
      console.log('🔐 Calling signInWithPopup...');
      // Note: Cross-Origin-Opener-Policy errors are harmless browser security warnings
      // The popup may not close automatically, but authentication still works
      const result = await firebase.auth().signInWithPopup(provider);
      console.log('🔐 Login successful!', result.user?.email);
      showInlineError(''); // clear
      closeAuthModal();

      // Update account button immediately
      console.log('🔍 Debug: Checking FlickletApp availability:', {
        FlickletApp: !!window.FlickletApp,
        updateAccountButton: !!(window.FlickletApp && window.FlickletApp.updateAccountButton),
        currentUser: window.FlickletApp?.currentUser,
        firebaseUser: result.user,
      });

      // Update account button immediately with the user data we have
      const accountBtn = document.getElementById('accountButton');
      if (accountBtn && result.user) {
        const displayName = result.user.displayName || result.user.email?.split('@')[0] || 'User';
        const accountButtonLabel = accountBtn.querySelector('#accountButtonLabel');
        if (accountButtonLabel) {
          accountButtonLabel.textContent = displayName;
        }
        accountBtn.title = `Signed in as ${result.user.email}. Click to sign out.`;
        console.log('🔍 Updated account button directly with user data:', displayName);
      }

      // Also try the FlickletApp method after a delay for consistency
      setTimeout(() => {
        if (window.FlickletApp && window.FlickletApp.updateAccountButton) {
          console.log('🔍 Updating account button after Google sign-in (delayed)');
          window.FlickletApp.updateAccountButton();
        }
      }, 500);

      // Show success notification
      if (window.showNotification) {
        window.showNotification('Signed in successfully!', 'success');
      } else if (Notify?.info) {
        Notify.info('Signed in successfully');
      }

      // DEPRECATED: Username prompt now handled by app layer post-auth pipeline
      console.warn('[auth] DEPRECATED: Username prompt trigger - handled by app layer');
    } catch (e) {
      console.error('[auth] google login failed', e);
      let errorMessage = 'Google sign-in failed. ';

      if (e.code === 'auth/popup-closed-by-user') {
        errorMessage += 'Please try again and complete the sign-in process.';
      } else if (e.code === 'auth/popup-blocked') {
        errorMessage += 'Please allow popups for this site and try again.';
      } else if (e.code === 'auth/network-request-failed') {
        errorMessage += 'Network error. Please check your connection and try again.';
      } else if (e.code === 'auth/too-many-requests') {
        errorMessage += 'Too many failed attempts. Please try again later.';
      } else if (e.code === 'auth/operation-not-allowed') {
        errorMessage += 'Google sign-in is not enabled. Please contact support.';
      } else {
        errorMessage += e.message || 'Please try again.';
      }

      showInlineError(errorMessage);

      // Show error notification
      if (window.showNotification) {
        window.showNotification(errorMessage, 'error');
      }

      // do NOT close modal
    } finally {
      setBusy('googleBtn', false, '🔒 Google');
    }
  }

  async function loginWithApple() {
    setBusy('appleBtn', true);
    try {
      ensureFirebase();
      const provider = new firebase.auth.OAuthProvider('apple.com');
      // Note: Cross-Origin-Opener-Policy errors are harmless browser security warnings
      // The popup may not close automatically, but authentication still works
      const result = await firebase.auth().signInWithPopup(provider);
      console.log('🍎 Apple login successful!', result.user?.email);
      showInlineError('');
      closeAuthModal();

      // Update account button immediately
      const accountBtn = document.getElementById('accountButton');
      if (accountBtn && result.user) {
        const displayName = result.user.displayName || result.user.email?.split('@')[0] || 'User';
        const accountButtonLabel = accountBtn.querySelector('#accountButtonLabel');
        if (accountButtonLabel) {
          accountButtonLabel.textContent = displayName;
        }
        accountBtn.title = `Signed in as ${result.user.email}. Click to sign out.`;
        console.log('🔍 Updated account button directly with user data:', displayName);
      }

      if (window.FlickletApp && window.FlickletApp.updateAccountButton) {
        console.log('🔍 Updating account button after Apple sign-in');
        window.FlickletApp.updateAccountButton();
      }

      Notify?.info?.('Signed in successfully');
    } catch (e) {
      console.error('[auth] apple login failed', e);
      let errorMessage = 'Apple sign-in failed. ';

      if (e.code === 'auth/popup-closed-by-user') {
        errorMessage += 'Please try again and complete the sign-in process.';
      } else if (e.code === 'auth/popup-blocked') {
        errorMessage += 'Please allow popups for this site and try again.';
      } else if (e.code === 'auth/network-request-failed') {
        errorMessage += 'Network error. Please check your connection and try again.';
      } else {
        errorMessage += e.message || 'Please try again.';
      }

      showInlineError(errorMessage);
    } finally {
      setBusy('appleBtn', false, '🍎 Apple');
    }
  }

  async function loginWithEmail() {
    setBusy('emailBtn', true);
    try {
      ensureFirebase();
      const modal = getCurrentModal();
      const email = (modal?.querySelector('#emailInput')?.value || '').trim();
      const pass = (modal?.querySelector('#passwordInput')?.value || '').trim();

      if (!email || !pass) {
        showInlineError('Email and password are required');
        return;
      }

      if (!email.includes('@')) {
        showInlineError('Please enter a valid email address');
        return;
      }

      if (pass.length < 6) {
        showInlineError('Password must be at least 6 characters');
        return;
      }

      const result = await firebase.auth().signInWithEmailAndPassword(email, pass);
      console.log('✉️ Email login successful!', result.user?.email);
      showInlineError('');
      closeAuthModal();

      // Update account button immediately
      const accountBtn = document.getElementById('accountButton');
      if (accountBtn && result.user) {
        const displayName = result.user.displayName || result.user.email?.split('@')[0] || 'User';
        const accountButtonLabel = accountBtn.querySelector('#accountButtonLabel');
        if (accountButtonLabel) {
          accountButtonLabel.textContent = displayName;
        }
        accountBtn.title = `Signed in as ${result.user.email}. Click to sign out.`;
        console.log('🔍 Updated account button directly with user data:', displayName);
      }

      if (window.FlickletApp && window.FlickletApp.updateAccountButton) {
        console.log('🔍 Updating account button after Email sign-in');
        window.FlickletApp.updateAccountButton();
      }

      Notify?.info?.('Signed in successfully');
    } catch (e) {
      console.error('[auth] email login failed', e);
      let errorMessage = 'Email sign-in failed. ';

      if (e.code === 'auth/user-not-found') {
        errorMessage +=
          'No account found with this email. Please check your email or create a new account.';
      } else if (e.code === 'auth/wrong-password') {
        errorMessage += 'Incorrect password. Please try again.';
      } else if (e.code === 'auth/invalid-email') {
        errorMessage += 'Please enter a valid email address.';
      } else if (e.code === 'auth/too-many-requests') {
        errorMessage += 'Too many failed attempts. Please try again later.';
      } else if (e.code === 'auth/network-request-failed') {
        errorMessage += 'Network error. Please check your connection and try again.';
      } else {
        errorMessage += e.message || 'Please try again.';
      }

      showInlineError(errorMessage);
    } finally {
      setBusy('emailBtn', false, '✉️ Email');
    }
  }

  // STEP 3.6a — Ensure a sign-in modal exists; inject minimal one if missing
  function ensureSignInModal() {
    let m = document.getElementById('signInModal');
    if (m) return m;

    // If your project uses a different id (e.g., #signInSheet), map it here:
    // m = document.getElementById('signInSheet');
    // if (m) return m;

    // Inject a minimal modal so the app isn't blocked
    const tpl = document.createElement('div');
    tpl.id = 'signInModal';
    tpl.setAttribute('hidden', '');
    tpl.setAttribute('role', 'dialog');
    tpl.setAttribute('aria-modal', 'true');
    tpl.setAttribute('aria-labelledby', 'signInTitle');
    tpl.innerHTML = `
      <div class="modal-backdrop" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;"></div>
      <div class="modal-card" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--surface, #fff);color:var(--text,#333);padding:24px;border-radius:12px;min-width:400px;max-width:500px;box-shadow:0 20px 60px rgba(0,0,0,.35);z-index:9999;">
        <h2 id="signInTitle" style="margin:0 0 16px;font-size:20px;font-weight:600;">Sign in to sync</h2>
        <p style="margin:0 0 20px;color:#666;">Continue to Flicklet</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;justify-content:center;align-items:center;max-width:320px;margin:0 auto 20px;">
          <button id="googleBtn" type="button" class="btn" style="font-size:14px;padding:12px 18px;min-height:44px;background:#4285f4;color:white;border:none;border-radius:8px;cursor:pointer;">🔒 Google</button>
          <button id="appleBtn" type="button" class="btn secondary" style="font-size:14px;padding:12px 18px;min-height:44px;background:#f5f5f5;color:#333;border:1px solid #ddd;border-radius:8px;cursor:pointer;">🍎 Apple</button>
          <button id="emailBtn" type="button" class="btn secondary" style="font-size:14px;padding:12px 18px;min-height:44px;grid-column:1/-1;background:#f5f5f5;color:#333;border:1px solid #ddd;border-radius:8px;cursor:pointer;">✉️ Email</button>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button type="button" id="closeSignInModal" style="padding:8px 16px;background:#f5f5f5;color:#333;border:1px solid #ddd;border-radius:6px;cursor:pointer;">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(tpl);

    // Close behavior
    tpl.addEventListener('click', (ev) => {
      if (ev.target.id === 'closeSignInModal' || ev.target.classList.contains('modal-backdrop')) {
        hideSignInModal();
      }
    });

    // Add sign-in event listeners
    const googleBtn = tpl.querySelector('#googleBtn');
    const appleBtn = tpl.querySelector('#appleBtn');
    const emailBtn = tpl.querySelector('#emailBtn');

    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        console.log('🔐 Google sign-in button clicked in injected modal');
        loginWithGoogle();
      });
    }

    if (appleBtn) {
      appleBtn.addEventListener('click', () => {
        console.log('🍎 Apple sign-in button clicked in injected modal');
        loginWithApple();
      });
    }

    if (emailBtn) {
      emailBtn.addEventListener('click', () => {
        console.log('✉️ Email sign-in button clicked in injected modal');
        loginWithEmail();
      });
    }

    return tpl;
  }

  function showSignInModal() {
    const m = ensureSignInModal();
    if (!m) {
      console.warn('showSignInModal: no modal');
      return;
    }
    m.removeAttribute('hidden');
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');

    // focus the primary action
    const btn = m.querySelector('#googleBtn');
    if (btn) btn.focus();
  }

  function hideSignInModal() {
    const m = document.getElementById('signInModal');
    if (!m) return;
    m.classList.remove('open');
    m.setAttribute('hidden', '');
    m.setAttribute('aria-hidden', 'true');
  }

  // Expose globally and onto FlickletApp when ready
  window.showSignInModal = showSignInModal;
  window.hideSignInModal = hideSignInModal;
  if (window.FlickletApp) {
    window.FlickletApp.showSignInModal = showSignInModal;
    window.FlickletApp.hideSignInModal = hideSignInModal;
  } else {
    window.addEventListener(
      'app-ready',
      () => {
        if (window.FlickletApp) {
          window.FlickletApp.showSignInModal = showSignInModal;
          window.FlickletApp.hideSignInModal = hideSignInModal;
        }
      },
      { once: true },
    );
  }

  // Export a single API for the rest of the app - delegate to AuthManager
  window.FlickletAuth = {
    loginWithGoogle: () => {
      console.log('[auth] FlickletAuth.loginWithGoogle() → delegating to AuthManager');
      if (window.AuthManager) {
        window.AuthManager.startLogin(window.AuthManager.PROVIDERS.GOOGLE);
      } else {
        console.error('[auth] AuthManager not available');
      }
    },
    loginWithApple: () => {
      console.log('[auth] FlickletAuth.loginWithApple() → delegating to AuthManager');
      if (window.AuthManager) {
        window.AuthManager.startLogin(window.AuthManager.PROVIDERS.APPLE);
      } else {
        console.error('[auth] AuthManager not available');
      }
    },
    loginWithEmail: () => {
      console.log('[auth] FlickletAuth.loginWithEmail() → delegating to AuthManager');
      if (window.AuthManager) {
        window.AuthManager.startLogin(window.AuthManager.PROVIDERS.EMAIL);
      } else {
        console.error('[auth] AuthManager not available');
      }
    },
    showInlineError: (text) => {
      console.log('[auth] FlickletAuth.showInlineError() → delegating to AuthManager');
      if (window.AuthManager) {
        window.AuthManager.showError(text);
      } else {
        console.error('[auth] AuthManager not available');
      }
    },
  };

  console.log('🔐 Auth.js loaded - enhanced modal protection and login functions available');
})();
