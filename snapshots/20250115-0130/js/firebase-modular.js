/**
 * Process: Firebase Modular Loader
 * Purpose: Load Firebase v9+ modular SDK dynamically after first paint
 * Data Source: Firebase v9+ modular imports
 * Update Path: Loaded via dynamic import() after DOMContentLoaded
 * Dependencies: Firebase v9+ modular SDK
 */

// Firebase configuration
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM",
  authDomain: "flicklet-71dff.firebaseapp.com",
  projectId: "flicklet-71dff",
  storageBucket: "flicklet-71dff.appspot.com",
  messagingSenderId: "1034923556763",
  appId: "1:1034923556763:web:bba5489cd1d9412c9c2b3e",
  measurementId: "G-YL4TJ4FHJC"
};

// Firebase services cache
let firebaseApp = null;
let auth = null;
let db = null;

// Initialize Firebase services dynamically
async function initializeFirebase() {
  if (firebaseApp) {
    return { firebaseApp, auth, db };
  }

  try {
    // Dynamic import of Firebase v9+ modular SDK
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js');
    const { getAuth, setPersistence, browserLocalPersistence } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js');
    const { getFirestore } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');

    // Initialize Firebase app
    firebaseApp = initializeApp(FIREBASE_CONFIG);
    
    // Initialize Auth
    auth = getAuth(firebaseApp);
    await setPersistence(auth, browserLocalPersistence);
    
    // Initialize Firestore
    db = getFirestore(firebaseApp);

    // Expose globally for compatibility
    window.firebaseApp = firebaseApp;
    window.auth = auth;
    window.db = db;
    window.firebaseInitialized = true;

    console.log('✅ Firebase v9+ modular SDK initialized');
    return { firebaseApp, auth, db };

  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
}

// Lazy load Firebase when needed
async function getFirebaseServices() {
  if (!firebaseApp) {
    await initializeFirebase();
  }
  return { firebaseApp, auth, db };
}

// Export for use in other modules
window.initializeFirebase = initializeFirebase;
window.getFirebaseServices = getFirebaseServices;
