/**
 * Optional I18n Lazy Loader - Defers non-critical translation bundles post-paint
 * 
 * Use this for optional i18n bundles or feature modules that don't need to
 * be available during first paint.
 */

export function loadOptionalI18nLater(cb: () => void) {
  if (typeof window === 'undefined') {
    // SSR: execute immediately
    cb();
    return;
  }

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(cb, { timeout: 2000 });
  } else {
    // Fallback: defer by 500ms to allow first paint
    setTimeout(cb, 500);
  }
}

