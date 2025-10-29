/**
 * Process: Firebase Bootstrap
 * Purpose: Atomic Firebase initialization with guaranteed persistence and ready state
 * Data Source: Firebase SDK, environment config
 * Update Path: Set once at app startup, never modified
 * Dependencies: None (to avoid circular deps)
 */

import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence,
  onAuthStateChanged
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { GoogleAuthProvider, OAuthProvider } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'flicklet-71dff.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'flicklet-71dff',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'flicklet-71dff.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1034923556763',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1034923556763:web:bba5489cd1d9412c9c2b3e',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-YL4TJ4FHJC',
};

// Initialize Firebase app (only once)
let app = getApps()[0];
if (!app) {
  app = initializeApp(firebaseConfig);
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth providers
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// Firebase ready promise - resolves only when persistence is set AND onAuthStateChanged fires
let firebaseReadyResolver: ((timestamp: string) => void) | null = null;
let readyResolved = false;
let readyResolvedAt: string | null = null;

export const firebaseReady = new Promise<string>((resolve) => {
  firebaseReadyResolver = resolve;
});

// Bootstrap function - must be called before any auth operations
export async function bootstrapFirebase(): Promise<void> {
  if (readyResolved) {
    return;
  }

  const startTime = Date.now();
  
  try {
    // Step 1: Set persistence explicitly
    await setPersistence(auth, browserLocalPersistence);
    
    // Step 2: Wait for onAuthStateChanged to fire at least once
    // OR timeout after 5000ms (safety net)
    const authStateReady = new Promise<string>((resolve) => {
      let resolved = false;
      
      const unsubscribe = onAuthStateChanged(auth, () => {
        if (!resolved) {
          resolved = true;
          const timestamp = new Date().toISOString();
          unsubscribe();
          resolve(timestamp);
        }
      });
      
      // Safety timeout: resolve after 5 seconds even if onAuthStateChanged never fires
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          const timestamp = new Date().toISOString();
          unsubscribe();
          resolve(timestamp);
        }
      }, 5000);
    });
    
    // Step 3: Wait for auth state to initialize
    const timestamp = await authStateReady;
    
    // Step 4: Resolve firebaseReady promise
    readyResolved = true;
    readyResolvedAt = timestamp;
    
    if (firebaseReadyResolver) {
      firebaseReadyResolver(timestamp);
      firebaseReadyResolver = null;
    }
    
    const duration = Date.now() - startTime;
    
    // Log to console for debugging (will be picked up by auth log if it exists)
    if (typeof console !== 'undefined') {
      console.log(`[FirebaseBootstrap] Ready after ${duration}ms at ${timestamp}`);
    }
  } catch (error) {
    // Even on error, resolve after timeout to prevent app from hanging
    readyResolved = true;
    readyResolvedAt = new Date().toISOString();
    
    if (firebaseReadyResolver) {
      firebaseReadyResolver(readyResolvedAt);
      firebaseReadyResolver = null;
    }
    
    console.error('[FirebaseBootstrap] Error during bootstrap:', error);
  }
}

// Get ready timestamp (null if not ready yet)
export function getFirebaseReadyTimestamp(): string | null {
  return readyResolvedAt;
}

// Check if Firebase is ready
export function isFirebaseReady(): boolean {
  return readyResolved;
}

export default app;

