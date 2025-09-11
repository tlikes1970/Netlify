import { test, expect } from '@playwright/test';

test('Debug search functionality step by step', async ({ page }) => {
  console.log('🚀 Starting debug test...');
  
  // Navigate to the page
  await page.goto('/');
  console.log('✅ Page loaded');
  
  // Wait for page to load and check if search input exists
  try {
    await page.waitForSelector('#searchInput', { timeout: 10000 });
    console.log('✅ Search input found');
  } catch (error) {
    console.log('❌ Search input not found:', error);
    return;
  }
  
  // Check if search button exists
  try {
    await page.waitForSelector('#searchBtn', { timeout: 10000 });
    console.log('✅ Search button found');
  } catch (error) {
    console.log('❌ Search button not found:', error);
    return;
  }
  
  // Check if clear search button exists
  try {
    await page.waitForSelector('#clearSearchBtn', { timeout: 10000 });
    console.log('✅ Clear search button found');
  } catch (error) {
    console.log('❌ Clear search button not found:', error);
    return;
  }
  
  // Check if search results container exists
  try {
    await page.waitForSelector('#searchResults', { timeout: 10000 });
    console.log('✅ Search results container found');
  } catch (error) {
    console.log('❌ Search results container not found:', error);
    return;
  }
  
  // Fill search input
  await page.fill('#searchInput', 'archer');
  console.log('✅ Filled search input with "archer"');
  
  // Check if search input has the value
  const inputValue = await page.locator('#searchInput').inputValue();
  console.log('📝 Search input value:', inputValue);
  
  // Click search button
  console.log('🔍 Clicking search button...');
  await page.click('#searchBtn');
  console.log('✅ Search button clicked');
  
  // Wait a moment for search to process
  await page.waitForTimeout(2000);
  
  // Check if search results are visible
  const isVisible = await page.locator('#searchResults').isVisible();
  console.log('👁️ Search results visible:', isVisible);
  
  // Check search results content
  const resultsContent = await page.locator('#searchResults').innerHTML();
  console.log('📄 Search results content length:', resultsContent.length);
  console.log('📄 Search results content preview:', resultsContent.substring(0, 200));
  
  // Check if there are any error messages
  const errorElements = await page.locator('.error, [class*="error"], [class*="fail"]').count();
  console.log('❌ Error elements found:', errorElements);
  
  // Check console for errors
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(msg.text());
    console.log('📱 Console:', msg.text());
  });
  
  // Wait a bit more to capture console logs
  await page.waitForTimeout(1000);
  
  console.log('📊 Test completed. Console logs captured:', consoleLogs.length);
});
