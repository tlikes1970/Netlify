import { test, expect } from '@playwright/test';

test('home shows Flicklet title', async ({ page }) => {
  await page.goto('/');

  // Title tag is stable and fastest
  await expect(page).toHaveTitle(/Flicklet/i);

  // Also allow any header variant the app renders
  const header = page.locator('h1, header [data-testid="app-title"], [data-testid="app-title"]');
  await expect(header).toContainText(/Flicklet/i);
});
