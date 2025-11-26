/**
 * Home Down Arrow Component
 * Scrolls from hero/header area to main content anchor on Home page
 * Config: Home down-arrow - scrolls to content start anchor
 */

import { useState, useEffect } from 'react';

interface HomeDownArrowProps {
  contentAnchorRef: React.RefObject<HTMLElement>;
  className?: string;
}

/**
 * Get the actual scroll container element used by Flicklet.
 * Matches the logic from ScrollToTopArrow to ensure consistency.
 * 
 * On mobile (< 1024px): body is the scroll container
 * On desktop: uses document.scrollingElement (usually <html>)
 */
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

export default function HomeDownArrow({ contentAnchorRef, className = '' }: HomeDownArrowProps) {
  // Start visible - at the top of Home, the arrow should be visible (content is below)
  const [isVisible, setIsVisible] = useState(true);
  // Mobile-only: hide on desktop (≥1024px)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth < 1024;
  });

  // Listen for resize to update mobile state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Show/hide arrow based on anchor's position in viewport
  // Show when anchor is still below viewport, hide when near/past it
  useEffect(() => {
    if (typeof window === "undefined") return;

    const scrollEl = getScrollElement();

    const handleScroll = () => {
      const anchorEl = contentAnchorRef.current;
      if (!anchorEl) {
        // If anchor isn't mounted yet, hide the arrow
        setIsVisible(false);
        return;
      }

      const rect = anchorEl.getBoundingClientRect();
      const anchorTop = rect.top;

      // Sticky header height (FlickletHeader + search bar)
      const stickyHeaderHeight = 100;
      
      // Logic:
      // - Show the arrow when the anchor is still below the sticky header area
      // - Hide it once the anchor reaches or passes the header area (user has scrolled to content)
      //
      // Simple rule: show when anchorTop > header height + buffer
      // This means the anchor is below the header, so user needs to scroll down to reach it
      const visibilityThreshold = stickyHeaderHeight + 20; // 120px
      const shouldShow = anchorTop > visibilityThreshold;

      setIsVisible(shouldShow);
    };

    // Initial check to set correct visibility state on mount
    handleScroll();

    // Attach listeners to the actual scroll container (same pattern as ScrollToTopArrow)
    if (scrollEl) {
      scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    }
    window.addEventListener("scroll", handleScroll, { passive: true }); // Keep for safety
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      if (scrollEl) {
        scrollEl.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [contentAnchorRef]);

  // Scroll to content anchor function
  const scrollToContent = () => {
    if (!contentAnchorRef.current || typeof window === "undefined") return;

    const anchor = contentAnchorRef.current;
    const rect = anchor.getBoundingClientRect();
    const scrollEl = getScrollElement();

    // Get current scroll position from the actual scroll container
    const currentScrollTop = scrollEl 
      ? (scrollEl.scrollTop || 0)
      : (window.scrollY || document.documentElement?.scrollTop || document.body?.scrollTop || 0);

    // Where the anchor is in document space
    const anchorTop = rect.top + currentScrollTop;

    // Estimate sticky header height (FlickletHeader + search)
    const stickyHeaderHeight = 100;
    const targetScrollTop = Math.max(anchorTop - stickyHeaderHeight, 0);

    // Scroll using the actual scroll container (same pattern as ScrollToTopArrow)
    if (scrollEl && typeof scrollEl.scrollTo === 'function') {
      scrollEl.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
    } else if (scrollEl) {
      scrollEl.scrollTop = targetScrollTop;
    } else {
      // Fallback: scroll window if we couldn't resolve the element
      window.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
    }
  };

  // Guard against rendering before anchor exists, when not visible, or on desktop
  if (!contentAnchorRef.current || !isVisible || !isMobile) return null;

  const buttonStyle = {
    backgroundColor: "var(--accent)",
    borderColor: "var(--accent)",
    color: "var(--text)",
    border: "2px solid var(--accent)",
    backdropFilter: "blur(8px)",
    animation: "fadeInUp 0.3s ease-out",
    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
  };

  return (
    <button
      onClick={scrollToContent}
      className={`fixed bottom-24 right-4 lg:bottom-32 lg:right-8 z-[10002] w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ease-out hover:scale-110 hover:shadow-2xl ${className}`}
      style={buttonStyle}
      aria-label="Scroll to content"
      title="Scroll to content"
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
  );
}

