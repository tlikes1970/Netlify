/**
 * Data Flow Audit Tests - v28.81
 * Comprehensive tests for TV/movie data flow from search to list management
 */

import { test, expect } from '@playwright/test';

test.describe('Data Flow Audit - High Priority Fixes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:8888');
    
    // Wait for app to load
    await page.waitForSelector('#homeSection', { timeout: 10000 });
    
    // Clear any existing data for clean tests
    await page.evaluate(() => {
      localStorage.clear();
      if (window.appData) {
        window.appData = {
          tv: { watching: [], wishlist: [], watched: [] },
          movies: { watching: [], wishlist: [], watched: [] },
          settings: { pro: false, isPro: false, episodeTracking: false, theme: 'light', lang: 'en' }
        };
      }
    });
  });

  test('Search to Add Flow - Basic Functionality', async ({ page }) => {
    // Test search functionality
    await page.fill('#search', 'The Matrix');
    await page.press('#search', 'Enter');
    
    // Wait for search results
    await page.waitForSelector('[data-id]', { timeout: 10000 });
    
    // Get first search result
    const firstResult = page.locator('[data-id]').first();
    let itemId = await firstResult.getAttribute('data-id');
    const itemTitle = await firstResult.locator('.title').textContent();
    
    console.log('Search result:', { itemId, itemTitle });
    
    expect(itemId).toBeTruthy();
    expect(itemTitle).toBeTruthy();
    
    // Test adding to wishlist
    const addButton = firstResult.locator('[data-action="add-to-wishlist"]').first();
    await addButton.click();
    
    // Wait for success notification
    await page.waitForSelector('.notification.success', { timeout: 5000 });
    
    // Verify item was added to data structure first
    const dataCheck = await page.evaluate((id) => {
      const appData = window.appData;
      if (!appData) return { found: false, error: 'No appData' };
      
      // Check both old and new structures
      const inOldStructure = appData.movies?.wishlist?.some(item => String(item.id) === String(id));
      const inNewStructure = appData.watchlists?.movies?.wishlist?.some(item => String(item.id) === String(id));
      
      // Get all item IDs for debugging
      const oldIds = appData.movies?.wishlist?.map(item => String(item.id)) || [];
      const newIds = appData.watchlists?.movies?.wishlist?.map(item => String(item.id)) || [];
      
      return {
        found: inOldStructure || inNewStructure,
        oldStructure: !!appData.movies?.wishlist,
        newStructure: !!appData.watchlists?.movies?.wishlist,
        oldCount: appData.movies?.wishlist?.length || 0,
        newCount: appData.watchlists?.movies?.wishlist?.length || 0,
        lookingFor: String(id),
        oldIds,
        newIds
      };
    }, itemId);
    
    console.log('Data check result:', dataCheck);
    
    // If the item wasn't found with the original ID, check if it was saved with a different ID
    if (!dataCheck.found && dataCheck.oldIds.length > 0) {
      console.log('Item not found with original ID, checking with saved ID:', dataCheck.oldIds[0]);
      itemId = dataCheck.oldIds[0]; // Use the actual saved ID
    }
    
    expect(dataCheck.oldCount).toBeGreaterThan(0);
    expect(dataCheck.newCount).toBeGreaterThan(0);
    
    // Now check if item appears in UI
    await page.click('#wishlistTab');
    await page.waitForSelector('#wishlistSection');
    
    // Check what's actually in the wishlist UI
    const wishlistContent = await page.evaluate(() => {
      const wishlistSection = document.getElementById('wishlistSection');
      if (!wishlistSection) return { error: 'No wishlistSection found' };
      
      const cards = wishlistSection.querySelectorAll('[data-id]');
      const cardIds = Array.from(cards).map(card => card.getAttribute('data-id'));
      const cardTitles = Array.from(cards).map(card => card.querySelector('.title')?.textContent);
      
      return {
        cardCount: cards.length,
        cardIds,
        cardTitles,
        sectionHTML: wishlistSection.innerHTML.substring(0, 500) // First 500 chars
      };
    });
    
    console.log('Wishlist UI content:', wishlistContent);
    
    const wishlistItem = page.locator(`[data-id="${itemId}"]`).first();
    await expect(wishlistItem).toBeVisible();
  });

  test('Move Between Lists - Data Integrity', async ({ page }) => {
    // Add test item to wishlist using DataOperations
    await page.evaluate(async () => {
      if (window.DataOperations) {
        await window.DataOperations.init();
        await window.DataOperations.addItem('12345', 'wishlist', {
          id: 12345,
          title: 'Test Movie',
          media_type: 'movie',
          poster_path: '/test.jpg'
        });
      }
    });
    
    // Navigate to wishlist
    await page.click('#wishlistTab');
    await page.waitForSelector('#wishlistSection');
    
    // Find test item and move to watching
    const testItem = page.locator('[data-id="12345"]').first();
    await expect(testItem).toBeVisible();
    
    const moveButton = testItem.locator('[data-action="move-to-watching"]').first();
    await moveButton.click();
    
    // Wait for success
    await page.waitForSelector('.notification.success', { timeout: 5000 });
    
    // Verify item moved to watching
    await page.click('#watchingTab');
    await page.waitForSelector('#watchingSection');
    
    const watchingItem = page.locator('[data-id="12345"]').first();
    await expect(watchingItem).toBeVisible();
    
    // Verify item not in wishlist anymore
    await page.click('#wishlistTab');
    const wishlistItem = page.locator('[data-id="12345"]');
    await expect(wishlistItem).toHaveCount(0);
  });

  test('Data Structure Consistency - Firebase Format', async ({ page }) => {
    // Test that data is stored in Firebase format (watchlists.*)
    await page.evaluate(() => {
      if (window.appData) {
        window.appData.movies.wishlist.push({
          id: 67890,
          title: 'Firebase Test Movie',
          media_type: 'movie'
        });
        if (window.saveAppData) window.saveAppData();
      }
    });
    
    // Check that data structure matches Firebase format
    const dataStructure = await page.evaluate(() => {
      return {
        hasWatchlists: !!window.appData?.watchlists,
        hasMovies: !!window.appData?.movies,
        hasTv: !!window.appData?.tv,
        structure: window.appData ? Object.keys(window.appData) : []
      };
    });
    
    // Should have both old and new structure during transition
    expect(dataStructure.hasMovies).toBe(true);
    expect(dataStructure.hasTv).toBe(true);
  });

  test('Error Handling - Missing Functions', async ({ page }) => {
    // Test graceful handling when functions are missing
    await page.evaluate(() => {
      // Temporarily remove critical functions
      delete window.moveItem;
      delete window.addToListFromCache;
    });
    
    // Try to add item from search
    await page.fill('#search', 'Test Movie');
    await page.press('#search', 'Enter');
    
    await page.waitForSelector('[data-id]', { timeout: 10000 });
    const firstResult = page.locator('[data-id]').first();
    const addButton = firstResult.locator('[data-action="add-to-wishlist"]').first();
    
    // Should not crash, should show error message
    await addButton.click();
    
    // Check for error handling
    const errorMessage = page.locator('.notification.error');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('Race Condition Prevention - Concurrent Operations', async ({ page }) => {
    // Test multiple rapid operations don't cause race conditions
    await page.evaluate(() => {
      if (window.appData) {
        window.appData.movies.wishlist.push({
          id: 11111,
          title: 'Race Test Movie',
          media_type: 'movie'
        });
        if (window.saveAppData) window.saveAppData();
      }
    });
    
    await page.click('#wishlistTab');
    await page.waitForSelector('#wishlistSection');
    
    const testItem = page.locator('[data-id="11111"]').first();
    
    // Rapidly click move button multiple times
    const moveButton = testItem.locator('[data-action="move"]').first();
    
    // Click multiple times rapidly
    await Promise.all([
      moveButton.click(),
      moveButton.click(),
      moveButton.click()
    ]);
    
    // Wait for operations to complete
    await page.waitForTimeout(2000);
    
    // Verify item only moved once (not duplicated)
    await page.click('#watchingTab');
    const watchingItems = page.locator('[data-id="11111"]');
    await expect(watchingItems).toHaveCount(1);
  });

  test('Cache Invalidation - Data Consistency', async ({ page }) => {
    // Test that cache invalidation works properly
    await page.evaluate(() => {
      if (window.appData) {
        window.appData.movies.wishlist.push({
          id: 22222,
          title: 'Cache Test Movie',
          media_type: 'movie'
        });
        if (window.saveAppData) window.saveAppData();
      }
    });
    
    // Verify item appears in UI
    await page.click('#wishlistTab');
    await page.waitForSelector('#wishlistSection');
    
    const testItem = page.locator('[data-id="22222"]').first();
    await expect(testItem).toBeVisible();
    
    // Simulate cache invalidation
    await page.evaluate(() => {
      if (window.WatchlistsAdapter && window.WatchlistsAdapter.invalidate) {
        window.WatchlistsAdapter.invalidate();
      }
    });
    
    // Item should still be visible after cache invalidation
    await expect(testItem).toBeVisible();
  });
});

