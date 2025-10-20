/**
 * Anti-Jump Guard (Simplified)
 * Purpose: Force app to start at top of Home, prevent auto-scrolling from hashes and autofocus
 * Data Source: window.location, DOM events
 * Update Path: Modify guard conditions or add new scroll prevention methods
 * Dependencies: flags-init.js
 */

(function () {
  'use strict';

  // Only run if flag is enabled
  if (!window.FLAGS?.route_fix_home_default) {
    return;
  }

  console.log('🛡️ Anti-Jump: Initializing simplified scroll prevention');

  // 1) Strip any non-home hash on first load of '/'
  const isInitialLoad = !window._antiJumpBooted;
  window._antiJumpBooted = true;

  if (isInitialLoad && (location.pathname === '/' || location.pathname === '')) {
    const allowed = new Set(['', '#', '#home']);
    if (!allowed.has(location.hash)) {
      console.log('🛡️ Anti-Jump: Removing hash', location.hash, 'to prevent auto-scroll');
      try {
        history.replaceState(history.state, '', location.pathname);
      } catch (e) {
        console.warn('🛡️ Anti-Jump: Could not replace state:', e);
      }
    }

    // Force scroll to top immediately
    console.log('🛡️ Anti-Jump: Forcing immediate scroll to top');
    try {
      window.scrollTo(0, 0);
    } catch (e) {
      console.warn('🛡️ Anti-Jump: Could not scroll to top immediately:', e);
    }
  }

  // 2) Remove autofocus (common scroll cause)
  document.addEventListener('DOMContentLoaded', () => {
    const autofocusElements = document.querySelectorAll('[autofocus]');
    if (autofocusElements.length > 0) {
      console.log('🛡️ Anti-Jump: Removing autofocus from', autofocusElements.length, 'elements');
      autofocusElements.forEach((n) => n.removeAttribute('autofocus'));
    }
  });

  // 3) Force scroll to top after layout is complete
  function forceScrollToTop() {
    try {
      if (window.scrollTo) {
        window.scrollTo(0, 0);
        console.log('🛡️ Anti-Jump: Forced scroll to top (0, 0)');
      }
    } catch (e) {
      console.warn('🛡️ Anti-Jump: Could not scroll to top:', e);
    }
  }

  // 4) Prevent any scroll events during initial load
  let preventScroll = true;
  function preventScrollEvents(e) {
    if (preventScroll) {
      e.preventDefault();
      e.stopPropagation();
      console.log('🛡️ Anti-Jump: Prevented scroll event during initial load');
      return false;
    }
  }

  // Add scroll event listeners
  window.addEventListener('scroll', preventScrollEvents, { passive: false });
  window.addEventListener('wheel', preventScrollEvents, { passive: false });
  window.addEventListener('touchmove', preventScrollEvents, { passive: false });

  // Force scroll to top after first layout
  requestAnimationFrame(() => {
    console.log('🛡️ Anti-Jump: First frame complete, forcing scroll to top');
    forceScrollToTop();
  });

  // Additional safety: Double-check after a short delay
  setTimeout(() => {
    if (window.scrollY > 0) {
      console.log('🛡️ Anti-Jump: Correcting scroll position after delay, was at', window.scrollY);
      forceScrollToTop();
    }
  }, 100);

  // Final check after everything loads
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (window.scrollY > 0) {
        console.log('🛡️ Anti-Jump: Final correction after load, was at', window.scrollY);
        forceScrollToTop();
      }
      // Release scroll prevention after everything is loaded
      preventScroll = false;
      console.log('🛡️ Anti-Jump: Released scroll prevention after load');
    }, 50);
  });

  console.log('🛡️ Anti-Jump: Simplified guard initialized');
})();
