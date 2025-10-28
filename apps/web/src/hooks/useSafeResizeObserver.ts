import { useEffect, useRef } from 'react';

/**
 * Safe ResizeObserver hook with proper lifecycle management
 * 
 * Features:
 * - One observer per element
 * - SSR safety (no window access on server)
 * - Bulletproof cleanup
 * - Performance throttling via requestAnimationFrame
 * - Visibility guard for conditional elements
 */
export function useSafeResizeObserver<T extends HTMLElement>(
  targetRef: React.RefObject<T>,
  onResize: (entry: ResizeObserverEntry) => void,
  options?: {
    enabled?: boolean;
    throttle?: boolean;
  }
) {
  const observerRef = useRef<ResizeObserver | null>(null);
  const { enabled = true, throttle = true } = options || {};

  useEffect(() => {
    const el = targetRef.current;
    if (!el || !enabled) return;
    
    // SSR guard
    if (typeof window === 'undefined' || typeof (window as any).ResizeObserver !== 'function') return;

    // Create observer if it doesn't exist
    if (!observerRef.current) {
      observerRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (throttle) {
            // Throttle via requestAnimationFrame for performance
            requestAnimationFrame(() => {
              onResize(entry);
            });
          } else {
            onResize(entry);
          }
        }
      });
    }

    const obs = observerRef.current;
    obs.observe(el);

    return () => {
      try {
        if (obs && el) {
          obs.unobserve(el);
        }
        // Only disconnect if this was the last element being observed
        // Note: ResizeObserver doesn't provide a way to check observed elements count
        // So we disconnect and recreate on next use
        if (observerRef.current) {
          observerRef.current.disconnect();
          observerRef.current = null;
        }
      } catch (error) {
        // Silently handle cleanup errors
        console.warn('ResizeObserver cleanup error:', error);
      }
    };
  }, [targetRef, onResize, enabled, throttle]);
}

/**
 * Hook for multiple elements with the same resize handler
 * Creates one observer per element but manages them efficiently
 */
export function useSafeResizeObserverMultiple<T extends HTMLElement>(
  targetRefs: React.RefObject<T>[],
  onResize: (entry: ResizeObserverEntry) => void,
  options?: {
    enabled?: boolean;
    throttle?: boolean;
  }
) {
  const observerRef = useRef<ResizeObserver | null>(null);
  const { enabled = true, throttle = true } = options || {};

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined' || typeof (window as any).ResizeObserver !== 'function') return;
    if (!enabled) return;

    // Create observer if it doesn't exist
    if (!observerRef.current) {
      observerRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (throttle) {
            requestAnimationFrame(() => {
              onResize(entry);
            });
          } else {
            onResize(entry);
          }
        }
      });
    }

    const obs = observerRef.current;
    
    // Observe all valid elements
    const validElements: T[] = [];
    targetRefs.forEach(ref => {
      if (ref.current) {
        obs.observe(ref.current);
        validElements.push(ref.current);
      }
    });

    return () => {
      try {
        // Unobserve all elements
        validElements.forEach(el => {
          if (obs && el) {
            obs.unobserve(el);
          }
        });
        
        // Disconnect and cleanup
        if (observerRef.current) {
          observerRef.current.disconnect();
          observerRef.current = null;
        }
      } catch (error) {
        console.warn('ResizeObserver cleanup error:', error);
      }
    };
  }, [targetRefs, onResize, enabled, throttle]);
}




