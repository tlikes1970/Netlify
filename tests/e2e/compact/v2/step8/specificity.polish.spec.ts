import { test, expect } from '@playwright/test';
import { enableCompactGate, disableCompactGate } from '../../_helpers/gate';
import { stubContextApis } from '../../_helpers/network';
import { seedLocalData } from '../../_helpers/data';
import { stubServiceWorker } from '../../_helpers/sw';

test.describe('Specificity Cleanup & Polish (Mobile Compact V2)', () => {
  test.beforeEach(async ({ context }) => { 
    await stubServiceWorker(context);
    await stubContextApis(context); 
  });

  test('A) Gate OFF: Home has no console errors; first rail/card is not geometrically overlapped by bottom nav', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
    await seedLocalData(page, { watching: [
      { id: '1', title: 'Stub 1', posterUrl: '/p1.png' },
      { id: '2', title: 'Stub 2', posterUrl: '/p2.png' }
    ]});
    
    await page.goto('/');
    await disableCompactGate(page);
    
    // Ensure compact gate is OFF
    const compactAttr = await page.evaluate(() => 
      document.documentElement.dataset.compactMobileV1 || ''
    );
    expect(compactAttr).toBe('');
    
    // Check that first rail/card is visible and not overlapped
    const firstCard = page.locator('[data-testid="cardv2"]').first();
    await expect(firstCard).toBeVisible();
    
    // Get card position
    const cardBox = await firstCard.boundingBox();
    expect(cardBox).not.toBeNull();
    
    // Get viewport height
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    
    // Card should be visible in viewport (not overlapped by bottom nav)
    expect(cardBox!.y + cardBox!.height).toBeLessThan(viewportHeight - 50); // Allow 50px for bottom nav
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test('B) Gate ON: Same checks; verify computed z-index of sheet > menu > FAB > bottom nav', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
    await seedLocalData(page, { watching: [
      { id: '1', title: 'Stub 1', posterUrl: '/p1.png' },
      { id: '2', title: 'Stub 2', posterUrl: '/p2.png' }
    ]});
    
    await page.goto('/');
    await enableCompactGate(page);
    
    // Ensure compact gate is ON
    const compactAttr = await page.evaluate(() => 
      document.documentElement.dataset.compactMobileV1 || ''
    );
    expect(compactAttr).toBe('true');
    
    // Check that first rail/card is visible and not overlapped
    const firstCard = page.locator('[data-testid="cardv2"]').first();
    await expect(firstCard).toBeVisible();
    
    // Get card position
    const cardBox = await firstCard.boundingBox();
    expect(cardBox).not.toBeNull();
    
    // Get viewport height
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    
    // Card should be visible in viewport (not overlapped by bottom nav)
    expect(cardBox!.y + cardBox!.height).toBeLessThan(viewportHeight - 50); // Allow 50px for bottom nav
    
    // Verify z-index stacking order
    const zIndexValues = await page.evaluate(() => {
      const getZIndex = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) return 0;
        const style = window.getComputedStyle(element);
        return parseInt(style.zIndex) || 0;
      };
      
      return {
        bottomNav: getZIndex('[data-bottom-nav], .bottom-nav'),
        fab: getZIndex('button[aria-label="Open Settings"]'),
        menu: getZIndex('.compact-overflow-menu, [role="menu"]'),
        sheet: getZIndex('.settings-sheet-overlay, .settings-sheet')
      };
    });
    
    // Verify stacking order: sheet > menu > FAB > bottom nav
    expect(zIndexValues.sheet).toBeGreaterThan(zIndexValues.menu);
    expect(zIndexValues.menu).toBeGreaterThan(zIndexValues.fab);
    expect(zIndexValues.fab).toBeGreaterThan(zIndexValues.bottomNav);
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test('C) No !important: fetch text of compact-cleanup.css and assert it does NOT include \'!important\'', async ({ page }) => {
    // Navigate to the app to ensure the CSS is loaded
    await page.goto('/');
    
    // Get the CSS content by fetching the file
    const response = await page.request.get('/src/styles/compact-cleanup.css');
    expect(response.status()).toBe(200);
    
    const cssContent = await response.text();
    
    // Assert that the CSS does NOT contain !important
    expect(cssContent).not.toContain('!important');
    
    // Additional check: verify the file contains our z-index tokens
    expect(cssContent).toContain('--z-bottom-nav: 1000');
    expect(cssContent).toContain('--z-fab: 1200');
    expect(cssContent).toContain('--z-menu: 15000');
    expect(cssContent).toContain('--z-sheet: 20000');
    
    // Verify safe-area usage
    expect(cssContent).toContain('env(safe-area-inset-bottom)');
  });

  test('D) Safe area: with gate ON, check bottom nav has padding-bottom ≥ env(safe-area-inset-bottom) fallback', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
    await seedLocalData(page, { watching: [
      { id: '1', title: 'Stub 1', posterUrl: '/p1.png' },
      { id: '2', title: 'Stub 2', posterUrl: '/p2.png' }
    ]});
    
    await page.goto('/');
    await enableCompactGate(page);
    
    // Ensure compact gate is ON
    const compactAttr = await page.evaluate(() => 
      document.documentElement.dataset.compactMobileV1 || ''
    );
    expect(compactAttr).toBe('true');
    
    // Check bottom nav padding
    const bottomNavPadding = await page.evaluate(() => {
      const bottomNav = document.querySelector('[data-bottom-nav], .bottom-nav, .mobile-tabs, [data-mobile-nav]');
      if (!bottomNav) return 0;
      const style = window.getComputedStyle(bottomNav);
      const paddingBottom = style.paddingBottom;
      return parseInt(paddingBottom) || 0;
    });
    
    // Bottom nav should have padding-bottom >= 8px (fallback for safe-area-inset-bottom)
    expect(bottomNavPadding).toBeGreaterThanOrEqual(8);
    
    // Check main content padding
    const mainPadding = await page.evaluate(() => {
      const main = document.querySelector('main');
      if (!main) return 0;
      const style = window.getComputedStyle(main);
      const paddingBottom = style.paddingBottom;
      return parseInt(paddingBottom) || 0;
    });
    
    // Main should have padding-bottom >= 16px (fallback for safe-area-inset-bottom)
    expect(mainPadding).toBeGreaterThanOrEqual(16);
    
    // Check settings sheet content area if it exists
    const settingsSheetPadding = await page.evaluate(() => {
      const contentArea = document.querySelector('.settings-sheet .content-area');
      if (!contentArea) return 0;
      const style = window.getComputedStyle(contentArea);
      const paddingBottom = style.paddingBottom;
      return parseInt(paddingBottom) || 0;
    });
    
    // Settings sheet content area should have padding-bottom >= 16px
    if (settingsSheetPadding > 0) {
      expect(settingsSheetPadding).toBeGreaterThanOrEqual(16);
    }
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test.afterEach(async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    expect(errors).toEqual([]);
  });
});








