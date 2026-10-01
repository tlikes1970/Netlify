import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  computeOverflowMenuPlacement,
  estimateOverflowMenuHeight,
  resolveOverflowMenuHeight,
  getMenuViewportBounds,
} from '@/features/compact/overflowMenuPlacement';

const viewport = { top: 8, bottom: 720, left: 8, right: 392 };

describe('computeOverflowMenuPlacement', () => {
  const menuWidth = 200;
  const menuHeight = estimateOverflowMenuHeight(10);

  it('opens downward when there is room below', () => {
    const buttonRect = { top: 200, bottom: 244, left: 100, right: 300, width: 200, height: 44 };
    const placement = computeOverflowMenuPlacement({
      buttonRect,
      menuWidth,
      menuHeight,
      viewport,
    });
    expect(placement.direction).toBe('down');
    expect(placement.top).toBe(248);
  });

  it('flips upward when near the bottom of the viewport', () => {
    const buttonRect = { top: 650, bottom: 694, left: 100, right: 300, width: 200, height: 44 };
    const placement = computeOverflowMenuPlacement({
      buttonRect,
      menuWidth,
      menuHeight,
      viewport,
    });
    expect(placement.direction).toBe('up');
    expect(placement.top).toBeLessThan(buttonRect.top);
    expect(placement.top + menuHeight).toBeLessThanOrEqual(buttonRect.top);
  });

  it('keeps the menu within viewport bounds when space is tight', () => {
    const buttonRect = { top: 680, bottom: 712, left: 100, right: 300, width: 200, height: 32 };
    const placement = computeOverflowMenuPlacement({
      buttonRect,
      menuWidth,
      menuHeight,
      viewport: { top: 8, bottom: 740, left: 8, right: 392 },
    });
    expect(placement.top).toBeGreaterThanOrEqual(8);
    expect(placement.top + menuHeight).toBeLessThanOrEqual(740);
  });

  it('aligns menu to the button right edge', () => {
    const buttonRect = { top: 200, bottom: 244, left: 150, right: 350, width: 200, height: 44 };
    const placement = computeOverflowMenuPlacement({
      buttonRect,
      menuWidth,
      menuHeight,
      viewport,
    });
    expect(placement.left).toBe(150);
  });
});

vi.mock('@/lib/isMobile', () => ({ isMobileNow: () => true }));
vi.mock('@/lib/capacitorSafeArea', () => ({
  readMobileNavClearancePx: () => 80,
  readSafeInsetPx: (side: string) => side === 'top' ? 24 : 0,
}));
afterEach(() => {
  document.querySelector('.flicklet-sticky-search')?.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('measured geometry and constrained placement', () => {
  const rect = (top: number, right = 300) => ({top, bottom: top + 40, left: right - 80, right, width: 80, height: 40});
  const place = (top: number, height = 160, right = 300) => computeOverflowMenuPlacement({
    buttonRect: rect(top, right), menuWidth: 200, menuHeight: height, viewport,
  });

  it('uses actual constrained height even for a long action menu', () => {
    expect(resolveOverflowMenuHeight(160, 10)).toBe(160);
    expect(place(300, resolveOverflowMenuHeight(160, 10)).direction).toBe('down');
  });
  it('uses estimated height only when measurement is unavailable', () => {
    expect(resolveOverflowMenuHeight(0, 10)).toBe(448);
  });
  it.each([20, 250])('places top/middle anchor %s below with a 4px gap', top => {
    expect(place(top).top).toBe(top + 44);
    expect(place(top).direction).toBe('down');
  });
  it('flips above a bottom anchor without an inflated gap', () => {
    expect(place(650).top).toBe(486);
    expect(place(650).direction).toBe('up');
  });
  it('uses the larger side and constrains when neither side fits', () => {
    const result = place(350, 600);
    expect(result.direction).toBe('up');
    expect(result.maxHeight).toBe(338);
    expect(result.top).toBe(8);
  });
  it('constrains a large menu on a short viewport', () => {
    const result = computeOverflowMenuPlacement({
      buttonRect: rect(110), menuWidth: 320, menuHeight: 600,
      viewport: {top:80,bottom:240,left:8,right:190},
    });
    expect(result.top).toBeGreaterThanOrEqual(80);
    expect(result.top + Math.min(600,result.maxHeight)).toBeLessThanOrEqual(240);
    expect(result.maxWidth).toBe(182);
    expect(result.left).toBe(8);
  });
  it('clamps left', () => expect(place(200,160,60).left).toBe(8));
  it('clamps right', () => expect(place(200,160,450).left).toBe(192));
  it('preserves trigger right alignment', () => expect(place(200).left).toBe(100));

  function visualViewport() {
    vi.stubGlobal('visualViewport', {offsetTop:10,offsetLeft:30,width:400,height:700});
  }
  it('accounts for visual viewport offsets and reserves nav only once', () => {
    visualViewport();
    expect(getMenuViewportBounds()).toEqual({top:42,bottom:622,left:38,right:422});
  });
  it('raises the top boundary to visible search bottom plus gap', () => {
    visualViewport();
    const search=document.createElement('div');
    search.className='flicklet-sticky-search';
    document.body.append(search);
    vi.spyOn(search,'getBoundingClientRect').mockReturnValue({top:34,bottom:94,left:30,right:430,height:60,width:400} as DOMRect);
    expect(getMenuViewportBounds().top).toBe(98);
    search.style.visibility='hidden';
    expect(getMenuViewportBounds().top).toBe(42);
  });
  it('ignores search outside the visible viewport', () => {
    visualViewport();
    const search=document.createElement('div');
    search.className='flicklet-sticky-search';
    document.body.append(search);
    vi.spyOn(search,'getBoundingClientRect').mockReturnValue({top:-100,bottom:-40,left:30,right:430,height:60,width:400} as DOMRect);
    expect(getMenuViewportBounds().top).toBe(42);
  });
});