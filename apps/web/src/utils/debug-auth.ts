/**
 * Debug utility to inspect Firebase auth state and session storage
 */
export function debugFirebaseAuth() {
  console.group('🔍 Firebase Auth Debug');
  
  // Check session storage (where Firebase stores redirect state)
  console.log('📦 Session Storage:');
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes('firebase') || key.includes('auth'))) {
      console.log(`  ${key}:`, sessionStorage.getItem(key));
    }
  }
  
  // Check localStorage
  console.log('📦 Local Storage (Firebase keys):');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('firebase') || key.includes('auth'))) {
      try {
        const value = localStorage.getItem(key);
        // Try to parse if it's JSON
        try {
          const parsed = JSON.parse(value || '{}');
          console.log(`  ${key}:`, parsed);
        } catch {
          console.log(`  ${key}:`, value);
        }
      } catch (e) {
        console.log(`  ${key}: <could not read>`);
      }
    }
  }
  
  console.groupEnd();
  
  // Return the data
  const sessionKeys = [];
  const localKeys = [];
  
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes('firebase') || key.includes('auth'))) {
      sessionKeys.push({ key, value: sessionStorage.getItem(key) });
    }
  }
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('firebase') || key.includes('auth'))) {
      localKeys.push({ key, value: localStorage.getItem(key) });
    }
  }
  
  return { sessionStorage: sessionKeys, localStorage: localKeys };
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).debugFirebaseAuth = debugFirebaseAuth;
}

