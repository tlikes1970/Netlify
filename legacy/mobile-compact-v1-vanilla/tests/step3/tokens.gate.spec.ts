import { test, expect } from '@playwright/test';

async function cssVar(page, name) {
  return page.evaluate((n) =>
    getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    name
  );
}

test.describe('Mobile Compact V1 token gate', () => {
  test('Case A: flag OFF → gate absent, poster width not 136px', async ({ page }) => {
    await page.goto('http://localhost:8888/');
    await page.evaluate(() => localStorage.removeItem('flag:mobile_compact_v1'));
    await page.reload();

    const attr = await page.evaluate(() => document.documentElement.dataset.compactMobileV1 || '');
    const posterW = await cssVar(page, '--poster-w');
    console.log('Case A posterW=', posterW, 'attr=', attr);

    expect(attr).toBe('');
    expect(posterW).not.toBe('136px');
  });

  test('Case B: flag ON + compact density → gate present, poster width 136px', async ({ page }) => {
    await page.goto('http://localhost:8888/');
    await page.evaluate(() => {
      localStorage.setItem('flag:mobile_compact_v1', 'true');
      document.documentElement.dataset.density = 'compact';
    });
    await page.reload();

    const attr = await page.evaluate(() => document.documentElement.dataset.compactMobileV1 || '');
    const posterW = await cssVar(page, '--poster-w');
    console.log('Case B posterW=', posterW, 'attr=', attr);

    expect(attr).toBe('true');
    expect(posterW).toBe('136px');
  });

  test('Case C: flag ON + comfy density → gate absent, poster width not 136px', async ({ page }) => {
    await page.goto('http://localhost:8888/');
    await page.evaluate(() => {
      localStorage.setItem('flag:mobile_compact_v1', 'true');
      delete document.documentElement.dataset.density;
    });
    await page.reload();

    const attr = await page.evaluate(() => document.documentElement.dataset.compactMobileV1 || '');
    const posterW = await cssVar(page, '--poster-w');
    console.log('Case C posterW=', posterW, 'attr=', attr);

    expect(attr).toBe('');
    expect(posterW).not.toBe('136px');
  });
});