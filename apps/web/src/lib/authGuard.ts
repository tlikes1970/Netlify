/**
 * Process: Auth Redirect Guard
 * Purpose: Session-based guard to prevent redirect loops with attempt budget
 * Data Source: sessionStorage
 * Update Path: Set when redirect starts, cleared when redirect completes or fails
 * Dependencies: None (pure utility)
 */

const K_REDIRECTING = 'auth:redirecting';
const K_INIT_DONE = 'auth:init:done';
const K_ATTEMPTS = 'auth:redirect:count';
const K_ATTEMPTS_TS = 'auth:redirect:ts';

export function markRedirectStarted(): void {
  try {
    sessionStorage.setItem(K_REDIRECTING, '1');
  } catch {
    // Ignore storage errors
  }
}

export function clearRedirectFlag(): void {
  try {
    sessionStorage.removeItem(K_REDIRECTING);
  } catch {
    // Ignore storage errors
  }
}

export function hasRedirectStarted(): boolean {
  try {
    return sessionStorage.getItem(K_REDIRECTING) === '1';
  } catch {
    return false;
  }
}

export function markInitDone(): void {
  try {
    sessionStorage.setItem(K_INIT_DONE, '1');
  } catch {
    // Ignore storage errors
  }
}

export function isInitDone(): boolean {
  try {
    return sessionStorage.getItem(K_INIT_DONE) === '1';
  } catch {
    return false;
  }
}

export function canAttemptRedirect(): boolean {
  try {
    const now = Date.now();
    const ts = Number(sessionStorage.getItem(K_ATTEMPTS_TS) || '0');
    
    // Reset every 10 minutes
    if (!ts || now - ts > 10 * 60 * 1000) {
      sessionStorage.setItem(K_ATTEMPTS_TS, String(now));
      sessionStorage.setItem(K_ATTEMPTS, '0');
    }
    
    const count = Number(sessionStorage.getItem(K_ATTEMPTS) || '0');
    return count < 1; // exactly ONE redirect attempt per session window
  } catch {
    return true;
  }
}

export function bumpAttempt(): void {
  try {
    const n = Number(sessionStorage.getItem(K_ATTEMPTS) || '0') + 1;
    sessionStorage.setItem(K_ATTEMPTS, String(n));
  } catch {
    // Ignore storage errors
  }
}

export function getRedirectAttemptCount(): number {
  try {
    return Number(sessionStorage.getItem(K_ATTEMPTS) || '0');
  } catch {
    return 0;
  }
}

// Backward compatibility
export const clearRedirectGuard = clearRedirectFlag;

