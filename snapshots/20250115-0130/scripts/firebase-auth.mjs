/**
 * Process: Firebase Auth Module
 * Purpose: Local Firebase auth module
 * Data Source: Firebase v9+ modular SDK
 * Update Path: Local module import
 * Dependencies: None
 */

// Mock Firebase auth module for local development
// In production, this would be the actual Firebase auth module
export function getAuth(app) {
  console.log('🔥 Firebase Auth: Getting auth for app', app);
  return {
    app: app,
    currentUser: null,
    _deleted: false
  };
}

export function setPersistence(auth, persistence) {
  console.log('🔥 Firebase Auth: Setting persistence', persistence);
  return Promise.resolve();
}

export const browserLocalPersistence = 'local';
export const browserSessionPersistence = 'session';
export const inMemoryPersistence = 'none';

export function signInWithEmailAndPassword(auth, email, password) {
  console.log('🔥 Firebase Auth: Sign in with email', email);
  return Promise.resolve({
    user: {
      uid: 'mock-user-id',
      email: email,
      displayName: 'Mock User'
    }
  });
}

export function createUserWithEmailAndPassword(auth, email, password) {
  console.log('🔥 Firebase Auth: Create user with email', email);
  return Promise.resolve({
    user: {
      uid: 'mock-user-id',
      email: email,
      displayName: 'Mock User'
    }
  });
}

export function signOut(auth) {
  console.log('🔥 Firebase Auth: Sign out');
  return Promise.resolve();
}

export function onAuthStateChanged(auth, callback) {
  console.log('🔥 Firebase Auth: Setting up auth state listener');
  // Simulate no user initially
  callback(null);
  return () => {}; // unsubscribe function
}
