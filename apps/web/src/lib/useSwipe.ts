import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { SWIPE } from './gestures';
import { isScrollFeatureEnabled } from '../utils/scrollFeatureFlags';

export interface SwipeState {
  isSwipeActive: boolean;
  swipeDistance: number;
  direction: 'left' | 'right' | null;
  actionTriggered: boolean;
}
export interface SwipeConfig {
  threshold?: number;
  maxSwipeDistance?: number;
  enableBidirectional?: boolean;
  enableRTL?: boolean;
}
export interface UseSwipeProps {
  config?: SwipeConfig;
  onSwipeStart?: () => void;
  onSwipeMove?: (distance: number, direction: 'left' | 'right') => void;
  onSwipeEnd?: (distance: number, direction: 'left' | 'right' | null) => void;
  onSwipeAction?: (direction: 'left' | 'right') => void;
  disabled?: boolean;
}

export function useSwipe({
  config = {},
  onSwipeStart,
  onSwipeMove,
  onSwipeEnd,
  onSwipeAction,
  disabled = false
}: UseSwipeProps = {}) {
  const {
    threshold = SWIPE.threshold,
    maxSwipeDistance = SWIPE.max,
    enableBidirectional = true
  } = config;

  // Phase 5: Check if swipe timing improvements are enabled
  const swipeTimingEnabled = typeof window !== 'undefined' && isScrollFeatureEnabled('swipe-timing-fix');

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwipeActive: false,
    swipeDistance: 0,
    direction: null,
    actionTriggered: false
  });

  const elementRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const axisLock = useRef<'x' | 'y' | null>(null);
  const captured = useRef(false);

  // rAF coalescing
  const rafId = useRef<number | null>(null);
  const pending = useRef<{ distance: number; direction: 'left' | 'right' | null } | null>(null);

  const clampX = useCallback((dx: number, b: { min: number; max: number }) => Math.min(Math.max(dx, b.min), b.max), []);

  const begin = useCallback((x: number, y: number) => {
    if (disabled) return;
    startX.current = x;
    startY.current = y;
    axisLock.current = null;
    captured.current = false;

    // Phase 5: Don't activate swipe immediately - wait for movement to determine intent
    // This allows quick touches to start scrolling without interference
    if (swipeTimingEnabled) {
      setSwipeState(s => ({ ...s, isSwipeActive: false, swipeDistance: 0, direction: null, actionTriggered: false }));
      // Don't call onSwipeStart yet - wait until we know it's actually a swipe
    } else {
      // Original behavior: activate immediately
      setSwipeState(s => ({ ...s, isSwipeActive: true, swipeDistance: 0, direction: null, actionTriggered: false }));
      onSwipeStart?.();
    }
  }, [disabled, swipeTimingEnabled, onSwipeStart]);

  const moveCore = useCallback((x: number, y: number) => {
    if (disabled) return;

    const dx = x - startX.current;
    const dy = y - startY.current;

    // Phase 5: Check if we need to activate swipe (first movement after touch)
    // Only if swipe timing improvements are enabled
    const needsActivation = swipeTimingEnabled && axisLock.current === null && startX.current !== 0 && startY.current !== 0;
    
    if (needsActivation) {
      const ax = Math.abs(dx), ay = Math.abs(dy);
      // Require clear movement (10px minimum) before considering swipe
      if (ax < 10 && ay < 10) {
        // Too small - don't activate, allow scroll
        return;
      }
      
      // Determine axis - strongly bias toward vertical for quick scrolls
      // On iOS, quick upward scrolls can have initial horizontal drift that misclassifies
      if (ax > ay * 2.0) {
        // Horizontal must be TWICE vertical to lock - very strict requirement
        axisLock.current = 'x';
        setSwipeState(s => ({ ...s, isSwipeActive: true, swipeDistance: 0, direction: null, actionTriggered: false }));
        onSwipeStart?.();
      } else if (ay > ax * 1.2) {
        // Vertical is clearly dominant - lock to y immediately and allow scroll
        axisLock.current = 'y';
        // Don't activate swipe for vertical - allow scroll
        return;
      } else {
        // Too close to call - strongly prefer vertical (allow scrolling)
        // This handles cases where there's slight horizontal drift during rapid vertical scroll
        if (ay >= ax) {
          // If vertical is equal or greater, prefer vertical (allow scroll)
          axisLock.current = 'y';
          return; // Allow scroll
        }
        // If horizontal is slightly more but not 2x, wait for more movement
        // Don't lock to horizontal too quickly - give vertical scroll a chance
        return;
      }
    }

    // If locked to vertical, always allow scroll
    if (axisLock.current === 'y') return;

    // Phase 5: If we reach here and axis isn't locked yet, determine axis
    // This handles cases where activation check didn't run (e.g., if feature disabled)
    if (axisLock.current === null) {
      const ax = Math.abs(dx), ay = Math.abs(dy);
      if (swipeTimingEnabled) {
        // Phase 5: Improved axis detection - strongly bias toward vertical
        if (ax > 15 || ay > 15) {
          // Require horizontal to be 2x vertical (very strict) to avoid false positives
          if (ax > ay * 2.0) {
            axisLock.current = 'x';
            // Activate swipe if not already active
            if (!swipeState.isSwipeActive) {
              setSwipeState(s => ({ ...s, isSwipeActive: true, swipeDistance: 0, direction: null, actionTriggered: false }));
              onSwipeStart?.();
            }
          } else if (ay > ax * 1.2) {
            // Vertical is clearly dominant - lock immediately and allow scroll
            axisLock.current = 'y';
            return; // Allow scroll
          } else {
            // Ambiguous - prefer vertical if equal or greater
            if (ay >= ax) {
              axisLock.current = 'y';
            }
            // Otherwise wait for more movement
          }
        } else {
          // Not enough movement yet - wait
          return;
        }
      } else {
        // Original behavior: simpler axis detection
        if (ax > 8 || ay > 8) {
          axisLock.current = ax > ay ? 'x' : 'y';
        }
      }
    }
    
    // If locked to vertical, allow scroll
    if (axisLock.current === 'y') return;

    const bounds = enableBidirectional ? { min: -maxSwipeDistance, max: maxSwipeDistance }
                                       : { min: -maxSwipeDistance, max: 0 };
    const clamped = clampX(dx, bounds);
    const distance = Math.abs(clamped);
    const direction: 'left' | 'right' | null = clamped === 0 ? null : (clamped > 0 ? 'right' : 'left');

    pending.current = { distance, direction };
    if (rafId.current == null) {
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        const p = pending.current;
        pending.current = null;
        if (!p) return;
        setSwipeState(s => ({ ...s, swipeDistance: p.distance, direction: p.direction }));
        if (p.direction) onSwipeMove?.(p.distance, p.direction);
      });
    }
  }, [disabled, swipeState.isSwipeActive, enableBidirectional, maxSwipeDistance, clampX, onSwipeMove, onSwipeStart, swipeTimingEnabled]);

  const endCore = useCallback(() => {
    if (disabled || !swipeState.isSwipeActive) {
      axisLock.current = null; captured.current = false; return;
    }
    const { swipeDistance, direction, actionTriggered } = swipeState;

    onSwipeEnd?.(swipeDistance, direction);
    if (swipeDistance >= threshold && direction && !actionTriggered) {
      setSwipeState(s => ({ ...s, actionTriggered: true }));
      onSwipeAction?.(direction);
      if (navigator.vibrate) navigator.vibrate(30);
    }
    setSwipeState({ isSwipeActive: false, swipeDistance: 0, direction: null, actionTriggered: false });
    axisLock.current = null; captured.current = false;
  }, [disabled, swipeState, threshold, onSwipeEnd, onSwipeAction]);

  const pointerHandlers = useMemo(() => ({
    onPointerDown: (e: React.PointerEvent) => {
      // Only handle pointer events from touch/pen, not mouse (mouse wheel should work normally)
      // Mouse button clicks are handled separately, so we only need touch/pen for swipe
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        begin(e.clientX, e.clientY);
      }
    },
    onPointerMove: (e: React.PointerEvent) => {
      // Only handle touch/pen pointer events, not mouse (mouse wheel/scroll should work normally)
      if (e.pointerType === 'mouse') return;
      
      // Phase 5: If timing improvements enabled, always call moveCore to allow activation check
      // Otherwise, only call if swipe is already active (original behavior)
      if (swipeTimingEnabled || swipeState.isSwipeActive) {
        moveCore(e.clientX, e.clientY);
      }
      // Only capture pointer if swipe is active and locked to horizontal
      if (!captured.current && swipeState.isSwipeActive && axisLock.current === 'x' && elementRef.current) {
        captured.current = true;
        elementRef.current.setPointerCapture?.(e.pointerId);
      }
    },
    onPointerUp: (e: React.PointerEvent) => {
      endCore();
      if (captured.current && elementRef.current) elementRef.current.releasePointerCapture?.(e.pointerId);
    },
    onPointerCancel: (e: React.PointerEvent) => {
      endCore();
      if (captured.current && elementRef.current) elementRef.current.releasePointerCapture?.(e.pointerId);
    }
  }), [begin, moveCore, endCore, swipeState.isSwipeActive, swipeTimingEnabled]);

  // Touch fallback for older iOS
  const touchHandlers = useMemo(() => ({
    onTouchStart: (e: React.TouchEvent) => begin(e.touches[0].clientX, e.touches[0].clientY),
    onTouchMove: (e: React.TouchEvent) => {
      const t = e.touches[0];
      
      // Quick check: if this is upward vertical movement, immediately allow scroll
      // This handles quick flicks where ANY upward movement should immediately allow scroll
      const dx = t.clientX - startX.current;
      const dy = t.clientY - startY.current;
      const ay = Math.abs(dy);
      const ax = Math.abs(dx);
      
      // If ANY upward movement detected, immediately lock to vertical and allow scroll
      // This is critical for quick flicks - even 1px upward should trigger this
      if (dy < 0 && (axisLock.current === null || axisLock.current === 'y')) {
        // Upward scroll detected - lock to vertical immediately and return
        // Don't wait for thresholds - quick flicks need immediate response
        axisLock.current = 'y';
        // Don't call moveCore - just allow the scroll to proceed
        return;
      }
      
      // Also check for significant downward movement (but not upward)
      // If downward is clearly dominant, also lock to vertical
      if (dy > 0 && ay > ax && axisLock.current === null) {
        axisLock.current = 'y';
        return;
      }
      
      // If already locked to vertical, don't process at all - just allow scroll
      if (axisLock.current === 'y') {
        return;
      }
      
      // Phase 5: Call moveCore for axis detection and activation
      moveCore(t.clientX, t.clientY);
      
      // Only preventDefault if we're definitely in horizontal swipe mode
      // Check if event is cancelable to avoid "Ignored attempt to cancel" warnings
      // If locked to y or still uncertain, allow default scroll behavior
      if (axisLock.current === 'x' && swipeState.isSwipeActive && e.cancelable) { 
        e.preventDefault(); 
      }
    },
    onTouchEnd: () => endCore()
  }), [begin, moveCore, endCore, swipeState.isSwipeActive]);

  useEffect(() => () => { if (rafId.current != null) cancelAnimationFrame(rafId.current); }, []);

  // Only reset on history pop; do not tie to scroll events
  useEffect(() => {
    const onPop = () => {
      setSwipeState({ isSwipeActive: false, swipeDistance: 0, direction: null, actionTriggered: false });
      axisLock.current = null; captured.current = false;
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const supportsPointer = typeof window !== 'undefined' && 'PointerEvent' in window;
  return {
    swipeState,
    elementRef,
    handlers: supportsPointer
      ? pointerHandlers
      : { ...touchHandlers, onMouseDown: (e: any) => begin(e.clientX, e.clientY), onMouseMove: (e: any) => moveCore(e.clientX, e.clientY), onMouseUp: () => endCore() }
  };
}
