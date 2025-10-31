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
  // Only preventDefault when actually needed (at boundaries), not for normal vertical motion
  if (overlayElement) {
    const handleOverlayTouchStart = (e: TouchEvent) => {
      // Prevent touch events on overlay from reaching background
      if (e.target === overlayElement) {
        e.stopPropagation();
      }
    };

    const handleOverlayTouchMove = (e: TouchEvent) => {
      // Only preventDefault if touching overlay directly (not modal content)
      // This prevents background scroll while allowing normal modal scrolling
      if (e.target === overlayElement && e.cancelable) {
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

  // 3. Prevent touch events on modal content from propagating to background
  // Note: overscroll-behavior: contain CSS handles scroll chaining, so we don't need
  // aggressive JavaScript boundary detection that could interfere with normal scrolling
  // Only preventDefault at boundaries during overscroll attempts, not for normal vertical motion
  if (modalContent) {
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Only stop propagation if we're sure this touch is within the modal
      // Don't interfere with normal scrolling - let CSS overscroll-behavior handle boundaries
      if (!modalElement.contains(e.target as Node)) {
        return;
      }

      // Find the scrollable element within modal that contains the touch target
      const findScrollableParent = (el: HTMLElement | null): HTMLElement | null => {
        if (!el || !modalElement.contains(el)) return null;
        
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        const overflow = style.overflow;
        const isScrollable = (overflowY === 'auto' || overflowY === 'scroll' || overflow === 'auto' || overflow === 'scroll') &&
                             el.scrollHeight > el.clientHeight;
        
        if (isScrollable) return el;
        return findScrollableParent(el.parentElement);
      };

      const scrollableContainer = findScrollableParent(e.target as HTMLElement);
      
      if (scrollableContainer) {
        const { scrollTop, scrollHeight, clientHeight } = scrollableContainer;
        const tolerance = 1;
        const isAtTop = scrollTop <= tolerance;
        const isAtBottom = scrollTop >= scrollHeight - clientHeight - tolerance;
        
        const deltaY = e.touches[0].clientY - touchStartY;
        const tryingToOverscrollUp = isAtTop && deltaY > 0; // At top, trying to scroll up (overscroll)
        const tryingToOverscrollDown = isAtBottom && deltaY < 0; // At bottom, trying to scroll down (overscroll)
        
        // Only preventDefault if we're at a boundary AND trying to overscroll
        // This allows normal vertical scrolling within modal boundaries
        if ((tryingToOverscrollUp || tryingToOverscrollDown) && e.cancelable) {
          e.preventDefault();
          e.stopPropagation();
        } else {
          // Normal scrolling - just stop propagation to prevent background scroll
          // but don't preventDefault which would block native scroll
          e.stopPropagation();
        }
      } else {
        // No scrollable container - just stop propagation
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

  // 4. Prevent wheel events from propagating to background only when at boundaries
  // Don't interfere with normal scrolling within the modal
  const handleWheel = (e: WheelEvent) => {
    const target = e.target as HTMLElement;
    if (!modalElement.contains(target)) {
      // Not in modal - allow normal behavior
      return;
    }

    // Find the scrollable element - check element itself and all parents up to modal
    const isScrollable = (el: HTMLElement): boolean => {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      const overflow = style.overflow;
      return (overflowY === 'auto' || overflowY === 'scroll' || overflow === 'auto' || overflow === 'scroll') &&
             el.scrollHeight > el.clientHeight;
    };

    // Walk up the DOM tree to find the scrollable container
    let scrollableTarget: HTMLElement | null = null;
    let current: HTMLElement | null = target as HTMLElement;
    
    while (current && modalElement.contains(current)) {
      if (isScrollable(current)) {
        scrollableTarget = current;
        break;
      }
      current = current.parentElement;
    }
    
    if (scrollableTarget) {
      const { scrollTop, scrollHeight, clientHeight } = scrollableTarget;
      const tolerance = 1; // Small tolerance for floating point issues
      const isAtTop = scrollTop <= tolerance;
      const isAtBottom = scrollTop >= scrollHeight - clientHeight - tolerance;
      
      // Only prevent propagation/preventDefault if we're at boundaries trying to overscroll
      // This prevents scroll chaining to background while allowing normal modal scrolling
      const tryingToScrollUp = e.deltaY < 0;
      const tryingToScrollDown = e.deltaY > 0;
      
      if ((isAtTop && tryingToScrollUp) || (isAtBottom && tryingToScrollDown)) {
        // At boundary and trying to scroll beyond - prevent it from reaching background
        if (e.cancelable) {
          e.preventDefault();
        }
        e.stopPropagation();
      }
      // Otherwise, allow normal scrolling within modal (don't stop propagation)
    }
    // If no scrollable target found, allow event to propagate normally
    // This ensures normal mouse wheel scrolling works in the modal
  };

  // Add listener to document in bubble phase (not capture) so modal can handle scroll normally
  // We'll stop propagation only when needed
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

