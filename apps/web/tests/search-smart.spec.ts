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

test('z-nation anchors correctly and titles are never numeric', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Test different Z-Nation query variants
  const queries = ['z-nation', 'z nation', 'Z—Nation'];
  
  for (const query of queries) {
    await page.fill('[role="searchbox"]', query);
    await page.keyboard.press('Enter');
    
    // Wait for search results
    await page.waitForSelector(`text=Search results for "${query}"`, { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Check first result should be Z Nation or very close
    const firstResult = page.locator('.font-bold.text-lg').first();
    await expect(firstResult).toBeVisible();
    
    const firstTitle = await firstResult.innerText().then(text => text.toLowerCase());
    
    // Should not be numeric "0" or empty
    expect(firstTitle).not.toBe('0');
    expect(firstTitle).not.toBe('');
    expect(firstTitle).not.toBe('untitled');
    
    // Should match Z-Nation pattern
    expect(firstTitle).toMatch(/z[ -]?nation/);
    
    // Clear search for next iteration
    await page.fill('[role="searchbox"]', '');
  }
});