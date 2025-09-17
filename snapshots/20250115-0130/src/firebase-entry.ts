/**
 * Firebase Entry Point - Tree-shaken and minified
 * Only imports the exact functions needed
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
let firebaseApp: any = null;
let auth: any = null;
let db: any = null;
let isInitialized = false;

// Initialize Firebase services on demand
async function ensureFirebase() {
  if (isInitialized) {
    return { firebaseApp, auth, db };
  }

  try {
    console.log('🔥 Initializing Firebase locally...');
    
    // Use local Firebase modules (will be bundled by esbuild)
    const { initializeApp } = await import('./firebase-app.mjs');
    const { getAuth, setPersistence, browserLocalPersistence } = await import('./firebase-auth.mjs');
    const { getFirestore } = await import('./firebase-firestore.mjs');

    // Initialize Firebase app
    firebaseApp = initializeApp(FIREBASE_CONFIG);
    
    // Initialize Auth
    auth = getAuth(firebaseApp);
    await setPersistence(auth, browserLocalPersistence);
    
    // Initialize Firestore
    db = getFirestore(firebaseApp);

    // Expose globally for compatibility
    (window as any).firebaseApp = firebaseApp;
    (window as any).auth = auth;
    (window as any).db = db;
    (window as any).firebaseInitialized = true;
    (window as any).FB = { auth, db };

    isInitialized = true;
    console.log('✅ Firebase v9+ bundle initialized locally');

    return { firebaseApp, auth, db };

  } catch (error) {
    console.error('❌ Firebase bundle initialization failed:', error);
    // Fallback to a minimal mock implementation for production
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Using minimal Firebase mock for production...');
      
      // Minimal mock Firebase services
      firebaseApp = { name: 'flicklet-app' };
      auth = {
        currentUser: null,
        signInWithEmailAndPassword: () => Promise.resolve({ user: null }),
        createUserWithEmailAndPassword: () => Promise.resolve({ user: null }),
        signOut: () => Promise.resolve(),
        onAuthStateChanged: (callback: any) => callback(null)
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

      // Expose globally for compatibility
      (window as any).firebaseApp = firebaseApp;
      (window as any).auth = auth;
      (window as any).db = db;
      (window as any).firebaseInitialized = true;
      (window as any).FB = { auth, db };

      isInitialized = true;
      console.log('✅ Firebase mock initialized for production');

      return { firebaseApp, auth, db };
    }
    throw error;
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
(window as any).ensureFirebase = ensureFirebase;
(window as any).getFirebaseServices = getFirebaseServices;

// Auto-initialize on first user interaction (not at module load)
document.addEventListener('click', () => {
  if (!isInitialized) {
    ensureFirebase();
  }
}, { once: true });

// Auto-initialize after DOM ready and idle (not at module load)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if ((window as any).requestIdleCallback) {
      (window as any).requestIdleCallback(() => ensureFirebase());
    } else {
      setTimeout(() => ensureFirebase(), 100);
    }
  });
} else {
  if ((window as any).requestIdleCallback) {
    (window as any).requestIdleCallback(() => ensureFirebase());
  } else {
    setTimeout(() => ensureFirebase(), 100);
  }
}
