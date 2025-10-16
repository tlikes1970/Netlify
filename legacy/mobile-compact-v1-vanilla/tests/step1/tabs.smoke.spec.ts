import { test, expect } from '@playwright/test';

test.describe('Tabs Smoke Tests', () => {
  test('clicks each bottom tab without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test each bottom tab
    const tabs = [
      { id: 'bottomHomeTab', section: 'homeSection' },
      { id: 'bottomWatchingTab', section: 'watchingSection' },
      { id: 'bottomWishlistTab', section: 'wishlistSection' },
      { id: 'bottomWatchedTab', section: 'watchedSection' },
      { id: 'bottomDiscoverTab', section: 'discoverSection' }
    ];

    for (const tab of tabs) {
      // Click the tab
      await page.click(`#${tab.id}`);
      
      // Wait for section to be visible
      await expect(page.locator(`#${tab.section}`)).toBeVisible();
      
      // Check for console errors after tab switch
      expect(consoleErrors).toHaveLength(0);
    }
  });

  test('tab switching works without JavaScript errors', async ({ page }) => {
    const jsErrors: string[] = [];
    
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test tab switching
    await page.click('#bottomWatchingTab');
    await page.waitForTimeout(500);
    
    await page.click('#bottomWishlistTab');
    await page.waitForTimeout(500);
    
    await page.click('#bottomHomeTab');
    await page.waitForTimeout(500);
    
    expect(jsErrors).toHaveLength(0);
  });
});
