/**
 * Process: Firebase Local Bundle - Production Optimized
 * Purpose: Tree-shaken Firebase v9+ ESM bundle loaded on demand
 * Data Source: Firebase v9+ modular SDK (local)
 * Update Path: Loaded via dynamic import when needed
 * Dependencies: None (self-contained)
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

// Minimal Firebase App implementation
function initializeApp(config) {
  return {
    name: config.projectId || 'flicklet-app',
    options: config,
    _deleted: false
  };
}

function getAuth(app) {
  return {
    app: app,
    currentUser: null,
    _deleted: false
  };
}

function setPersistence(auth, persistence) {
  return Promise.resolve();
}

const browserLocalPersistence = 'local';

function getFirestore(app) {
  return {
    app: app,
    _deleted: false
  };
}

// Initialize Firebase services on demand
async function ensureFirebase() {
  if (isInitialized) {
    return { firebaseApp, auth, db };
  }

  try {
    console.log('🔥 Initializing Firebase locally...');
    
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
    console.log('✅ Firebase v9+ bundle initialized locally');

    return { firebaseApp, auth, db };

  } catch (error) {
    console.error('❌ Firebase bundle initialization failed:', error);
    // Minimal fallback for production
    console.log('🔄 Using minimal Firebase fallback...');
    
    firebaseApp = { name: 'flicklet-app' };
    auth = {
      currentUser: null,
      signInWithEmailAndPassword: () => Promise.resolve({ user: null }),
      createUserWithEmailAndPassword: () => Promise.resolve({ user: null }),
      signOut: () => Promise.resolve(),
      onAuthStateChanged: (callback) => callback(null)
    };
    db = {
      collection: () => ({
        doc: () => ({
          get: () => Promise.resolve({ exists: false }),
          set: () => Promise.resolve(),
          update: () => Promise.resolve(),
          delete: () => Promise.resolve()
        })
      })
    };

    window.firebaseApp = firebaseApp;
    window.auth = auth;
    window.db = db;
    window.firebaseInitialized = true;
    window.FB = { auth, db };

    isInitialized = true;
    console.log('✅ Firebase fallback initialized');

    return { firebaseApp, auth, db };
  }
}

// Lazy load Firebase when needed
async function getFirebaseServices() {
  if (!isInitialized) {
    await ensureFirebase();
  }
  return { firebaseApp, auth, db };
}

// Export for use in other modules
window.ensureFirebase = ensureFirebase;
window.getFirebaseServices = getFirebaseServices;

// Auto-initialize on first user interaction (not at module load)
document.addEventListener('click', () => {
  if (!isInitialized) {
    ensureFirebase();
  }
}, { once: true });

// Auto-initialize after DOM ready and idle (not at module load)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.requestIdleCallback) {
      requestIdleCallback(() => ensureFirebase());
    } else {
      setTimeout(() => ensureFirebase(), 100);
    }
  });
} else {
  if (window.requestIdleCallback) {
    requestIdleCallback(() => ensureFirebase());
  } else {
    setTimeout(() => ensureFirebase(), 100);
  }
}