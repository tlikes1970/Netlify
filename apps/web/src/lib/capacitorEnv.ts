/**
 * Capacitor Android/iOS shell detection (not mobile browser).
 * Used to avoid WebView heuristics that target embedded in-app browsers (FB, IG, etc.).
 */

export function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const Cap = (
      window as {
        Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
      }
    ).Capacitor;
    if (!Cap) return false;
    if (typeof Cap.isNativePlatform === 'function') return Cap.isNativePlatform();
    if (typeof Cap.getPlatform === 'function') {
      const p = Cap.getPlatform();
      return p === 'android' || p === 'ios';
    }
    return false;
  } catch {
    return false;
  }
}
