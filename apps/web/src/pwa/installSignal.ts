/**
 * PWA Install Signal - Stable install state management
 * 
 * Prevents header jump by maintaining stable install state throughout the session.
 * State is determined once at boot and doesn't change mid-session.
 */

let canInstall = false;
let deferredEvt: any = null;
const listeners = new Set<() => void>();

export function getCanInstall() {
  return canInstall;
}

export function onInstallChange(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach(fn => fn());
}

export function initInstallSignal() {
  // Idempotent - only initialize once
  if ((window as any).__installInit) return;
  (window as any).__installInit = true;

  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    deferredEvt = e;
    if (!canInstall) {
      canInstall = true;
      notify();
    }
  });

  window.addEventListener('appinstalled', () => {
    if (canInstall) {
      canInstall = false;
      deferredEvt = null;
      notify();
    }
  });

  // Optional: standalone mode detection at boot. Don't flip later.
  const standalone = window.matchMedia?.('(display-mode: standalone)')?.matches || (navigator as any).standalone;
  if (standalone && canInstall) {
    canInstall = false;
    deferredEvt = null;
    notify();
  }
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredEvt) return false;

  const p = deferredEvt;
  deferredEvt = null;

  const res = await p.prompt();
  canInstall = false;
  notify();

  return !!res;
}













