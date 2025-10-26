/**
 * Process: Mobile Detection Normalization
 * Purpose: Single source of truth for mobile device detection using matchMedia
 * Data Source: CSS media query (max-width: 768px)
 * Update Path: isMobileNow() for immediate checks, onMobileChange() for reactive updates
 * Dependencies: All components that check mobile viewport, responsive behavior
 */

// Canonical mobile breakpoint query
export const isMobileQuery = '(max-width: 768px)';

/**
 * Check if the current viewport is mobile-sized
 * @returns Boolean indicating if viewport is mobile-sized
 */
export function isMobileNow(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(isMobileQuery).matches;
}

/**
 * Subscribe to mobile viewport changes
 * @param cb - Callback function called when mobile state changes
 * @returns Cleanup function to unsubscribe
 */
export function onMobileChange(cb: (isMobile: boolean) => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  
  const mq = window.matchMedia(isMobileQuery);
  const handler = () => cb(mq.matches);
  
  // Use modern addEventListener if available, fallback to addListener for older browsers
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', handler);
  } else if (typeof mq.addListener === 'function') {
    mq.addListener(handler);
  }
  
  // Call handler immediately with current state
  handler();
  
  // Return cleanup function
  return () => {
    if (typeof mq.removeEventListener === 'function') {
      mq.removeEventListener('change', handler);
    } else if (typeof mq.removeListener === 'function') {
      mq.removeListener(handler);
    }
  };
}

/**
 * Legacy compatibility: Check if screen is mobile-sized
 * @deprecated Use isMobileNow() instead
 * @returns Boolean indicating if viewport is mobile-sized
 */
export const isMobileScreen = isMobileNow;

/**
 * Legacy compatibility: Detect if device is desktop
 * @deprecated Use !isMobileNow() instead
 * @returns Boolean indicating if viewport is desktop-sized
 */
export const isDesktop = (): boolean => {
  return !isMobileNow();
};



