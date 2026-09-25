/**
 * Capacitor native shell: document classes + safe-area bootstrap.
 * Android: MainActivity injects --safe-top/bottom/left/right from WindowInsets (not env()).
 * iOS: env(safe-area-inset-*) until/unless a native injector is added.
 */

import { getCapacitorPlatform, isCapacitorNative } from './capacitorEnv';

declare global {
  interface Window {
    /** Injected by MainActivity; web calls requestSync() after boot. */
    FlickletNativeInsets?: { requestSync: () => void };
  }
}

export type NativeSafeAreaInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

/** Tab row height (px) — must match --mobile-nav-base-height in global.css */
export const MOBILE_NAV_BASE_HEIGHT = 56;

/** Conservative Android boot fallbacks until MainActivity injects real insets. */
const ANDROID_SAFE_TOP_FALLBACK_PX = 24;
const ANDROID_SAFE_BOTTOM_FALLBACK_PX = 48;

/** CSS bottom offset for fixed controls above mobile nav + system inset. */
export function mobileFabBottom(extraPx: number, viewportOffsetPx = 0): string {
  return `calc(var(--mobile-nav-height, ${MOBILE_NAV_BASE_HEIGHT}px) + ${viewportOffsetPx}px + ${extraPx}px)`;
}

/** CSS inline offset for fixed controls: existing gutter plus --safe-left / --safe-right. */
export function mobileFabInlineInset(extraPx: number, side: 'left' | 'right'): string {
  const insetVar = side === 'left' ? '--safe-left' : '--safe-right';
  return `calc(${extraPx}px + var(${insetVar}, 0px))`;
}

export function readSafeInsetPx(side: 'top' | 'bottom' | 'left' | 'right'): number {
  if (typeof document === 'undefined') return 0;
  const parsed = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(`--safe-${side}`)
  );
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Resolved bottom clearance for fixed UI (tab row + system nav inset).
 * Prefer computed --mobile-nav-height so overflow menus match FAB positioning.
 */
export function readMobileNavClearancePx(): number {
  if (typeof document === 'undefined') return MOBILE_NAV_BASE_HEIGHT;

  const root = document.documentElement;
  const computed = getComputedStyle(root).getPropertyValue('--mobile-nav-height');
  const parsed = parseFloat(computed);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return MOBILE_NAV_BASE_HEIGHT + readSafeInsetPx('bottom');
}

function applyAndroidShellClasses(root: HTMLElement): void {
  root.classList.add('capacitor-android');
}

function applyAndroidSafeAreaFallbacks(root: HTMLElement): void {
  const topPx = parseFloat(root.style.getPropertyValue('--safe-top')) || 0;
  const bottomPx = parseFloat(root.style.getPropertyValue('--safe-bottom')) || 0;

  if (topPx <= 0) {
    root.style.setProperty('--safe-top', `${ANDROID_SAFE_TOP_FALLBACK_PX}px`);
  }
  if (bottomPx <= 0) {
    root.style.setProperty('--safe-bottom', `${ANDROID_SAFE_BOTTOM_FALLBACK_PX}px`);
  }
  if (!root.style.getPropertyValue('--safe-left')) {
    root.style.setProperty('--safe-left', '0px');
  }
  if (!root.style.getPropertyValue('--safe-right')) {
    root.style.setProperty('--safe-right', '0px');
  }
}

export function applySafeAreaFromNative(insets: NativeSafeAreaInsets): void {
  const root = document.documentElement;
  root.style.setProperty('--safe-top', `${insets.top}px`);
  root.style.setProperty('--safe-bottom', `${insets.bottom}px`);
  root.style.setProperty('--safe-left', `${insets.left}px`);
  root.style.setProperty('--safe-right', `${insets.right}px`);
  root.setAttribute('data-safe-area-ready', 'true');
}

function handleCapacitorSafeArea(event: Event): void {
  const detail = (event as CustomEvent<Partial<NativeSafeAreaInsets>>).detail;
  if (!detail || typeof detail.top !== 'number' || typeof detail.bottom !== 'number') {
    return;
  }
  applySafeAreaFromNative({
    top: detail.top,
    bottom: detail.bottom,
    left: typeof detail.left === 'number' ? detail.left : 0,
    right: typeof detail.right === 'number' ? detail.right : 0,
  });
}

function requestAndroidInsetSync(): void {
  try {
    window.FlickletNativeInsets?.requestSync?.();
  } catch {
    // Bridge not ready yet; onResume / decor listener will inject when available.
  }
}

function scheduleAndroidInsetSyncRetries(): void {
  if (typeof window === 'undefined') return;

  let attempts = 0;
  const maxAttempts = 60;
  const delayMs = 50;

  const tick = () => {
    if (document.documentElement.getAttribute('data-safe-area-ready') === 'true') {
      return;
    }
    requestAndroidInsetSync();
    attempts += 1;
    if (attempts < maxAttempts) {
      window.setTimeout(tick, delayMs);
    }
  };

  tick();
}

/** Same native bridge as boot: re-sync all four insets after rotate / nav-mode changes. */
function watchViewportForInsetSync(): void {
  if (typeof window === 'undefined') return;

  let timer = 0;
  const kick = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => requestAndroidInsetSync(), 50);
  };

  window.addEventListener('resize', kick);
  window.addEventListener('orientationchange', kick);
  window.visualViewport?.addEventListener('resize', kick);
}

function applyIosEdgeToEdgeFallbacks(root: HTMLElement): void {
  root.classList.add('capacitor-ios');
  if (!root.style.getPropertyValue('--safe-bottom')) {
    root.style.setProperty('--safe-bottom', 'env(safe-area-inset-bottom, 0px)');
  }
  if (!root.style.getPropertyValue('--safe-top')) {
    root.style.setProperty('--safe-top', 'env(safe-area-inset-top, 0px)');
  }
  if (!root.style.getPropertyValue('--safe-left')) {
    root.style.setProperty('--safe-left', 'env(safe-area-inset-left, 0px)');
  }
  if (!root.style.getPropertyValue('--safe-right')) {
    root.style.setProperty('--safe-right', 'env(safe-area-inset-right, 0px)');
  }
}

export function initCapacitorNativeShell(): void {
  if (typeof document === 'undefined' || !isCapacitorNative()) return;

  const root = document.documentElement;
  root.classList.add('capacitor-native');

  const platform = getCapacitorPlatform();
  if (platform === 'android') {
    applyAndroidShellClasses(root);
    applyAndroidSafeAreaFallbacks(root);
    window.addEventListener('capacitor-safe-area', handleCapacitorSafeArea);
    requestAndroidInsetSync();
    scheduleAndroidInsetSyncRetries();
    watchViewportForInsetSync();
    return;
  }

  if (platform === 'ios') {
    applyIosEdgeToEdgeFallbacks(root);
  }
}
