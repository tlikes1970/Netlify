import { useState, useRef, useCallback, useEffect } from 'react';

export interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  canRefresh: boolean;
}

export interface UsePullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  maxPullDistance?: number;
  resistance?: number;
  enabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPullDistance = 120,
  resistance = 0.5,
  enabled = true
}: UsePullToRefreshProps) {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    canRefresh: false
  });

  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate pull distance with resistance
  const calculatePullDistance = useCallback((deltaY: number) => {
    if (deltaY <= 0) return 0;
    
    // Apply resistance - harder to pull as distance increases
    const resistanceFactor = Math.max(0.1, 1 - (deltaY / maxPullDistance));
    return Math.min(deltaY * resistanceFactor, maxPullDistance);
  }, [maxPullDistance, resistance]);

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || state.isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;

    // Only start pull-to-refresh if we're at the top of the scroll
    if (container.scrollTop > 0) return;

    const touch = e.touches[0];
    startY.current = touch.clientY;
    currentY.current = touch.clientY;
    isDragging.current = false;
  }, [enabled, state.isRefreshing]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || state.isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;

    // Only handle if we're at the top of the scroll
    if (container.scrollTop > 0) return;

    const touch = e.touches[0];
    currentY.current = touch.clientY;
    
    const deltaY = currentY.current - startY.current;
    
    // Only start dragging if we've moved down enough
    if (!isDragging.current && deltaY > 10) {
      isDragging.current = true;
    }

    if (isDragging.current && deltaY > 0) {
      const pullDistance = calculatePullDistance(deltaY);
      const canRefresh = pullDistance >= threshold;
      
      setState(prev => ({
        ...prev,
        isPulling: true,
        pullDistance,
        canRefresh
      }));

      // Prevent default scrolling when pulling
      e.preventDefault();
    }
  }, [enabled, state.isRefreshing, threshold, calculatePullDistance]);

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (!enabled || !state.isPulling) return;

    if (state.canRefresh && !state.isRefreshing) {
      setState(prev => ({
        ...prev,
        isRefreshing: true,
        isPulling: false
      }));

      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull-to-refresh error:', error);
      } finally {
        setState(prev => ({
          ...prev,
          isRefreshing: false,
          pullDistance: 0,
          canRefresh: false
        }));
      }
    } else {
      // Reset without refreshing
      setState(prev => ({
        ...prev,
        isPulling: false,
        pullDistance: 0,
        canRefresh: false
      }));
    }

    isDragging.current = false;
  }, [enabled, state.isPulling, state.canRefresh, state.isRefreshing, onRefresh]);

  // Add event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Calculate refresh indicator styles
  const getRefreshIndicatorStyles = () => {
    const progress = Math.min(state.pullDistance / threshold, 1);
    const opacity = state.isPulling ? Math.min(progress, 1) : 0;
    const scale = state.isRefreshing ? 1 : Math.min(progress, 1);
    
    return {
      transform: `translateY(${state.pullDistance}px) scale(${scale})`,
      opacity,
      transition: state.isRefreshing ? 'all 0.3s ease-out' : 'opacity 0.2s ease-out'
    };
  };

  // Calculate container styles
  const getContainerStyles = () => {
    return {
      transform: state.isPulling ? `translateY(${state.pullDistance}px)` : 'translateY(0)',
      transition: state.isRefreshing ? 'transform 0.3s ease-out' : 'none'
    };
  };

  return {
    state,
    containerRef,
    refreshIndicatorStyles: getRefreshIndicatorStyles(),
    containerStyles: getContainerStyles(),
    isEnabled: enabled
  };
}
