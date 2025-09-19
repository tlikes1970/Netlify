/**
 * Auth State Fix - Manual Trigger
 * 
 * Process: Auth State Fix
 * Purpose: Manually trigger auth state update when bridge fails
 * Data Source: Firebase auth currentUser
 * Update Path: Remove after auth bridge is fixed
 * Dependencies: Firebase auth, setAuthUI function
 */

(function() {
  'use strict';

  console.log('🔧 Auth State Fix starting...');

  // Wait for Firebase to be ready
  function waitForFirebase() {
    return new Promise((resolve) => {
      if (window.firebaseAuth) {
        resolve();
      } else {
        setTimeout(() => waitForFirebase().then(resolve), 100);
      }
    });
  }

  // Wait for setAuthUI to be available
  function waitForSetAuthUI() {
    return new Promise((resolve) => {
      if (window.setAuthUI) {
        resolve();
      } else {
        setTimeout(() => waitForSetAuthUI().then(resolve), 100);
      }
    });
  }

  // Fix auth state
  async function fixAuthState() {
    try {
      await waitForFirebase();
      await waitForSetAuthUI();
      
      const auth = window.firebaseAuth;
      const currentUser = auth.currentUser;
      
      console.log('🔧 Current user from Firebase:', currentUser);
      
      if (currentUser) {
        console.log('🔧 User is signed in, updating UI...');
        
        // Update global references
        window.currentUser = currentUser;
        if (window.FlickletApp) {
          window.FlickletApp.currentUser = currentUser;
        }
        
        // Update UI
        const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
        window.setAuthUI(true, displayName);
        
        console.log('🔧 Auth state fixed! User:', displayName);
        
        // Show success message
        if (window.showToast) {
          window.showToast('success', 'Signed In', `Welcome back, ${displayName}!`);
        }
        
      } else {
        console.log('🔧 No user signed in');
        window.setAuthUI(false, null);
      }
      
    } catch (error) {
      console.error('🔧 Failed to fix auth state:', error);
    }
  }

  // Run the fix
  setTimeout(fixAuthState, 1000);

  // Also expose globally for manual use
  window.fixAuthState = fixAuthState;

  console.log('✅ Auth State Fix loaded. Use window.fixAuthState() to manually fix.');

})();

