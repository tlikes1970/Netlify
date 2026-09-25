import { isMobileNow } from '@/lib/isMobile';
import { readMobileNavClearancePx, readSafeInsetPx } from '@/lib/capacitorSafeArea';

export type MenuPlacement = {
  top: number;
  left: number;
  direction: 'up' | 'down';
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
  const height = vv?.height ?? window.innerHeight;
  const width = vv?.width ?? window.innerWidth;

  let bottomReserve = EDGE_PADDING;
  if (isMobileNow()) {
    bottomReserve += readMobileNavClearancePx();
  }

  return {
    top: offsetTop + EDGE_PADDING + readSafeInsetPx('top'),
    bottom: offsetTop + height - bottomReserve,
    left: EDGE_PADDING + readSafeInsetPx('left'),
    right: width - EDGE_PADDING - readSafeInsetPx('right'),
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

  const spaceBelow = viewport.bottom - buttonRect.bottom;
  const spaceAbove = buttonRect.top - viewport.top;

  let direction: 'up' | 'down' = 'down';
  let top: number;

  const fitsBelow = spaceBelow >= menuHeight + gap;
  const fitsAbove = spaceAbove >= menuHeight + gap;

  if (fitsBelow) {
    direction = 'down';
    top = buttonRect.bottom + gap;
  } else if (fitsAbove) {
    direction = 'up';
    top = buttonRect.top - menuHeight - gap;
  } else if (spaceAbove >= spaceBelow) {
    direction = 'up';
    top = Math.max(viewport.top, buttonRect.top - menuHeight - gap);
  } else {
    direction = 'down';
    top = Math.min(buttonRect.bottom + gap, viewport.bottom - menuHeight);
  }

  top = Math.max(viewport.top, Math.min(top, viewport.bottom - menuHeight));

  let left = buttonRect.right - menuWidth;
  left = Math.max(viewport.left, Math.min(left, viewport.right - menuWidth));

  return { top, left, direction };
}

/** Estimate menu height before layout when items are known (fallback only). */
export function estimateOverflowMenuHeight(itemCount: number): number {
  const rowHeight = 44;
  const chrome = 8;
  return itemCount * rowHeight + chrome;
}
