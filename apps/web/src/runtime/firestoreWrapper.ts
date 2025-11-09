/**
 * Process: Firestore Listener Wrapper
 * Purpose: Wrap onSnapshot calls to respect kill switch
 * Data Source: runtime/switches.ts
 * Update Path: Used by all Firestore onSnapshot calls
 * Dependencies: runtime/switches.ts
 */

import { isOff } from './switches';
import type { Unsubscribe } from 'firebase/firestore';

/**
 * Wrap onSnapshot to respect kill switch
 * If ifire:off is set, returns a no-op unsubscribe function and never calls the callback
 */
export function wrapOnSnapshot(
  originalOnSnapshot: (...args: any[]) => Unsubscribe,
  ...args: any[]
): Unsubscribe {
  if (isOff('ifire')) {
    console.info('[Firestore] Disabled via kill switch (ifire:off)');
    // Return no-op unsubscribe function
    return () => {};
  }
  
  // Call original onSnapshot
  return originalOnSnapshot(...args);
}

