/**
 * Authentication Debug Script
 * 
 * Process: Auth Debug
 * Purpose: Debug authentication state and UI issues
 * Data Source: Firebase auth state, DOM elements
 * Update Path: Modify debug output as needed
 * Dependencies: Firebase auth, DOM elements
 */

(function() {
  'use strict';

  console.log('🔍 Auth Debug Script loaded');

  /**
   * Debug authentication state
   */
  function debugAuthState() {
    console.log('🔍 === AUTHENTICATION DEBUG ===');
    
    // Check Firebase availability
    console.log('Firebase available:', !!window.firebase);
    console.log('Firebase auth available:', !!(window.firebase && window.firebase.auth));
    
    // Check auth state
    if (window.firebase && window.firebase.auth) {
      const auth = window.firebase.auth();
      const currentUser = auth.currentUser;
      console.log('Current user:', currentUser);
      console.log('User email:', currentUser?.email);
      console.log('User display name:', currentUser?.displayName);
      console.log('User UID:', currentUser?.uid);
    }
    
    // Check global references
    console.log('window.currentUser:', window.currentUser);
    console.log('window.FlickletApp?.currentUser:', window.FlickletApp?.currentUser);
    
    // Check auth ready state
    console.log('window.__authReady:', window.__authReady);
    console.log('window.__authBridgeReady:', window.__authBridgeReady);
    console.log('window.__authObserverRegistered:', window.__authObserverRegistered);
    
    // Check UI elements
    const signInArea = document.querySelector('[data-auth="signed-out-visible"]');
    const signOutArea = document.querySelector('[data-auth="signed-in-visible"]');
    const usernameDisplay = document.querySelector('[data-username-display]');
    
    console.log('Sign-in area visible:', !signInArea?.hidden);
    console.log('Sign-out area visible:', !signOutArea?.hidden);
    console.log('Username display text:', usernameDisplay?.textContent);
    console.log('Username display hidden:', usernameDisplay?.hidden);
    
    // Check for conflicting elements
    const allAuthElements = document.querySelectorAll('[data-auth]');
    console.log('All auth elements:', Array.from(allAuthElements).map(el => ({
      selector: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').join('.') : ''),
      auth: el.dataset.auth,
      hidden: el.hidden,
      text: el.textContent?.trim()
    })));
    
    // Check for duplicate auth buttons
    const signInButtons = document.querySelectorAll('[data-action="sign-in"]');
    const signOutButtons = document.querySelectorAll('[data-action="sign-out"]');
    const usernameDisplays = document.querySelectorAll('[data-username-display]');
    
    console.log('Sign-in buttons count:', signInButtons.length);
    console.log('Sign-out buttons count:', signOutButtons.length);
    console.log('Username displays count:', usernameDisplays.length);
    
    // Check for conflicting text
    const signInText = document.querySelector('[data-auth="signed-out-visible"]')?.textContent;
    const signOutText = document.querySelector('[data-auth="signed-in-visible"]')?.textContent;
    console.log('Sign-in area text:', signInText);
    console.log('Sign-out area text:', signOutText);
    
    console.log('🔍 === END AUTH DEBUG ===');
  }

  /**
   * Force authentication state refresh
   */
  function forceAuthRefresh() {
    console.log('🔄 Forcing auth state refresh...');
    
    if (window.firebase && window.firebase.auth) {
      const auth = window.firebase.auth();
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        console.log('🔄 User is signed in, refreshing UI...');
        if (window.setAuthUI) {
          window.setAuthUI(true, currentUser.displayName || currentUser.email);
        }
      } else {
        console.log('🔄 User is signed out, refreshing UI...');
        if (window.setAuthUI) {
          window.setAuthUI(false, null);
        }
      }
    }
  }

  /**
   * Clear authentication state and reset
   */
  function clearAuthState() {
    console.log('🧹 Clearing auth state...');
    
    // Clear global references
    window.currentUser = null;
    if (window.FlickletApp) {
      window.FlickletApp.currentUser = null;
    }
    
    // Force sign out
    if (window.firebase && window.firebase.auth) {
      window.firebase.auth().signOut().then(() => {
        console.log('🧹 Signed out successfully');
        forceAuthRefresh();
      }).catch(err => {
        console.error('🧹 Sign out failed:', err);
      });
    }
  }

  /**
   * Test authentication flow
   */
  function testAuthFlow() {
    console.log('🧪 Testing authentication flow...');
    
    // Check if we can detect auth state
    if (window.firebase && window.firebase.auth) {
      const auth = window.firebase.auth();
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        console.log('🧪 User is signed in, testing sign out...');
        auth.signOut().then(() => {
          console.log('🧪 Sign out successful');
          setTimeout(() => {
            debugAuthState();
          }, 1000);
        }).catch(err => {
          console.error('🧪 Sign out failed:', err);
        });
      } else {
        console.log('🧪 User is signed out, testing sign in...');
        const provider = new window.firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).then(() => {
          console.log('🧪 Sign in successful');
          setTimeout(() => {
            debugAuthState();
          }, 1000);
        }).catch(err => {
          console.error('🧪 Sign in failed:', err);
        });
      }
    } else {
      console.error('🧪 Firebase auth not available');
    }
  }

  // Expose debug functions globally
  window.debugAuth = {
    state: debugAuthState,
    refresh: forceAuthRefresh,
    clear: clearAuthState,
    test: testAuthFlow
  };

  // Auto-run debug on load
  setTimeout(() => {
    debugAuthState();
  }, 2000);

  console.log('✅ Auth Debug Script ready. Use window.debugAuth.state() to debug');

})();

