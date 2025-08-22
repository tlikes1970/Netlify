import { test, expect } from '@playwright/test';

test('binge banner renders and Start jumps to Watching', async ({ page }) => {
  // baseURL is set in the config; "/" resolves to it
  await page.goto('/');

  const banner = page.locator('#bingeBanner');
  await expect(banner).toBeVisible();
  await expect(banner.locator('#bingeTimeText')).toHaveText(/m|h|d/);

  const startBtn = banner.locator('#startBingeBtn');
  await expect(startBtn).toBeVisible();
  await expect(startBtn).toBeEnabled();

  await startBtn.click();

  // Be tolerant: we accept either an id or a data-testid
  const watching = page.locator('#watchingSection, #watchingList, [data-testid="watching-section"]');
  await expect(watching).toBeVisible();
});
