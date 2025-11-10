import { isOff } from './runtime/switches';

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
  // Kill switch: Service Worker disabled
  if (isOff('isw')) {
    console.info('[SW] Disabled via kill switch (isw:off)');
    return;
  }
  
  if (!('serviceWorker' in navigator)) return;

  // Check for ?sw=skip or ?sw=hardreset param (debug mode only)
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const swParam = urlParams.get('sw');
    
    if (swParam === 'skip') {
      // Unregister all SWs and clear caches
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => reg.unregister());
        if ('caches' in window) {
          caches.keys().then(keys => {
            keys.forEach(key => caches.delete(key));
          });
        }
        console.info('[SW] Skipped via ?sw=skip param');
      });
      return;
    }
    
    if (swParam === 'hardreset') {
      // Hard reset: unregister all SWs, clear all caches, then reload without the param
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister());
        if ('caches' in window) {
          caches.keys().then(keys => {
            keys.forEach(k => caches.delete(k));
          });
        }
        console.info('[SW] Hard reset: unregistered all SWs and cleared caches');
        // Reload without the hardreset param
        setTimeout(() => {
          const newUrl = location.pathname + location.search.replace(/[?&]sw=hardreset(&|$)/, (_, sep) => sep || '').replace(/^&/, '?');
          location.replace(newUrl || location.pathname);
        }, 100);
      });
      return;
    }
  }

  // Vite truth: only register in production builds.
  if (import.meta.env.DEV) {
    console.info('[SW] Disabled in dev via import.meta.env.DEV');
    return;
  }

  // ⚠️ FIXED: Removed automatic reg.update() on activation to prevent update loop
  // Added controller change handling to prevent unexpected reloads
  // Debounce update checks to prevent rapid update cycles
  
  let updateCheckDebounce: ReturnType<typeof setTimeout> | null = null;
  const DEBOUNCE_MS = 5000; // 5 second debounce for update checks
  
  const handleControllerChange = () => {
    // Controller changed - this can happen when SW activates
    // Don't reload immediately, let the page continue normally
    console.info('[SW] Controller changed - SW activated');
  };
  
  // Listen for controller changes
  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
  }
  
  const registerSW = () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => {
        console.info('[SW] registered:', reg.scope);
        
        // ⚠️ FIXED: Removed automatic reg.update() on activation
        // The browser will check for updates naturally, we don't need to force it
        // This prevents the update loop: activate → update → install → activate
        
        // Only listen for updates, don't trigger them automatically
        reg.addEventListener('updatefound', () => {
          console.info('[SW] Update found');
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                console.info('[SW] New version activated');
                // Don't call reg.update() here - let browser handle updates naturally
              }
            });
          }
        });
        
        // Debounced update check (only if no recent check)
        const checkForUpdates = () => {
          if (updateCheckDebounce) {
            clearTimeout(updateCheckDebounce);
          }
          updateCheckDebounce = setTimeout(() => {
            reg.update().catch(() => {
              // Ignore update errors (SW might be updating already)
            });
          }, DEBOUNCE_MS);
        };
        
        // Check for updates on registration (debounced)
        checkForUpdates();
      })
      .catch(err => console.error('[SW] registration failed:', err));
  };
  
  // Register immediately (don't wait for load event) so Lighthouse can detect it
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerSW);
  } else {
    // DOM already loaded, register immediately
    registerSW();
  }
}
