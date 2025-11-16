import { useState, useEffect, useMemo } from 'react';
import { MOBILE_NAV_HEIGHT, useViewportOffset } from './MobileTabs';

function getScrollElement(): HTMLElement | null {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return null;
  }

  // On Flicklet mobile layout, body is the scroll container:
  // @media (max-width: 1024px) { html { overflow: hidden; } body { overflow-y: auto; } }
  if (window.innerWidth < 1024) {
    return document.body;
  }

  // On desktop, fall back to the browser's scrollingElement (usually <html>)
  // or documentElement, then body.
  return (document.scrollingElement as HTMLElement) || document.documentElement || document.body;
}

interface ScrollToTopArrowProps {
  threshold?: number; // Scroll threshold in pixels (default: 400)
  className?: string;
}

export default function ScrollToTopArrow({ threshold = 400, className = '' }: ScrollToTopArrowProps) {
  const [showUpArrow, setShowUpArrow] = useState(false);
  const [showDownArrow, setShowDownArrow] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const { viewportOffset } = useViewportOffset();
  
  // Cap viewportOffset at 0 if <50px to avoid toolbar micro-shifts (same as FABs)
  const effectiveOffset = useMemo(() => Math.max(0, viewportOffset - 50), [viewportOffset]);
  
  // Track window width for responsive positioning
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show/hide arrows based on scroll position
  useEffect(() => {
    const scrollEl = getScrollElement();
    
    const handleScroll = () => {
      if (!scrollEl) return;

      const scrollY = scrollEl.scrollTop || 0;
      const windowHeight = scrollEl.clientHeight || window.innerHeight;
      const documentHeight = scrollEl.scrollHeight;
      
      // Check if scrolled past threshold (show up arrow)
      const isScrolledDown = scrollY > threshold;
      
      // Check if at bottom (within 50px tolerance)
      const scrollBottom = scrollY + windowHeight;
      const isAtBottom = scrollBottom >= documentHeight - 50;
      
      // Check if at top (within 50px tolerance)
      const isAtTop = scrollY <= 50;
      
      const shouldShowUp = isScrolledDown && !isAtTop;
      const shouldShowDown = !isAtBottom && !isAtTop;
      
      setShowUpArrow(shouldShowUp);
      setShowDownArrow(shouldShowDown);
    };

    // Initial check
    handleScroll();

    // Attach listeners:
    // - scroll on the actual scroll element
    // - resize on window for recalculation
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true }); // keep this for safety
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      if (scrollEl) {
        scrollEl.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [threshold, isMobile, effectiveOffset]);

  // Scroll to top function
  const scrollToTop = () => {
    const scrollEl = getScrollElement();

    if (scrollEl && typeof scrollEl.scrollTo === 'function') {
      scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (scrollEl) {
      scrollEl.scrollTop = 0;
    } else {
      // Fallback: scroll window if we couldn't resolve the element
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    const scrollEl = getScrollElement();

    if (scrollEl) {
      const maxScroll = scrollEl.scrollHeight;

      if (typeof scrollEl.scrollTo === 'function') {
        scrollEl.scrollTo({ top: maxScroll, behavior: 'smooth' });
      } else {
        scrollEl.scrollTop = maxScroll;
      }
    } else {
      // Fallback: scroll whole page
      const maxScroll = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      window.scrollTo({ top: maxScroll, behavior: 'smooth' });
    }
  };

  const buttonStyle = {
    backgroundColor: 'var(--btn)',
    borderColor: 'var(--line)',
    color: 'var(--text)',
    border: '1px solid var(--line)',
    backdropFilter: 'blur(8px)',
    animation: 'fadeInUp 0.3s ease-out'
  };


  return (
    <>
      {/* Scroll to bottom arrow - positioned above the up arrow */}
      {showDownArrow && (
        <button
          onClick={scrollToBottom}
          className={`fixed bottom-32 right-4 lg:bottom-36 lg:right-8 z-dropdown w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl ${className}`}
          style={{
            ...buttonStyle,
            // Only apply mobile positioning on mobile screens (same pattern as FABs)
            ...(isMobile && {
              bottom: `calc(${MOBILE_NAV_HEIGHT}px + ${effectiveOffset}px + 128px)`,
              right: '16px',
              zIndex: 10000 // Above mobile nav (9999)
            })
          }}
          aria-label="Scroll to bottom"
          title="Scroll to bottom"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>
      )}

      {/* Scroll to top arrow - original position */}
      {showUpArrow && (
        <button
          onClick={scrollToTop}
          className={`fixed bottom-20 right-4 lg:bottom-24 lg:right-8 z-dropdown w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl ${className}`}
          style={{
            ...buttonStyle,
            // Only apply mobile positioning on mobile screens (same pattern as FABs)
            ...(isMobile && {
              bottom: `calc(${MOBILE_NAV_HEIGHT}px + ${effectiveOffset}px + 80px)`,
              right: '16px',
              zIndex: 10000 // Above mobile nav (9999)
            })
          }}
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </>
  );
}
