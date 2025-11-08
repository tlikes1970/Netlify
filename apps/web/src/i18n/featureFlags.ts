/**
 * I18N Feature Flags - Runtime toggles via localStorage
 * 
 * Allows enabling/disabling i18n diagnostics and containment without rebuilds.
 */

/**
 * Check if i18n diagnostics auto-run is enabled
 */
export function isI18nDiagnosticsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check localStorage first (runtime override)
    const localStorageValue = localStorage.getItem('i18n:diagnostics:autoRun');
    if (localStorageValue === 'true') return true;
    if (localStorageValue === 'false') return false;
    
    // Fallback to env var (build-time default)
    if (import.meta.env.VITE_I18N_DIAGNOSTICS === 'true') return true;
    
    return false;
  } catch (e) {
    // localStorage unavailable, default to false
    return false;
  }
}

/**
 * Check if i18n containment (rAF batching) is enabled
 */
export function isI18nContainmentEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check localStorage first (runtime override)
    const localStorageValue = localStorage.getItem('i18n:containment');
    if (localStorageValue === 'on') return true;
    if (localStorageValue === 'off') return false;
    
    // Fallback to env var (build-time default)
    if (import.meta.env.VITE_I18N_CONTAINMENT === 'true') return true;
    
    return false;
  } catch (e) {
    // localStorage unavailable, default to false
    return false;
  }
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

