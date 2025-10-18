import { test, expect } from '@playwright/test';
import { enableCompactGate, disableCompactGate } from '../../_helpers/gate';
import { stubContextApis } from '../../_helpers/network';
import { stubServiceWorker } from '../../_helpers/sw';

const cssVar = (page, name: string) =>
  page.evaluate(n => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

test.describe('Mobile Compact V1 token gate (React V2)', () => {
  test.beforeEach(async ({ context }) => { 
    await stubServiceWorker(context);
    await stubContextApis(context); 
  });

  test('A) flag OFF → gate absent, --poster-w != 136px', async ({ page }) => {
    await page.goto('/');
    await disableCompactGate(page);
    const attr = await page.evaluate(() => document.documentElement.dataset.compactMobileV1 || '');
    const posterW = await cssVar(page, '--poster-w');
    expect(attr).toBe('');
    expect(posterW).not.toBe('136px');
  });

  test('B) flag ON + compact density → gate present, --poster-w == 136px', async ({ page }) => {
    await page.goto('/');
    await enableCompactGate(page);
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
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
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
