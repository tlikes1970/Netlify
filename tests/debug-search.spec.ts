import { test, expect, Page } from './fixtures';

test.describe('Debug Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Debug Search Functionality', async ({ page }) => {
    console.log('🔍 Starting search debug test...');
    
    // Check if search input exists
    const searchInput = page.locator('#search');
    await expect(searchInput).toBeVisible();
    console.log('✅ Search input found');
    
    // Perform search
    await searchInput.fill('test movie');
    await searchInput.press('Enter');
    console.log('✅ Search performed');
    
    // Wait for search results
    await page.waitForTimeout(2000);
    
    // Check search results container
    const searchResults = page.locator('#searchResults');
    await expect(searchResults).toBeVisible();
    console.log('✅ Search results container visible');
    
    // Get the HTML content to see what's actually there
    const searchHTML = await searchResults.innerHTML();
    console.log('Search results HTML:', searchHTML);
    
    // Check if there are any cards
    const cards = page.locator('#searchResults .media-card, #searchResults [data-id]');
    const cardCount = await cards.count();
    console.log(`Found ${cardCount} cards`);
    
    // Check network requests
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('tmdb') || request.url().includes('search')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });
    
    // Wait a bit more to capture requests
    await page.waitForTimeout(1000);
    
    console.log('Network requests:', requests);
    
    // Check if search function exists
    const searchFunction = await page.evaluate(() => {
      return typeof window.performSearch === 'function';
    });
    console.log('Search function exists:', searchFunction);
    
    // Check if searchTMDB function exists
    const tmdbFunction = await page.evaluate(() => {
      return typeof window.searchTMDB === 'function';
    });
    console.log('searchTMDB function exists:', tmdbFunction);
  });
});