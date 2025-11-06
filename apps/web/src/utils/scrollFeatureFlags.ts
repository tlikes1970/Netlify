/**
 * Process: Scroll & Swipe Feature Flags
 * Purpose: Feature flags for phased scroll and swipe fixes implementation
 * Data Source: localStorage with 'flag:' prefix (matches existing flag system)
 * Update Path: Use setScrollFeatureFlag() or localStorage.setItem('flag:scroll-lock-safety', 'true')
 * Dependencies: apps/web/src/lib/flags.tsx (uses same localStorage pattern)
 */

// Note: Using direct localStorage access to match existing flag() pattern
// from lib/flags.tsx for consistency

/**
 * Scroll and swipe fix feature flags
 * All flags default to disabled (false) - must be explicitly enabled via localStorage
 */
export type ScrollFeatureFlag = 
  | 'scroll-lock-safety'
  | 'touch-event-audit'
  | 'ios-scroll-fix'
  | 'modal-scroll-isolation'
  | 'swipe-timing-fix'
  | 'pull-refresh-fix'
  | 'css-touch-action-consolidation'
  | 'drag-handle-v1'
  | 'drag-animation-v1'
  | 'drag-touch-hold-reduced';

/**
 * Check if a scroll feature flag is enabled
 * Uses same localStorage pattern as lib/flags.tsx flag() function
 * @param flagName - The feature flag name
 * @returns Boolean indicating if the flag is enabled
 */
export function isScrollFeatureEnabled(flagName: ScrollFeatureFlag): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const value = localStorage.getItem(`flag:${flagName}`);
    if (value === null) return false;
    return value === 'true';
  } catch {
    // Ignore localStorage errors
    return false;
  }
}

/**
 * Set a scroll feature flag
 * @param flagName - The feature flag name
 * @param enabled - Boolean value to set
 * Note: In browser, this persists to localStorage and can be verified via window.scrollFeatures.list()
 */
export function setScrollFeatureFlag(flagName: ScrollFeatureFlag, enabled: boolean): void {
  // Only early-return in SSR (server-side rendering), not in browser
  // This ensures flags can be enabled in browser via console
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`flag:${flagName}`, enabled.toString());
    console.log(`🔧 Scroll Feature Flag "${flagName}" set to ${enabled}`);
    
    // Verify persistence (helpful for debugging)
    if (import.meta.env.DEV) {
      const verified = localStorage.getItem(`flag:${flagName}`) === enabled.toString();
      if (!verified) {
        console.warn(`⚠️ Flag "${flagName}" may not have persisted correctly`);
      }
    }
  } catch (error) {
    console.error(`Failed to set scroll feature flag "${flagName}":`, error);
  }
}

/**
 * Get all scroll feature flag states (for debugging)
 * @returns Object with all flag names and their current states
 */
export function getAllScrollFeatureFlags(): Record<ScrollFeatureFlag, boolean> {
  return {
    'scroll-lock-safety': isScrollFeatureEnabled('scroll-lock-safety'),
    'touch-event-audit': isScrollFeatureEnabled('touch-event-audit'),
    'ios-scroll-fix': isScrollFeatureEnabled('ios-scroll-fix'),
    'modal-scroll-isolation': isScrollFeatureEnabled('modal-scroll-isolation'),
    'swipe-timing-fix': isScrollFeatureEnabled('swipe-timing-fix'),
    'pull-refresh-fix': isScrollFeatureEnabled('pull-refresh-fix'),
    'css-touch-action-consolidation': isScrollFeatureEnabled('css-touch-action-consolidation'),
    'drag-handle-v1': isScrollFeatureEnabled('drag-handle-v1'),
    'drag-animation-v1': isScrollFeatureEnabled('drag-animation-v1'),
    'drag-touch-hold-reduced': isScrollFeatureEnabled('drag-touch-hold-reduced'),
  };
}

/**
 * Enable all scroll feature flags (for testing)
 */
export function enableAllScrollFeatures(): void {
  const flags: ScrollFeatureFlag[] = [
    'scroll-lock-safety',
    'touch-event-audit',
    'ios-scroll-fix',
    'modal-scroll-isolation',
    'swipe-timing-fix',
    'pull-refresh-fix',
    'css-touch-action-consolidation',
    'drag-handle-v1',
    'drag-animation-v1',
    'drag-touch-hold-reduced',
  ];
  
  flags.forEach(flagName => setScrollFeatureFlag(flagName, true));
  console.log('✅ All scroll feature flags enabled');
}

/**
 * Disable all scroll feature flags (for rollback)
 */
export function disableAllScrollFeatures(): void {
  const flags: ScrollFeatureFlag[] = [
    'scroll-lock-safety',
    'touch-event-audit',
    'ios-scroll-fix',
    'modal-scroll-isolation',
    'swipe-timing-fix',
    'pull-refresh-fix',
    'css-touch-action-consolidation',
    'drag-handle-v1',
    'drag-animation-v1',
    'drag-touch-hold-reduced',
  ];
  
  flags.forEach(flagName => setScrollFeatureFlag(flagName, false));
  console.log('❌ All scroll feature flags disabled');
}

// Expose to window for browser console debugging
// Available in all environments for testing purposes
if (typeof window !== 'undefined') {
  (window as any).scrollFeatures = {
    enable: (flag: ScrollFeatureFlag) => setScrollFeatureFlag(flag, true),
    disable: (flag: ScrollFeatureFlag) => setScrollFeatureFlag(flag, false),
    check: (flag: ScrollFeatureFlag) => isScrollFeatureEnabled(flag),
    list: () => getAllScrollFeatureFlags(),
    enableAll: enableAllScrollFeatures,
    disableAll: disableAllScrollFeatures,
  };
  
  // Also expose direct functions for convenience
  (window as any).isFeatureEnabled = isScrollFeatureEnabled;
  (window as any).setFeatureFlag = setScrollFeatureFlag;
  
  // Only log in dev mode to avoid console spam
  if (import.meta.env.DEV) {
    console.log('🔧 Scroll feature flags available:');
    console.log('  window.scrollFeatures.check("scroll-lock-safety")');
    console.log('  window.isFeatureEnabled("scroll-lock-safety")');
    console.log('  window.setFeatureFlag("scroll-lock-safety", true)');
  }
}

