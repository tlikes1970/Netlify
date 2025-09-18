import { test, expect, getLastTMDBUrl, dumpDebug, resetLastOpenedUrl, getLastOpenedUrl } from './fixtures';

test('FlickWord card appears', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(250); // allow tmdbGet shim + mocks to settle
  const card = page.locator('#flickwordCard, [data-flickword], .flickword-card');
  if (!(await card.first().isVisible())) await dumpDebug(page);
  await expect(card.first()).toBeVisible();
  
  // Verify the card contains expected elements
  await expect(page.locator('#flickwordCard h3')).toHaveText(/Daily Word Challenge/i);
  await expect(page.locator('#flickwordCard #dailyCountdown')).toBeVisible();
  
  // Verify the play button exists
  const playButton = page.locator('#flickwordCard button:has-text("Play Today\'s Word")');
  await expect(playButton).toBeVisible();
});

test('FlickWord countdown timer shows time remaining', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(250); // allow tmdbGet shim + mocks to settle
  const timer = page.locator('#dailyCountdown, [data-countdown], .countdown');
  if (!(await timer.first().isVisible())) await dumpDebug(page);
  await expect(timer.first()).toBeVisible();
  
  // Verify it shows time format (should show countdown)
  const timerText = await page.locator('#dailyCountdown').textContent();
  expect(timerText).toMatch(/⏱/);
});

test('FlickWord CTA opens expected URL', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(250); // allow shims/mocks to settle
  await resetLastOpenedUrl(page);

  const cta = page.locator('#flickwordCard a, [data-flickword] a, .flickword-card a').first();
  await expect(cta).toBeVisible();
  const href = await cta.getAttribute('href');
  await cta.click();

  // give the stub a tick to record the URL
  await page.waitForTimeout(50);
  const opened = await getLastOpenedUrl(page);
  if (!opened) await dumpDebug(page);
  expect(opened).toContain(href || '#');
});

test('FlickWord mobile CTA opens expected URL', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  
  await page.goto('/');
  await page.waitForTimeout(250); // allow shims/mocks to settle
  await resetLastOpenedUrl(page);

  const cta = page.locator('#flickwordCard a, [data-flickword] a, .flickword-card a').first();
  await expect(cta).toBeVisible();
  const href = await cta.getAttribute('href');
  await cta.click();

  // give the stub a tick to record the URL
  await page.waitForTimeout(50);
  const opened = await getLastOpenedUrl(page);
  if (!opened) await dumpDebug(page);
  expect(opened).toContain(href || '#');
});
