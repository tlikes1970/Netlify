// Flags must exist before any feature checks in row modules.
window.FLAGS = window.FLAGS || {};
// Turn on Card v2 for validation; we can gate later via config.
if (typeof window.FLAGS.cards_v2 === 'undefined') {
  window.FLAGS.cards_v2 = true;
}
// Turn on Home layout v2 (Option B structure)
if (typeof window.FLAGS.home_layout_v2 === 'undefined') {
  window.FLAGS.home_layout_v2 = true;
}
