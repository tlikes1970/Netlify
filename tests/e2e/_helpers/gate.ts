import { Page, expect } from '@playwright/test';

export async function enableCompactGate(page: Page) {
  await page.setViewportSize({ width: 375, height: 667 }); // mobile-ish
  await page.evaluate(() => {
    localStorage.setItem('flag:mobile_compact_v1', 'true');
    document.documentElement.dataset.density = 'compact';
  });
  // retrigger the gate logic
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  await expect.poll(async () =>
    (await page.evaluate(() => document.documentElement.dataset.compactMobileV1 || ''))
  ).toBe('true');
}

export async function disableCompactGate(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('flag:mobile_compact_v1');
    delete document.documentElement.dataset.density;
  });
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
}







