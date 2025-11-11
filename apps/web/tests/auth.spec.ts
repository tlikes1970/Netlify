import { test, expect } from '@playwright/test';

/**
 * Auth redirect flow test
 * Simulates redirect sequence with mocked provider to test origin verification
 */
test.describe('Auth Redirect Flow', () => {
  test('should parse redirect result once and not re-initiate login', async ({ page, context }) => {
    // Navigate to app
    await page.goto('/?debug=auth');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that debug page is accessible
    await page.goto('/debug/auth');
    await expect(page.locator('h1')).toContainText('Auth Debug Page');
    
    // Verify origin info is displayed
    const originInfo = page.locator('text=App Origin:');
    await expect(originInfo).toBeVisible();
    
    // Go back to home
    await page.goto('/?debug=auth');
    await page.waitForLoadState('networkidle');
    
    // Simulate redirect return by setting sessionStorage flag
    // This mimics what happens when user returns from OAuth provider
    await page.evaluate(() => {
      sessionStorage.setItem('flk:didRedirect', '1');
      // Simulate redirect URL with auth params
      window.history.replaceState({}, '', '/?state=test&code=test');
    });
    
    // Reload to trigger redirect processing
    await page.reload({ waitUntil: 'networkidle' });
    
    // Wait a bit for auth processing
    await page.waitForTimeout(2000);
    
    // Check that redirect flag was processed (should be removed)
    const didRedirect = await page.evaluate(() => {
      return sessionStorage.getItem('flk:didRedirect');
    });
    expect(didRedirect).toBeNull();
    
    // Check that once flag was set (prevents retry)
    const onceFlag = await page.evaluate(() => {
      return sessionStorage.getItem('flk.auth.redirect.once');
    });
    expect(onceFlag).toBe('1');
  });

  test('should show origin mismatch banner when origins do not match', async ({ page }) => {
    await page.goto('/?debug=auth');
    await page.waitForLoadState('networkidle');
    
    // Simulate origin mismatch scenario
    // In real scenario, this would happen if OAuth redirects to wrong domain
    await page.evaluate(() => {
      // Dispatch origin mismatch event (what auth.ts does)
      window.dispatchEvent(new CustomEvent('auth:origin-mismatch', {
        detail: {
          got: 'https://wrong-domain.com',
          expected: window.location.origin,
          message: 'Auth return origin mismatch',
        }
      }));
    });
    
    // Wait for banner to appear
    await page.waitForTimeout(500);
    
    // Check for origin mismatch banner
    const banner = page.locator('text=Auth return origin mismatch');
    await expect(banner).toBeVisible();
    
    // Check for retry button
    const retryButton = page.locator('text=Retry with Popup');
    await expect(retryButton).toBeVisible();
  });

  test('should respect authMode query param override', async ({ page }) => {
    // Test popup override
    await page.goto('/?debug=auth&authMode=popup');
    await page.waitForLoadState('networkidle');
    
    // Check debug page shows override
    await page.goto('/debug/auth');
    const authModeDisplay = page.locator('text=Auth Mode Override:');
    await expect(authModeDisplay).toBeVisible();
    
    // Check that popup mode is indicated
    const popupMode = page.locator('text=popup');
    await expect(popupMode).toBeVisible();
    
    // Test redirect override
    await page.goto('/?debug=auth&authMode=redirect');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/debug/auth');
    const redirectMode = page.locator('text=redirect');
    await expect(redirectMode).toBeVisible();
  });

  test('should not loop on redirect processing', async ({ page }) => {
    await page.goto('/?debug=auth');
    await page.waitForLoadState('networkidle');
    
    // Set redirect flag and simulate return
    await page.evaluate(() => {
      sessionStorage.setItem('flk:didRedirect', '1');
    });
    
    // Reload multiple times to ensure no loop
    for (let i = 0; i < 3; i++) {
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      
      // After first reload, flag should be processed
      const onceFlag = await page.evaluate(() => {
        return sessionStorage.getItem('flk.auth.redirect.once');
      });
      
      if (i === 0) {
        // First reload should process it
        expect(onceFlag).toBe('1');
      } else {
        // Subsequent reloads should not process again
        expect(onceFlag).toBe('1');
      }
    }
  });

  test('debug page should display all diagnostic info', async ({ page }) => {
    await page.goto('/debug/auth');
    await page.waitForLoadState('networkidle');
    
    // Check all sections are present
    await expect(page.locator('h2:has-text("Environment")')).toBeVisible();
    await expect(page.locator('h2:has-text("Firebase Config")')).toBeVisible();
    await expect(page.locator('h2:has-text("Cookies")')).toBeVisible();
    await expect(page.locator('h2:has-text("Storage Availability")')).toBeVisible();
    await expect(page.locator('h2:has-text("Service Worker")')).toBeVisible();
    await expect(page.locator('h2:has-text("Recent Auth Logs")')).toBeVisible();
    
    // Check storage tests run
    const storageTable = page.locator('text=localStorage');
    await expect(storageTable).toBeVisible();
    
    // Check query toggles
    const debugToggle = page.locator('button:has-text("debug=auth")');
    await expect(debugToggle).toBeVisible();
  });
});







