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
      
      if (gestureRef.current) {
        gestureRef.current.setPointerCapture(e.pointerId);
        gestureRef.current.classList.add('dragging');
        gestureRef.current.parentElement?.classList.add('dragging');
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

    // Close swipe on escape key
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isSwipeOpen) {
          if (contentRef.current) {
            contentRef.current.style.transform = 'translateX(0)';
            setIsSwipeOpen(false);
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isSwipeOpen]);

    // Close swipe when clicking outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (ref && 'current' in ref && ref.current && !ref.current.contains(e.target as Node)) {
          if (contentRef.current && isSwipeOpen) {
            contentRef.current.style.transform = 'translateX(0)';
            setIsSwipeOpen(false);
          }
        }
      };

      if (isSwipeOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isSwipeOpen, ref]);

  return (
    <div
      ref={ref}
      data-swipe-container
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 5,
        margin: 0,
        padding: 0,
        border: 'none',
        boxSizing: 'border-box',
        background: 'transparent'
      }}
    >
        {/* Gesture Plane */}
        <div
          ref={gestureRef}
          className="gesture-plane"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'auto',
            touchAction: 'pan-y',
            cursor: 'grab',
            background: 'transparent'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        />

        {/* Trailing Actions */}
        <div
          className="swipe-actions"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '120px',
            backgroundColor: 'var(--accent, #007AFF)',
            borderRadius: '0 var(--radius-md, 10px) var(--radius-md, 10px) 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-sm, 8px)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease-out',
            pointerEvents: 'auto'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm, 8px)' }}>
            {swipeConfig.leftAction && (
              <button
                onClick={swipeConfig.leftAction.action}
                className="swipe-action-button"
                style={{
                  padding: 'var(--space-sm, 8px)',
                  borderRadius: 'var(--radius-sm, 6px)',
                  fontSize: 'var(--font-xs, 12px)',
                  backgroundColor: 'var(--bg, #ffffff)',
                  color: 'var(--accent, #007AFF)',
                  border: '1px solid var(--bg, #ffffff)',
                  cursor: 'pointer',
                  fontWeight: '500',
                  minWidth: '80px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-hover, #0056CC)';
                  e.currentTarget.style.color = 'var(--bg, #ffffff)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg, #ffffff)';
                  e.currentTarget.style.color = 'var(--accent, #007AFF)';
                }}
              >
                {swipeConfig.leftAction.label}
              </button>
            )}
            {swipeConfig.rightAction && (
              <button
                onClick={swipeConfig.rightAction.action}
                className="swipe-action-button"
                style={{
                  padding: 'var(--space-sm, 8px)',
                  borderRadius: 'var(--radius-sm, 6px)',
                  fontSize: 'var(--font-xs, 12px)',
                  backgroundColor: 'var(--bg, #ffffff)',
                  color: 'var(--accent, #007AFF)',
                  border: '1px solid var(--bg, #ffffff)',
                  cursor: 'pointer',
                  fontWeight: '500',
                  minWidth: '80px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-hover, #0056CC)';
                  e.currentTarget.style.color = 'var(--bg, #ffffff)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg, #ffffff)';
                  e.currentTarget.style.color = 'var(--accent, #007AFF)';
                }}
              >
                {swipeConfig.rightAction.label}
              </button>
            )}
          </div>
        </div>

        {/* Swipe Indicator */}
        <div
          className="swipe-indicator"
          style={{
            position: 'absolute',
            top: '50%',
            right: 'var(--space-sm, 8px)',
            transform: 'translateY(-50%)',
            opacity: isSwipeOpen ? 0 : 0.3,
            transition: 'opacity 0.3s ease-out',
            pointerEvents: 'none'
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </div>
    );
  }
);

SwipeRowOverlay.displayName = 'SwipeRowOverlay';
