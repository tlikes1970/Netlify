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
import { getFirestore, serverTimestamp } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { GoogleAuthProvider, OAuthProvider } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM',
  // ⚠️ CRITICAL: authDomain MUST match the actual domain users visit
  // If it's flicklet-71dff.firebaseapp.com but users visit flicklet.netlify.app,
  // Google redirects to the wrong domain and Safari drops the params
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'flicklet-71dff.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'flicklet-71dff',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'flicklet-71dff.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1034923556763',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1034923556763:web:bba5489cd1d9412c9c2b3e',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-YL4TJ4FHJC',
};

// ⚠️ FIX #1: Single Auth instance guard
// ⚠️ SINGLE SOURCE OF TRUTH: Only place Firebase is initialized
// Initialize Firebase app (only once)
let app = getApps()[0];
let authInstance: ReturnType<typeof getAuth> | null = null;

if (!app) {
  app = initializeApp(firebaseConfig);
} else {
  // App already initialized - check if it's from this module or duplicate
  // If getApps() returns more than 1 app, that's a duplicate
  const allApps = getApps();
  if (allApps.length > 1) {
    // Runtime guard: detect duplicate initialization
    const error = new Error('DUPLICATE_AUTH_INSTANCE: Multiple Firebase apps detected. Only firebaseBootstrap.ts should call initializeApp.');
    console.error('[FirebaseBootstrap] CRITICAL ERROR:', error);
    console.error('[FirebaseBootstrap] Existing apps:', allApps.map(a => a.name));
    // Hard crash for visibility
    throw error;
  }
  // Single app already exists - that's fine, it's from a previous module load
  console.log('[FirebaseBootstrap] Reusing existing Firebase app');
}

// Initialize Firebase services
authInstance = getAuth(app);

// ⚠️ FIX #5: Verify origin/client combo at runtime
if (typeof window !== 'undefined') {
  const currentOrigin = window.location.origin.replace('http://', 'https://').replace(/:\d+$/, ''); // Normalize
  const expectedDomain = firebaseConfig.authDomain;
  
  // Check if origin matches authDomain (allowing for www prefix and port differences)
  const originMatches = 
    currentOrigin === `https://${expectedDomain}` ||
    currentOrigin === `https://www.${expectedDomain}` ||
    currentOrigin.endsWith(`.${expectedDomain}`) ||
    currentOrigin.includes(expectedDomain);
  
  if (!originMatches) {
    const warning = `[FirebaseBootstrap] ORIGIN MISMATCH: location.origin (${currentOrigin}) does not match authDomain (${expectedDomain}). This may cause OAuth redirect failures.`;
    console.warn(warning);
    // Log but don't crash - might be localhost or preview build
  } else {
    console.log(`[FirebaseBootstrap] Origin verified: ${currentOrigin} matches authDomain ${expectedDomain}`);
  }
}

export const auth = authInstance!;
export const db = getFirestore(app);
export const functions = getFunctions(app);
export { serverTimestamp };

// Note: Persistence is set once inside bootstrapFirebase() before listeners are wired.

// Auth providers
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// Note: no global latches; redirect handling is gated by an explicit session flag

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
    // ⚠️ FIX #2: Lock persistence BEFORE any sign-in or listener is wired
    // Safari requires persistence to be set BEFORE any redirect or sign-in call
    // This is a critical timing requirement - Firebase SDK warns about this
    // We AWAIT here to ensure it completes before wiring up listeners
    await setPersistence(auth, browserLocalPersistence);
    
    // Log that persistence is confirmed set
    if (typeof console !== 'undefined') {
      console.log('[FirebaseBootstrap] Persistence LOCKED before any auth operations');
    }
    
    // ⚠️ CRITICAL: Now that persistence is locked, wire up listeners
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
      }, 5000); // 5s hard timeout
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

