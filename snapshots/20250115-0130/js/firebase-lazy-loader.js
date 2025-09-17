/**
 * Process: Firebase Lazy Loader
 * Purpose: Load Firebase only when authentication or database is actually needed
 * Data Source: User interactions and app state
 * Update Path: Triggered by auth/db usage
 * Dependencies: firebase-modular.js
 */

let firebaseLoadPromise = null;
let firebaseLoaded = false;

// Load Firebase on first user interaction or when auth/db is needed
function loadFirebaseOnDemand() {
  if (firebaseLoadPromise) {
    return firebaseLoadPromise;
  }

  firebaseLoadPromise = new Promise(async (resolve) => {
    try {
      // Load Firebase modular SDK
      await import('./firebase-modular.js');
      firebaseLoaded = true;
      console.log('✅ Firebase loaded on demand');
      resolve();
    } catch (error) {
      console.error('❌ Failed to load Firebase on demand:', error);
      resolve();
    }
  });

  return firebaseLoadPromise;
}

// Trigger Firebase loading on user interactions
function setupFirebaseTriggers() {
  // Load on first user interaction
  const events = ['click', 'touchstart', 'keydown', 'scroll'];
  
  events.forEach(event => {
    document.addEventListener(event, () => {
      if (!firebaseLoaded) {
        loadFirebaseOnDemand();
      }
    }, { once: true, passive: true });
  });

  // Load after DOM is ready and idle
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!firebaseLoaded) {
        // Use requestIdleCallback if available, otherwise setTimeout
        if (window.requestIdleCallback) {
          requestIdleCallback(() => loadFirebaseOnDemand());
        } else {
          setTimeout(() => loadFirebaseOnDemand(), 100);
        }
      }
    });
  } else {
    // DOM already ready
    if (window.requestIdleCallback) {
      requestIdleCallback(() => loadFirebaseOnDemand());
    } else {
      setTimeout(() => loadFirebaseOnDemand(), 100);
    }
  }
}

// Initialize triggers
setupFirebaseTriggers();

// Export for manual triggering
window.loadFirebaseOnDemand = loadFirebaseOnDemand;
