import { test, expect } from '@playwright/test';

test('Debug search process in detail', async ({ page }) => {
  console.log('🚀 Starting detailed search debug...');
  
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
  
  // Set up console log capture
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(msg.text());
    console.log('📱 Console:', msg.text());
  });
  
  // Set up network request monitoring
  const networkRequests = [];
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers()
    });
    console.log('🌐 Network Request:', request.method(), request.url());
  });
  
  page.on('response', response => {
    console.log('🌐 Network Response:', response.status(), response.url());
  });
  
  // Click search button
  console.log('🔍 Clicking search button...');
  await page.click('#searchBtn');
  console.log('✅ Search button clicked');
  
  // Wait for any network activity
  await page.waitForTimeout(3000);
  
  // Check search results container state
  const searchResults = page.locator('#searchResults');
  const isVisible = await searchResults.isVisible();
  const displayStyle = await searchResults.evaluate(el => el.style.display);
  const innerHTML = await searchResults.innerHTML();
  
  console.log('📊 Search Results Analysis:');
  console.log('  - Visible:', isVisible);
  console.log('  - Display style:', displayStyle);
  console.log('  - Inner HTML length:', innerHTML.length);
  console.log('  - Inner HTML preview:', innerHTML.substring(0, 300));
  
  // Check if there are any error messages or loading states
  const loadingElements = await page.locator('[class*="loading"], [class*="searching"], .loading, .searching').count();
  const errorElements = await page.locator('[class*="error"], [class*="fail"], .error, .fail').count();
  
  console.log('📊 Element Analysis:');
  console.log('  - Loading elements:', loadingElements);
  console.log('  - Error elements:', errorElements);
  
  // Check if TMDB API calls were made
  const tmdbCalls = networkRequests.filter(req => req.url.includes('tmdb') || req.url.includes('api.themoviedb.org'));
  console.log('🌐 TMDB API calls made:', tmdbCalls.length);
  tmdbCalls.forEach((call, index) => {
    console.log(`  ${index + 1}. ${call.method} ${call.url}`);
  });
  
  // Check console logs for errors
  const errorLogs = consoleLogs.filter(log => 
    log.toLowerCase().includes('error') || 
    log.toLowerCase().includes('fail') || 
    log.toLowerCase().includes('exception')
  );
  
  console.log('📱 Error console logs:', errorLogs.length);
  errorLogs.forEach((log, index) => {
    console.log(`  ${index + 1}. ${log}`);
  });
  
  // Try to manually trigger search via JavaScript
  console.log('🔧 Attempting manual search trigger...');
  const searchResult = await page.evaluate(() => {
    try {
      // Check if functions exist
      const hasPerformSearch = typeof window.performSearch === 'function';
      const hasTmdbGet = typeof window.tmdbGet === 'function';
      const hasT = typeof window.t === 'function';
      
      console.log('🔧 Function availability:', { hasPerformSearch, hasTmdbGet, hasT });
      
      // Try to call performSearch directly
      if (hasPerformSearch) {
        window.performSearch();
        return 'performSearch called successfully';
      } else {
        return 'performSearch function not found';
      }
    } catch (error) {
      return `Error: ${error.message}`;
    }
  });
  
  console.log('🔧 Manual search result:', searchResult);
  
  // Wait a bit more for manual search
  await page.waitForTimeout(2000);
  
  // Check search results again
  const isVisibleAfter = await searchResults.isVisible();
  const displayStyleAfter = await searchResults.evaluate(el => el.style.display);
  const innerHTMLAfter = await searchResults.innerHTML();
  
  console.log('📊 Search Results After Manual Trigger:');
  console.log('  - Visible:', isVisibleAfter);
  console.log('  - Display style:', displayStyleAfter);
  console.log('  - Inner HTML length:', innerHTMLAfter.length);
  
  console.log('📊 Test completed. Total console logs:', consoleLogs.length);
  console.log('📊 Total network requests:', networkRequests.length);
});
