/**
 * Process: Modal Scroll Isolation
 * Purpose: Ensure modals have completely isolated scroll contexts, preventing background scroll leakage
 * Data Source: Modal DOM elements, scroll events, touch events
 * Update Path: applyModalScrollIsolation() and removeModalScrollIsolation()
 * Dependencies: scrollFeatureFlags, scrollLock (for verification)
 */

import React from 'react';
import { isScrollFeatureEnabled } from './scrollFeatureFlags';

/**
 * Check if modal scroll isolation improvements are enabled
 */
function isModalIsolationEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return isScrollFeatureEnabled('modal-scroll-isolation');
  } catch {
    return false;
  }
}

/**
 * Apply scroll isolation styles and event handlers to a modal container
 * This ensures modal scrolling doesn't leak to the background
 */
export function applyModalScrollIsolation(
  modalElement: HTMLElement | null,
  overlayElement: HTMLElement | null
): () => void {
  if (!isModalIsolationEnabled() || !modalElement) {
    return () => {}; // No-op cleanup
  }

  const cleanupFunctions: (() => void)[] = [];

  // 1. Apply CSS for scroll isolation
  const modalContent = modalElement.querySelector('[class*="content"], [class*="body"], [class*="dialog"]') as HTMLElement;
  const scrollableElements = modalContent 
    ? [modalContent, ...Array.from(modalContent.querySelectorAll('[class*="scroll"], [class*="overflow"]')) as HTMLElement[]]
    : [];

  // Apply overscroll-behavior to prevent scroll chaining
  const applyOverscrollBehavior = (element: HTMLElement) => {
    const originalOverscroll = element.style.overscrollBehavior;
    element.style.overscrollBehavior = 'contain';
    cleanupFunctions.push(() => {
      element.style.overscrollBehavior = originalOverscroll;
    });
  };

  // Apply to modal and all scrollable children
  if (modalContent) {
    applyOverscrollBehavior(modalContent);
  }
  scrollableElements.forEach(applyOverscrollBehavior);

  // 2. Prevent touch event propagation from overlay to background
  if (overlayElement) {
    const handleOverlayTouchStart = (e: TouchEvent) => {
      // Prevent touch events on overlay from reaching background
      if (e.target === overlayElement) {
        e.stopPropagation();
      }
    };

    const handleOverlayTouchMove = (e: TouchEvent) => {
      // Prevent scroll on overlay from affecting background
      if (e.target === overlayElement) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    overlayElement.addEventListener('touchstart', handleOverlayTouchStart, { passive: true });
    overlayElement.addEventListener('touchmove', handleOverlayTouchMove, { passive: false });
    cleanupFunctions.push(() => {
      overlayElement.removeEventListener('touchstart', handleOverlayTouchStart);
      overlayElement.removeEventListener('touchmove', handleOverlayTouchMove);
    });
  }

  // 3. Scroll boundary detection for modal content (prevents overscroll)
  // Note: overscroll-behavior: contain CSS handles most cases, but we add JS fallback
  if (modalContent) {
    let touchStartY = 0;
    let isScrolling = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (modalContent?.contains(e.target as Node)) {
        touchStartY = e.touches[0]?.clientY || 0;
        isScrolling = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!modalContent?.contains(e.target as Node)) return;
      
      const target = e.target as HTMLElement;
      const scrollableParent = target.closest('[style*="overflow"], [class*="scroll"], [class*="overflow"]') as HTMLElement;
      const scrollable = scrollableParent || modalContent;
      
      if (!scrollable) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollable;
      const touchY = e.touches[0]?.clientY || 0;
      const deltaY = touchY - touchStartY;
      
      // If at boundaries and trying to overscroll, prevent it
      const isAtTop = scrollTop <= 0;
      const isAtBottom = scrollTop >= scrollHeight - clientHeight - 1;
      
      if ((isAtTop && deltaY > 0) || (isAtBottom && deltaY < 0)) {
        // Trying to overscroll - prevent default and stop propagation
        e.preventDefault();
        e.stopPropagation();
        isScrolling = true;
      } else {
        // Normal scroll - allow it, but prevent propagation to background
        e.stopPropagation();
      }
    };

    modalContent.addEventListener('touchstart', handleTouchStart, { passive: true });
    modalContent.addEventListener('touchmove', handleTouchMove, { passive: false });
    cleanupFunctions.push(() => {
      modalContent.removeEventListener('touchstart', handleTouchStart);
      modalContent.removeEventListener('touchmove', handleTouchMove);
    });
  }

  // 4. Prevent wheel events from propagating to background
  const handleWheel = (e: WheelEvent) => {
    // Only prevent if scrolling modal content
    const target = e.target as HTMLElement;
    if (modalElement.contains(target)) {
      e.stopPropagation();
      
      // If at scroll boundaries, prevent further scrolling
      const scrollableTarget = target.closest('[style*="overflow"], [class*="scroll"]') as HTMLElement;
      if (scrollableTarget) {
        const { scrollTop, scrollHeight, clientHeight } = scrollableTarget;
        const isAtTop = scrollTop <= 0;
        const isAtBottom = scrollTop >= scrollHeight - clientHeight - 1;
        
        if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
          e.preventDefault();
        }
      }
    }
  };

  document.addEventListener('wheel', handleWheel, { passive: false });
  cleanupFunctions.push(() => {
    document.removeEventListener('wheel', handleWheel);
  });

  // Return cleanup function
  return () => {
    cleanupFunctions.forEach(fn => fn());
  };
}

/**
 * Create a React hook for modal scroll isolation
 * Usage: const cleanup = useModalScrollIsolation(modalRef, overlayRef, isOpen);
 */
export function useModalScrollIsolation(
  modalRef: React.RefObject<HTMLElement>,
  overlayRef: React.RefObject<HTMLElement> | null,
  isOpen: boolean
): void {
  if (typeof window === 'undefined') return;

  React.useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const cleanup = applyModalScrollIsolation(
      modalRef.current,
      overlayRef?.current || null
    );

    return cleanup;
  }, [isOpen, modalRef, overlayRef]);
}

// Expose utilities to window for debugging
if (typeof window !== 'undefined') {
  (window as any).modalScrollIsolation = {
    isModalIsolationEnabled,
    applyModalScrollIsolation,
  };
}

