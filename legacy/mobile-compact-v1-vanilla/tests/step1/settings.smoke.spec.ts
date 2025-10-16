import { test, expect } from '@playwright/test';

test.describe('Settings Modal Smoke Tests', () => {
  test('opens settings modal without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click settings button (FAB)
    await page.click('#btnSettings');
    
    // Wait for settings modal to be visible
    await expect(page.locator('#settingsModal')).toBeVisible();
    
    // Check for console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('settings modal opens and closes without JavaScript errors', async ({ page }) => {
    const jsErrors: string[] = [];
    
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open settings modal
    await page.click('#btnSettings');
    await expect(page.locator('#settingsModal')).toBeVisible();
    
    // Close settings modal
    await page.click('#settingsClose');
    await expect(page.locator('#settingsModal')).toBeHidden();
    
    expect(jsErrors).toHaveLength(0);
  });

  test('settings modal density toggle exists', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open settings modal
    await page.click('#btnSettings');
    await expect(page.locator('#settingsModal')).toBeVisible();
    
    // Check for density toggle
    await expect(page.locator('#condensedMode')).toBeVisible();
  });
});
