/**
 * Translation Bus - Centralized translation update notification system
 * 
 * Wraps LanguageManager to provide batching via rAF when containment is enabled.
 */

import { isI18nContainmentEnabled } from './featureFlags';
import { createRafBatcher, RafBatcher } from './rafBatcher';

export type TranslationUpdate = {
  translations: any; // The translations object
  language: string;
  timestamp: number;
};

export type Listener = (payload: TranslationUpdate | TranslationUpdate[]) => void;

class TranslationBus {
  private listeners: Set<Listener> = new Set();
  private batcher: RafBatcher<TranslationUpdate> | null = null;
  private containmentEnabled = false;
  
  constructor() {
    this.updateContainmentState();
  }
  
  /**
   * Update containment state (call when flag changes)
   */
  updateContainmentState() {
    const wasEnabled = this.containmentEnabled;
    this.containmentEnabled = isI18nContainmentEnabled();
    
    // If containment state changed, recreate batcher
    if (this.containmentEnabled !== wasEnabled) {
      if (this.containmentEnabled) {
        // Create batcher that emits arrays
        this.batcher = createRafBatcher<TranslationUpdate>((payloads) => {
          // Emit array to all listeners
          this.listeners.forEach(listener => {
            try {
              listener(payloads);
            } catch (e) {
              console.error('[TranslationBus] Listener error:', e);
            }
          });
        });
      } else {
        // Disable batching
        if (this.batcher) {
          this.batcher.flushNow();
        }
        this.batcher = null;
      }
    }
  }
  
  /**
   * Subscribe to translation updates
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    
    // Update containment state in case it changed
    this.updateContainmentState();
    
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  /**
   * Unsubscribe a listener
   */
  unsubscribe(listener: Listener): void {
    this.listeners.delete(listener);
  }
  
  /**
   * Notify all listeners of a translation update
   */
  notify(update: TranslationUpdate): void {
    if (this.containmentEnabled && this.batcher) {
      // Queue for batching
      this.batcher.queue(update);
    } else {
      // Immediate notification (existing behavior)
      this.listeners.forEach(listener => {
        try {
          listener(update);
        } catch (e) {
          console.error('[TranslationBus] Listener error:', e);
        }
      });
    }
  }
  
  /**
   * Force flush any pending batched updates
   */
  flush(): void {
    if (this.batcher) {
      this.batcher.flushNow();
    }
  }
  
  /**
   * Get current containment state
   */
  isContainmentEnabled(): boolean {
    return this.containmentEnabled;
  }
}

// Singleton instance
export const translationBus = new TranslationBus();

// Update containment state when localStorage changes (for runtime toggling)
if (typeof window !== 'undefined') {
  // Listen for storage events (from other tabs)
  window.addEventListener('storage', (e) => {
    if (e.key === 'i18n:containment') {
      translationBus.updateContainmentState();
    }
  });
  
  // Also check periodically in case flag changed in same tab
  // (storage event only fires for other tabs)
  setInterval(() => {
    translationBus.updateContainmentState();
  }, 1000);
}

