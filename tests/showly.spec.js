// tests/showly.spec.js
import { test, expect } from '@playwright/test';

test.describe('Flicklet smoke suite', () => {
  test('home loads and shows title', async ({ page }) => {
    await page.goto('/'); // uses baseURL from config
    await expect(page.locator('h1.title')).toContainText(/Flicklet/i);
    await expect(page.locator('#searchInput')).toBeVisible();
  });

  test('About modal opens and closes', async ({ page }) => {
    await page.goto('/');
    await page.click('#aboutBtn');
    await expect(page.locator('.backdrop')).toBeVisible();
    await expect(page.getByText('About Flicklet 📺')).toBeVisible();
    await page.getByRole('button', { name: /Got it/i }).click(); // handles "Got it! 👍"
    await expect(page.locator('.backdrop')).toBeHidden();
  });

  test('Stats modal opens and closes', async ({ page }) => {
    await page.goto('/');
    await page.click('#usageStatsBtn');
    await expect(page.locator('.backdrop')).toBeVisible();
    await expect(page.getByText('📊 Your Flicklet Stats')).toBeVisible();
    await page.getByRole('button', { name: /Close/i }).click();
    await expect(page.locator('.backdrop')).toBeHidden();
  });
});
