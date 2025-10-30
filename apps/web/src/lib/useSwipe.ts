import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { SWIPE } from './gestures';

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

    setSwipeState(s => ({ ...s, isSwipeActive: true, swipeDistance: 0, direction: null, actionTriggered: false }));
    onSwipeStart?.();
  }, [disabled, onSwipeStart]);

  const moveCore = useCallback((x: number, y: number) => {
    if (disabled || !swipeState.isSwipeActive) return;

    const dx = x - startX.current;
    const dy = y - startY.current;

    if (!axisLock.current) {
      const ax = Math.abs(dx), ay = Math.abs(dy);
      if (ax > 8 || ay > 8) axisLock.current = ax > ay ? 'x' : 'y';
    }
    if (axisLock.current === 'y') return; // let vertical scroll happen

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
  }, [disabled, swipeState.isSwipeActive, enableBidirectional, maxSwipeDistance, clampX, onSwipeMove]);

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
      if (e.pointerType === 'mouse' || e.pointerType === 'touch' || e.pointerType === 'pen') {
        begin(e.clientX, e.clientY);
      }
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!swipeState.isSwipeActive) return;
      moveCore(e.clientX, e.clientY);
      if (!captured.current && axisLock.current === 'x' && elementRef.current) {
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
  }), [begin, moveCore, endCore, swipeState.isSwipeActive]);

  // Touch fallback for older iOS
  const touchHandlers = useMemo(() => ({
    onTouchStart: (e: React.TouchEvent) => begin(e.touches[0].clientX, e.touches[0].clientY),
    onTouchMove: (e: React.TouchEvent) => {
      const t = e.touches[0];
      const dx = t.clientX - startX.current, dy = t.clientY - startY.current;
      if (!axisLock.current) {
        const ax = Math.abs(dx), ay = Math.abs(dy);
        if (ax > 8 || ay > 8) axisLock.current = ax > ay ? 'x' : 'y';
      }
      if (axisLock.current === 'x') { e.preventDefault(); moveCore(t.clientX, t.clientY); }
    },
    onTouchEnd: () => endCore()
  }), [begin, moveCore, endCore]);

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
