import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
// Note: Firebase v9 automatically uses LOCAL persistence by default
export const auth = getAuth(app);
export const db = getFirestore(app);

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
