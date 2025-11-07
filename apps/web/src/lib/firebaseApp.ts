/**
 * Process: Firebase App Singleton (DEPRECATED)
 * Purpose: Re-export from firebaseBootstrap to maintain backward compatibility
 * Data Source: firebaseBootstrap singleton
 * Update Path: Use firebaseBootstrap directly instead
 * Dependencies: firebaseBootstrap
 * 
 * @deprecated Use `import { app } from './firebaseBootstrap'` directly
 */

// Re-export from singleton to prevent duplicate initialization
import { app } from './firebaseBootstrap';

export function getFirebaseApp() {
  return app;
}

