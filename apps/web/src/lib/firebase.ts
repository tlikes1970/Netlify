/**
 * DEPRECATED: This module is replaced by firebaseBootstrap.ts
 * All Firebase initialization now happens in firebaseBootstrap.ts
 * This file exists only for backwards compatibility - re-exports from bootstrap
 */

// Re-export everything from firebaseBootstrap to maintain compatibility
export { 
  auth, 
  db, 
  googleProvider, 
  appleProvider, 
  firebaseReady, 
  getFirebaseReadyTimestamp,
  isFirebaseReady,
  bootstrapFirebase 
} from './firebaseBootstrap';

export default null;
