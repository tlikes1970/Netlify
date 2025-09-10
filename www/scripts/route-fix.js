/**
 * Route Fix - Home Default Landing
 * Purpose: Ensure app always opens at top of Home, not scrolled to sections
 * Data Source: window.location and browser scroll restoration
 * Update Path: Modify flags-init.js to toggle route_fix_home_default
 * Dependencies: flags-init.js, home sections
 */

(function() {
  'use strict';

  // Only run if flag is enabled
  if (!window.FLAGS?.route_fix_home_default) {
    return;
  }

  // Disable browser scroll restoration
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  // Track if this is the initial app boot
  const isInitialLoad = !window._appBooted;
  window._appBooted = true;

  function normalizeInitialLocation() {
    const hash = location.hash || '';
    const allowed = new Set(['', '#home']); // allow top/home only
    
    if (!allowed.has(hash)) {
      // Strip unknown hash that can jump the page
      console.log('🔧 Route Fix: Removing hash', hash, 'to prevent auto-scroll');
      history.replaceState(history.state, '', location.pathname);
    }
  }

  function ensureTopOnLoad() {
    // Ensure we're at the top on initial render
    requestAnimationFrame(() => {
      window.scrollTo({ 
        top: 0, 
        left: 0, 
        behavior: 'instant' 
      });
      console.log('🔧 Route Fix: Scrolled to top on initial load');
    });
  }

  // Apply fixes on initial load
  if (isInitialLoad) {
    if (location.pathname === '/' || location.pathname === '') {
      normalizeInitialLocation();
      ensureTopOnLoad();
    }
  }

  // Prevent accidental hash navigation on load
  window.addEventListener('load', function() {
    if (window.FLAGS?.route_fix_home_default) {
      // Double-check we're at the top after everything loads
      setTimeout(() => {
        if (window.scrollY > 0) {
          console.log('🔧 Route Fix: Correcting scroll position after load');
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
      }, 100);
    }
  });

  // Export for debugging
  if (typeof window !== 'undefined') {
    window.RouteFix = {
      normalizeInitialLocation,
      ensureTopOnLoad,
      isEnabled: () => !!window.FLAGS?.route_fix_home_default
    };
  }

})();




