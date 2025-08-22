import { test, expect } from '@playwright/test';

test('clear search hides results and resets inputs', async ({ page }) => {
  await page.goto('/');
  await page.fill('#searchInput', 'archer');
  await page.click('#searchBtn');
  await expect(page.locator('#searchResults')).toBeVisible();
  await page.click('#clearSearchBtn');
  await expect(page.locator('#searchResults')).toBeHidden();
  await expect(page.locator('#searchInput')).toHaveValue('');
});
