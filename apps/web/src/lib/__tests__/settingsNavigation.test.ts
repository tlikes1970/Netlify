import { afterEach, describe, expect, it } from 'vitest';
import { shouldUseMobileSettings } from '@/lib/settingsNavigation';

describe('shouldUseMobileSettings', () => {
  const originalWidth = window.innerWidth;

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-compact-mobile-v1');
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: originalWidth,
    });
  });

  it('stays on the page shell when the mobile sheet flag is off', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 412,
    });
    expect(shouldUseMobileSettings()).toBe(false);
  });

  it('uses the sheet on a narrow viewport when the sheet flag is on', () => {
    localStorage.setItem('flag:settings_mobile_sheet_v1', 'true');
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 412,
    });
    expect(shouldUseMobileSettings()).toBe(true);
  });

  it('uses the page shell on a wide viewport even when the sheet flag is on', () => {
    localStorage.setItem('flag:settings_mobile_sheet_v1', 'true');
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 924,
    });
    expect(shouldUseMobileSettings()).toBe(false);
  });
});
