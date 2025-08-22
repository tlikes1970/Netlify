// tests/about-stats.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('About modal opens and closes', async ({ page }) => {
  await page.locator('#aboutBtn').click();

  // Assert a modal with the About title shows up
  const aboutTitle = page.locator('.modal h3', { hasText: /About Flicklet/i });
  await expect(aboutTitle).toBeVisible();

  // Close (click any "Close" button inside a modal)
  await page.locator('.modal button:has-text("Close")').click();

  // Modal is gone
  await expect(aboutTitle).toHaveCount(0);
});

test('Usage Stats modal opens and closes', async ({ page }) => {
  await page.locator('#usageStatsBtn').click();

  const statsTitle = page.locator('.modal h3', { hasText: /Usage Stats/i });
  await expect(statsTitle).toBeVisible();

  // Optional: spot-check content
  await expect(page.locator('.modal')).toContainText(/Total items/i);

  await page.locator('.modal button:has-text("Close")').click();
  await expect(statsTitle).toHaveCount(0);
});
