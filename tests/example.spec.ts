import { test, expect } from '@playwright/test';

test('home shows Flicklet title', async ({ page }) => {
  await page.goto('/'); // uses baseURL from config
  await expect(page.locator('h1.title')).toHaveText(/Flicklet/i);
});
