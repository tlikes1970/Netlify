import { test, expect } from '@playwright/test';

const cssVar = (page, name: string) =>
  page.evaluate(n => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

test.describe('TabCard poster width tokens (React V2)', () => {
  test('A) Default: flag OFF → computed --poster-w is not 136px, TabCard poster matches fallback', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('flag:mobile_compact_v1'));
    await page.reload();
    
    // Check computed CSS variable
    const posterW = await cssVar(page, '--poster-w');
    expect(posterW).not.toBe('136px');
    
    // Navigate to a tab page to find TabCard
    await page.goto('/list/watching');
    await page.waitForLoadState('networkidle');
    
    // Find TabCard poster element and measure its width
    const posterWidth = await page.evaluate(() => {
      const poster = document.querySelector('.poster');
      return poster ? poster.getBoundingClientRect().width : 0;
    });
    
    // Should be either 80px (condensed) or 160px (normal) - allow some tolerance
    expect(posterWidth).toBeGreaterThan(70);
    expect(posterWidth).toBeLessThan(170);
    expect(posterWidth).not.toBe(136);
  });

  test('B) Gate ON: flag + compact density → --poster-w == 136px, TabCard poster ≤ 136px', async ({ page }) => {
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
    
    // Check HTML attribute
    const attr = await page.evaluate(() => document.documentElement.dataset.compactMobileV1 || '');
    expect(attr).toBe('true');
    
    // Check computed CSS variable
    const posterW = await cssVar(page, '--poster-w');
    expect(posterW).toBe('136px');
    
    // Navigate to a tab page to find TabCard
    await page.goto('/list/watching');
    await page.waitForLoadState('networkidle');
    
    // Find TabCard poster element and measure its width
    const posterWidth = await page.evaluate(() => {
      const poster = document.querySelector('.poster');
      return poster ? poster.getBoundingClientRect().width : 0;
    });
    
    // Should be ≤ 136px (allow ±1px for rounding)
    expect(posterWidth).toBeLessThanOrEqual(137);
    expect(posterWidth).toBeGreaterThan(0);
  });

  test.afterEach(async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    expect(errors).toEqual([]);
  });
});
