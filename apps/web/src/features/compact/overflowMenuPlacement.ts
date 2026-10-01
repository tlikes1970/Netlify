import { isMobileNow } from '@/lib/isMobile';
import { readMobileNavClearancePx, readSafeInsetPx } from '@/lib/capacitorSafeArea';

export type MenuPlacement = {
  top: number;
  left: number;
  direction: 'up' | 'down';
  maxHeight: number;
  maxWidth: number;
};

export type ViewportBounds = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

type RectLike = Pick<DOMRect, 'top' | 'bottom' | 'left' | 'right' | 'width' | 'height'>;

const EDGE_PADDING = 8;
const MENU_GAP = 4;

/** Usable viewport for fixed menus (accounts for mobile bottom nav + visualViewport). */
export function getMenuViewportBounds(): ViewportBounds {
  if (typeof window === 'undefined') {
    return { top: EDGE_PADDING, bottom: 600, left: EDGE_PADDING, right: 400 };
  }

  const vv = window.visualViewport;
  const offsetTop = vv?.offsetTop ?? 0;
  const offsetLeft = vv?.offsetLeft ?? 0;
  const height = vv?.height ?? window.innerHeight;
  const width = vv?.width ?? window.innerWidth;

  let bottomReserve = EDGE_PADDING;
  if (isMobileNow()) {
    bottomReserve += readMobileNavClearancePx();
  }

  let top = offsetTop + EDGE_PADDING + readSafeInsetPx('top');
  const search = document.querySelector<HTMLElement>('.flicklet-sticky-search');
  if (search) {
    const rect = search.getBoundingClientRect();
    const style = getComputedStyle(search);
    const visible = style.display !== 'none' && style.visibility !== 'hidden' &&
      rect.height > 0 && rect.bottom > offsetTop && rect.top < offsetTop + height &&
      rect.right > offsetLeft && rect.left < offsetLeft + width;
    if (visible) top = Math.max(top, Math.min(rect.bottom, offsetTop + height) + MENU_GAP);
  }

  return {
    top,
    bottom: offsetTop + height - bottomReserve,
    left: offsetLeft + EDGE_PADDING + readSafeInsetPx('left'),
    right: offsetLeft + width - EDGE_PADDING - readSafeInsetPx('right'),
  };
}

/**
 * Pick menu placement: prefer below, flip up when insufficient space, clamp to viewport.
 */
export function computeOverflowMenuPlacement(params: {
  buttonRect: RectLike;
  menuWidth: number;
  menuHeight: number;
  viewport?: ViewportBounds;
  gap?: number;
}): MenuPlacement {
  const {
    buttonRect,
    menuWidth,
    menuHeight,
    viewport = getMenuViewportBounds(),
    gap = MENU_GAP,
  } = params;

  const usableHeight = Math.max(0, viewport.bottom - viewport.top);
  const usableWidth = Math.max(0, viewport.right - viewport.left);
  const height = Math.min(menuHeight, usableHeight);
  const width = Math.min(menuWidth, usableWidth);
  const spaceBelow = Math.max(0, viewport.bottom - buttonRect.bottom - gap);
  const spaceAbove = Math.max(0, buttonRect.top - viewport.top - gap);
  const direction = spaceBelow >= height ? 'down'
    : spaceAbove >= height || spaceAbove >= spaceBelow ? 'up' : 'down';
  const room = direction === 'up' ? spaceAbove : spaceBelow;
  const maxHeight = Math.min(usableHeight, room);
  const renderedHeight = Math.min(height, maxHeight);
  const desiredTop = direction === 'up'
    ? buttonRect.top - renderedHeight - gap : buttonRect.bottom + gap;
  const top = Math.max(viewport.top, Math.min(desiredTop, viewport.bottom - renderedHeight));
  const left = Math.max(viewport.left, Math.min(buttonRect.right - width, viewport.right - width));

  return { top, left, direction, maxHeight, maxWidth: usableWidth };
}

/** Estimate menu height before layout when items are known (fallback only). */
export function estimateOverflowMenuHeight(itemCount: number): number {
  const rowHeight = 44;
  const chrome = 8;
  return itemCount * rowHeight + chrome;
}

/** Measured, CSS-constrained height wins; estimate is only a zero-layout fallback. */
export function resolveOverflowMenuHeight(actualHeight: number, itemCount: number): number {
  return actualHeight > 0 ? actualHeight : estimateOverflowMenuHeight(itemCount);
}
