/**
 * Process: Pull-to-Refresh
 * Purpose: Provide pull-to-refresh gesture handling with iOS freeze prevention
 * Data Source: Touch events, container scroll state
 * Update Path: usePullToRefresh hook configuration
 * Dependencies: scrollFeatureFlags (pull-refresh-fix, ios-scroll-fix)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { isScrollFeatureEnabled } from '../utils/scrollFeatureFlags';

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

// Thresholds (feature-flagged)
const START_THRESHOLD = 20; // Must pull down 20px before PTR "owns" the gesture
const VISUAL_THRESHOLD = 16; // No transforms below this distance
const SCROLL_TOLERANCE = 5; // Tolerance for "at top" detection (px)

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPullDistance = 120,
  resistance = 0.5,
  enabled = true
}: UsePullToRefreshProps) {
  const pullRefreshEnabled = typeof window !== 'undefined' && isScrollFeatureEnabled('pull-refresh-fix');
  const iosScrollFixEnabled = typeof window !== 'undefined' && isScrollFeatureEnabled('ios-scroll-fix');
  
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    canRefresh: false
  });

  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const topTolerance = pullRefreshEnabled || iosScrollFixEnabled ? SCROLL_TOLERANCE : 0;

  // Check if container is actually scrollable
  const isContainerScrollable = useCallback((container: HTMLElement): boolean => {
    const { scrollHeight, clientHeight } = container;
    const tolerance = 1; // Small tolerance for floating point
    return scrollHeight > clientHeight + tolerance;
  }, []);

  // Check if container is at top with tolerance
  const isAtTop = useCallback((container: HTMLElement): boolean => {
    const scrollTop = container.scrollTop || (container as any).scrollY || 0;
    return scrollTop <= topTolerance;
  }, [topTolerance]);

  // Calculate pull distance with resistance
  const calculatePullDistance = useCallback((deltaY: number) => {
    if (deltaY <= 0) return 0;
    
    // Apply resistance - harder to pull as distance increases
    const resistanceFactor = Math.max(0.1, 1 - (deltaY / maxPullDistance));
    return Math.min(deltaY * resistanceFactor, maxPullDistance);
  }, [maxPullDistance, resistance]);

  // Handle touch start - observe only, do not block
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || state.isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;

    // Guard: Disable PTR for non-scrollable containers
    if (!isContainerScrollable(container)) {
      return;
    }

    // Only consider PTR if at top
    if (!isAtTop(container)) {
      return;
    }

    const touch = e.touches[0];
    startY.current = touch.clientY;
    currentY.current = touch.clientY;
    
    // Reset pulling state on new touch
    if (state.isPulling) {
      setState(prev => ({
        ...prev,
        isPulling: false,
        pullDistance: 0,
        canRefresh: false
      }));
    }
  }, [enabled, state.isRefreshing, state.isPulling, isContainerScrollable, isAtTop]);

  // Handle touch move - only preventDefault when already in pulling state
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || state.isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;

    // Guard: Disable PTR for non-scrollable containers
    if (!isContainerScrollable(container)) {
      // Hard reset if we were pulling
      if (state.isPulling) {
        setState(prev => ({
          ...prev,
          isPulling: false,
          pullDistance: 0,
          canRefresh: false
        }));
      }
      return;
    }

    // Check if still at top - if scrolled away, hard reset
    if (!isAtTop(container)) {
      if (state.isPulling) {
        setState(prev => ({
          ...prev,
          isPulling: false,
          pullDistance: 0,
          canRefresh: false
        }));
      }
      return;
    }

    const touch = e.touches[0];
    currentY.current = touch.clientY;
    
    const deltaY = currentY.current - startY.current;
    
    // Only transition to pulling if all conditions met:
    // 1. Clearly downward gesture (deltaY > START_THRESHOLD)
    // 2. Container is scrollable (already checked)
    // 3. Container is at top (already checked)
    const shouldEnterPulling = deltaY > START_THRESHOLD;

    if (shouldEnterPulling) {
      // We are now in pulling state
      const pullDistance = calculatePullDistance(deltaY);
      const canRefresh = pullDistance >= threshold;
      
      const wasPulling = state.isPulling;
      
      setState(prev => ({
        ...prev,
        isPulling: true,
        pullDistance,
        canRefresh
      }));

      // Only preventDefault if we're in pulling state AND past start threshold
      // This allows native scroll for micro flicks (< START_THRESHOLD)
      if (!wasPulling && deltaY > START_THRESHOLD) {
        // Logging for debugging (can be removed in production)
        if (process.env.NODE_ENV === 'development' && pullRefreshEnabled) {
          console.log('PTR considered', {
            scrollTop: container.scrollTop,
            deltaY,
            isPulling: true
          });
        }
      }

      // Only call preventDefault when we're definitely in pulling state
      if (e.cancelable) {
        e.preventDefault();
        if (process.env.NODE_ENV === 'development' && pullRefreshEnabled) {
          console.log('PTR blocked default', {
            isPulling: true,
            deltaY,
            pullDistance
          });
        }
      }
    } else {
      // Not enough downward movement - let native scroll handle it
      // But if we were pulling and user pulled up, reset
      if (state.isPulling && deltaY <= 0) {
        setState(prev => ({
          ...prev,
          isPulling: false,
          pullDistance: 0,
          canRefresh: false
        }));
      }
    }
  }, [enabled, state.isRefreshing, state.isPulling, threshold, calculatePullDistance, isContainerScrollable, isAtTop, pullRefreshEnabled]);

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (!enabled) return;

    // If we were pulling and reached refresh threshold, trigger refresh
    if (state.isPulling && state.canRefresh && !state.isRefreshing) {
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
    } else if (state.isPulling) {
      // Reset without refreshing - snap back
      setState(prev => ({
        ...prev,
        isPulling: false,
        pullDistance: 0,
        canRefresh: false
      }));
    }
  }, [enabled, state.isPulling, state.canRefresh, state.isRefreshing, onRefresh]);

  // Add event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // touchstart: passive true (observe only, don't block)
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    
    // touchmove: passive false (need option to preventDefault), but only call preventDefault when pulling
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    // touchend: passive true (non-blocking)
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Calculate refresh indicator styles - no visual feedback below visual threshold
  const getRefreshIndicatorStyles = () => {
    // Only show indicator if pull distance exceeds visual threshold
    const effectiveDistance = state.pullDistance >= VISUAL_THRESHOLD ? state.pullDistance : 0;
    const progress = Math.min(effectiveDistance / threshold, 1);
    const opacity = state.isPulling && effectiveDistance > 0 ? Math.min(progress, 1) : 0;
    const scale = state.isRefreshing ? 1 : Math.min(progress, 1);
    
    return {
      transform: effectiveDistance > 0 ? `translateY(${effectiveDistance}px) scale(${scale})` : 'translateY(0) scale(0)',
      opacity,
      transition: state.isRefreshing ? 'all 0.3s ease-out' : 'opacity 0.2s ease-out'
    };
  };

  // Calculate container styles - no transform below visual threshold
  const getContainerStyles = () => {
    // Only apply transform if pull distance exceeds visual threshold
    const effectiveDistance = state.pullDistance >= VISUAL_THRESHOLD ? state.pullDistance : 0;
    
    return {
      transform: effectiveDistance > 0 ? `translateY(${effectiveDistance}px)` : 'translateY(0)',
      transition: state.isRefreshing ? 'transform 0.3s ease-out' : (state.isPulling && effectiveDistance === 0 ? 'transform 0.2s ease-out' : 'none')
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
