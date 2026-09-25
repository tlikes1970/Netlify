import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  MOBILE_NAV_BASE_HEIGHT,
  readMobileNavClearancePx,
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
