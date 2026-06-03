import { useState, useEffect, useMemo, useCallback } from 'react';
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
  return (document.scrollingElement as HTMLElement) || document.documentElement || document.body;
}

/** Viewport-height multiplier for when the up arrow appears (mobile-first). */
export const MOBILE_THRESHOLD_VH = 1.0;
export const DESKTOP_THRESHOLD_VH = 1.25;

export function scrollThresholdForViewport(
  viewportHeight: number,
  isMobile: boolean,
  fixedThreshold?: number
): number {
  if (fixedThreshold !== undefined) return fixedThreshold;
  const ratio = isMobile ? MOBILE_THRESHOLD_VH : DESKTOP_THRESHOLD_VH;
  return viewportHeight * ratio;
}

interface ScrollToTopArrowProps {
  /** Fixed px threshold; if omitted, uses ~1–1.25 viewport heights. */
  threshold?: number;
  className?: string;
}

export default function ScrollToTopArrow({ threshold, className = '' }: ScrollToTopArrowProps) {
  const [showUpArrow, setShowUpArrow] = useState(false);
  const [showDownArrow, setShowDownArrow] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const { viewportOffset } = useViewportOffset();

  const effectiveOffset = useMemo(() => Math.max(0, viewportOffset - 50), [viewportOffset]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const resolveScrollThreshold = useCallback(
    (viewportHeight: number) =>
      scrollThresholdForViewport(viewportHeight, isMobile, threshold),
    [threshold, isMobile]
  );

  useEffect(() => {
    const scrollEl = getScrollElement();

    const handleScroll = () => {
      if (!scrollEl) return;

      const scrollY = scrollEl.scrollTop || 0;
      const viewportHeight = scrollEl.clientHeight || window.innerHeight;
      const documentHeight = scrollEl.scrollHeight;
      const scrollThreshold = resolveScrollThreshold(viewportHeight);

      const isScrolledDown = scrollY > scrollThreshold;
      const scrollBottom = scrollY + viewportHeight;
      const isAtBottom = scrollBottom >= documentHeight - 50;
      const isAtTop = scrollY <= 50;

      setShowUpArrow(isScrolledDown && !isAtTop);
      setShowDownArrow(!isAtBottom && !isAtTop);
    };

    handleScroll();

    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      if (scrollEl) {
        scrollEl.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [resolveScrollThreshold, isMobile, effectiveOffset]);

  const scrollToTop = () => {
    const scrollEl = getScrollElement();

    if (scrollEl && typeof scrollEl.scrollTo === 'function') {
      scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (scrollEl) {
      scrollEl.scrollTop = 0;
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
  };

  const visibilityClass = (visible: boolean) =>
    visible
      ? 'opacity-100 pointer-events-auto scale-100'
      : 'opacity-0 pointer-events-none scale-95';

  const sharedButtonClass = `fixed z-dropdown w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl ${className}`;

  return (
    <>
      {/* Scroll to bottom — stacked above scroll-to-top, same right column as theme FAB */}
      <button
        type="button"
        onClick={scrollToBottom}
        className={`${sharedButtonClass} bottom-32 right-4 lg:bottom-36 lg:right-8 ${visibilityClass(showDownArrow)}`}
        style={{
          ...buttonStyle,
          ...(isMobile && {
            bottom: `calc(${MOBILE_NAV_HEIGHT}px + ${effectiveOffset}px + 128px)`,
            right: '16px',
            zIndex: 10000,
          }),
        }}
        aria-label="Scroll to bottom"
        title="Scroll to bottom"
        aria-hidden={!showDownArrow}
        tabIndex={showDownArrow ? 0 : -1}
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

      {/* Scroll to top — lower-right, above theme toggle FAB */}
      <button
        type="button"
        onClick={scrollToTop}
        className={`${sharedButtonClass} bottom-20 right-4 lg:bottom-24 lg:right-8 ${visibilityClass(showUpArrow)}`}
        style={{
          ...buttonStyle,
          ...(isMobile && {
            bottom: `calc(${MOBILE_NAV_HEIGHT}px + ${effectiveOffset}px + 80px)`,
            right: '16px',
            zIndex: 10000,
          }),
        }}
        aria-label="Scroll to top"
        title="Scroll to top"
        aria-hidden={!showUpArrow}
        tabIndex={showUpArrow ? 0 : -1}
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
    </>
  );
}
