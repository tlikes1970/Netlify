import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  MOBILE_NAV_BASE_HEIGHT,
  applySafeAreaFromNative,
  mobileFabInlineInset,
  mobileNavControlBottom,
  readMobileNavClearancePx,
  readSafeInsetPx,
} from '@/lib/capacitorSafeArea';

describe('readMobileNavClearancePx', () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty('--mobile-nav-height');
    document.documentElement.style.removeProperty('--safe-bottom');
  });

  afterEach(() => {
    document.documentElement.style.removeProperty('--mobile-nav-height');
    document.documentElement.style.removeProperty('--safe-bottom');
  });

  it('uses computed --mobile-nav-height when available', () => {
    document.documentElement.style.setProperty('--mobile-nav-height', '104px');
    expect(readMobileNavClearancePx()).toBe(104);
  });

  it('falls back to tab height plus --safe-bottom', () => {
    document.documentElement.style.setProperty('--safe-bottom', '48px');
    expect(readMobileNavClearancePx()).toBe(MOBILE_NAV_BASE_HEIGHT + 48);
  });

  it('returns tab height when no inset vars are set', () => {
    expect(readMobileNavClearancePx()).toBe(MOBILE_NAV_BASE_HEIGHT);
  });
});

describe('applySafeAreaFromNative', () => {
  afterEach(() => {
    const root = document.documentElement;
    root.style.removeProperty('--safe-top');
    root.style.removeProperty('--safe-bottom');
    root.style.removeProperty('--safe-left');
    root.style.removeProperty('--safe-right');
    root.removeAttribute('data-safe-area-ready');
  });

  it('writes all four inset CSS variables together', () => {
    applySafeAreaFromNative({
      top: 54.095,
      bottom: 0,
      left: 54.095,
      right: 0,
    });
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--safe-top')).toBe('54.095px');
    expect(root.style.getPropertyValue('--safe-bottom')).toBe('0px');
    expect(root.style.getPropertyValue('--safe-left')).toBe('54.095px');
    expect(root.style.getPropertyValue('--safe-right')).toBe('0px');
    expect(root.getAttribute('data-safe-area-ready')).toBe('true');
  });

  it('treats zero horizontal inset as zero, not undefined', () => {
    applySafeAreaFromNative({ top: 24, bottom: 48, left: 0, right: 0 });
    expect(document.documentElement.style.getPropertyValue('--safe-left')).toBe('0px');
    expect(document.documentElement.style.getPropertyValue('--safe-right')).toBe('0px');
    expect(readSafeInsetPx('left')).toBe(0);
    expect(readSafeInsetPx('right')).toBe(0);
  });
});

describe('mobileFabInlineInset', () => {
  it('adds the matching horizontal safe-area variable to the existing gutter', () => {
    expect(mobileFabInlineInset(16, 'right')).toBe('calc(16px + var(--safe-right, 0px))');
    expect(mobileFabInlineInset(16, 'left')).toBe('calc(16px + var(--safe-left, 0px))');
  });
});

describe('mobileNavControlBottom', () => {
  it('docks controls inside the mobile nav above the system inset', () => {
    expect(mobileNavControlBottom(4, 0)).toBe(
      'calc(var(--safe-bottom, 0px) + 0px + 4px)'
    );
  });
});
