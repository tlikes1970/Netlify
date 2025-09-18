import { test, expect } from '@playwright/test';

test('Debug search button event handlers', async ({ page }) => {
  console.log('🚀 Starting event handler debug...');
  
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
  
  // Check if performSearch function exists
  const hasPerformSearch = await page.evaluate(() => {
    return typeof window.performSearch === 'function';
  });
  console.log('🔧 performSearch function exists:', hasPerformSearch);
  
  // Check if search button has onclick handler
  const hasOnClick = await page.evaluate(() => {
    const searchBtn = document.getElementById('searchBtn');
    return searchBtn && searchBtn.onclick !== null;
  });
  console.log('🔧 Search button has onclick:', hasOnClick);
  
  // Check if search button has any event listeners
  const eventListeners = await page.evaluate(() => {
    const searchBtn = document.getElementById('searchBtn');
    if (!searchBtn) return 'Button not found';
    
    // Try to get event listeners (this might not work in all browsers)
    try {
      // Check if there's a click handler
      const hasClick = searchBtn.onclick !== null;
      const hasAddEventListener = searchBtn.addEventListener !== undefined;
      
      return {
        hasClick,
        hasAddEventListener,
        onclickType: typeof searchBtn.onclick,
        onclickValue: searchBtn.onclick ? 'function' : 'null'
      };
    } catch (error) {
      return `Error: ${error.message}`;
    }
  });
  console.log('🔧 Event listener analysis:', eventListeners);
  
  // Try to manually add a click handler to see if it works
  console.log('🔧 Testing manual click handler...');
  const clickResult = await page.evaluate(() => {
    try {
      const searchBtn = document.getElementById('searchBtn');
      if (!searchBtn) return 'Button not found';
      
      // Add a test click handler
      let clickCount = 0;
      searchBtn.addEventListener('click', () => {
        clickCount++;
        console.log('🔧 Manual click handler fired! Count:', clickCount);
      });
      
      // Trigger a click
      searchBtn.click();
      
      return `Click handler added and triggered. Count: ${clickCount}`;
    } catch (error) {
      return `Error: ${error.message}`;
    }
  });
  console.log('🔧 Manual click handler test:', clickResult);
  
  // Now try the original search button click
  console.log('🔍 Clicking original search button...');
  await page.click('#searchBtn');
  console.log('✅ Search button clicked');
  
  // Wait a moment
  await page.waitForTimeout(2000);
  
  // Check if search results are now visible
  const searchResults = page.locator('#searchResults');
  const isVisible = await searchResults.isVisible();
  const displayStyle = await searchResults.evaluate(el => el.style.display);
  const innerHTML = await searchResults.innerHTML();
  
  console.log('📊 Search Results After Click:');
  console.log('  - Visible:', isVisible);
  console.log('  - Display style:', displayStyle);
  console.log('  - Inner HTML length:', innerHTML.length);
  
  // Check if any network requests were made
  const networkRequests = [];
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method()
    });
    console.log('🌐 Network Request:', request.method(), request.url());
  });
  
  // Wait a bit more to capture any delayed requests
  await page.waitForTimeout(2000);
  
  // Check for TMDB API calls
  const tmdbCalls = networkRequests.filter(req => 
    req.url.includes('tmdb') || req.url.includes('api.themoviedb.org')
  );
  console.log('🌐 TMDB API calls made:', tmdbCalls.length);
  
  // Try to call performSearch directly to see if it works
  console.log('🔧 Calling performSearch directly...');
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
  const displayStyleAfter = await searchResults.evaluate(el => el.style.display);
  const innerHTMLAfter = await searchResults.innerHTML();
  
  console.log('📊 Search Results After Direct Call:');
  console.log('  - Visible:', isVisibleAfter);
  console.log('  - Display style:', displayStyleAfter);
  console.log('  - Inner HTML length:', innerHTMLAfter.length);
  
  console.log('📊 Test completed');
});
