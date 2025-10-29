import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, setPersistence, browserLocalPersistence, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration from environment variables with fallback to hardcoded values
// This allows the app to work both locally with .env and in production without requiring Netlify env vars
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'flicklet-71dff.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'flicklet-71dff',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'flicklet-71dff.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1034923556763',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1034923556763:web:bba5489cd1d9412c9c2b3e',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-YL4TJ4FHJC',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// ⚠️ CRITICAL: Set persistence explicitly BEFORE any auth operations
// This ensures auth state survives redirects (especially on iOS)
let persistenceSet = false;
let persistencePromise: Promise<void> | null = null;

export async function ensureAuthPersistence(): Promise<void> {
  if (persistenceSet) return;
  
  if (!persistencePromise) {
    persistencePromise = setPersistence(auth, browserLocalPersistence).then(() => {
      persistenceSet = true;
    });
  }
  
  return persistencePromise;
}

// Firebase ready promise - resolves when auth state is initialized
let firebaseReadyResolver: (() => void) | null = null;
export const firebaseReady = new Promise<void>((resolve) => {
  firebaseReadyResolver = resolve;
});

// Helper to resolve the ready promise
function resolveFirebaseReady() {
  if (firebaseReadyResolver) {
    const resolver = firebaseReadyResolver;
    firebaseReadyResolver = null;
    resolver();
  }
}

// Wait for auth state to initialize, then resolve ready promise
let authInitDetected = false;
const unsubscribe = onAuthStateChanged(auth, () => {
  if (!authInitDetected) {
    authInitDetected = true;
    resolveFirebaseReady();
    unsubscribe(); // Clean up listener after first fire
  }
});

// If auth is already initialized (e.g., user already signed in), resolve immediately
if (auth.currentUser !== null) {
  authInitDetected = true;
  unsubscribe(); // Clean up unused listener
  resolveFirebaseReady();
} else {
  // Set a timeout to resolve anyway after 500ms (safety net)
  setTimeout(() => {
    if (!authInitDetected) {
      authInitDetected = true;
      unsubscribe(); // Clean up unused listener
      resolveFirebaseReady();
    }
  }, 500);
}

// Auth providers
export const googleProvider = new GoogleAuthProvider();

// For localhost development, we need to enable popup mode instead of redirect
// This avoids Firebase's managed redirect handler which isn't working properly
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🔧 Localhost detected - using direct popup flow');
}

export const appleProvider = new OAuthProvider('apple.com');

// Configure Apple provider
appleProvider.addScope('email');
appleProvider.addScope('name');

export default app;
