/**
 * Process: Firebase App Singleton
 * Purpose: Prevent double initialization during React StrictMode
 * Data Source: Firebase SDK, environment config
 * Update Path: Set once at app startup, never modified
 * Dependencies: firebaseBootstrap (for config)
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from './firebaseBootstrap';

let app: ReturnType<typeof initializeApp> | null = null;

export function getFirebaseApp() {
  if (app) return app;
  
  if (getApps().length) {
    app = getApp();
    return app;
  }
  
  app = initializeApp(firebaseConfig);
  return app;
}

