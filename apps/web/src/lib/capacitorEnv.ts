/**
 * Capacitor Android/iOS shell detection (not mobile browser).
 * Used to avoid WebView heuristics that target embedded in-app browsers (FB, IG, etc.).
 */

type CapacitorPlatform = 'android' | 'ios' | 'web';

function getCapacitorApi():
  | {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
    }
  | undefined {
  if (typeof window === 'undefined') return undefined;
  return (
    window as {
      Capacitor?: {
        isNativePlatform?: () => boolean;
        getPlatform?: () => string;
      };
    }
  ).Capacitor;
}

export function getCapacitorPlatform(): CapacitorPlatform {
  try {
    const Cap = getCapacitorApi();
    if (!Cap?.getPlatform) return 'web';
    const platform = Cap.getPlatform();
    if (platform === 'android' || platform === 'ios') return platform;
    return 'web';
  } catch {
    return 'web';
  }
}

export function isCapacitorNative(): boolean {
  try {
    const Cap = getCapacitorApi();
    if (!Cap) return false;
    if (typeof Cap.isNativePlatform === 'function') return Cap.isNativePlatform();
    const platform = getCapacitorPlatform();
    return platform === 'android' || platform === 'ios';
  } catch {
    return false;
  }
}

export function isCapacitorAndroid(): boolean {
  return getCapacitorPlatform() === 'android';
}

export function isCapacitorIOS(): boolean {
  return getCapacitorPlatform() === 'ios';
}

/** Android native: CSS safe areas come from MainActivity WindowInsets injection. */
export function androidUsesInjectedSafeAreas(): boolean {
  return isCapacitorAndroid();
}
