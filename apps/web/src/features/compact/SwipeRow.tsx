import React, { useState, useRef, useEffect } from 'react';

interface SwipeRowProps {
  children: React.ReactNode;
  trailingActions: React.ReactNode;
}

export function SwipeRow({ children, trailingActions }: SwipeRowProps) {
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const gate = document.documentElement.dataset.compactMobileV1 === 'true';
  const flagEnabled = document.documentElement.dataset.actionsSplit === 'true';
  const isMobile = window.innerWidth < 768;

  // If not mobile or gate/flag not enabled, render children passthrough
  if (!gate || !flagEnabled || !isMobile) {
    return <>{children}</>;
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setCurrentX(touch.clientX);
    setIsDragging(true);
    
    // Add performance optimization attribute
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
      const maxSwipe = -120; // Maximum swipe distance
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
    
    // Remove performance optimization attribute
    if (contentRef.current) {
      contentRef.current.removeAttribute('data-swipe-active');
    }
    
    if (contentRef.current) {
      if (deltaX < -60) {
        // Swipe threshold reached, open the actions
        contentRef.current.style.transform = 'translateX(-120px)';
        setIsSwipeOpen(true);
      } else {
        // Snap back to original position
        contentRef.current.style.transform = 'translateX(0)';
        setIsSwipeOpen(false);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setCurrentX(e.clientX);
    setIsDragging(true);
    
    // Add performance optimization attribute
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
    
    // Remove performance optimization attribute
    if (contentRef.current) {
      contentRef.current.removeAttribute('data-swipe-active');
    }
    
    if (contentRef.current) {
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
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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
  }, [isSwipeOpen]);

  return (
    <div
      ref={containerRef}
      className="swipe-row-container"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--radius, 12px)',
        backgroundColor: 'var(--card, #ffffff)',
        border: '1px solid var(--line, #e0e0e0)'
      }}
    >
      {/* Main content */}
      <div
        ref={contentRef}
        className="swipe-row-content"
        style={{
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          transform: 'translateX(0)',
          backgroundColor: 'var(--card, #ffffff)',
          borderRadius: 'var(--radius, 12px)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {children}
      </div>

      {/* Trailing actions */}
      <div
        className="swipe-row-actions"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '120px',
          backgroundColor: 'var(--accent, #007AFF)',
          borderRadius: '0 var(--radius, 12px) var(--radius, 12px) 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-2, 8px)',
          transform: 'translateX(100%)',
          transition: 'transform 0.3s ease-out'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2, 8px)' }}>
          {trailingActions}
        </div>
      </div>

      {/* Swipe indicator */}
      <div
        className="swipe-indicator"
        style={{
          position: 'absolute',
          top: '50%',
          right: 'var(--space-2, 8px)',
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
