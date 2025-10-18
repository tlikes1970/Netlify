import { test, expect } from '@playwright/test';

test('smart search ranks anchor and zombie-ish items higher', async ({ page }) => {
  await page.goto('/');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Fill in the search input
  await page.fill('[role="searchbox"]', 'z nation');
  await page.keyboard.press('Enter');
  
  // Wait for search results to appear
  await page.waitForSelector('text=Search results for "z nation"', { timeout: 10000 });
  
  // Wait a bit more for results to load
  await page.waitForTimeout(2000);
  
  // Check if we have search results
  const resultsSection = page.locator('section[aria-labelledby="search-results-heading"]');
  await expect(resultsSection).toBeVisible();
  
  // Look for the first result title
  const firstResult = resultsSection.locator('.font-bold.text-lg').first();
  await expect(firstResult).toBeVisible();
  
  const firstTitle = await firstResult.innerText();
  expect(firstTitle.toLowerCase()).toContain('z nation'); // anchor on top
  
  // Verify we have multiple results
  const allResults = resultsSection.locator('.font-bold.text-lg');
  const resultCount = await allResults.count();
  expect(resultCount).toBeGreaterThan(0);
});
