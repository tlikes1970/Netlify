import { test, expect } from '@playwright/test';
import { enableCompactGate, disableCompactGate } from '../../_helpers/gate';
import { stubContextApis } from '../../_helpers/network';
import { seedLocalData } from '../../_helpers/data';
import { stubServiceWorker } from '../../_helpers/sw';

test.describe('Home compact layout activation (React V2)', () => {
  test.beforeEach(async ({ context }) => { 
    await stubServiceWorker(context);
    await stubContextApis(context); 
  });

  test('A) Flag OFF: no data-compact-mobile-v1, cards exist, zero console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
    await seedLocalData(page, { watching: [
      { id: '1', title: 'Stub 1', posterUrl: '/p1.png' },
      { id: '2', title: 'Stub 2', posterUrl: '/p2.png' }
    ]});
    
    await page.goto('/');
    await disableCompactGate(page);
    
    const compactAttr = await page.evaluate(() => document.documentElement.dataset.compactMobileV1 || '');
    expect(compactAttr).toBe('');
    
    // Find first two card elements on Home
    const sel = ['[data-testid="cardv2"]', '.CardV2', '[class*="card"]'];
    const firstCard = await page.locator(sel.join(', ')).first();
    const secondCard = await page.locator(sel.join(', ')).nth(1);
    
    await expect(firstCard).toBeVisible();
    await expect(secondCard).toBeVisible();
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test('B) Gate ON: data-compact-mobile-v1=true, --poster-w=136px, cards visible in viewport', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
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
    const posterW = await page.evaluate(() => 
      getComputedStyle(document.documentElement).getPropertyValue('--poster-w').trim()
    );
    expect(posterW).toBe('136px');
    
    // Find first rail and measure first two cards
    const cardMeasurements = await page.evaluate(() => {
      const firstRail = document.querySelector('[data-rail]');
      if (!firstRail) return null;
      
      const sel = ['[data-testid="cardv2"]', '.CardV2', '[class*="card"]'];
      const cards = Array.from(firstRail.querySelectorAll(sel.join(', ')));
      if (cards.length < 2) return null;
      
      const card1 = cards[0] as HTMLElement;
      const card2 = cards[1] as HTMLElement;
      
      const rect1 = card1.getBoundingClientRect();
      const rect2 = card2.getBoundingClientRect();
      
      return {
        card1Right: rect1.right,
        card2Right: rect2.right,
        viewportWidth: window.innerWidth
      };
    });
    
    // Assert cards are visible within viewport
    expect(cardMeasurements).not.toBeNull();
    expect(cardMeasurements!.card1Right).toBeLessThanOrEqual(cardMeasurements!.viewportWidth + 1); // Allow ±1px
    expect(cardMeasurements!.card2Right).toBeLessThanOrEqual(cardMeasurements!.viewportWidth + 1); // Allow ±1px
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test.afterEach(async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    expect(errors).toEqual([]);
  });
});