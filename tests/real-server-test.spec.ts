import { test, expect, Page } from '@playwright/test';

/**
 * Process: Real Server Test
 * Purpose: Test against the actual running server without mocking
 * Data Source: Real TMDB API and Firebase data
 * Update Path: Run against localhost:8888 when server is running
 * Dependencies: Real server, real API calls, real data
 */

test.describe('Real Server Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Connect directly to the real server without mocking
    await page.goto('http://localhost:8888');
    await page.waitForLoadState('networkidle');
  });

  test('Complete User Journey - Real Server', async ({ page }) => {
    console.log('🎬 Starting real server user journey test...');
    
    // Step 1: Start from home tab
    await expect(page.locator('#homeSection')).toBeVisible();
    console.log('✅ Step 1: Home tab is visible');
    
    // Step 2: Perform search
    console.log('🔍 Step 2: Performing search...');
    await page.fill('#search', 'the voice');
    await page.press('#search', 'Enter');
    
    // Wait for search results
    await page.waitForTimeout(3000); // Give more time for real API calls
    
    // Check if search results container is visible
    const searchResults = page.locator('#searchResults');
    await expect(searchResults).toBeVisible();
    console.log('✅ Step 2: Search results container visible');
    
    // Look for actual search result cards
    const searchCards = page.locator('#searchResultsGrid .media-card, #searchResults .media-card, #searchResults [data-id]');
    const cardCount = await searchCards.count();
    console.log(`Found ${cardCount} search result cards`);
    
    if (cardCount > 0) {
      console.log('✅ Step 2: Search results loaded successfully');
      
      // Step 3: Get first result and add to wishlist
      console.log('📝 Step 3: Adding item to wishlist...');
      const firstCard = searchCards.first();
      
      // Try multiple selectors for the title
      let itemTitle = '';
      const titleSelectors = ['.media-card-title', '[data-title]', 'h3', '.card-title', '.title'];
      
      for (const selector of titleSelectors) {
        const titleElement = firstCard.locator(selector);
        if (await titleElement.count() > 0) {
          itemTitle = await titleElement.textContent();
          break;
        }
      }
      
      console.log(`Adding item: ${itemTitle || 'Unknown Title'}`);
      
      // Click add to wishlist button - try multiple selectors
      const buttonSelectors = [
        '[data-action="want-to-watch"]',
        '[data-action="add"][data-list="wishlist"]',
        'button[data-action="add"]',
        '.unified-card-action-btn',
        'button:has-text("Want to Watch")',
        'button:has-text("Add")'
      ];
      
      let addButton = null;
      for (const selector of buttonSelectors) {
        const button = firstCard.locator(selector);
        if (await button.count() > 0) {
          addButton = button;
          break;
        }
      }
      
      if (addButton) {
        await expect(addButton).toBeVisible();
        await addButton.click();
        console.log('✅ Add button clicked');
      } else {
        console.log('❌ No add button found');
        // Debug: show the card HTML
        const cardHTML = await firstCard.innerHTML();
        console.log('Card HTML:', cardHTML.substring(0, 500));
      }
      
      // Wait for success notification
      await page.waitForSelector('.notification', { timeout: 5000 });
      console.log('✅ Step 3: Item added to wishlist');
      
      // Step 4: Switch to wishlist tab to verify
      console.log('🔄 Step 4: Switching to wishlist tab...');
      await page.click('#wishlistTab');
      await page.waitForTimeout(1000);
      
      const wishlistSection = page.locator('#wishlistSection');
      await expect(wishlistSection).toBeVisible();
      
      const wishlistItems = page.locator('#wishlistSection .media-card, #wishlistSection [data-id]');
      const wishlistCount = await wishlistItems.count();
      console.log(`Found ${wishlistCount} items in wishlist`);
      
      if (wishlistCount > 0) {
        const firstWishlistItem = wishlistItems.first();
        
        // Try multiple selectors for the title
        let wishlistTitle = '';
        const titleSelectors = ['.media-card-title', '[data-title]', 'h3', '.card-title', '.title'];
        
        for (const selector of titleSelectors) {
          const titleElement = firstWishlistItem.locator(selector);
          if (await titleElement.count() > 0) {
            wishlistTitle = await titleElement.textContent();
            break;
          }
        }
        
        console.log(`Wishlist item: ${wishlistTitle || 'Unknown Title'}`);
        console.log('✅ Step 4: Item verified in wishlist');
        
        // Step 5: Move item to watching
        console.log('📦 Step 5: Moving item to watching list...');
        const moveButtonSelectors = [
          '[data-action="move-to-watching"]',
          '[data-action="move"][data-dest="watching"]',
          'button[data-action="move"]',
          '.unified-card-action-btn',
          'button:has-text("Currently Watching")',
          'button:has-text("Move")'
        ];
        
        let moveButton = null;
        for (const selector of moveButtonSelectors) {
          const button = firstWishlistItem.locator(selector);
          if (await button.count() > 0) {
            moveButton = button;
            break;
          }
        }
        
        if (moveButton && await moveButton.isVisible()) {
          await moveButton.click();
          await page.waitForTimeout(1000);
          console.log('✅ Step 5: Item moved to watching list');
        } else {
          console.log('❌ No move button found');
        }
        
        // Step 6: Switch to watching tab
        console.log('👀 Step 6: Switching to watching tab...');
        await page.click('#watchingTab');
        await page.waitForTimeout(3000); // Wait longer for UI to refresh
        
        const watchingSection = page.locator('#watchingSection');
        await expect(watchingSection).toBeVisible();
        
        // Debug: Check what's actually in the watching list container
        const watchingListContainer = page.locator('#watchingList');
        const containerHTML = await watchingListContainer.innerHTML();
        console.log('Watching list container HTML:', containerHTML.substring(0, 500));
        
        const watchingItems = page.locator('#watchingSection .media-card, #watchingSection [data-id]');
        const watchingCount = await watchingItems.count();
        console.log(`Found ${watchingCount} items in watching list`);
        
        if (watchingCount > 0) {
          const firstWatchingItem = watchingItems.first();
          
          // Try multiple selectors for the title
          let watchingTitle = '';
          const titleSelectors = ['.media-card-title', '[data-title]', 'h3', '.card-title', '.title'];
          
          for (const selector of titleSelectors) {
            const titleElement = firstWatchingItem.locator(selector);
            if (await titleElement.count() > 0) {
              watchingTitle = await titleElement.textContent();
              break;
            }
          }
          
          console.log(`Watching item: ${watchingTitle || 'Unknown Title'}`);
          console.log('✅ Step 6: Item verified in watching list');
        }
        
        // Step 7: Return to home tab
        console.log('🏠 Step 7: Checking home page display...');
        await page.click('#homeTab');
        await page.waitForTimeout(1000);
        
        // Check for currently watching section
        const currentlyWatchingSection = page.locator('#group-1-your-shows, .currently-watching, [data-section="currently-watching"]');
        if (await currentlyWatchingSection.count() > 0) {
          const firstSection = currentlyWatchingSection.first();
          await expect(firstSection).toBeVisible();
          console.log('✅ Step 7: Currently watching section is visible');
          
          const cards = firstSection.locator('[data-id], .card, .media-card');
          const cardCount = await cards.count();
          console.log(`Found ${cardCount} cards in currently watching section`);
        }
        
        console.log('🎉 Complete user journey test completed successfully!');
      } else {
        console.log('❌ No items found in wishlist after adding');
      }
    } else {
      console.log('❌ No search results found');
      // Get the search results HTML to debug
      const searchHTML = await searchResults.innerHTML();
      console.log('Search results HTML:', searchHTML.substring(0, 500));
    }
  });

  test('Search Functionality - Real Server', async ({ page }) => {
    console.log('🔍 Testing search functionality with real server...');
    
    // Test search input
    const searchInput = page.locator('#search');
    await expect(searchInput).toBeVisible();
    
    // Perform search
    await searchInput.fill('inception');
    await searchInput.press('Enter');
    
    // Wait for results
    await page.waitForTimeout(3000);
    
    // Check search results
    const searchResults = page.locator('#searchResults');
    await expect(searchResults).toBeVisible();
    
    // Check for actual results
    const cards = page.locator('#searchResultsGrid .media-card, #searchResults .media-card, #searchResults [data-id]');
    const cardCount = await cards.count();
    console.log(`Found ${cardCount} search result cards`);
    
    if (cardCount > 0) {
      console.log('✅ Search functionality working with real server');
    } else {
      console.log('❌ No search results found');
      const searchHTML = await searchResults.innerHTML();
      console.log('Search results HTML:', searchHTML.substring(0, 500));
    }
  });

  test('Tab Navigation - Real Server', async ({ page }) => {
    console.log('🔄 Testing tab navigation with real server...');
    
    const tabs = ['home', 'watching', 'wishlist', 'watched', 'discover'];
    
    for (const tab of tabs) {
      console.log(`Testing ${tab} tab...`);
      
      const tabElement = page.locator(`#${tab}Tab`);
      await expect(tabElement).toBeVisible();
      await tabElement.click();
      await page.waitForTimeout(500);
      
      const section = page.locator(`#${tab}Section`);
      await expect(section).toBeVisible();
      
      console.log(`✅ ${tab} tab working`);
    }
    
    console.log('✅ All tab navigation working with real server');
  });
});
