/* ============== Bootstrap (Cleaned) ============== */

document.addEventListener('DOMContentLoaded', () => {
  if (window.FlickletApp && typeof window.FlickletApp.init === 'function') {
    window.FlickletApp.init();
  } else {
    console.error('FlickletApp.init missing');
  }
});
