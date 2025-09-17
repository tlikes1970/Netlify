// Minimal Firebase Auth module - tree-shaken
export function getAuth(app) {
  return {
    app: app,
    currentUser: null,
    _deleted: false
  };
}

export function setPersistence(auth, persistence) {
  return Promise.resolve();
}

export const browserLocalPersistence = 'local';
export const browserSessionPersistence = 'session';
export const inMemoryPersistence = 'none';

export function signInWithEmailAndPassword(auth, email, password) {
  return Promise.resolve({
    user: {
      uid: 'mock-user-id',
      email: email,
      displayName: 'Mock User'
    }
  });
}

export function createUserWithEmailAndPassword(auth, email, password) {
  return Promise.resolve({
    user: {
      uid: 'mock-user-id',
      email: email,
      displayName: 'Mock User'
    }
  });
}

export function signOut(auth) {
  return Promise.resolve();
}

export function onAuthStateChanged(auth, callback) {
  callback(null);
  return () => {}; // unsubscribe function
}