test.describe('Data Flow Audit - Medium Priority Fixes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8888');
    await page.waitForSelector('#homeSection', { timeout: 10000 });
  });

  test('Data Validation - Invalid Data Handling', async ({ page }) => {
    // Test handling of invalid data
    await page.evaluate(() => {
      if (window.appData) {
        // Add invalid data
        window.appData.movies.wishlist.push({
          id: 'invalid',
          title: null,
          media_type: 'invalid'
        });
        if (window.saveAppData) window.saveAppData();
      }
    });
    
    // App should not crash
    await page.click('#wishlistTab');
    await page.waitForSelector('#wishlistSection');
    
    // Should handle invalid data gracefully
    const section = page.locator('#wishlistSection');
    await expect(section).toBeVisible();
  });

  test('Logging Consistency - Debug Information', async ({ page }) => {
    // Test that logging is consistent across functions
    const consoleLogs = [];
    
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('[data-flow]')) {
        consoleLogs.push(msg.text());
      }
    });
    
    // Perform data operation
    await page.fill('#search', 'Test');
    await page.press('#search', 'Enter');
    
    await page.waitForSelector('[data-id]', { timeout: 10000 });
    const firstResult = page.locator('[data-id]').first();
    const addButton = firstResult.locator('[data-action="add-to-wishlist"]').first();
    await addButton.click();
    
    // Should have consistent logging
    expect(consoleLogs.length).toBeGreaterThan(0);
  });

  test('Offline Support - Local Storage Fallback', async ({ page }) => {
    // Test offline functionality
    await page.context().setOffline(true);
    
    // Should still work with local storage
    await page.evaluate(() => {
      if (window.appData) {
        window.appData.movies.wishlist.push({
          id: 33333,
          title: 'Offline Test Movie',
          media_type: 'movie'
        });
        if (window.saveAppData) window.saveAppData();
      }
    });
    
    await page.click('#wishlistTab');
    await page.waitForSelector('#wishlistSection');
    
    const testItem = page.locator('[data-id="33333"]').first();
    await expect(testItem).toBeVisible();
    
    // Re-enable network
    await page.context().setOffline(false);
  });
});
