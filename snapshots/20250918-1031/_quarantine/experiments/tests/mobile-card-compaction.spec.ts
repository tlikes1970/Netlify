import { test, expect } from '@playwright/test';

test.describe('Mobile Card Compaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page to load completely
    await page.waitForTimeout(1000);
  });

  test('mobile cards use grid layout with correct dimensions', async ({ page }) => {
    // Set mobile viewport (iPhone 13 size)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);

    // Force mobile-v1 class to be applied
    await page.evaluate(() => {
      document.body.classList.add('mobile-v1');
    });

    // Wait for any cards to load
    await page.waitForTimeout(500);

    // Check if we have any cards
    const cards = page.locator('.show-card');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      const firstCard = cards.first();
      
      // Check grid layout
      const display = await firstCard.evaluate(el => getComputedStyle(el).display);
      const gridTemplateColumns = await firstCard.evaluate(el => getComputedStyle(el).gridTemplateColumns);
      
      expect(display).toBe('grid');
      expect(gridTemplateColumns).toContain('64px');
      expect(gridTemplateColumns).toContain('1fr');
      expect(gridTemplateColumns).toContain('44px');
    }
  });

  test('card heights are compact on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);

    // Force mobile-v1 class
    await page.evaluate(() => {
      document.body.classList.add('mobile-v1');
    });

    await page.waitForTimeout(500);

    const cards = page.locator('.show-card');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      // Check heights of first 5 cards
      const heights = await cards.evaluateAll(cards => 
        cards.slice(0, 5).map(card => card.getBoundingClientRect().height)
      );
      
      // Heights should be compact (≤160px)
      heights.forEach(height => {
        expect(height).toBeLessThanOrEqual(160);
        expect(height).toBeGreaterThan(80); // Should still be reasonable
      });
    }
  });

  test('poster images have correct dimensions', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);

    await page.evaluate(() => {
      document.body.classList.add('mobile-v1');
    });

    await page.waitForTimeout(500);

    const posters = page.locator('.show-card .poster, .show-card img.poster, .show-card .thumb, .show-card img.thumb');
    const posterCount = await posters.count();
    
    if (posterCount > 0) {
      const firstPoster = posters.first();
      
      const width = await firstPoster.evaluate(el => getComputedStyle(el).width);
      const height = await firstPoster.evaluate(el => getComputedStyle(el).height);
      
      expect(width).toBe('64px');
      expect(height).toBe('96px'); // 64px * 1.5
    }
  });

  test('action buttons have correct width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);

    await page.evaluate(() => {
      document.body.classList.add('mobile-v1');
    });

    await page.waitForTimeout(500);

    const actionButtons = page.locator('.show-card .actions .btn, .show-card .actions button, .show-card .actions .icon-btn');
    const buttonCount = await actionButtons.count();
    
    if (buttonCount > 0) {
      const firstButton = actionButtons.first();
      
      const width = await firstButton.evaluate(el => getComputedStyle(el).width);
      const minWidth = await firstButton.evaluate(el => getComputedStyle(el).minWidth);
      
      expect(width).toBe('44px');
      expect(minWidth).toBe('44px');
    }
  });

  test('overview text is clamped to 2 lines', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);

    await page.evaluate(() => {
      document.body.classList.add('mobile-v1');
    });

    await page.waitForTimeout(500);

    const overviews = page.locator('.show-card .overview');
    const overviewCount = await overviews.count();
    
    if (overviewCount > 0) {
      const firstOverview = overviews.first();
      
      const display = await firstOverview.evaluate(el => getComputedStyle(el).display);
      const webkitBoxOrient = await firstOverview.evaluate(el => getComputedStyle(el).webkitBoxOrient);
      const webkitLineClamp = await firstOverview.evaluate(el => getComputedStyle(el).webkitLineClamp);
      const overflow = await firstOverview.evaluate(el => getComputedStyle(el).overflow);
      
      expect(display).toBe('-webkit-box');
      expect(webkitBoxOrient).toBe('vertical');
      expect(webkitLineClamp).toBe('2');
      expect(overflow).toBe('hidden');
    }
  });

  test('desktop layout not affected', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(100);

    // Ensure mobile-v1 class is NOT applied
    await page.evaluate(() => {
      document.body.classList.remove('mobile-v1');
    });

    await page.waitForTimeout(500);

    const cards = page.locator('.show-card');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      const firstCard = cards.first();
      
      // Should not be grid layout on desktop
      const display = await firstCard.evaluate(el => getComputedStyle(el).display);
      expect(display).not.toBe('grid');
    }
  });

  test('mobile layout only applies at correct viewport', async ({ page }) => {
    // Test at exactly 640px (should not apply)
    await page.setViewportSize({ width: 640, height: 800 });
    await page.waitForTimeout(100);

    await page.evaluate(() => {
      document.body.classList.add('mobile-v1');
    });

    await page.waitForTimeout(500);

    const cards = page.locator('.show-card');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      const firstCard = cards.first();
      
      // At 640px, should not be grid (max-width: 640px means < 640px)
      const display = await firstCard.evaluate(el => getComputedStyle(el).display);
      expect(display).not.toBe('grid');
    }

    // Test at 639px (should apply)
    await page.setViewportSize({ width: 639, height: 800 });
    await page.waitForTimeout(100);

    await page.waitForTimeout(500);

    if (cardCount > 0) {
      const firstCard = cards.first();
      
      // At 639px, should be grid
      const display = await firstCard.evaluate(el => getComputedStyle(el).display);
      expect(display).toBe('grid');
    }
  });

  test('no horizontal scroll introduced', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);

    await page.evaluate(() => {
      document.body.classList.add('mobile-v1');
    });

    await page.waitForTimeout(500);

    // Check if there's horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // Allow small margin for rounding
  });

  test('action buttons remain tappable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);

    await page.evaluate(() => {
      document.body.classList.add('mobile-v1');
    });

    await page.waitForTimeout(500);

    const actionButtons = page.locator('.show-card .actions .btn, .show-card .actions button, .show-card .actions .icon-btn');
    const buttonCount = await actionButtons.count();
    
    if (buttonCount > 0) {
      const firstButton = actionButtons.first();
      
      const height = await firstButton.evaluate(el => getComputedStyle(el).height);
      const paddingTop = await firstButton.evaluate(el => getComputedStyle(el).paddingTop);
      const paddingBottom = await firstButton.evaluate(el => getComputedStyle(el).paddingBottom);
      
      // Total height should be at least 40px for good touch targets
      const totalHeight = parseFloat(height) + parseFloat(paddingTop) + parseFloat(paddingBottom);
      expect(totalHeight).toBeGreaterThanOrEqual(40);
    }
  });
});
