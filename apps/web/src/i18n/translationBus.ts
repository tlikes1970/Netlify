/**
 * Translation Bus - SINGLE SOURCE OF TRUTH for translation notifications
 * 
 * All translation updates flow through this bus. When containment is enabled,
 * notifications are batched via rAF. When disabled, notifications are immediate.
 */

import { isI18nContainmentEnabled } from './featureFlags';
import { createRafBatcher } from './rafBatcher';

export type TranslationUpdate = {
  translations: any; // The translations object
  language: string;
  timestamp: number;
};

export type Listener = (payload: TranslationUpdate | TranslationUpdate[]) => void;

// Single source of truth - only one Set of listeners
const listeners = new Set<Listener>();

// Emit function that calls all listeners
function emitToAll(payload: TranslationUpdate | TranslationUpdate[]) {
  for (const listener of listeners) {
    try {
      listener(payload);
    } catch (e) {
      // Optional: dev warn (but don't break in production)
      if (import.meta.env.DEV) {
        console.warn('[TranslationBus] Listener error:', e);
      }
    }
  }
}

// Create batcher that emits arrays
const batcher = createRafBatcher<TranslationUpdate>((items) => {
  emitToAll(items);
});

// Wire up emit tracking for diagnostics (if available)
if (typeof window !== 'undefined') {
  // Set up callback after batcher is created
  setTimeout(() => {
    const tracker = (window as any).__i18nEmitTracker;
    if (typeof tracker === 'function') {
      (batcher as any).onEmit = tracker;
    }
  }, 0);
}

// Current mode (updated on each notify to honor runtime flips)
let currentMode: 'off' | 'raf' = 'off';

function recomputeMode() {
  currentMode = isI18nContainmentEnabled() ? 'raf' : 'off';
}

// Initialize mode
recomputeMode();

// Dev-only rapid-notify detector: track rapid notify() calls when containment is ON
let __lastNotifyTs = 0;

// Dev-only caller tracking: aggregate and rank callers
const __callerCounts: Record<string, number> = {};

/**
 * Subscribe to translation updates
 */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Unsubscribe a listener
 */
export function unsubscribe(listener: Listener): void {
  listeners.delete(listener);
}

/**
 * Notify all listeners of a translation update
 * 
 * Checks the containment flag on EVERY call to honor runtime toggles.
 * When containment is ON, queues to rAF batcher.
 * When containment is OFF, emits immediately.
 */
export function notify(update: TranslationUpdate): void {
  // Check flag on every call (runtime toggle support)
  const m = isI18nContainmentEnabled() ? 'raf' : 'off';
  const now = performance.now();
  
  // Dev-only: rapid-notify detector (warn when repeated calls occur within 5ms while containment is ON)
  if (import.meta.env.DEV && isI18nContainmentEnabled() && now - __lastNotifyTs < 5) {
    // eslint-disable-next-line no-console
    console.warn('[i18n] rapid notify (<5ms)', new Error().stack);
  }
  __lastNotifyTs = now;
  
  // Dev-only: aggregate and rank callers (tally caller site on every notify)
  if (import.meta.env.DEV) {
    const stack = (new Error().stack || '');
    const sig = stack.split('\n')[2]?.trim() ?? 'unknown';
    __callerCounts[sig] = (__callerCounts[sig] || 0) + 1;
  }
  
  if (m !== currentMode) {
    // If switching from raf to off, flush any pending batched updates
    if (currentMode === 'raf' && m === 'off') {
      batcher.flushNow();
    }
    currentMode = m;
  }
  
  // Dev sanity log to confirm active path (gated behind debug:verbose)
  if (import.meta.env.DEV) {
    import('../diagnostics/debugGate').then(({ dlog }) => {
      dlog('[i18n] notify mode=', currentMode, performance.now());
    }).catch(() => {});
  }
  
  if (currentMode === 'raf') {
    batcher.queue(update);
  } else {
    // Track emit for diagnostics (when mode is 'off', this is a direct emit)
    if (typeof window !== 'undefined') {
      const tracker = (window as any).__i18nEmitTracker;
      if (typeof tracker === 'function') {
        tracker(now);
      }
    }
    emitToAll(update);
  }
}

/**
 * Get current mode
 */
export function mode(): 'off' | 'raf' {
  return currentMode;
}

/**
 * Force flush any pending batched updates
 */
export function flush(): void {
  batcher.flushNow();
}

/**
 * Dev-only: Dump the top 10 callers of notify() for debugging
 * 
 * Usage: After ~60 seconds of problematic flow with containment ON, run:
 *   window.__i18nDump && window.__i18nDump();
 * 
 * Displays a table with the top 10 caller stack signatures and counts.
 */
export function __dumpI18nNotifyLeaderboard() {
  if (!import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn('[i18n] Leaderboard only available in dev mode');
    return [];
  }
  
  const rows = Object.entries(__callerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([sig, count]) => ({ count, sig }));
  
  // eslint-disable-next-line no-console
  console.table(rows);
  return rows;
}

// Export singleton instance for direct access if needed
export const translationBus = {
  subscribe,
  unsubscribe,
  notify,
  mode,
  flush
};

// Dev-only: Attach leaderboard dumper to window for easy access
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // @ts-expect-error - attaching debug utility to window
  window.__i18nDump = __dumpI18nNotifyLeaderboard;
}
