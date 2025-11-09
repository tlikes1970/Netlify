/**
 * Process: Runtime Subsystem Kill Switches
 * Purpose: Binary isolation of subsystems to identify flicker sources
 * Data Source: localStorage keys (isw:off, iauth:off, etc.)
 * Update Path: Set via localStorage.setItem('isw:off', '1') or browser console
 * Dependencies: None (pure utility)
 */

/**
 * Check if a subsystem is disabled via kill switch
 * @param key - Switch key (e.g., 'isw', 'iauth', 'ifire')
 * @returns true if subsystem should be disabled (no-op)
 */
export function isOff(key: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const value = localStorage.getItem(`${key}:off`);
    return value === '1' || value === 'true';
  } catch {
    // localStorage unavailable or blocked - default to enabled
    return false;
  }
}

/**
 * Get all switch states for debugging/overlay
 */
export function getAllSwitchStates(): Record<string, boolean> {
  const switches = [
    'isw',      // Service Worker
    'iauth',    // Firebase Auth
    'ifire',    // Firestore/RTDB listeners
    'iapiclient', // External API client
    'imsg',     // FCM/messaging
    'ircfg',    // Remote config/feature flags
    'ianalytics', // Analytics/perf
    'iprefetch', // Router prefetch
    'ifonts'    // Fonts/assets preload
  ];
  
  const states: Record<string, boolean> = {};
  for (const key of switches) {
    states[key] = isOff(key);
  }
  return states;
}

