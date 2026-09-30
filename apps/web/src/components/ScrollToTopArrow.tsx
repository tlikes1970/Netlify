import { useState, useEffect, useRef } from 'react';
import { useViewportOffset } from './MobileTabs';
import { mobileFabBottom } from '@/lib/capacitorSafeArea';

export const MOBILE_THRESHOLD_VH = 1;
export const DESKTOP_THRESHOLD_VH = 1.25;

export function scrollThresholdForViewport(
  viewportHeight: number,
  isMobile: boolean,
  fixedThreshold?: number
): number {
  return fixedThreshold ?? viewportHeight * (isMobile ? MOBILE_THRESHOLD_VH : DESKTOP_THRESHOLD_VH);
}

/** Body owns mobile scrolling when CSS gives it an independent overflow viewport.
 * Otherwise use the document's actual scrolling element (including native WebViews).
 */
export function getScrollElement(): HTMLElement {
  const body = document.body;
  const overflow = getComputedStyle(body).overflowY;
  if (window.innerWidth <= 1024 && /^(auto|scroll)$/.test(overflow)) {
    return body;
  }
  return (document.scrollingElement as HTMLElement) || document.documentElement;
}

interface ScrollToTopArrowProps {
  threshold?: number;
  className?: string;
}

export default function ScrollToTopArrow({ threshold, className = '' }: ScrollToTopArrowProps) {
  const [direction, setDirection] = useState<'down' | 'up' | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const scrollOwner = useRef<HTMLElement | null>(null);
  const { viewportOffset } = useViewportOffset();
  const effectiveOffset = Math.max(0, viewportOffset - 50);

  useEffect(() => {
    let owner: HTMLElement | null = null;
    const update = () => {
      const nextOwner = getScrollElement();
      if (nextOwner !== owner) {
        owner?.removeEventListener('scroll', update);
        owner = nextOwner;
        scrollOwner.current = owner;
        owner.addEventListener('scroll', update, { passive: true });
      }
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      const maxScroll = Math.max(0, owner.scrollHeight - owner.clientHeight);
      const switchThreshold = Math.min(
        scrollThresholdForViewport(owner.clientHeight, mobile, threshold),
        maxScroll / 2
      );
      setDirection(maxScroll <= 1 ? null : owner.scrollTop < switchThreshold ? 'down' : 'up');
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    window.visualViewport?.addEventListener('resize', update);

    // Observe layout boxes, not every DOM mutation. Main grows with async rails/lists
    // even when the body's own viewport height stays fixed.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    const boxes = new Set<Element>([document.body, document.documentElement]);
    const main = document.querySelector('.flicklet-app-main');
    if (main) boxes.add(main);
    boxes.forEach(box => observer?.observe(box));

    return () => {
      owner?.removeEventListener('scroll', update);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      observer?.disconnect();
      scrollOwner.current = null;
    };
  }, [threshold]);

  if (!direction) return null;

  const label = direction === 'up' ? 'Scroll to top' : 'Scroll to bottom';
  const scroll = () => {
    const owner = scrollOwner.current;
    if (!owner) return;
    const top = direction === 'up' ? 0 : Math.max(0, owner.scrollHeight - owner.clientHeight);
    if (typeof owner.scrollTo === 'function') owner.scrollTo({ top, behavior: 'smooth' });
    else owner.scrollTop = top;
  };

  return (
    <button
      type="button"
      onClick={scroll}
      aria-label={label}
      title={label}
      data-scroll-direction={direction}
      className={`fixed z-dropdown w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl bottom-20 right-4 ${direction === 'up' ? 'lg:bottom-24' : 'lg:bottom-36'} lg:right-8 ${className}`}
      style={{
        backgroundColor: 'var(--btn)',
        border: '1px solid var(--line)',
        color: 'var(--text)',
        backdropFilter: 'blur(8px)',
        ...(isMobile && {
          bottom: mobileFabBottom(80, effectiveOffset),
          right: '16px',
          zIndex: 10000,
        }),
      }}
    >
      <svg aria-hidden="true" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={direction === 'up' ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'}
        />
      </svg>
    </button>
  );
}
