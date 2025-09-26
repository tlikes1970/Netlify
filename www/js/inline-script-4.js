(function () {
  if (!('serviceWorker' in navigator)) return;
  const host = location.hostname;
  const isPreview = host.includes('--deploy-preview-');
  if (isPreview) {
    // Purge any already-installed SW and caches on previews
    navigator.serviceWorker.getRegistrations?.().then((rs) => rs.forEach((r) => r.unregister()));
    if (window.caches && caches.keys) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
    // Block future registrations in this context
    const noop = () => Promise.reject(new Error('SW disabled on preview'));
    try {
      navigator.serviceWorker.register = noop;
    } catch {}
    console.info('[SW] Disabled for deploy preview:', host);
  }
})();
