/**
 * Persistence on iOS: Force IndexedDB/local before any auth call
 * Falls back to localStorage if IndexedDB fails
 * NEVER use sessionStorage for auth state
 */

import { authLogManager } from './authLog';

async function ensureIndexedDB(): Promise<boolean> {
  if (typeof indexedDB === 'undefined') {
    return false;
  }
  
  try {
    // Try to open a test database
    const dbName = 'flicklet-persistence-check';
    const request = indexedDB.open(dbName, 1);
    
    return new Promise((resolve) => {
      request.onsuccess = () => {
        indexedDB.deleteDatabase(dbName);
        resolve(true);
      };
      request.onerror = () => {
        resolve(false);
      };
      // Timeout after 1 second
      setTimeout(() => resolve(false), 1000);
    });
  } catch (e) {
    return false;
  }
}

export async function ensurePersistenceBeforeAuth(): Promise<string> {
  // Try IndexedDB first (preferred on iOS)
  const indexedDBAvailable = await ensureIndexedDB();
  
  if (indexedDBAvailable) {
    console.debug('[Persistence] IndexedDB available - using for auth state');
    // One-liner: persistence_selected
    authLogManager.log('persistence_selected', { method: 'IndexedDB' });
    // IndexedDB is available - Firebase will use it automatically
    return 'IndexedDB';
  }
  
  // Fallback to localStorage (less reliable on iOS but better than sessionStorage)
  try {
    // Test localStorage
    const testKey = 'flicklet.persistence.test';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    console.debug('[Persistence] IndexedDB unavailable - using localStorage fallback');
    // One-liner: persistence_selected
    authLogManager.log('persistence_selected', { method: 'localStorage' });
    return 'localStorage';
  } catch (e) {
    // Don't throw - log warning but continue
    // Some browsers may have restricted storage but auth might still work
    console.warn('[Persistence] Storage test failed, but continuing with auth:', e);
    // One-liner: persistence_selected
    authLogManager.log('persistence_selected', { method: 'unknown' });
    // Firebase will handle storage errors gracefully
    return 'unknown';
  }
  
  // ⚠️ CRITICAL: NEVER use sessionStorage for auth state persistence
  // sessionStorage is unreliable on iOS Safari, especially across redirects
}

