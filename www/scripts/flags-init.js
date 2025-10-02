// Flags must exist before any feature checks in row modules.
window.FLAGS = window.FLAGS || {};
// Turn on Card v2 for validation; we can gate later via config. - ENABLED for V2 Cards phase
if (typeof window.FLAGS.cards_v2 === 'undefined') {
  window.FLAGS.cards_v2 = true;
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

// Enable V2 Cards system features
if (typeof window.FLAGS.homeRowCurrentlyWatching === 'undefined') {
  window.FLAGS.homeRowCurrentlyWatching = true;
}
if (typeof window.FLAGS.homeRowNextUp === 'undefined') {
  window.FLAGS.homeRowNextUp = true;
}
if (typeof window.FLAGS.homeRowCurated === 'undefined') {
  window.FLAGS.homeRowCurated = true;
}
if (typeof window.FLAGS.homeRowSpotlight === 'undefined') {
  window.FLAGS.homeRowSpotlight = true;
}
if (typeof window.FLAGS.route_fix_home_default === 'undefined') {
  window.FLAGS.route_fix_home_default = true;
}
if (typeof window.FLAGS.community_games_enabled === 'undefined') {
  window.FLAGS.community_games_enabled = true;
}
if (typeof window.FLAGS.community_stats_teaser === 'undefined') {
  window.FLAGS.community_stats_teaser = true;
}
if (typeof window.FLAGS.skeletonsEnabled === 'undefined') {
  window.FLAGS.skeletonsEnabled = true;
}
