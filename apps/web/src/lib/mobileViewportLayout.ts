/**
 * Mobile keyboard / visualViewport helpers.
 * Capacitor native uses adjustResize — do not lift fixed chrome with viewportOffset.
 */

import { isCapacitorNative } from './capacitorEnv';

export const KEYBOARD_DISMISS_EVENT = 'flicklet:keyboard-dismiss';

/** Height delta (px) above which we treat the keyboard as open. */
export const KEYBOARD_OPEN_THRESHOLD = 80;

export function dispatchKeyboardDismiss(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(KEYBOARD_DISMISS_EVENT));
}

export function estimateKeyboardInset(): number {
  if (typeof window === 'undefined') return 0;
  const vv = window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, window.innerHeight - vv.height);
}

export function isKeyboardLikelyOpen(): boolean {
  return estimateKeyboardInset() > KEYBOARD_OPEN_THRESHOLD;
}

/** Capacitor WebView: never shift fixed bottom nav via visualViewport offset. */
export function useNavViewportLift(): boolean {
  return !isCapacitorNative();
}

/** Extra page padding when iOS Safari lifts nav above keyboard (not on Capacitor). */
export function mobileContentPaddingBottom(viewportOffset: number): string | undefined {
  if (!useNavViewportLift()) return undefined;
  if (
    typeof window !== 'undefined' &&
    viewportOffset > 0 &&
    window.visualViewport?.offsetTop === 0
  ) {
    return `calc(var(--mobile-nav-height) + ${viewportOffset}px)`;
  }
  return undefined;
}
