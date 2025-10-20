/**
 * Process: Mobile Detection Module
 * Purpose: Single mobile detection system - viewport width only
 * Data Source: window.innerWidth
 * Update Path: Update breakpoint if needed
 * Dependencies: None
 */

export function initializeMobileDetection() {
  // Single mobile detection system - viewport width only
  function applyMobileClass() {
    const isMobileSize = window.innerWidth <= 768;

    if (isMobileSize) {
      document.body.classList.add('mobile');
      document.body.classList.remove('desktop');
    } else {
      document.body.classList.add('desktop');
      document.body.classList.remove('mobile');
    }
  }

  // Apply on load
  applyMobileClass();

  // Apply on resize with debounce
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(applyMobileClass, 100);
  });

  // Expose for manual calls
  window.applyMobileClass = applyMobileClass;
}
