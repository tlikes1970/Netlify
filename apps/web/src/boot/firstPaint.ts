/**
 * First-paint gate — release body visibility as early as safe.
 * Native/Capacitor builds bypass the gate in index.html and show a themed splash instead.
 */

let gateReleased = false;

/** Capacitor WebView or repeat visit — skip hiding body behind fp-gate. */
export function shouldBypassFirstPaintGate(): boolean {
  if (typeof window === 'undefined') return false;

  if (import.meta.env.MODE === 'mobile') return true;

  try {
    if (localStorage.getItem('app:primed') === '1') return true;
  } catch {
    /* ignore */
  }

  const { hostname, protocol } = window.location;
  if (
    hostname === 'localhost' &&
    (protocol === 'https:' || protocol === 'http:' || protocol === 'capacitor:')
  ) {
    return true;
  }

  return false;
}

function hideSplash(): void {
  const splash = document.querySelector<HTMLElement>('.app-splash');
  if (splash) {
    splash.style.display = 'none';
  }
}

/** Release fp-gate and hide boot splash. Idempotent. */
export function releaseFirstPaintGate(): void {
  if (gateReleased) return;
  gateReleased = true;

  try {
    localStorage.setItem('app:primed', '1');
  } catch {
    /* ignore */
  }

  document.documentElement.classList.remove('fp-gate');
  const gateCss = document.getElementById('fp-gate-css');
  if (gateCss?.parentNode) {
    gateCss.parentNode.removeChild(gateCss);
  }

  hideSplash();
}

/** Called from index.html inline script on native before the bundle loads. */
export function installFirstPaintGateGlobals(): void {
  if (typeof window === 'undefined') return;
  (window as Window & { __flickletReleaseFirstPaint?: () => void }).__flickletReleaseFirstPaint =
    releaseFirstPaintGate;
}
