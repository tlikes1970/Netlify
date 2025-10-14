import { useState, useRef, useCallback } from 'react';
import type { MediaItem, CardActionHandlers } from '../components/cards/card.types';
import { useIsDesktop } from './useDeviceDetection';

export interface SwipeAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  backgroundColor: string;
  action: (item: MediaItem) => void;
}

export interface SwipeState {
  isSwipeActive: boolean;
  swipeDistance: number;
  direction: 'left' | 'right' | null;
  actionTriggered: boolean;
}

export interface UseSwipeActionsProps {
  item: MediaItem;
  actions?: CardActionHandlers;
  context: 'tab-watching' | 'tab-want' | 'tab-watched' | 'tab-foryou' | 'search' | 'home' | 'holiday';
  threshold?: number;
  maxSwipeDistance?: number;
  disableSwipe?: boolean; // New prop to disable swipe actions
}

export function useSwipeActions({
  item,
  actions,
  context,
  threshold = 100,
  maxSwipeDistance = 200,
  disableSwipe = false
}: UseSwipeActionsProps) {
  // Auto-disable swipe on desktop
  const isDesktopDevice = useIsDesktop();
  const swipeDisabled = disableSwipe || isDesktopDevice;
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwipeActive: false,
    swipeDistance: 0,
    direction: null,
    actionTriggered: false
  });

  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Define swipe actions based on context
  const getSwipeActions = useCallback((): SwipeAction[] => {
    // const baseActions: SwipeAction[] = []; // Unused

    switch (context) {
      case 'tab-watching':
        return [
          {
            id: 'want',
            label: 'Want',
            icon: '❤️',
            color: '#ffffff',
            backgroundColor: '#ef4444',
            action: () => actions?.onWant?.(item)
          },
          {
            id: 'watched',
            label: 'Watched',
            icon: '✅',
            color: '#ffffff',
            backgroundColor: '#10b981',
            action: () => actions?.onWatched?.(item)
          },
          {
            id: 'not-interested',
            label: 'Not Interested',
            icon: '👎',
            color: '#ffffff',
            backgroundColor: '#6b7280',
            action: () => actions?.onNotInterested?.(item)
          },
          {
            id: 'delete',
            label: 'Delete',
            icon: '🗑️',
            color: '#ffffff',
            backgroundColor: '#dc2626',
            action: () => actions?.onDelete?.(item)
          }
        ];

      case 'tab-want':
        return [
          {
            id: 'watching',
            label: 'Watching',
            icon: '▶️',
            color: '#ffffff',
            backgroundColor: '#3b82f6',
            action: () => actions?.onWant?.(item) // Move to watching
          },
          {
            id: 'watched',
            label: 'Watched',
            icon: '✅',
            color: '#ffffff',
            backgroundColor: '#10b981',
            action: () => actions?.onWatched?.(item)
          },
          {
            id: 'delete',
            label: 'Remove',
            icon: '🗑️',
            color: '#ffffff',
            backgroundColor: '#dc2626',
            action: () => actions?.onDelete?.(item)
          }
        ];

      case 'tab-watched':
        return [
          {
            id: 'watching',
            label: 'Rewatch',
            icon: '🔄',
            color: '#ffffff',
            backgroundColor: '#3b82f6',
            action: () => actions?.onWant?.(item) // Move to watching
          },
          {
            id: 'want',
            label: 'Want',
            icon: '❤️',
            color: '#ffffff',
            backgroundColor: '#ef4444',
            action: () => actions?.onWant?.(item)
          },
          {
            id: 'delete',
            label: 'Remove',
            icon: '🗑️',
            color: '#ffffff',
            backgroundColor: '#dc2626',
            action: () => actions?.onDelete?.(item)
          }
        ];

      case 'tab-foryou':
      case 'search':
      case 'home':
        return [
          {
            id: 'want',
            label: 'Want to Watch',
            icon: '❤️',
            color: '#ffffff',
            backgroundColor: '#ef4444',
            action: () => actions?.onWant?.(item)
          }
        ];

      default:
        return [];
    }
  }, [context, actions, item]);

  const swipeActions = getSwipeActions();

  // Touch/Mouse event handlers
  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (swipeDisabled) return; // Skip if swipe is disabled
    
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
  }, [swipeDisabled]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!swipeState.isSwipeActive) return;

    const deltaX = clientX - startX.current;
    const deltaY = clientY - startY.current;
    
    // Determine if this is a horizontal swipe (not vertical scroll)
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    
    if (!isDragging.current && Math.abs(deltaX) > 10) {
      isDragging.current = true;
    }

    if (isDragging.current && isHorizontalSwipe) {
      const distance = Math.min(Math.abs(deltaX), maxSwipeDistance);
      const direction = deltaX > 0 ? 'right' : 'left';
      
      setSwipeState(prev => ({
        ...prev,
        swipeDistance: distance,
        direction
      }));

      // Prevent default scrolling when swiping
      return false;
    }
  }, [swipeState.isSwipeActive, maxSwipeDistance]);

  const handleEnd = useCallback(() => {
    if (!swipeState.isSwipeActive) return;

    const { swipeDistance, direction } = swipeState;
    
    // Check if swipe threshold was met
    if (swipeDistance >= threshold && direction && !swipeState.actionTriggered) {
      // Determine which action to trigger based on direction and available actions
      let actionToTrigger: SwipeAction | null = null;
      
      if (direction === 'right' && swipeActions.length > 0) {
        // Right swipe = first action
        actionToTrigger = swipeActions[0];
      } else if (direction === 'left' && swipeActions.length > 1) {
        // Left swipe = second action
        actionToTrigger = swipeActions[1];
      }

      if (actionToTrigger) {
        setSwipeState(prev => ({
          ...prev,
          actionTriggered: true
        }));
        
        // Trigger the action
        actionToTrigger.action(item);
        
        // Add haptic feedback on mobile
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }

    // Reset swipe state
    setTimeout(() => {
      setSwipeState({
        isSwipeActive: false,
        swipeDistance: 0,
        direction: null,
        actionTriggered: false
      });
    }, 300);
  }, [swipeState, threshold, swipeActions, item]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  }, [handleStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const shouldPrevent = handleMove(touch.clientX, touch.clientY);
    if (shouldPrevent === false) {
      e.preventDefault();
    }
  }, [handleMove]);

  const handleTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Mouse events (for desktop testing)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  }, [handleStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Get the current action being previewed
  const getPreviewAction = useCallback((): SwipeAction | null => {
    if (!swipeState.isSwipeActive || swipeState.swipeDistance < threshold) {
      return null;
    }

    if (swipeState.direction === 'right' && swipeActions.length > 0) {
      return swipeActions[0];
    } else if (swipeState.direction === 'left' && swipeActions.length > 1) {
      return swipeActions[1];
    }

    return null;
  }, [swipeState, threshold, swipeActions]);

  return {
    swipeState,
    cardRef,
    swipeActions,
    previewAction: getPreviewAction(),
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp
    }
  };
}
