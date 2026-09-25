import { describe, it, expect } from 'vitest';
import {
  computeOverflowMenuPlacement,
  estimateOverflowMenuHeight,
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
