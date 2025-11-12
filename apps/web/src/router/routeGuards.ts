/**
 * Process: Route Guards
 * Purpose: Ensure auth is initialized before allowing protected routes
 * Data Source: authGuard (init status)
 * Update Path: Called before route access
 * Dependencies: authGuard, authFlow
 */

import { isInitDone } from '../lib/authGuard';
import { initAuthOnLoad } from '../lib/authFlow';

let started = false;

export async function ensureAuthBeforeRoute(): Promise<{ allow: boolean; reason?: string }> {
  if (!started) {
    started = true;
    initAuthOnLoad();
  }
  
  // If init isn't done yet, DO NOT trigger sign-in here; render a loading gate.
  if (!isInitDone()) {
    return { allow: false, reason: 'auth-initializing' };
  }
  
  // After init, if no user, THEN show a login button (popup fallback) instead of auto-redirect.
  return { allow: true };
}








