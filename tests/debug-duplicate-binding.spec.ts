import { test, expect } from '@playwright/test';

test('Verify search button binding works after removing duplicates', async ({ page }) => {
  console.log('🚀 Testing search button binding...');

  // Navigate to the page
  await page.goto('/');
  console.log('✅ Page loaded');

  // Wait for search elements
  await page.waitForSelector('#searchInput');
  await page.waitForSelector('#searchBtn');
  console.log('✅ Search elements ready');

  // Fill search input
  await page.fill('#searchInput', 'archer');
  console.log('✅ Filled search input');

  // Check if search button has onclick handler BEFORE clicking
  const hasOnClickBefore = await page.evaluate(() => {
    const searchBtn = document.getElementById('searchBtn');
    return searchBtn && searchBtn.onclick !== null;
  });
  console.log('🔧 Search button has onclick BEFORE click:', hasOnClickBefore);

  // Check if performSearch function exists
  const hasPerformSearch = await page.evaluate(() => {
    return typeof window.performSearch === 'function';
  });
  console.log('🔧 performSearch function exists:', hasPerformSearch);

  // Click search button
  console.log('🔍 Clicking search button...');
  await page.click('#searchBtn');
  console.log('✅ Search button clicked');

  // Wait for search to process
  await page.waitForTimeout(3000);

  // Check if search results are now visible
  const searchResults = page.locator('#searchResults');
  const isVisible = await searchResults.isVisible();
  const displayStyle = await searchResults.evaluate((el) => el.style.display);
  const innerHTML = await searchResults.innerHTML();

  console.log('📊 Search Results After Click:');
  console.log('  - Visible:', isVisible);
  console.log('  - Display style:', displayStyle);
  console.log('  - Inner HTML length:', innerHTML.length);

  // Check if any TMDB API calls were made
  const networkRequests = [];
  page.on('request', (request) => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
    });
    console.log('🌐 Network Request:', request.method(), request.url());
  });

  // Wait a bit more to capture any delayed requests
  await page.waitForTimeout(2000);

  // Check for TMDB API calls
  const tmdbCalls = networkRequests.filter(
    (req) => req.url.includes('tmdb') || req.url.includes('api.themoviedb.org'),
  );
  console.log('🌐 TMDB API calls made:', tmdbCalls.length);

  // If search didn't work, try calling performSearch directly
  if (!isVisible && innerHTML.length === 0) {
    console.log("🔧 Search didn't work, trying direct function call...");
    const directResult = await page.evaluate(() => {
      try {
        if (typeof window.performSearch === 'function') {
          window.performSearch();
          return 'performSearch called successfully';
        } else {
          return 'performSearch function not found';
        }
      } catch (error) {
        return `Error: ${error.message}`;
      }
    });
    console.log('🔧 Direct performSearch result:', directResult);

    // Wait for direct call to complete
    await page.waitForTimeout(3000);

    // Check search results again
    const isVisibleAfter = await searchResults.isVisible();
    const displayStyleAfter = await searchResults.evaluate((el) => el.style.display);
    const innerHTMLAfter = await searchResults.innerHTML();

    console.log('📊 Search Results After Direct Call:');
    console.log('  - Visible:', isVisibleAfter);
    console.log('  - Display style:', displayStyleAfter);
    console.log('  - Inner HTML length:', innerHTMLAfter.length);
  }

  console.log('📊 Test completed');
});
