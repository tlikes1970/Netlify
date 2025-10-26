import { useState, useRef, useCallback, useEffect } from 'react';
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

  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Clamp X delta with min/max bounds
  const clampX = useCallback((deltaX: number, bounds: { min: number; max: number }) => {
    return Math.min(Math.max(deltaX, bounds.min), bounds.max);
  }, []);

  // Handle pointer/touch start
  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (disabled) return;
    
    startX.current = clientX;
    startY.current = clientY;
    isDragging.current = false;
    
    setSwipeState(prev => ({
      ...prev,
      isSwipeActive: true,
      swipeDistance: 0,
      direction: null,
      actionTriggered: false
    }));

    onSwipeStart?.();
  }, [disabled, onSwipeStart]);

  // Handle pointer/touch move
  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!swipeState.isSwipeActive || disabled) return;

    const deltaX = clientX - startX.current;
    const deltaY = clientY - startY.current;
    
    // Determine if this is a horizontal swipe (not vertical scroll)
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    
    if (!isDragging.current && Math.abs(deltaX) > 10) {
      isDragging.current = true;
    }

    if (isDragging.current && isHorizontalSwipe) {
      // Apply clamping based on configuration
      const bounds = enableBidirectional 
        ? { min: -maxSwipeDistance, max: maxSwipeDistance }
        : { min: -maxSwipeDistance, max: 0 }; // Only left swipes
      
      const clampedDeltaX = clampX(deltaX, bounds);
      const distance = Math.abs(clampedDeltaX);
      const direction = clampedDeltaX > 0 ? 'right' : 'left';
      
      setSwipeState(prev => ({
        ...prev,
        swipeDistance: distance,
        direction
      }));

      onSwipeMove?.(distance, direction);
    }
  }, [swipeState.isSwipeActive, disabled, maxSwipeDistance, enableBidirectional, clampX, onSwipeMove]);

  // Handle pointer/touch end
  const handleEnd = useCallback(() => {
    if (!swipeState.isSwipeActive || disabled) return;

    const { swipeDistance, direction } = swipeState;
    
    onSwipeEnd?.(swipeDistance, direction);
    
    // Check if swipe threshold was met
    if (swipeDistance >= threshold && direction && !swipeState.actionTriggered) {
      setSwipeState(prev => ({
        ...prev,
        actionTriggered: true
      }));
      
      onSwipeAction?.(direction);
      
      // Add haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }

    // Reset swipe state - respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const resetDelay = prefersReducedMotion ? 0 : 300;
    
    setTimeout(() => {
      setSwipeState({
        isSwipeActive: false,
        swipeDistance: 0,
        direction: null,
        actionTriggered: false
      });
    }, resetDelay);
  }, [swipeState, threshold, disabled, onSwipeEnd, onSwipeAction]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  }, [handleStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  }, [handleMove]);

  const handleTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Mouse events (for desktop testing)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  }, [handleStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Pointer events (modern approach)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only handle mouse and touch pointers
    if (e.pointerType !== 'mouse' && e.pointerType !== 'touch') return;
    
    handleStart(e.clientX, e.clientY);
    
    if (elementRef.current) {
      elementRef.current.setPointerCapture(e.pointerId);
    }
  }, [handleStart]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    handleEnd();
    
    if (elementRef.current) {
      elementRef.current.releasePointerCapture(e.pointerId);
    }
  }, [handleEnd]);

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    handleEnd();
    
    if (elementRef.current) {
      elementRef.current.releasePointerCapture(e.pointerId);
    }
  }, [handleEnd]);

  // Programmatic close on route changes and scroll start
  useEffect(() => {
    const handleRouteChange = () => {
      if (swipeState.isSwipeActive) {
        setSwipeState({
          isSwipeActive: false,
          swipeDistance: 0,
          direction: null,
          actionTriggered: false
        });
      }
    };

    const handleScrollStart = () => {
      if (swipeState.isSwipeActive) {
        setSwipeState({
          isSwipeActive: false,
          swipeDistance: 0,
          direction: null,
          actionTriggered: false
        });
      }
    };

    // Listen for route changes (popstate) and scroll events
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('scroll', handleScrollStart, { passive: true });
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('scroll', handleScrollStart);
    };
  }, [swipeState.isSwipeActive]);

  return {
    swipeState,
    elementRef,
    handlers: {
      // Pointer events (preferred - modern approach)
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      // Touch events (fallback for older browsers)
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      // Mouse events (for desktop testing)
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp
    }
  };
}
