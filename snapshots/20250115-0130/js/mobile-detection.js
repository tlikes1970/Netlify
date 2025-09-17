/**
 * Process: Mobile Detection
 * Purpose: Single mobile detection system - viewport width only
 * Data Source: Window viewport width
 * Update Path: Runs on load and resize
 * Dependencies: None
 */

(function() {
  // Single mobile detection system - viewport width only
  function applyMobileClass() {
    const isMobileSize = window.innerWidth <= 768;
    
    if (isMobileSize && document.body) {
      document.body.classList.add('mobile');
      console.log('📱 Mobile class applied - viewport width:', window.innerWidth);
    }
  }

  // Apply on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyMobileClass);
  } else {
    applyMobileClass();
  }

  // Apply on resize
  window.addEventListener('resize', applyMobileClass);
})();
