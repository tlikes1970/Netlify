// Flags must exist before any feature checks in row modules.
window.FLAGS = window.FLAGS || {};
// Turn on Card v2 for validation; we can gate later via config. - DISABLED due to functionality issues
if (typeof window.FLAGS.cards_v2 === 'undefined') {
  window.FLAGS.cards_v2 = false;
}
// Home layout v2 removed - using main layout system
// Enable mobile layout fixes for Card v2 + Home Sections
if (typeof window.FLAGS.layout_mobile_fix === 'undefined') {
  window.FLAGS.layout_mobile_fix = true;
}

// Apply mobile fix class to body when flag is enabled
if (window.FLAGS.layout_mobile_fix) {
  document.addEventListener('DOMContentLoaded', function () {
    document.body.classList.add('layout-mobile-fix');
  });
}
