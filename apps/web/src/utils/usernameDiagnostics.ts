/**
 * Username Prompt Diagnostics
 * Purpose: Investigate username prompt issues in production vs localhost
 * Usage: Call window.debugUsername() in browser console
 */

import { auth, db } from '../lib/firebaseBootstrap';
import { doc, getDoc } from 'firebase/firestore';

interface DiagnosticResult {
  timestamp: string;
  environment: 'localhost' | 'production' | 'unknown';
  authState: {
    hasUser: boolean;
    uid: string | null;
    email: string | null;
    displayName: string | null;
  };
  firestoreState: {
    exists: boolean;
    username: string | null;
    usernamePrompted: boolean | null;
    lastUpdated: string | null;
    rawData: any;
  };
  timing: {
    authCheckTime: number;
    firestoreReadTime: number;
    totalTime: number;
  };
  shouldShowPrompt: {
    hasUser: boolean;
    hasUsername: boolean;
    usernamePrompted: boolean;
    result: boolean;
  };
  issues: string[];
}

/**
 * Comprehensive diagnostic for username prompt system
 */
export async function diagnoseUsernamePrompt(): Promise<DiagnosticResult> {
  const startTime = performance.now();
  const issues: string[] = [];
  
  // Detect environment
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname.startsWith('192.168.');
  const environment = isLocalhost ? 'localhost' : 
                      window.location.hostname.includes('netlify') ? 'production' : 'unknown';
  
  // Check auth state using shared auth instance
  const authCheckStart = performance.now();
  const currentUser = auth.currentUser;
  const authCheckTime = performance.now() - authCheckStart;
  
  const authState = {
    hasUser: !!currentUser?.uid,
    uid: currentUser?.uid || null,
    email: currentUser?.email || null,
    displayName: currentUser?.displayName || null,
  };
  
  if (!authState.hasUser) {
    issues.push('No authenticated user found');
  }
  
  // Check Firestore state
  const firestoreStart = performance.now();
  let firestoreState = {
    exists: false,
    username: null as string | null,
    usernamePrompted: null as boolean | null,
    lastUpdated: null as string | null,
    rawData: null as any,
  };
  let firestoreReadTime = 0;
  
  if (authState.uid) {
    try {
      const userRef = doc(db, 'users', authState.uid);
      const userSnap = await getDoc(userRef);
      firestoreReadTime = performance.now() - firestoreStart;
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        firestoreState = {
          exists: true,
          username: data.settings?.username || null,
          usernamePrompted: data.settings?.usernamePrompted ?? null,
          lastUpdated: data.settings ? 'present' : 'missing',
          rawData: {
            hasSettings: !!data.settings,
            settingsKeys: data.settings ? Object.keys(data.settings) : [],
            fullData: data,
          },
        };
        
        // Check for issues
        if (firestoreState.usernamePrompted === null) {
          issues.push('usernamePrompted field is missing or null in Firestore');
        }
        if (!firestoreState.username && firestoreState.usernamePrompted === false) {
          issues.push('User has no username and prompt not yet shown (should show prompt)');
        }
        if (!firestoreState.username && firestoreState.usernamePrompted === true) {
          issues.push('User skipped username prompt but has no username');
        }
      } else {
        issues.push('User document does not exist in Firestore');
      }
    } catch (error: any) {
      issues.push(`Firestore read failed: ${error.message}`);
    }
  }
  
  const totalTime = performance.now() - startTime;
  
  // Determine if prompt should show
  const shouldShowPrompt = {
    hasUser: authState.hasUser,
    hasUsername: !!firestoreState.username,
    usernamePrompted: firestoreState.usernamePrompted === true,
    result: authState.hasUser && !firestoreState.username && firestoreState.usernamePrompted !== true,
  };
  
  if (shouldShowPrompt.result && issues.length === 0) {
    issues.push('Prompt should show but may not be displaying (check FlickletHeader logic)');
  }
  
  return {
    timestamp: new Date().toISOString(),
    environment,
    authState,
    firestoreState,
    timing: {
      authCheckTime,
      firestoreReadTime,
      totalTime,
    },
    shouldShowPrompt,
    issues,
  };
}

/**
 * Monitor username state changes over time
 */
export function monitorUsernameState(durationMs: number = 10000): void {
  console.log(`🔍 Monitoring username state for ${durationMs}ms...`);
  
  const startTime = Date.now();
  const checks: Array<{ time: number; state: any }> = [];
  
  const checkInterval = setInterval(async () => {
    const currentUser = auth.currentUser;
    const state = {
      hasUser: !!currentUser?.uid,
      uid: currentUser?.uid,
    };
    
    if (state.hasUser && state.uid) {
      try {
        const userRef = doc(db, 'users', state.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          checks.push({
            time: Date.now() - startTime,
            state: {
              username: data.settings?.username || null,
              usernamePrompted: data.settings?.usernamePrompted ?? null,
            },
          });
        }
      } catch (_e) {
        // ignore
      }
    }
    
    if (Date.now() - startTime >= durationMs) {
      clearInterval(checkInterval);
      console.log('📊 Username state monitoring complete:', checks);
    }
  }, 500);
}

/**
 * Test Firestore write timing
 */
export async function testFirestoreWriteTiming(): Promise<{
  writeTime: number;
  readTime: number;
  verifyTime: number;
  success: boolean;
}> {
  const currentUser = auth.currentUser;
  if (!currentUser?.uid) {
    throw new Error('No authenticated user');
  }
  
  const testValue = `test-${Date.now()}`;
  const userRef = doc(db, 'users', currentUser.uid);
  
  // Measure write time
  const writeStart = performance.now();
  const { updateDoc } = await import('firebase/firestore');
  await updateDoc(userRef, {
    'settings.username': testValue,
  });
  const writeTime = performance.now() - writeStart;
  
  // Measure read time
  const readStart = performance.now();
  const userSnap = await getDoc(userRef);
  const readTime = performance.now() - readStart;
  
  // Verify
  const verifyStart = performance.now();
  const data = userSnap.data();
  const verifyTime = performance.now() - verifyStart;
  const success = data?.settings?.username === testValue;
  
  // Clean up test value
  await updateDoc(userRef, {
    'settings.username': currentUser.displayName || '',
  });
  
  return {
    writeTime,
    readTime,
    verifyTime,
    success,
  };
}

// Expose to window for console access immediately
// Debug functions removed - no longer exposed to window

