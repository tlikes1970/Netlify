import { test, expect } from '@playwright/test';

test('FlickWord game card is visible on home page', async ({ page }) => {
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForSelector('#flickwordCard');
  
  // Verify FlickWord card is visible
  await expect(page.locator('#flickwordCard')).toBeVisible();
  
  // Verify the card contains expected elements
  await expect(page.locator('#flickwordCard h3')).toHaveText(/Daily Word Challenge/i);
  await expect(page.locator('#flickwordCard #dailyCountdown')).toBeVisible();
  
  // Verify the play button exists
  const playButton = page.locator('#flickwordCard button:has-text("Play Today\'s Word")');
  await expect(playButton).toBeVisible();
});

test('FlickWord countdown timer shows time remaining', async ({ page }) => {
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForSelector('#dailyCountdown');
  
  // Verify countdown timer is visible
  await expect(page.locator('#dailyCountdown')).toBeVisible();
  
  // Verify it shows time format (should show countdown)
  const timerText = await page.locator('#dailyCountdown').textContent();
  expect(timerText).toMatch(/⏱/);
});

test('FlickWord game opens in new window/tab', async ({ page, context }) => {
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForSelector('#flickwordCard button:has-text("Play Today\'s Word")');
  
  // Click the play button
  const playButton = page.locator('#flickwordCard button:has-text("Play Today\'s Word")');
  
  // Listen for new page/window
  const pagePromise = context.waitForEvent('page');
  await playButton.click();
  
  // Wait for new page to open
  const newPage = await pagePromise;
  await newPage.waitForLoadState();
  
  // Verify the new page is FlickWord game
  await expect(newPage.locator('h2')).toHaveText('FlickWord');
  await expect(newPage.locator('#grid')).toBeVisible();
  await expect(newPage.locator('#keyboard')).toBeVisible();
  
  // Close the game page
  await newPage.close();
});

test('FlickWord game keyboard is properly sized on mobile', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForSelector('#flickwordCard button:has-text("Play Today\'s Word")');
  
  // Click the play button
  const playButton = page.locator('#flickwordCard button:has-text("Play Today\'s Word")');
  
  // Listen for new page/window
  const pagePromise = page.context().waitForEvent('page');
  await playButton.click();
  
  // Wait for new page to open
  const newPage = await pagePromise;
  await newPage.waitForLoadState();
  
  // Verify mobile keyboard styling is applied
  const keyboard = newPage.locator('#keyboard');
  await expect(keyboard).toBeVisible();
  
  // Check that keys are properly sized for mobile
  const firstKey = newPage.locator('.key').first();
  const keyStyles = await firstKey.evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      minWidth: styles.minWidth,
      height: styles.height,
      fontSize: styles.fontSize
    };
  });
  
  // Verify mobile-appropriate sizing
  expect(keyStyles.minWidth).toMatch(/calc\(9vw/);
  expect(keyStyles.height).toBe('44px');
  
  // Close the game page
  await newPage.close();
});
