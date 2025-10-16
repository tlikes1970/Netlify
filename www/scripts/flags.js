/**
 * Feature Flags System
 * Purpose: Centralized feature flag management for mobile compact migration
 * Usage: flag('mobile_compact_v1') // default OFF
 */

export const flag = (name) => {
  try { 
    const v = localStorage.getItem('flag:'+name); 
    if (v !== null) return v === 'true'; 
  } catch {}
  return false;
};

/**
 * Check if current viewport is mobile
 * @returns {boolean} True if mobile viewport
 */
export const isMobile = () => {
  return window.matchMedia('(max-width: 768px)').matches;
};

/**
 * Ensure compact mobile attribute is set correctly based on flag and conditions
 * Sets data-compact-mobile-v1="true" if:
 * - mobile_compact_v1 flag is ON
 * - viewport is mobile
 * - density is set to "compact"
 */
export const ensureCompactAttr = () => {
  const shouldBeCompact = flag('mobile_compact_v1') && 
                          isMobile() && 
                          document.documentElement.dataset.density === 'compact';
  
  if (shouldBeCompact) {
    document.documentElement.dataset.compactMobileV1 = 'true';
  } else {
    delete document.documentElement.dataset.compactMobileV1;
  }
};

// Bind to DOM events
document.addEventListener('DOMContentLoaded', ensureCompactAttr);
document.addEventListener('visibilitychange', ensureCompactAttr);

// Available flags:
// flag('mobile_compact_v1') // default OFF
