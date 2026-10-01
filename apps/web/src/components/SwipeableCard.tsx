import React from 'react';
import { SwipeOverflowContext } from './SwipeOverflowContext';
import type { MediaItem, CardActionHandlers, CardContext } from '../components/cards/card.types';
import { useSwipe } from '../lib/useSwipe';
import { useIsDesktop } from '../hooks/useDeviceDetection';
import { SWIPE } from '../lib/gestures';
import { setPrimaryStatus } from '../lib/statusTransitions';

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
  const { isDesktop: isDesktopDevice } = useIsDesktop();
  const swipeDisabled = disableSwipe || isDesktopDevice;
  const [overflowOpen, setOverflowOpen] = React.useState(false);

  // Define swipe actions based on context
  const getSwipeActions = () => {
    switch (context) {
      case 'tab-watching':
        return [
          {
            id: 'watched',
            label: 'Watched',
            icon: '',
            color: '#ffffff',
            backgroundColor: '#10b981',
            action: () => setPrimaryStatus(item, 'watched', { feedback: true })
          },
          {
            id: 'want',
            label: 'Want to Watch',
            icon: '',
            color: '#ffffff',
            backgroundColor: '#ef4444',
            action: () => setPrimaryStatus(item, 'wishlist', { feedback: true })
          }
        ];

      case 'tab-want':
        return [
          {
            id: 'watched',
            label: 'Watched',
            icon: '',
            color: '#ffffff',
            backgroundColor: '#10b981',
            action: () => setPrimaryStatus(item, 'watched', { feedback: true })
          },
          {
            id: 'watching',
            label: 'Currently Watching',
            icon: '',
            color: '#ffffff',
            backgroundColor: '#3b82f6',
            action: () => setPrimaryStatus(item, 'watching', { feedback: true })
          }
        ];

      case 'tab-watched':
        return [
          {
            id: 'want',
            label: 'Want to Watch',
            icon: '',
            color: '#ffffff',
            backgroundColor: '#ef4444',
            action: () => setPrimaryStatus(item, 'wishlist', { feedback: true })
          },
          {
            id: 'watching',
            label: 'Currently Watching',
            icon: '',
            color: '#ffffff',
            backgroundColor: '#3b82f6',
            action: () => setPrimaryStatus(item, 'watching', { feedback: true })
          }
        ];

      case 'tab-foryou':
      case 'search':
      case 'home':
        return [
          {
            id: 'want',
            label: 'Want to Watch',
            icon: '',
            color: '#ffffff',
            backgroundColor: '#ef4444',
            action: () => setPrimaryStatus(item, 'wishlist', { feedback: true })
          }
        ];

      case 'tab-not':
        return [
          {
            id: 'watching',
            label: 'Currently Watching',
            icon: '',
            color: '#ffffff',
            backgroundColor: '#3b82f6',
            action: () => setPrimaryStatus(item, 'watching', { feedback: true })
          },
          {
            id: 'delete',
            label: 'Delete',
            icon: '',
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
  const rowRef = React.useRef<HTMLDivElement>(null);

  const resetSwipeTransform = React.useCallback(() => {
    if (rowRef.current) {
      rowRef.current.style.transform = '';
    }
  }, []);

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
    onSwipeMove: (d, dir) => {
      if (
        typeof document !== 'undefined' &&
        document.querySelector('[data-drag-active="true"]')
      ) {
        resetSwipeTransform();
        return;
      }
      if (rowRef.current) {
        rowRef.current.style.transform = `translateX(${dir === 'left' ? -d : d}px)`;
      }
    },
    onSwipeEnd: resetSwipeTransform,
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
  // Show preview much earlier (at 20px instead of 100px threshold) so users see what will happen
  const getPreviewAction = () => {
    if (!swipeState.isSwipeActive || swipeState.swipeDistance < 20) {
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


  // Calculate swipe action overlay opacity
  // Show animation earlier - start at 15px, full opacity by 60px (instead of 100px)
  const getOverlayOpacity = () => {
    if (!swipeState.isSwipeActive || !previewAction) return 0;
    
    // Start showing at 15px, reach full opacity by 60px
    const minDistance = 15;
    const maxDistance = 60;
    const progress = swipeState.swipeDistance < minDistance 
      ? 0 
      : Math.min((swipeState.swipeDistance - minDistance) / (maxDistance - minDistance), 1);
    return progress * 0.9; // Max opacity of 0.9
  };

  return (
    <SwipeOverflowContext.Provider value={setOverflowOpen}>
    <div className="group/swipe-card relative overflow-hidden">
      {/* Swipe Action Overlays */}
      {previewAction && (
        <>
          {/* Right swipe action (first action) */}
          {swipeState.direction === 'right' && (
            <div
              className="absolute inset-0 flex items-center justify-start pl-6 z-10 transition-opacity duration-300"
              style={{
                backgroundColor: previewAction.backgroundColor,
                opacity: getOverlayOpacity()
              }}
            >
              <div className="flex items-center gap-3" style={{ color: previewAction.color }}>
                {previewAction.icon && <span className="text-2xl">{previewAction.icon}</span>}
                <div>
                  <div 
                    className="text-sm font-semibold" 
                    style={{ 
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)',
                      WebkitTextStroke: '0.5px rgba(0,0,0,0.8)'
                    }}
                  >
                    {previewAction.label}
                  </div>
                  <div 
                    className="text-xs opacity-90"
                    style={{ 
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      WebkitTextStroke: '0.3px rgba(0,0,0,0.8)'
                    }}
                  >
                    Swipe to {previewAction.label.toLowerCase()}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Left swipe action (second action) */}
          {swipeState.direction === 'left' && (
            <div
              className="absolute inset-0 flex items-center justify-end pr-6 z-10 transition-opacity duration-300"
              style={{
                backgroundColor: previewAction.backgroundColor,
                opacity: getOverlayOpacity()
              }}
            >
              <div className="flex items-center gap-3" style={{ color: previewAction.color }}>
                <div className="text-right">
                  <div 
                    className="text-sm font-semibold"
                    style={{ 
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)',
                      WebkitTextStroke: '0.5px rgba(0,0,0,0.8)'
                    }}
                  >
                    {previewAction.label}
                  </div>
                  <div 
                    className="text-xs opacity-90"
                    style={{ 
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      WebkitTextStroke: '0.3px rgba(0,0,0,0.8)'
                    }}
                  >
                    Swipe to {previewAction.label.toLowerCase()}
                  </div>
                </div>
                {previewAction.icon && <span className="text-2xl">{previewAction.icon}</span>}
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Main Card Content */}
      <div ref={elementRef} className={`${swipeDisabled ? '' : 'swipeable'} ${className}`} {...(swipeDisabled ? {} : handlers)}>
        <div ref={rowRef} style={{ pointerEvents: swipeState.isSwipeActive && swipeState.swipeDistance > 0 ? 'none' : 'auto', ...style }}>
          {children}
        </div>
      </div>
      
      {/* Swipe Instructions (only show on mobile) */}
      {!swipeState.isSwipeActive && !isDesktopDevice && !overflowOpen && (
        <div className="pointer-events-none absolute top-2 right-2 z-20 opacity-0 group-hover/swipe-card:opacity-100 transition-opacity duration-200">
          <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            <div className="flex items-center gap-1">
              <span>👆</span>
              <span>Swipe for actions</span>
            </div>
          </div>
        </div>
      )}
    </div>
    </SwipeOverflowContext.Provider>
  );
}
