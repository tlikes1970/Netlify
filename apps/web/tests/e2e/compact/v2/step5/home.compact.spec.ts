import { test, expect } from '@playwright/test';

test.describe('Home compact layout activation (React V2)', () => {
  test('A) Flag OFF: no data-compact-mobile-v1, cards exist, zero console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('flag:mobile_compact_v1'));
    await page.reload();
    
    // Check HTML attribute is absent
    const attr = await page.evaluate(() => document.documentElement.dataset.compactMobileV1 || '');
    expect(attr).toBe('');
    
    // Find first two card elements on Home
    const cards = await page.evaluate(() => {
      const selectors = ['[data-testid="cardv2"]', '.CardV2', '[class*="card"]'];
      const foundCards = [];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          foundCards.push(...Array.from(elements).slice(0, 2));
          break;
        }
      }
      
      return foundCards.map(card => ({
        exists: !!card,
        tagName: card?.tagName,
        className: card?.className
      }));
    });
    
    // Assert cards exist
    expect(cards.length).toBeGreaterThan(0);
    expect(cards[0].exists).toBe(true);
    if (cards.length > 1) {
      expect(cards[1].exists).toBe(true);
    }
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test('B) Gate ON: data-compact-mobile-v1=true, --poster-w=136px, cards visible in viewport', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
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
    const posterW = await page.evaluate(() => 
      getComputedStyle(document.documentElement).getPropertyValue('--poster-w').trim()
    );
    expect(posterW).toBe('136px');
    
    // Find first rail and measure first two cards
    const cardMeasurements = await page.evaluate(() => {
      const firstRail = document.querySelector('[data-rail]');
      if (!firstRail) return null;
      
      const cards = firstRail.querySelectorAll('[data-testid="cardv2"]');
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
