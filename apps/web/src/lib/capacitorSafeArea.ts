/**
 * Capacitor native shell: document classes + safe-area bootstrap.
 * Android: MainActivity injects --safe-top / --safe-bottom from WindowInsets (not env()).
 * iOS: env(safe-area-inset-*) until/unless a native injector is added.
 */

import { getCapacitorPlatform, isCapacitorNative } from './capacitorEnv';

declare global {
  interface Window {
    /** Injected by MainActivity; web calls requestSync() after boot. */
    FlickletNativeInsets?: { requestSync: () => void };
  }
}

/** Tab row height (px) — must match --mobile-nav-base-height in global.css */
export const MOBILE_NAV_BASE_HEIGHT = 56;

/** Conservative Android boot fallbacks until MainActivity injects real insets. */
const ANDROID_SAFE_TOP_FALLBACK_PX = 24;
const ANDROID_SAFE_BOTTOM_FALLBACK_PX = 48;

/** CSS bottom offset for fixed controls above mobile nav + system inset. */
export function mobileFabBottom(extraPx: number, viewportOffsetPx = 0): string {
  return `calc(var(--mobile-nav-height, ${MOBILE_NAV_BASE_HEIGHT}px) + ${viewportOffsetPx}px + ${extraPx}px)`;
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

  const safeBottom = parseFloat(getComputedStyle(root).getPropertyValue('--safe-bottom')) || 0;
  return MOBILE_NAV_BASE_HEIGHT + safeBottom;
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
}

function applySafeAreaFromNative(top: number, bottom: number): void {
  const root = document.documentElement;
  root.style.setProperty('--safe-top', `${top}px`);
  root.style.setProperty('--safe-bottom', `${bottom}px`);
  root.setAttribute('data-safe-area-ready', 'true');
}

function handleCapacitorSafeArea(event: Event): void {
  const detail = (event as CustomEvent<{ top: number; bottom: number }>).detail;
  if (!detail || typeof detail.top !== 'number' || typeof detail.bottom !== 'number') {
    return;
  }
  applySafeAreaFromNative(detail.top, detail.bottom);
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

function applyIosEdgeToEdgeFallbacks(root: HTMLElement): void {
  root.classList.add('capacitor-ios');
  if (!root.style.getPropertyValue('--safe-bottom')) {
    root.style.setProperty('--safe-bottom', 'env(safe-area-inset-bottom, 0px)');
  }
  if (!root.style.getPropertyValue('--safe-top')) {
    root.style.setProperty('--safe-top', 'env(safe-area-inset-top, 0px)');
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
    return;
  }

  if (platform === 'ios') {
    applyIosEdgeToEdgeFallbacks(root);
  }
}
