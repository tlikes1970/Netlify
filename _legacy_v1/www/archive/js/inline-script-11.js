// Helper to size an iframe to its modal body
function sizeModalIframe(modalId, iframeEl) {
  const modal = document.getElementById(modalId);
  if (!modal || !iframeEl) return;
  const body = modal.querySelector('.gm-body');
  if (!body) return;

  /* Height now managed by card system - no forced heights */
}

// Patch FlickWordBridge to use dynamic sizing
(function patchFlickWordSizing() {
  if (!window.FlickWordBridge) return;
  const _mount = window.FlickWordBridge.mount;
  window.FlickWordBridge.mount = async function (rootSel) {
    const handle = await _mount.call(window.FlickWordBridge, rootSel);

    // Try to find the iframe we just created
    const root = typeof rootSel === 'string' ? document.querySelector(rootSel) : rootSel;
    const iframe = root && (root.querySelector('iframe') || root.firstElementChild);

    // Initial size after next frame
    requestAnimationFrame(() => sizeModalIframe('modal-flickword', iframe));

    // Resize with window
    function onResize() {
      sizeModalIframe('modal-flickword', iframe);
    }
    window.addEventListener('resize', onResize);

    // Keep cleanup on destroy
    const _destroy = handle?.destroy;
    if (_destroy) {
      handle.destroy = function () {
        window.removeEventListener('resize', onResize);
        _destroy.call(handle);
      };
    }
    return handle;
  };
})();
