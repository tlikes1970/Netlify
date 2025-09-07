// auth.js — hardened modal + login flows
(function(){
  if (window.__authInit__) return; window.__authInit__ = true;

  function getCurrentModal() {
    return document.querySelector('[data-modal="login"]') || document.querySelector('.modal-backdrop[data-testid="modal-backdrop"]');
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
      el.setAttribute('data-auth-msg',''); 
      el.style.marginTop='8px'; 
      el.style.color='var(--color-error,#b00020)'; 
      modal.querySelector('[data-modal-actions]')?.insertAdjacentElement('beforebegin', el); 
    }
    return el;
  }

  function getButton(buttonId) {
    return document.getElementById(buttonId);
  }

  function setBusy(buttonId, on, labelIdle){
    const btn = getButton(buttonId);
    if (!btn) return;
    btn.disabled = !!on;
    if (on) btn.dataset._label = btn.textContent;
    btn.textContent = on ? 'Working…' : (labelIdle || btn.dataset._label || btn.textContent);
  }

  function ensureFirebase(){
    const ok = !!(window.firebase && window.firebaseInitialized);
    if (!ok) {
      const error = 'Firebase not properly initialized. Please refresh the page and try again.';
      console.error('❌ Firebase check failed:', error);
      showInlineError(error);
      
      // Show a more user-friendly notification
      if (window.showNotification) {
        window.showNotification('Authentication system is not ready. Please refresh the page.', 'error');
      }
      
      throw new Error(error);
    }
    return true;
  }

  function showInlineError(text){
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
    authModals.forEach(modal => {
      console.log('🚪 Removing auth modal:', modal);
      modal.remove();
    });
    
    // Clear the global handle if it exists but is disconnected
    if (window.__currentAuthModal && !window.__currentAuthModal.isConnected) {
      window.__currentAuthModal = null;
    }
  }


  async function loginWithGoogle(){
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
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification('Signed in successfully!', 'success');
      } else if (Notify?.info) {
        Notify.info('Signed in successfully');
      }
    } catch (e){
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

  async function loginWithApple(){
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
      Notify?.info?.('Signed in successfully');
    } catch (e){
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

  async function loginWithEmail(){
    setBusy('emailBtn', true);
    try {
      ensureFirebase();
      const modal = getCurrentModal();
      const email = (modal?.querySelector('#emailInput')?.value || '').trim();
      const pass  = (modal?.querySelector('#passwordInput')?.value || '').trim();
      
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
      Notify?.info?.('Signed in successfully');
    } catch (e){
      console.error('[auth] email login failed', e);
      let errorMessage = 'Email sign-in failed. ';
      
      if (e.code === 'auth/user-not-found') {
        errorMessage += 'No account found with this email. Please check your email or create a new account.';
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

  // Export a single API for the rest of the app
  window.FlickletAuth = {
    loginWithGoogle, loginWithApple, loginWithEmail,
    showInlineError
  };

  console.log('🔐 Auth.js loaded - enhanced modal protection and login functions available');
})();
