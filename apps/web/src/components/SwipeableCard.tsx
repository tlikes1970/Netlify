import React from 'react';
import type { MediaItem, CardActionHandlers } from './card.types';
import { useSwipeActions } from '../hooks/useSwipeActions';
import { useIsDesktop } from '../hooks/useDeviceDetection';

export interface SwipeableCardProps {
  item: MediaItem;
  actions?: CardActionHandlers;
  context: 'tab-watching' | 'tab-want' | 'tab-watched' | 'tab-foryou' | 'search' | 'home' | 'holiday';
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

  const {
    swipeState,
    cardRef,
    previewAction,
    handlers
  } = useSwipeActions({
    item,
    actions,
    context,
    disableSwipe: swipeDisabled
  });

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
        ref={cardRef}
        className={`transition-transform duration-200 ease-out ${className}`}
        style={{
          transform: getTransform(),
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
