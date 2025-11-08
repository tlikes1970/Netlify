/**
 * rAF Batcher - Batches multiple payloads into single emit per animation frame
 * 
 * Guarantees at most 1 emit per frame, regardless of how many queue calls.
 * Uses microtask merge before rAF to collapse same-tick microbursts.
 * Safe for multiple calls within the same tick.
 */

export interface RafBatcher<T> {
  queue(payload: T): void;
  flushNow(): void;
  // Expose emit callback for diagnostics tracking
  onEmit?: (timestamp: number) => void;
}

/**
 * Create a requestAnimationFrame batcher with microtask merge
 * 
 * @param emit Function to call with batched payloads (array)
 * @returns Batcher instance with queue() and flushNow() methods
 */
export function createRafBatcher<T>(emit: (payloads: T[]) => void): RafBatcher<T> {
  let queue: T[] = [];
  let scheduled = false;
  let microtaskQueued = false;
  let rafId: number | null = null;
  let onEmitCallback: ((timestamp: number) => void) | undefined = undefined;
  
  const flush = () => {
    if (queue.length === 0) {
      scheduled = false;
      return;
    }
    
    const now = performance.now();
    
    // Copy and clear queue
    const payloads = [...queue];
    queue = [];
    scheduled = false;
    rafId = null;
    microtaskQueued = false;
    
    // Emit batched payloads
    emit(payloads);
    
    // Notify diagnostics if callback is set
    if (typeof onEmitCallback === 'function') {
      onEmitCallback(now);
    }
  };
  
  const scheduleFlush = () => {
    // Microtask merge: collapse same-tick microbursts before rAF
    if (!microtaskQueued) {
      microtaskQueued = true;
      Promise.resolve().then(() => {
        microtaskQueued = false;
        // After microtask, check if rAF is already scheduled
        if (scheduled) return;
        
        scheduled = true;
        // SSR-safe: fallback to setTimeout if requestAnimationFrame unavailable
        const rAF = typeof requestAnimationFrame === 'function' 
          ? requestAnimationFrame 
          : (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16);
        
        rafId = rAF(() => {
          flush();
        });
      });
    }
  };
  
  const batcher: RafBatcher<T> = {
    queue(payload: T) {
      queue.push(payload);
      scheduleFlush();
    },
    
    flushNow() {
      // Cancel scheduled flush if any
      if (rafId !== null) {
        if (typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(rafId);
        }
        rafId = null;
        scheduled = false;
      }
      microtaskQueued = false;
      
      // Flush immediately
      flush();
    },
    
    get onEmit() {
      return onEmitCallback;
    },
    
    set onEmit(callback: ((timestamp: number) => void) | undefined) {
      onEmitCallback = callback;
    }
  };
  
  return batcher;
}

