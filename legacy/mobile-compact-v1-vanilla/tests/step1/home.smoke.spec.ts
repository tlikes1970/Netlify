import { test, expect } from '@playwright/test';

test.describe('Home Page Smoke Tests', () => {
  test('loads home route without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for console errors
    expect(consoleErrors).toHaveLength(0);
    
    // Verify home section is visible
    await expect(page.locator('#homeSection')).toBeVisible();
  });

  test('home page renders without JavaScript errors', async ({ page }) => {
    const jsErrors: string[] = [];
    
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    expect(jsErrors).toHaveLength(0);
  });
});
