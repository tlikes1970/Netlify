export async function devUnregisterAllSW() {
  if (!('serviceWorker' in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map(r => r.unregister()));
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  }
  console.info('[SW] Dev: unregistered all and cleared caches');
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // Vite truth: only register in production builds.
  if (import.meta.env.DEV) {
    console.info('[SW] Disabled in dev via import.meta.env.DEV');
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => console.info('[SW] registered:', reg.scope))
      .catch(err => console.error('[SW] registration failed:', err));
  });
}
