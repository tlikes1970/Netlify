/**
 * Process: Auth Redirect Guard
 * Purpose: Session-based guard to prevent redirect loops
 * Data Source: sessionStorage
 * Update Path: Set when redirect starts, cleared when redirect completes or fails
 * Dependencies: None (pure utility)
 */

const REDIRECT_GUARD_KEY = 'auth:redirecting';

export function markRedirectStarted(): void {
  try {
    sessionStorage.setItem(REDIRECT_GUARD_KEY, '1');
  } catch {
    // Ignore storage errors
  }
}

export function clearRedirectGuard(): void {
  try {
    sessionStorage.removeItem(REDIRECT_GUARD_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function hasRedirectStarted(): boolean {
  try {
    return sessionStorage.getItem(REDIRECT_GUARD_KEY) === '1';
  } catch {
    return false;
  }
}

