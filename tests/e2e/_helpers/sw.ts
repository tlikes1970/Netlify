import { BrowserContext } from '@playwright/test';

export async function stubServiceWorker(context: BrowserContext) {
  await context.addInitScript(() => {
    const sw = (navigator as any).serviceWorker;
    if (!sw) return;
    const fakeReg = {
      installing: null, waiting: null, active: null, scope: location.origin,
      unregister: async () => true, update: async () => undefined,
    };
    const noop = async () => fakeReg;
    try { sw.register = noop; } catch {}
    try { sw.getRegistration = async () => fakeReg; } catch {}
  });
}



