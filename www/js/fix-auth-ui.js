/**
 * Auth UI Fix - Comprehensive UI State Correction
 * 
 * Process: Auth UI Fix
 * Purpose: Fix conflicting auth UI elements and sign-out functionality
 * Data Source: Firebase auth state, DOM elements
 * Update Path: Remove after auth system is fully fixed
 * Dependencies: Firebase auth, DOM manipulation
 */

(function() {
  'use strict';

  console.log('🔧 Auth UI Fix starting...');

  /**
   * Force clear all auth UI states and rebuild correctly
   */
  function fixAuthUI() {
    console.log('🔧 Fixing auth UI state...');
    
    try {
      // Get current Firebase auth state
      const auth = window.firebase?.auth();
      const currentUser = auth?.currentUser;
      
      console.log('🔧 Current user:', currentUser?.email || 'None');
      
      // Clear all conflicting text and states
      const signInArea = document.querySelector('[data-auth="signed-out-visible"]');
      const signOutArea = document.querySelector('[data-auth="signed-in-visible"]');
      
      if (signInArea) {
        // Clear any conflicting text
        signInArea.innerHTML = `
          <button id="signIn" data-action="sign-in" class="btn btn--sm">👤 Sign In</button>
        `;
        signInArea.hidden = !!currentUser; // Hide if signed in
      }
      
      if (signOutArea) {
        // Clear any conflicting text and rebuild
        signOutArea.innerHTML = `
          <div class="account-info">
            <span id="usernameDisplay" class="user-name" data-username-display title="Click to sign out">${currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}</span>
            <button id="signOutBtn" data-action="sign-out" class="btn btn--sm btn--secondary">Sign Out</button>
          </div>
        `;
        signOutArea.hidden = !currentUser; // Show if signed in
      }
      
      // Update global references
      if (currentUser) {
        window.currentUser = currentUser;
        if (window.FlickletApp) {
          window.FlickletApp.currentUser = currentUser;
        }
      } else {
        window.currentUser = null;
        if (window.FlickletApp) {
          window.FlickletApp.currentUser = null;
        }
      }
      
      // Add proper event listeners
      setupAuthEventListeners();
      
      console.log('🔧 Auth UI fixed! Signed in:', !!currentUser);
      
      // Show success message
      if (currentUser && window.showToast) {
        window.showToast('success', 'Signed In', `Welcome back, ${currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}!`);
      }
      
    } catch (error) {
      console.error('🔧 Failed to fix auth UI:', error);
    }
  }

  /**
   * Setup proper event listeners for auth buttons
   */
  function setupAuthEventListeners() {
    // Remove existing listeners to prevent duplicates
    document.removeEventListener('click', handleAuthClick);
    
    // Add new listener
    document.addEventListener('click', handleAuthClick);
  }

  /**
   * Handle auth button clicks
   */
  function handleAuthClick(e) {
    const el = e.target.closest('[data-action="sign-in"], [data-action="sign-out"]');
    if (!el) return;
    
    e.preventDefault();
    
    try {
      if (el.matches('[data-action="sign-in"]')) {
        console.log('🔧 Sign in clicked');
        signIn();
      } else if (el.matches('[data-action="sign-out"]')) {
        console.log('🔧 Sign out clicked');
        signOut();
      }
    } catch (error) {
      console.error('🔧 Auth click handler failed:', error);
    }
  }

  /**
   * Sign in function
   */
  async function signIn() {
    try {
      if (!window.firebase?.auth) {
        console.error('🔧 Firebase auth not available');
        return;
      }
      
      const auth = window.firebaseAuth;
      const provider = new window.firebaseAuth.GoogleAuthProvider();
      
      console.log('🔧 Starting Google sign in...');
      const result = await auth.signInWithPopup(provider);
      
      console.log('🔧 Sign in successful:', result.user?.email);
      
      // Update UI after successful sign in
      setTimeout(() => {
        fixAuthUI();
      }, 500);
      
    } catch (error) {
      console.error('🔧 Sign in failed:', error);
      if (window.showToast) {
        window.showToast('error', 'Sign In Failed', 'Please try again');
      }
    }
  }

  /**
   * Sign out function
   */
  async function signOut() {
    try {
      if (!window.firebase?.auth) {
        console.error('🔧 Firebase auth not available');
        return;
      }
      
      const auth = window.firebaseAuth;
      
      console.log('🔧 Starting sign out...');
      await auth.signOut();
      
      console.log('🔧 Sign out successful');
      
      // Update UI after sign out
      setTimeout(() => {
        fixAuthUI();
      }, 100);
      
      if (window.showToast) {
        window.showToast('success', 'Signed Out', 'You have been signed out');
      }
      
    } catch (error) {
      console.error('🔧 Sign out failed:', error);
      if (window.showToast) {
        window.showToast('error', 'Sign Out Failed', 'Please try again');
      }
    }
  }

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

  // Initialize the fix
  async function init() {
    await waitForFirebase();
    
    // Run the fix
    fixAuthUI();
    
    // Also listen for auth state changes
    const auth = window.firebaseAuth;
    auth.onAuthStateChanged((user) => {
      console.log('🔧 Auth state changed:', user?.email || 'None');
      setTimeout(() => {
        fixAuthUI();
      }, 100);
    });
  }

  // Start the fix
  setTimeout(init, 1000);

  // Expose globally for manual use
  window.fixAuthUI = fixAuthUI;
  window.signOut = signOut;
  window.signIn = signIn;

  console.log('✅ Auth UI Fix loaded. Use window.fixAuthUI() to manually fix.');

})();

