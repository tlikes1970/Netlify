// tests/showly-advanced.spec.js
// Add these tests for comprehensive coverage

import { test, expect } from '@playwright/test';

test.describe('Showly Advanced Features', () => {
  
  test('Can add shows to watchlist', async ({ page }) => {
    await page.goto('/');
    
    // Search for a show
    await page.fill('#searchInput', 'Breaking Bad');
    await page.click('#searchBtn');
    await page.waitForSelector('.show-card', { timeout: 10000 });
    
    // Add to Currently Watching
    await page.click('text="▶️ Currently Watching"');
    
    // Navigate to watching tab and verify
    await page.click('#watchingTab');
    await expect(page.locator('#watchingList .show-card')).toBeVisible();
    await expect(page.locator('#watchingBadge')).toContainText('1');
  });

  test('About modal opens and closes', async ({ page }) => {
    await page.goto('/');
    
    // Open About modal
    await page.click('#aboutBtn');
    await expect(page.locator('.backdrop')).toBeVisible();
    await expect(page.locator('text="About Showly 📺"')).toBeVisible();
    
    // Close modal
    await page.click('text="Got it! 👍"');
    await expect(page.locator('.backdrop')).not.toBeVisible();
  });

  test('Stats modal opens correctly', async ({ page }) => {
    await page.goto('/');
    
    await page.click('#usageStatsBtn');
    await expect(page.locator('.backdrop')).toBeVisible();
    await expect(page.locator('text="📊 Your Showly Stats"')).toBeVisible();
    await expect(page.locator('text="Total Shows"')).toBeVisible();
    
    // Close modal
    await page.click('text="Close"');
    await expect(page.locator('.backdrop')).not.toBeVisible();
  });

  test('Notification test button works', async ({ page }) => {
    await page.goto('/');
    
    await page.click('#testNotification');
    // Should show some kind of notification or permission request
    await expect(page.locator('.notification')).toBeVisible();
  });

  test('Search clear functionality', async ({ page }) => {
    await page.goto('/');
    
    // Enter search term
    await page.fill('#searchInput', 'test search');
    await page.selectOption('#genreFilter', { index: 1 }); // Select first genre
    
    // Clear search should appear
    await expect(page.locator('#clearSearchBtn')).toBeVisible();
    
    // Click clear
    await page.click('#clearSearchBtn');
    
    // Should be cleared
    await expect(page.locator('#searchInput')).toHaveValue('');
    await expect(page.locator('#clearSearchBtn')).not.toBeVisible();
  });

  test('Wildcard search works', async ({ page }) => {
    await page.goto('/');
    
    // Test wildcard search
    await page.fill('#searchInput', 'star*');
    await page.click('#searchBtn');
    
    // Should show wildcard notification
    await expect(page.locator('.notification')).toBeVisible();
  });

  test('Export functionality available', async ({ page }) => {
    await page.goto('/');
    
    // Export button should be visible and clickable
    await expect(page.locator('#exportBtn')).toBeVisible();
    await expect(page.locator('#exportBtn')).toBeEnabled();
  });

  test('Mobile responsive design', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Should still be functional on mobile
    await expect(page.locator('.title')).toBeVisible();
    await expect(page.locator('#searchInput')).toBeVisible();
    await expect(page.locator('.tab-container')).toBeVisible();
    
    // Test mobile navigation
    await page.click('#watchingTab');
    await expect(page.locator('#watchingTab')).toHaveClass(/active/);
  });

  test('Performance check - loads under 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('All key elements present on load', async ({ page }) => {
    await page.goto('/');
    
    // Check all critical UI elements
    await expect(page.locator('.title')).toContainText('Showly');
    await expect(page.locator('#searchInput')).toBeVisible();
    await expect(page.locator('#searchBtn')).toBeVisible();
    await expect(page.locator('#darkModeToggle')).toBeVisible();
    await expect(page.locator('#homeTab')).toBeVisible();
    await expect(page.locator('#watchingTab')).toBeVisible();
    await expect(page.locator('#wishlistTab')).toBeVisible();
    await expect(page.locator('#watchedTab')).toBeVisible();
    await expect(page.locator('#aboutBtn')).toBeVisible();
    await expect(page.locator('#usageStatsBtn')).toBeVisible();
  });
});
