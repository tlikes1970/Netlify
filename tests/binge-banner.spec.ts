// tests/binge-banner.spec.ts
import { test, expect } from '@playwright/test';

test('binge banner renders and Start jumps to Watching', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#bingeBanner');
  await expect(page.locator('#bingeBanner #bingeTimeText')).toHaveText(/m|h|d/);

  const targetTop = await page.locator('#watchingSection')
    .evaluate(el => Math.round(el.getBoundingClientRect().top + window.scrollY));

  await page.locator('#startBingeBtn').click();
  await page.waitForTimeout(250); // allow smooth scroll
  const scrollY = await page.evaluate(() => Math.round(window.scrollY));
  expect(Math.abs(scrollY - targetTop)).toBeLessThan(300);
});
