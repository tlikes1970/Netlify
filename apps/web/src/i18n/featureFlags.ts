/**
 * I18N Feature Flags - Runtime toggles via localStorage
 * 
 * Allows enabling/disabling i18n diagnostics and containment without rebuilds.
 */

/**
 * Check if i18n diagnostics auto-run is enabled
 */
export function isI18nDiagnosticsEnabled(): boolean {
  try {
    // Check localStorage first (runtime override) - SSR-safe
    const ls = typeof localStorage !== 'undefined' ? localStorage.getItem('i18n:diagnostics:autoRun') : null;
    if (ls) {
      const value = ls.toLowerCase();
      if (value === 'true') return true;
      if (value === 'false') return false;
    }
  } catch (e) {
    // localStorage unavailable, continue to env fallback
  }
  
  // Fallback to env var (build-time default)
  const env = (import.meta as any)?.env?.VITE_I18N_DIAGNOSTICS;
  return String(env).toLowerCase() === 'true';
}

/**
 * Check if i18n containment (rAF batching) is enabled
 */
export function isI18nContainmentEnabled(): boolean {
  try {
    // Check localStorage first (runtime override) - SSR-safe
    const ls = typeof localStorage !== 'undefined' ? localStorage.getItem('i18n:containment') : null;
    if (ls) {
      const value = ls.toLowerCase();
      if (value === 'on') return true;
      if (value === 'off') return false;
    }
  } catch (e) {
    // localStorage unavailable, continue to env fallback
  }
  
  // Fallback to env var (build-time default)
  const env = (import.meta as any)?.env?.VITE_I18N_CONTAINMENT;
  return String(env).toLowerCase() === 'true';
}

/**
 * Get diagnostics duration in milliseconds
 */
export function getI18nDiagnosticsDuration(): number {
  if (typeof window === 'undefined') return 60000;
  
  try {
    const duration = localStorage.getItem('i18n:diagnostics:durationMs');
    if (duration) {
      const parsed = parseInt(duration, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore
  }
  
  return 60000; // Default 60 seconds
}

