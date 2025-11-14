/**
 * Debug Gate - Centralized debug logging control
 * 
 * Gates miscellaneous debug logs and experimental probes behind a single
 * runtime switch so normal users never see them.
 */

/**
 * Check if verbose debug logging is enabled
 */
export function debugOn(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('debug:verbose') === '1';
  } catch {
    return false;
  }
}

/**
 * Debug log that only logs if debug:verbose flag is set
 */
export function dlog(...args: any[]): void {
  if (debugOn()) {
    console.log(...args);
  }
}

/**
 * Debug warn that only logs if debug:verbose flag is set
 */
export function dwarn(...args: any[]): void {
  if (debugOn()) {
    console.warn(...args);
  }
}








