import React, { useState, useRef, useEffect, forwardRef } from 'react';
import type { MediaItem } from '../card.types';

/**
 * Process: Swipe Row Overlay
 * Purpose: Non-layout-affecting swipe gesture overlay for mobile cards
 * Data Source: Swipe configuration and card dimensions
 * Update Path: ResizeObserver updates overlay size to match card
 * Dependencies: CardBaseMobile, cards-mobile.css
 */

interface SwipeRowOverlayProps {
  swipeConfig: {
    leftAction?: { label: string; action: () => void };
    rightAction?: { label: string; action: () => void };
  };
  targetRef: React.RefObject<HTMLElement>;
}

export const SwipeRowOverlay = forwardRef<HTMLDivElement, SwipeRowOverlayProps>(
  ({ swipeConfig, targetRef }, ref) => {
    const [isSwipeOpen, setIsSwipeOpen] = useState(false);
    const [startX, setStartX] = useState(0);
    const [currentX, setCurrentX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [captureId, setCaptureId] = useState<number | null>(null);
    const gestureRef = useRef<HTMLDivElement>(null);

    const handlePointerDown = (e: React.PointerEvent) => {
      // Only handle mouse and touch pointers
      if (e.pointerType !== 'mouse' && e.pointerType !== 'touch') return;
      
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
      
      // Apply transform to the real content target
      if (targetRef.current) {
        const maxSwipe = -120; // Maximum swipe distance
        const clampedDelta = Math.max(deltaX, maxSwipe);
        targetRef.current.style.transform = `translate3d(${clampedDelta}px, 0, 0)`;
      }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
      if (!isDragging || captureId !== e.pointerId) return;
      
      setIsDragging(false);
      setCaptureId(null);
      
      // Remove dragging class from card
      const card = gestureRef.current?.closest('.card-mobile');
      if (card) {
        card.classList.remove('dragging');
      }
      
      if (gestureRef.current) {
        gestureRef.current.releasePointerCapture(e.pointerId);
        gestureRef.current.classList.remove('dragging');
      }
      
      const deltaX = currentX - startX;
      
      if (targetRef.current) {
        targetRef.current.removeAttribute('data-swipe-active');
        
        if (deltaX < -64) {
          // Swipe threshold reached, trigger action
          targetRef.current.style.transition = 'transform 160ms ease-out';
          targetRef.current.style.transform = 'translate3d(-120px, 0, 0)';
          setIsSwipeOpen(true);
          
          // Trigger the appropriate action based on swipe distance
          if (deltaX < -100 && swipeConfig.rightAction) {
            swipeConfig.rightAction.action();
          } else if (swipeConfig.leftAction) {
            swipeConfig.leftAction.action();
          }
        } else {
          // Snap back to original position
          targetRef.current.style.transition = 'transform 160ms ease-out';
          targetRef.current.style.transform = 'translate3d(0, 0, 0)';
          setTimeout(() => {
            if (targetRef.current) {
              targetRef.current.style.transition = '';
            }
          }, 200);
          setIsSwipeOpen(false);
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
        card.classList.remove('dragging');
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
        setIsSwipeOpen(false);
      }
    };


  return (
    <div className="gesture-plane"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    />
    );
  }
);

SwipeRowOverlay.displayName = 'SwipeRowOverlay';
