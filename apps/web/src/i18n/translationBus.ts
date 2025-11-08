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

// Bypass detector: track rapid notify() calls when mode is raf
let lastNotifyTs = 0;

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
  
  // Bypass detector: warn about rapid notify() calls when mode is raf
  if (m === 'raf' && import.meta.env.DEV && now - lastNotifyTs < 5) {
    console.warn('[i18n] rapid notify() (<5ms) while mode=raf — caller should be batched', new Error().stack);
  }
  lastNotifyTs = now;
  
  if (m !== currentMode) {
    // If switching from raf to off, flush any pending batched updates
    if (currentMode === 'raf' && m === 'off') {
      batcher.flushNow();
    }
    currentMode = m;
  }
  
  // Dev sanity log to confirm active path
  if (import.meta.env.DEV) {
    console.log('[i18n] notify mode=', currentMode, performance.now());
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

// Export singleton instance for direct access if needed
export const translationBus = {
  subscribe,
  unsubscribe,
  notify,
  mode,
  flush
};
