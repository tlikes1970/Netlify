// --- Firebase v9 CDN Compat Bridge ---
// This file exposes Firebase v9 CDN compat APIs on window for non-module scripts

(function initFirebaseV9Bridge(retryCount = 0) {
  const maxRetries = 50; // 5 seconds max
  
  // Wait for Firebase to be loaded
  if (typeof firebase === 'undefined') {
    if (retryCount >= maxRetries) {
      console.error('Firebase failed to load after 5 seconds - CSP may be blocking scripts');
      return;
    }
    console.warn('Firebase not loaded yet, retrying...', retryCount + 1);
    setTimeout(() => initFirebaseV9Bridge(retryCount + 1), 100);
    return;
  }

  // Initialize Firebase if not already done
  if (!firebase.apps || firebase.apps.length === 0) {
    // Use the existing firebase-config.js configuration
    if (window.firebaseConfig) {
      firebase.initializeApp(window.firebaseConfig);
    } else {
      console.error('firebaseConfig not found');
      return;
    }
  }

  // Get auth instance
  const auth = firebase.auth();
  
  // --- Expose minimal surface on window for non-module scripts/diagnostics ---
  window.firebaseApp = firebase.app();
  window.auth = auth;
  window.getAuth = () => auth;
  window.onAuthStateChanged = (authInstance, callback) => authInstance.onAuthStateChanged(callback);
  window.setPersistence = (authInstance, persistence) => authInstance.setPersistence(persistence);
  window.browserLocalPersistence = firebase.auth.Auth.Persistence.LOCAL;
  window.GoogleAuthProvider = firebase.auth.GoogleAuthProvider;
  window.signInWithPopup = (authInstance, provider) => authInstance.signInWithPopup(provider);
  window.signOut = (authInstance) => authInstance.signOut();

  console.log('✅ Firebase v9 CDN bridge initialized');
})();
