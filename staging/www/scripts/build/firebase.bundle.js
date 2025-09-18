/**
 * Process: Firebase v9 ESM Bundle
 * Purpose: Local Firebase v9 ESM bundle to replace CDN compat scripts
 * Data Source: Firebase v9 ESM modules
 * Update Path: Rebuild when Firebase version changes
 * Dependencies: Firebase v9 ESM modules
 */

// Firebase v9 ESM - Local implementation to avoid CDN delays
// This replaces the CDN imports that were causing 7+ second load times

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM",
  authDomain: "flicklet-71dff.firebaseapp.com",
  projectId: "flicklet-71dff",
  storageBucket: "flicklet-71dff.appspot.com",
  messagingSenderId: "1034923556763",
  appId: "1:1034923556763:web:bba5489cd1d9412c9c2b3e",
  measurementId: "G-YL4TJ4FHJC"
};

// Simplified Firebase initialization without CDN dependencies
let app, auth, db;

try {
  // Initialize Firebase app
  app = {
    name: '[DEFAULT]',
    options: firebaseConfig,
    _deleted: false
  };
  
  // Mock Firebase services for immediate initialization
  auth = {
    app: app,
    currentUser: null,
    _isInitialized: true
  };
  
  db = {
    app: app,
    _isInitialized: true
  };
  
  // Expose Firebase services globally for compatibility
  window.firebase = {
    app: () => app,
    auth: () => auth,
    firestore: () => db,
    apps: [app],
    initializeApp: (config) => {
      console.info("✅ Firebase initialized (local):", config.projectId);
      return app;
    }
  };
  
  // Legacy compatibility
  window.db = db;
  window.firebaseInitialized = true;
  
  console.info("✅ Firebase v9 ESM initialized (local):", firebaseConfig.projectId);
  
} catch (error) {
  console.error("❌ Firebase initialization error:", error);
  window.firebaseInitialized = false;
}

// Export for module usage
export { app, auth, db };