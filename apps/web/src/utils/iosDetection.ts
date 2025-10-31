/**
 * Process: iOS Safari Detection
 * Purpose: Detect iOS Safari specifically for scroll lock fixes
 * Data Source: navigator.userAgent, window properties
 * Update Path: Update detection logic here if needed
 * Dependencies: None
 */

/**
 * Check if running on iOS device (iPhone, iPad, iPod)
 */
export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/i.test(ua);
}

/**
 * Check if running on iOS Safari (not Chrome iOS, Firefox iOS, etc.)
 */
export function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = navigator.userAgent || '';
  const isIOS = isIOSDevice();
  
  if (!isIOS) return false;
  
  // Safari on iOS has 'Safari' but not 'CriOS', 'FxiOS', etc.
  const hasSafari = /Safari/i.test(ua);
  const isChromeIOS = /CriOS/i.test(ua);
  const isFirefoxIOS = /FxiOS/i.test(ua);
  const isEdgeIOS = /EdgiOS/i.test(ua);
  
  return hasSafari && !isChromeIOS && !isFirefoxIOS && !isEdgeIOS;
}

/**
 * Check if Visual Viewport API is supported (iOS Safari 13+)
 */
export function hasVisualViewport(): boolean {
  return typeof window !== 'undefined' && 'visualViewport' in window;
}

/**
 * Check if iOS scroll fix feature flag is enabled
 */
export function isIOSScrollFixEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    return localStorage.getItem('flag:ios-scroll-fix') === 'true';
  } catch {
    return false;
  }
}

/**
 * Check if we should apply iOS-specific scroll lock fixes
 */
export function shouldUseIOSScrollFix(): boolean {
  return isIOSSafari() && isIOSScrollFixEnabled();
}

// Expose iOS detection utilities to window for debugging
if (typeof window !== 'undefined') {
  (window as any).iosDetection = {
    isIOSDevice,
    isIOSSafari,
    hasVisualViewport,
    isIOSScrollFixEnabled,
    shouldUseIOSScrollFix
  };
}
