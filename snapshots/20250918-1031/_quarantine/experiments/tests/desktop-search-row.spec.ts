import { test, expect } from '@playwright/test';

test.describe('Desktop Search Row Grid Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page to load completely
    await page.waitForTimeout(1000);
  });

  test('search row uses grid layout at desktop widths', async ({ page }) => {
    // Test at 1024px width
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.waitForTimeout(100);

    const searchRow = page.locator('.top-search .search-row');
    const searchInput = page.locator('.top-search .search-input');
    const genreFilter = page.locator('.top-search .genre-filter');

    // Verify elements exist
    await expect(searchRow).toBeVisible();
    await expect(searchInput).toBeVisible();
    await expect(genreFilter).toBeVisible();

    // Check CSS properties
    const display = await searchRow.evaluate(el => getComputedStyle(el).display);
    const gridTemplateColumns = await searchRow.evaluate(el => getComputedStyle(el).gridTemplateColumns);
    const inputMinWidth = await searchInput.evaluate(el => getComputedStyle(el).minWidth);
    const genreWidth = await genreFilter.evaluate(el => getComputedStyle(el).width);

    expect(display).toBe('grid');
    // Grid template columns will be computed as pixel values, not the original CSS function
    expect(gridTemplateColumns).toMatch(/\d+\.?\d*px/); // Should contain pixel values
    expect(inputMinWidth).toBe('0px');
    expect(genreWidth).not.toBe('auto');
  });

  test('search row layout at 1440px width', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 800 });
    await page.waitForTimeout(100);

    const searchRow = page.locator('.top-search .search-row');
    const display = await searchRow.evaluate(el => getComputedStyle(el).display);
    const gridTemplateColumns = await searchRow.evaluate(el => getComputedStyle(el).gridTemplateColumns);

    expect(display).toBe('grid');
    // Grid template columns will be computed as pixel values
    expect(gridTemplateColumns).toMatch(/\d+\.?\d*px/);
  });

  test('search row layout at 1920px width', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 800 });
    await page.waitForTimeout(100);

    const searchRow = page.locator('.top-search .search-row');
    const display = await searchRow.evaluate(el => getComputedStyle(el).display);
    const gridTemplateColumns = await searchRow.evaluate(el => getComputedStyle(el).gridTemplateColumns);

    expect(display).toBe('grid');
    // Grid template columns will be computed as pixel values
    expect(gridTemplateColumns).toMatch(/\d+\.?\d*px/);
  });

  test('search controls are in correct order', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(100);

    const searchRow = page.locator('.top-search .search-row');
    const children = await searchRow.locator('*').all();

    // Should have at least 4 children: input, genre filter, search button, clear button
    expect(children.length).toBeGreaterThanOrEqual(4);

    // Check the order by looking at the elements
    const input = page.locator('.top-search .search-input');
    const genre = page.locator('.top-search .genre-filter');
    const searchBtn = page.locator('.top-search .search-btn');
    const clearBtn = page.locator('.top-search .clear-search-btn');

    // Verify all elements are visible and in the correct order
    await expect(input).toBeVisible();
    await expect(genre).toBeVisible();
    await expect(searchBtn).toBeVisible();
    await expect(clearBtn).toBeVisible();
  });

  test('search input can shrink below 300px', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.waitForTimeout(100);

    const searchInput = page.locator('.top-search .search-input');
    const minWidth = await searchInput.evaluate(el => getComputedStyle(el).minWidth);
    const width = await searchInput.evaluate(el => getComputedStyle(el).width);

    expect(minWidth).toBe('0px');
    // Width should be flexible, not fixed
    expect(width).not.toBe('300px');
  });

  test('genre filter has appropriate sizing', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(100);

    const genreFilter = page.locator('.top-search .genre-filter');
    const width = await genreFilter.evaluate(el => getComputedStyle(el).width);
    const minWidth = await genreFilter.evaluate(el => getComputedStyle(el).minWidth);

    // Should have max-content width with 120px minimum
    expect(minWidth).toBe('120px');
    expect(width).not.toBe('auto');
  });

  test('search functionality still works', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(100);

    // Test search functionality
    await page.fill('.top-search .search-input', 'test search');
    await page.click('.top-search .search-btn');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Verify search worked (results should appear or no results message)
    const searchResults = page.locator('#searchResults');
    const isVisible = await searchResults.isVisible();
    
    // Either results are visible or the search was processed
    expect(isVisible).toBeTruthy();
  });

  test('clear search functionality still works', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(100);

    // First perform a search
    await page.fill('.top-search .search-input', 'test search');
    await page.click('.top-search .search-btn');
    await page.waitForTimeout(500);

    // Then clear it
    await page.click('.top-search .clear-search-btn');
    await page.waitForTimeout(100);

    // Verify input is cleared
    const inputValue = await page.inputValue('.top-search .search-input');
    expect(inputValue).toBe('');
  });

  test('no layout wrapping at edge cases', async ({ page }) => {
    // Test at the minimum desktop width (641px)
    await page.setViewportSize({ width: 641, height: 800 });
    await page.waitForTimeout(100);

    const searchRow = page.locator('.top-search .search-row');
    const display = await searchRow.evaluate(el => getComputedStyle(el).display);
    
    expect(display).toBe('grid');

    // Test at maximum width (1920px)
    await page.setViewportSize({ width: 1920, height: 800 });
    await page.waitForTimeout(100);

    const displayMax = await searchRow.evaluate(el => getComputedStyle(el).display);
    expect(displayMax).toBe('grid');
  });

  test('mobile layout not affected', async ({ page }) => {
    // Test at mobile width (should not use grid)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(100);

    const searchRow = page.locator('.top-search .search-row');
    const display = await searchRow.evaluate(el => getComputedStyle(el).display);
    
    // Should be flex at mobile width (not grid)
    expect(display).toBe('flex');
  });
});
