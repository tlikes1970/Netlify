import React, { useState, useRef, forwardRef, useEffect } from 'react';
import type { SwipeConfig } from '../../../lib/swipeMaps';
import type { MediaItem, CardActionHandlers } from '../card.types';

/**
 * Process: Swipe Row Overlay
 * Purpose: Non-layout-affecting swipe gesture overlay for mobile cards
 * Data Source: Swipe configuration and card dimensions
 * Update Path: ResizeObserver updates overlay size to match card
 * Dependencies: CardBaseMobile, cards-mobile.css
 */

interface SwipeRowOverlayProps {
  swipeConfig: SwipeConfig;
  targetRef: React.RefObject<HTMLElement>;
  item: MediaItem;
  actions?: CardActionHandlers;
}

export const SwipeRowOverlay = forwardRef<HTMLDivElement, SwipeRowOverlayProps>(
  ({ swipeConfig, targetRef, item, actions }, ref) => {
    const [startX, setStartX] = useState(0);
    const [currentX, setCurrentX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [captureId, setCaptureId] = useState<number | null>(null);
    const gestureRef = useRef<HTMLDivElement>(null);

    // Normalized thresholds
    const OPEN_TRAY = 60;   // px
    const FIRE_PRIMARY = 100; // px

    const handlePointerDown = (e: React.PointerEvent) => {
      // Only handle mouse and touch pointers
      if (e.pointerType !== 'mouse' && e.pointerType !== 'touch') return;
      
      // Ignore events starting in drag rail or rating row
      const t = e.target as HTMLElement;
      if (t.closest('.drag-rail') || t.closest('.rating-row .stars')) return;
      
      setStartX(e.clientX);
      setCurrentX(e.clientX);
      setIsDragging(true);
      setCaptureId(e.pointerId);
      
      // Add dragging class to card
      const card = gestureRef.current?.closest('.card-mobile');
      if (card) {
        card.classList.add('dragging');
      }
      
      if (gestureRef.current) {
        gestureRef.current.setPointerCapture(e.pointerId);
        gestureRef.current.classList.add('dragging');
      }
      
      if (targetRef.current) {
        targetRef.current.setAttribute('data-swipe-active', 'true');
      }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
      if (!isDragging || captureId !== e.pointerId) return;
      
      const deltaX = e.clientX - startX;
      setCurrentX(e.clientX);
      
      // Set drag direction classes on card
      const card = gestureRef.current?.closest('.card-mobile');
      if (card) {
        card.classList.add('dragging');
        card.classList.toggle('drag-left', deltaX < 0);
        card.classList.toggle('drag-right', deltaX > 0);
      }
      
      // Apply transform to the real content target with clamping
      if (targetRef.current) {
        const clampedDelta = Math.min(0, deltaX); // Only allow left swipes
        const maxSwipe = -120; // Maximum swipe distance
        const finalDelta = Math.max(clampedDelta, maxSwipe);
        targetRef.current.style.transform = `translate3d(${finalDelta}px, 0, 0)`;
      }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
      if (!isDragging || captureId !== e.pointerId) return;
      
      setIsDragging(false);
      setCaptureId(null);
      
      // Remove dragging class from card
      const card = gestureRef.current?.closest('.card-mobile');
      if (card) {
        card.classList.remove('dragging', 'drag-left', 'drag-right');
      }
      
      if (gestureRef.current) {
        gestureRef.current.releasePointerCapture(e.pointerId);
        gestureRef.current.classList.remove('dragging');
      }
      
      const deltaX = currentX - startX;
      
      if (targetRef.current) {
        targetRef.current.removeAttribute('data-swipe-active');
        
        if (deltaX <= -FIRE_PRIMARY) {
          // Fire primary action and snap back
          targetRef.current.style.transition = 'transform 160ms ease-out';
          targetRef.current.style.transform = 'translate3d(0, 0, 0)';
          
          // Trigger the primary action (rightAction for left swipes)
          if (swipeConfig.rightAction) {
            swipeConfig.rightAction.action(item, actions);
          }
          
          setTimeout(() => {
            if (targetRef.current) {
              targetRef.current.style.transition = '';
            }
          }, 180);
        } else if (deltaX <= -OPEN_TRAY) {
          // Open tray state without firing action
          targetRef.current.style.transition = 'transform 160ms ease-out';
          targetRef.current.style.transform = 'translate3d(-120px, 0, 0)';
          
          // Add swipe-open class for CSS styling
          if (card) {
            card.classList.add('swipe-open');
          }
        } else {
          // Snap back to original position
          targetRef.current.style.transition = 'transform 160ms ease-out';
          targetRef.current.style.transform = 'translate3d(0, 0, 0)';
          setTimeout(() => {
            if (targetRef.current) {
              targetRef.current.style.transition = '';
            }
          }, 180);
        }
      }
    };

    const handlePointerCancel = (e: React.PointerEvent) => {
      if (captureId !== e.pointerId) return;
      
      setIsDragging(false);
      setCaptureId(null);
      
      // Remove dragging class from card
      const card = gestureRef.current?.closest('.card-mobile');
      if (card) {
        card.classList.remove('dragging', 'drag-left', 'drag-right');
      }
      
      if (gestureRef.current) {
        gestureRef.current.releasePointerCapture(e.pointerId);
        gestureRef.current.classList.remove('dragging');
      }
      
      if (targetRef.current) {
        targetRef.current.removeAttribute('data-swipe-active');
        targetRef.current.style.transition = 'transform 160ms ease-out';
        targetRef.current.style.transform = 'translate3d(0, 0, 0)';
        setTimeout(() => {
          if (targetRef.current) {
            targetRef.current.style.transition = '';
          }
        }, 200);
      }
    };

    // Escape and outside-click handlers
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          const card = gestureRef.current?.closest('.card-mobile');
          if (card && card.classList.contains('swipe-open')) {
            card.classList.remove('swipe-open');
            if (targetRef.current) {
              targetRef.current.style.transition = 'transform 160ms ease-out';
              targetRef.current.style.transform = 'translate3d(0, 0, 0)';
              setTimeout(() => {
                if (targetRef.current) {
                  targetRef.current.style.transition = '';
                }
              }, 180);
            }
          }
        }
      };

      const handleClickOutside = (e: MouseEvent) => {
        const card = gestureRef.current?.closest('.card-mobile');
        if (card && card.classList.contains('swipe-open') && !card.contains(e.target as Node)) {
          card.classList.remove('swipe-open');
          if (targetRef.current) {
            targetRef.current.style.transition = 'transform 160ms ease-out';
            targetRef.current.style.transform = 'translate3d(0, 0, 0)';
            setTimeout(() => {
              if (targetRef.current) {
                targetRef.current.style.transition = '';
              }
            }, 180);
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);


  return (
    <div 
      ref={ref}
      className="gesture-plane"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    />
    );
  }
);

SwipeRowOverlay.displayName = 'SwipeRowOverlay';
