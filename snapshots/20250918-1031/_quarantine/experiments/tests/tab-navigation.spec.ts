import { test, expect } from '@playwright/test';

test('Tab navigation works correctly', async ({ page }) => {
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForSelector('#homeTab');
  
  // Verify all tabs are present
  await expect(page.locator('#homeTab')).toBeVisible();
  await expect(page.locator('#watchingTab')).toBeVisible();
  await expect(page.locator('#wishlistTab')).toBeVisible();
  await expect(page.locator('#watchedTab')).toBeVisible();
  await expect(page.locator('#discoverTab')).toBeVisible();
  
  // Verify home tab is active by default
  await expect(page.locator('#homeTab')).toHaveClass(/active/);
  await expect(page.locator('#homeSection')).toBeVisible();
  
  // Test switching to watching tab
  await page.click('#watchingTab');
  await expect(page.locator('#watchingTab')).toHaveClass(/active/);
  await expect(page.locator('#watchingSection')).toBeVisible();
  await expect(page.locator('#homeSection')).toBeHidden();
  
  // Test switching to wishlist tab
  await page.click('#wishlistTab');
  await expect(page.locator('#wishlistTab')).toHaveClass(/active/);
  await expect(page.locator('#wishlistSection')).toBeVisible();
  await expect(page.locator('#watchingSection')).toBeHidden();
  
  // Test switching to watched tab
  await page.click('#watchedTab');
  await expect(page.locator('#watchedTab')).toHaveClass(/active/);
  await expect(page.locator('#watchedSection')).toBeVisible();
  await expect(page.locator('#wishlistSection')).toBeHidden();
  
  // Test switching to discover tab
  await page.click('#discoverTab');
  await expect(page.locator('#discoverTab')).toHaveClass(/active/);
  await expect(page.locator('#discoverSection')).toBeVisible();
  await expect(page.locator('#watchedSection')).toBeHidden();
  
  // Test switching back to home tab
  await page.click('#homeTab');
  await expect(page.locator('#homeTab')).toHaveClass(/active/);
  await expect(page.locator('#homeSection')).toBeVisible();
  await expect(page.locator('#discoverSection')).toBeHidden();
});

test('Tab badges show correct counts', async ({ page }) => {
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForSelector('#watchingBadge');
  
  // Verify badge elements exist
  await expect(page.locator('#watchingBadge')).toBeVisible();
  await expect(page.locator('#wishlistBadge')).toBeVisible();
  await expect(page.locator('#watchedBadge')).toBeVisible();
  
  // Verify badges contain numbers (even if 0)
  const watchingCount = await page.locator('#watchingBadge').textContent();
  const wishlistCount = await page.locator('#wishlistBadge').textContent();
  const watchedCount = await page.locator('#watchedBadge').textContent();
  
  expect(watchingCount).toMatch(/^\d+$/);
  expect(wishlistCount).toMatch(/^\d+$/);
  expect(watchedCount).toMatch(/^\d+$/);
});
