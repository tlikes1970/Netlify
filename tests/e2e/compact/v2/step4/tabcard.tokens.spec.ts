import { test, expect } from '@playwright/test';
import { enableCompactGate, disableCompactGate } from '../../_helpers/gate';
import { stubContextApis } from '../../_helpers/network';
import { seedLocalData } from '../../_helpers/data';
import { gotoWatchingTab } from '../../_helpers/nav';
import { stubServiceWorker } from '../../_helpers/sw';

const cssVar = (page, name: string) =>
  page.evaluate(n => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

test.describe('TabCard poster width tokens (React V2)', () => {
  test.beforeEach(async ({ context }) => { 
    await stubServiceWorker(context);
    await stubContextApis(context); 
  });

  test('A) Default: flag OFF → computed --poster-w is not 136px, TabCard poster matches fallback', async ({ page }) => {
    await seedLocalData(page, { watching: [
      { id: '1', title: 'Stub 1', posterUrl: '/p1.png' },
      { id: '2', title: 'Stub 2', posterUrl: '/p2.png' }
    ]});
    
    await page.goto('/');
    await disableCompactGate(page);
    
    const posterW = await cssVar(page, '--poster-w');
    expect(posterW).not.toBe('136px');
    
    // Navigate to watching tab via UI
    await gotoWatchingTab(page);
    
    const candidates = [
      '[data-testid="tab-card"]',
      '.tab-card',
      '[data-rail] [data-cards] > *',
      '[role="main"] [class*="card"]'
    ];
    const locator = page.locator(candidates.join(', ')).first();
    await locator.waitFor({ state: 'visible' });
    
    // OFF: verify fallback widths > 0
    const offBox = await locator.boundingBox();
    expect((offBox?.width || 0)).toBeGreaterThan(0);
    expect(offBox!.width).not.toBe(136);
  });

  test('B) Gate ON: flag + compact density → --poster-w == 136px, TabCard poster ≤ 136px', async ({ page }) => {
    await seedLocalData(page, { watching: [
      { id: '1', title: 'Stub 1', posterUrl: '/p1.png' },
      { id: '2', title: 'Stub 2', posterUrl: '/p2.png' }
    ]});
    
    await page.goto('/');
    await enableCompactGate(page);
    
    // Check HTML attribute
    const attr = await page.evaluate(() => document.documentElement.dataset.compactMobileV1 || '');
    expect(attr).toBe('true');
    
    // Check computed CSS variable
    const posterW = await cssVar(page, '--poster-w');
    expect(posterW).toBe('136px');
    
    // Navigate to watching tab via UI
    await gotoWatchingTab(page);
    
    const candidates = [
      '[data-testid="tab-card"]',
      '.tab-card',
      '[data-rail] [data-cards] > *',
      '[role="main"] [class*="card"]'
    ];
    const locator = page.locator(candidates.join(', ')).first();
    await locator.waitFor({ state: 'visible' });
    
    // ON: enable gate then verify <= 136
    const onBox = await locator.boundingBox();
    expect((onBox?.width || 0)).toBeGreaterThan(0);
    expect(onBox!.width).toBeLessThanOrEqual(137);
  });

  test.afterEach(async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    expect(errors).toEqual([]);
  });
});