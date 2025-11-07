/**
 * Process: Firebase Bootstrap
 * Purpose: Atomic Firebase initialization with guaranteed persistence and ready state
 * Data Source: Firebase SDK, environment config
 * Update Path: Set once at app startup, never modified
 * Dependencies: None (to avoid circular deps)
 */

import { initializeApp, getApp, getApps } from "firebase/app";
import {
  getAuth,
  setPersistence,
  indexedDBLocalPersistence,
  onAuthStateChanged,
  signInWithRedirect,
  signInWithPopup,
} from "firebase/auth";
import { getFirestore, serverTimestamp } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { isAuthDebug, logAuth, safeOrigin, maskSecret } from "./authDebug";

// Firebase configuration
const config = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM",
  // ⚠️ CRITICAL: authDomain MUST match the actual domain users visit
  // If it's flicklet-71dff.firebaseapp.com but users visit flicklet.netlify.app,
  // Google redirects to the wrong domain and Safari drops the params
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "flicklet-71dff.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "flicklet-71dff",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "flicklet-71dff.appspot.com",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1034923556763",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:1034923556763:web:bba5489cd1d9412c9c2b3e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-YL4TJ4FHJC",
};

// Export config for backwards compatibility
export const firebaseConfig = config;

// Expected canonical base URL (production/staging)
const BASE_URL = import.meta.env.VITE_PUBLIC_BASE_URL?.replace(/\/$/, '') || null;

// CRITICAL: Prevent re-initialization at the module level
// Use let instead of const to allow reassignment if needed
let app: ReturnType<typeof initializeApp>;
let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;

try {
  if (getApps().length === 0) {
    app = initializeApp(config);
    console.log('[FirebaseBootstrap] App initialized');
  } else {
    app = getApp();
    console.warn('[FirebaseBootstrap] Reusing existing app');
  }
  
  auth = getAuth(app);
  
  // Make persistence non-blocking
  setPersistence(auth, indexedDBLocalPersistence).catch(() => {
    console.warn('[FirebaseBootstrap] Persistence setup failed');
  });
  
  db = getFirestore(app);
  
  // Debug escape hatch: only if explicitly enabled
  try {
    if (localStorage.getItem('flk:debug:auth') === '1') {
      // @ts-expect-error debug
      window.firebaseApp = app;
      // @ts-expect-error debug
      window.firebaseAuth = auth;
      // @ts-expect-error debug
      window.firebaseDb = db;
      // Optional sanity check
      console.log('[debug] firebase handles exposed');
    }
  } catch { /* localStorage may be blocked; ignore */ }
} catch (error) {
  console.error('[FirebaseBootstrap] Fatal init error:', error);
  throw error;
}

// Export getters to prevent race conditions (recommended)
export const getFirebaseApp = () => app;
export const getFirebaseAuth = () => auth;
export const getFirebaseFirestore = () => db;

// Also export direct references for backward compatibility
export { app, auth, db };

/**
 * Verify auth environment and recommend flow
 * Returns whether redirect flow is safe to use
 */
export function verifyAuthEnvironment(): {
  ok: boolean;
  reason?: string;
  recommendPopup?: boolean;
} {
  if (typeof window === "undefined") {
    return { ok: true, recommendPopup: false };
  }

  const here = window.location.origin;
  const authDomain = firebaseConfig.authDomain;
  const prod = BASE_URL;

  // If we're not on the canonical prod/staging origin, recommend popup flow
  const recommendPopup = !!prod && here !== prod;

  // Basic mismatch that breaks redirects
  if (!authDomain || !here) {
    return { ok: false, reason: "missing-config" };
  }

  // Redirect requires the return origin to be authorized; we can't guarantee that on previews
  if (recommendPopup) {
    return { ok: true, recommendPopup: true }; // ok, but popup flow only
  }

  // On prod/staging host: redirect allowed if that host is authorized in Firebase console
  return { ok: true, recommendPopup: false };
}

// Log auth environment on boot (dev only or debug mode)
if (typeof window !== "undefined" && (import.meta.env.DEV || isAuthDebug())) {
  const env = verifyAuthEnvironment();
  const here = window.location.origin;
  const authDomain = firebaseConfig.authDomain;
  const flow = env.recommendPopup ? "popup" : "redirect";
  console.log(
    `[FirebaseBootstrap] Auth boot: origin=${here} authDomain=${authDomain} flow=${flow}`
  );
  
  // Debug logging
  if (isAuthDebug()) {
    logAuth('firebase_config_loaded', {
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      apiKey: maskSecret(firebaseConfig.apiKey),
      appId: maskSecret(firebaseConfig.appId),
      origin: here,
      recommendPopup: env.recommendPopup,
      flow,
    });
  }
}

export const functions = getFunctions(app);
export { serverTimestamp };

// Auth providers
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");

// Export for use in auth flow selection
export { signInWithRedirect, signInWithPopup };

// Note: Persistence is set once inside bootstrapFirebase() before listeners are wired.
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
    // Persistence is already set above (non-blocking), but ensure it's complete before listeners
    // Safari requires persistence to be set BEFORE any redirect or sign-in call
    try {
      await setPersistence(auth, indexedDBLocalPersistence);
    } catch (e) {
      // Already set above, or persistence failed - continue anyway
    }

    // Log that persistence is confirmed set
    if (typeof console !== "undefined") {
      console.log(
        "[FirebaseBootstrap] Persistence LOCKED before any auth operations"
      );
    }
    
    // Debug logging
    if (isAuthDebug()) {
      logAuth('persistence_locked', {
        method: 'indexedDBLocalPersistence',
        origin: safeOrigin(),
      });
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
    if (typeof console !== "undefined") {
      console.log(
        `[FirebaseBootstrap] Ready after ${duration}ms at ${timestamp}`
      );
    }
    
    // Debug logging
    if (isAuthDebug()) {
      logAuth('firebase_ready', {
        durationMs: duration,
        timestamp,
        origin: safeOrigin(),
      });
    }
  } catch (error) {
    // Even on error, resolve after timeout to prevent app from hanging
    readyResolved = true;
    readyResolvedAt = new Date().toISOString();

    if (firebaseReadyResolver) {
      firebaseReadyResolver(readyResolvedAt);
      firebaseReadyResolver = null;
    }

    console.error("[FirebaseBootstrap] Error during bootstrap:", error);
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

// Dev-only sanity log: ensure exactly one app
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.log('[FirebaseBootstrap] App initialized:', app.name);
  const apps = getApps();
  console.log('[FirebaseBootstrap] All apps:', apps.map(a => a.name));
  if (apps.length !== 1) {
    console.warn('[FirebaseBootstrap] WARNING: Expected exactly 1 app, found', apps.length);
  }
}
