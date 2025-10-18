import { test, expect } from '@playwright/test';

const cssVar = (page, name: string) =>
  page.evaluate(n => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

test.describe('Mobile Compact V1 token gate (React V2)', () => {
  test('A) flag OFF → gate absent, --poster-w != 136px', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('flag:mobile_compact_v1'));
    await page.reload();
    const attr = await page.evaluate(() => document.documentElement.dataset.compactMobileV1 || '');
    const posterW = await cssVar(page, '--poster-w');
    expect(attr).toBe('');
    expect(posterW).not.toBe('136px');
  });

  test('B) flag ON + compact density → gate present, --poster-w == 136px', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('flag:mobile_compact_v1', 'true');
    });
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.evaluate(() => {
      document.documentElement.dataset.density = 'compact';
      window.dispatchEvent(new Event('resize'));
    });
    await page.waitForTimeout(100);
    const attr = await page.evaluate(() => document.documentElement.dataset.compactMobileV1 || '');
    const posterW = await cssVar(page, '--poster-w');
    expect(attr).toBe('true');
    expect(posterW).toBe('136px');
  });

  test('C) flag ON + comfy density → gate absent, --poster-w != 136px', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('flag:mobile_compact_v1', 'true');
      delete document.documentElement.dataset.density;
    });
    await page.reload();
    const attr = await page.evaluate(() => document.documentElement.dataset.compactMobileV1 || '');
    const posterW = await cssVar(page, '--poster-w');
    expect(attr).toBe('');
    expect(posterW).not.toBe('136px');
  });

  test.afterEach(async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    expect(errors).toEqual([]);
  });
});
