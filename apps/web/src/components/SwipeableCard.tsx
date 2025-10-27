import React from 'react';
import type { MediaItem, CardActionHandlers, CardContext } from '../components/cards/card.types';
import { useSwipe } from '../lib/useSwipe';
import { useIsDesktop } from '../hooks/useDeviceDetection';
import { SWIPE } from '../lib/gestures';
import { Library } from '../lib/storage';

export interface SwipeableCardProps {
  item: MediaItem;
  actions?: CardActionHandlers;
  context: CardContext;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disableSwipe?: boolean; // New prop to disable swipe actions
}

export default function SwipeableCard({
  item,
  actions,
  context,
  children,
  className = '',
  style = {},
  disableSwipe = false
}: SwipeableCardProps) {
  // Auto-disable swipe on desktop
  const isDesktopDevice = useIsDesktop();
  const swipeDisabled = disableSwipe || isDesktopDevice;

  // Define swipe actions based on context
  const getSwipeActions = () => {
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
            action: () => {
              // Move from wishlist to watching
              if (item.id && item.mediaType) {
                Library.move(item.id, item.mediaType, 'watching');
              }
            }
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
            action: () => {
              // Move from watched to watching
              if (item.id && item.mediaType) {
                Library.move(item.id, item.mediaType, 'watching');
              }
            }
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

      case 'tab-not':
        return [
          {
            id: 'watching',
            label: 'Watching',
            icon: '▶️',
            color: '#ffffff',
            backgroundColor: '#3b82f6',
            action: () => {
              // Move from not interested to watching
              if (item.id && item.mediaType) {
                Library.move(item.id, item.mediaType, 'watching');
              }
            }
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

      default:
        return [];
    }
  };

  const swipeActions = getSwipeActions();

  const {
    swipeState,
    elementRef,
    handlers
  } = useSwipe({
    config: {
      threshold: SWIPE.threshold,
      maxSwipeDistance: SWIPE.max,
      enableBidirectional: true
    },
    onSwipeAction: (direction) => {
      if (direction === 'right' && swipeActions.length > 0) {
        swipeActions[0].action();
      } else if (direction === 'left' && swipeActions.length > 1) {
        swipeActions[1].action();
      }
    },
    disabled: swipeDisabled
  });

  // Get the current action being previewed
  const getPreviewAction = () => {
    if (!swipeState.isSwipeActive || swipeState.swipeDistance < SWIPE.threshold) {
      return null;
    }

    if (swipeState.direction === 'right' && swipeActions.length > 0) {
      return swipeActions[0];
    } else if (swipeState.direction === 'left' && swipeActions.length > 1) {
      return swipeActions[1];
    }

    return null;
  };

  const previewAction = getPreviewAction();

  // Calculate transform based on swipe state
  const getTransform = () => {
    if (!swipeState.isSwipeActive) return 'translateX(0)';
    
    const distance = swipeState.swipeDistance;
    const direction = swipeState.direction;
    
    if (direction === 'right') {
      return `translateX(${distance}px)`;
    } else if (direction === 'left') {
      return `translateX(-${distance}px)`;
    }
    
    return 'translateX(0)';
  };

  // Calculate swipe action overlay opacity
  const getOverlayOpacity = () => {
    if (!swipeState.isSwipeActive || !previewAction) return 0;
    
    const progress = Math.min(swipeState.swipeDistance / 100, 1);
    return progress * 0.9; // Max opacity of 0.9
  };

  return (
    <div className="relative overflow-hidden">
      {/* Swipe Action Overlays */}
      {previewAction && (
        <>
          {/* Right swipe action (first action) */}
          {swipeState.direction === 'right' && (
            <div
              className="absolute inset-0 flex items-center justify-start pl-6 z-10 transition-opacity duration-200"
              style={{
                backgroundColor: previewAction.backgroundColor,
                opacity: getOverlayOpacity()
              }}
            >
              <div className="flex items-center gap-3 text-white">
                <span className="text-2xl">{previewAction.icon}</span>
                <div>
                  <div className="text-sm font-semibold">{previewAction.label}</div>
                  <div className="text-xs opacity-90">Swipe to {previewAction.label.toLowerCase()}</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Left swipe action (second action) */}
          {swipeState.direction === 'left' && (
            <div
              className="absolute inset-0 flex items-center justify-end pr-6 z-10 transition-opacity duration-200"
              style={{
                backgroundColor: previewAction.backgroundColor,
                opacity: getOverlayOpacity()
              }}
            >
              <div className="flex items-center gap-3 text-white">
                <div className="text-right">
                  <div className="text-sm font-semibold">{previewAction.label}</div>
                  <div className="text-xs opacity-90">Swipe to {previewAction.label.toLowerCase()}</div>
                </div>
                <span className="text-2xl">{previewAction.icon}</span>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Main Card Content */}
      <div
        ref={elementRef}
        className={`transition-transform duration-200 ease-out ${swipeDisabled ? '' : 'swipe-surface'} ${className}`}
        style={{
          transform: getTransform(),
          pointerEvents: swipeState.isSwipeActive && swipeState.swipeDistance > 0 ? 'none' : 'auto',
          ...style
        }}
        {...(swipeDisabled ? {} : handlers)}
      >
        {children}
      </div>
      
      {/* Swipe Instructions (only show on mobile) */}
      {!swipeState.isSwipeActive && !isDesktopDevice && (
        <div className="absolute top-2 right-2 z-20 opacity-0 hover:opacity-100 transition-opacity duration-200">
          <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            <div className="flex items-center gap-1">
              <span>👆</span>
              <span>Swipe for actions</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
