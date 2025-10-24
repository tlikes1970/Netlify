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
  item: MediaItem;
}

export const SwipeRowOverlay = forwardRef<HTMLDivElement, SwipeRowOverlayProps>(
  ({ swipeConfig, item }, ref) => {
    const [isSwipeOpen, setIsSwipeOpen] = useState(false);
    const [startX, setStartX] = useState(0);
    const [currentX, setCurrentX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
      const touch = e.touches[0];
      setStartX(touch.clientX);
      setCurrentX(touch.clientX);
      setIsDragging(true);
      
      if (contentRef.current) {
        contentRef.current.setAttribute('data-swipe-active', 'true');
      }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDragging) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      
      // Only allow left swipe (negative deltaX)
      if (deltaX < 0) {
        const maxSwipe = -120;
        const clampedDelta = Math.max(deltaX, maxSwipe);
        setCurrentX(touch.clientX);
        
        if (contentRef.current) {
          contentRef.current.style.transform = `translateX(${clampedDelta}px)`;
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      
      setIsDragging(false);
      const deltaX = currentX - startX;
      
      if (contentRef.current) {
        contentRef.current.removeAttribute('data-swipe-active');
        
        if (deltaX < -60) {
          contentRef.current.style.transform = 'translateX(-120px)';
          setIsSwipeOpen(true);
        } else {
          contentRef.current.style.transform = 'translateX(0)';
          setIsSwipeOpen(false);
        }
      }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      setStartX(e.clientX);
      setCurrentX(e.clientX);
      setIsDragging(true);
      
      if (contentRef.current) {
        contentRef.current.setAttribute('data-swipe-active', 'true');
      }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      
      if (deltaX < 0) {
        const maxSwipe = -120;
        const clampedDelta = Math.max(deltaX, maxSwipe);
        setCurrentX(e.clientX);
        
        if (contentRef.current) {
          contentRef.current.style.transform = `translateX(${clampedDelta}px)`;
        }
      }
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      
      setIsDragging(false);
      const deltaX = currentX - startX;
      
      if (contentRef.current) {
        contentRef.current.removeAttribute('data-swipe-active');
        
        if (deltaX < -60) {
          contentRef.current.style.transform = 'translateX(-120px)';
          setIsSwipeOpen(true);
        } else {
          contentRef.current.style.transform = 'translateX(0)';
          setIsSwipeOpen(false);
        }
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
        className="swipe-row-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 5,
          margin: 0,
          padding: 0,
          border: 'none',
          boxSizing: 'border-box'
        }}
      >
        {/* Gesture Zone */}
        <div
          ref={contentRef}
          className="swipe-gesture-zone"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'auto',
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            transform: 'translateX(0)',
            backgroundColor: 'transparent'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
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
