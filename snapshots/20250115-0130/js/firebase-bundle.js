/**
 * Process: Firebase Local Bundle
 * Purpose: Tree-shaken Firebase v9+ ESM bundle loaded on demand
 * Data Source: Firebase v9+ modular SDK
 * Update Path: Loaded via dynamic import when needed
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
let isInitialized = false;

// Initialize Firebase services on demand
async function initializeFirebase() {
  if (isInitialized) {
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
    window.FB = { auth, db };

    isInitialized = true;
    console.log('✅ Firebase v9+ bundle initialized on demand');

    return { firebaseApp, auth, db };

  } catch (error) {
    console.error('❌ Firebase bundle initialization failed:', error);
    throw error;
  }
}

// Lazy load Firebase when needed
async function getFirebaseServices() {
  if (!isInitialized) {
    await initializeFirebase();
  }
  return { firebaseApp, auth, db };
}

// Export for use in other modules
window.initializeFirebase = initializeFirebase;
window.getFirebaseServices = getFirebaseServices;

// Auto-initialize on first user interaction
document.addEventListener('click', () => {
  if (!isInitialized) {
    initializeFirebase();
  }
}, { once: true });

// Auto-initialize after DOM ready and idle
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.requestIdleCallback) {
      requestIdleCallback(() => initializeFirebase());
    } else {
      setTimeout(() => initializeFirebase(), 100);
    }
  });
} else {
  if (window.requestIdleCallback) {
    requestIdleCallback(() => initializeFirebase());
  } else {
    setTimeout(() => initializeFirebase(), 100);
  }
}
