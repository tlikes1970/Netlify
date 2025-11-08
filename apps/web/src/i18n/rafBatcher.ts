/**
 * rAF Batcher - Batches multiple payloads into single emit per animation frame
 * 
 * Guarantees at most 1 emit per frame, regardless of how many queue calls.
 * Safe for multiple calls within the same tick.
 */

export interface RafBatcher<T> {
  queue(payload: T): void;
  flushNow(): void;
}

/**
 * Create a requestAnimationFrame batcher
 * 
 * @param emit Function to call with batched payloads (array)
 * @returns Batcher instance with queue() and flushNow() methods
 */
export function createRafBatcher<T>(emit: (payloads: T[]) => void): RafBatcher<T> {
  let queue: T[] = [];
  let scheduled = false;
  let rafId: number | null = null;
  
  const flush = () => {
    if (queue.length === 0) {
      scheduled = false;
      return;
    }
    
    // Copy and clear queue
    const payloads = [...queue];
    queue = [];
    scheduled = false;
    rafId = null;
    
    // Emit batched payloads
    emit(payloads);
  };
  
  const scheduleFlush = () => {
    if (scheduled) return;
    
    scheduled = true;
    rafId = requestAnimationFrame(() => {
      flush();
    });
  };
  
  return {
    queue(payload: T) {
      queue.push(payload);
      scheduleFlush();
    },
    
    flushNow() {
      // Cancel scheduled flush if any
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
        scheduled = false;
      }
      
      // Flush immediately
      flush();
    }
  };
}

