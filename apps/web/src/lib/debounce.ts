/**
 * Process: Debounce Utility
 * Purpose: Debounce function calls with flush capability for persistence operations
 * Data Source: Function calls
 * Update Path: Use debounce() to wrap functions that need debouncing
 * Dependencies: None
 */

export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  flush: () => void;
  cancel: () => void;
}

/**
 * Debounce a function with flush and cancel capabilities
 * @param fn Function to debounce
 * @param wait Debounce delay in milliseconds (default: 150ms)
 * @returns Debounced function with flush() and cancel() methods
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number = 150
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let isPending = false;

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args;
    isPending = true;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      if (lastArgs && isPending) {
        fn(...lastArgs);
        isPending = false;
        lastArgs = null;
      }
      timeoutId = null;
    }, wait);
  };

  // Flush: execute immediately if pending
  debounced.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (lastArgs && isPending) {
      fn(...lastArgs);
      isPending = false;
      lastArgs = null;
    }
  };

  // Cancel: cancel pending execution
  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    isPending = false;
    lastArgs = null;
  };

  return debounced as DebouncedFunction<T>;
}









