/**
 * Cards Move & Counts Tests - Visible Move Buttons + Live Tab Counts
 * 
 * Process: Move Button Testing
 * Purpose: Validate move buttons work correctly and tab counts update optimistically
 * Data Source: Test data fixtures and DOM elements
 * Update Path: Update test selectors if move button structure changes
 * Dependencies: Playwright, test fixtures, poster-card component
 */

import { test, expect } from '@playwright/test';

test.describe('Move Buttons & Tab Counts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Move Buttons Display', () => {
    test('shows correct move buttons per section', async ({ page }) => {
      // Add test items to different sections
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 1001,
            name: 'Watching Show',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv'
          });
          window.appData.tv.wishlist.push({
            id: 1002,
            name: 'Wishlist Show',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv'
          });
          window.appData.tv.watched.push({
            id: 1003,
            name: 'Watched Show',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv'
          });
          
          if (window.loadListContent) {
            window.loadListContent('watching');
            window.loadListContent('wishlist');
            window.loadListContent('watched');
          }
        }
      });

      // Test Watching section buttons
      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');
      
      const watchingButtons = page.locator('.poster-card__move-btn');
      await expect(watchingButtons).toHaveCount(2);
      await expect(watchingButtons.nth(0)).toHaveText('Move to Wishlist');
      await expect(watchingButtons.nth(1)).toHaveText('Move to Watched');

      // Test Wishlist section buttons
      await page.click('[data-tab="wishlist"]');
      await page.waitForSelector('.poster-card');
      
      const wishlistButtons = page.locator('.poster-card__move-btn');
      await expect(wishlistButtons).toHaveCount(2);
      await expect(wishlistButtons.nth(0)).toHaveText('Move to Watching');
      await expect(wishlistButtons.nth(1)).toHaveText('Move to Watched');

      // Test Watched section buttons
      await page.click('[data-tab="watched"]');
      await page.waitForSelector('.poster-card');
      
      const watchedButtons = page.locator('.poster-card__move-btn');
      await expect(watchedButtons).toHaveCount(2);
      await expect(watchedButtons.nth(0)).toHaveText('Move to Watching');
      await expect(watchedButtons.nth(1)).toHaveText('Move to Wishlist');
    });

    test('move buttons are large and visible', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 1004,
            name: 'Test Show',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv'
          });
          if (window.loadListContent) {
            window.loadListContent('watching');
          }
        }
      });

      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');
      
      const moveButton = page.locator('.poster-card__move-btn').first();
      await expect(moveButton).toBeVisible();
      
      // Check button sizing
      const buttonBox = await moveButton.boundingBox();
      expect(buttonBox?.height).toBeGreaterThanOrEqual(24); // Minimum tap target
    });
  });

  test.describe('Move Functionality', () => {
    test('move updates tab count optimistically', async ({ page }) => {
      // Add test items
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 1005,
            name: 'Move Test Show',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv'
          });
          if (window.loadListContent) {
            window.loadListContent('watching');
            window.loadListContent('wishlist');
            window.loadListContent('watched');
          }
        }
      });

      // Get initial counts
      const initialWatchingCount = await page.textContent('#watchingCount');
      const initialWishlistCount = await page.textContent('#wishlistCount');

      // Move item from watching to wishlist
      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');
      
      const moveButton = page.locator('.poster-card__move-btn').first(); // Move to Wishlist
      await moveButton.click();

      // Check counts updated
      await page.waitForTimeout(500); // Wait for optimistic update
      
      const newWatchingCount = await page.textContent('#watchingCount');
      const newWishlistCount = await page.textContent('#wishlistCount');
      
      expect(parseInt(newWatchingCount || '0')).toBeLessThan(parseInt(initialWatchingCount || '0'));
      expect(parseInt(newWishlistCount || '0')).toBeGreaterThan(parseInt(initialWishlistCount || '0'));
    });

    test('move removes card from current section', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 1006,
            name: 'Remove Test Show',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv'
          });
          if (window.loadListContent) {
            window.loadListContent('watching');
          }
        }
      });

      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');
      
      // Verify card exists
      const initialCards = page.locator('.poster-card');
      await expect(initialCards).toHaveCount(1);
      
      // Move item
      const moveButton = page.locator('.poster-card__move-btn').first();
      await moveButton.click();
      
      // Check card is removed (with animation delay)
      await page.waitForTimeout(500);
      const remainingCards = page.locator('.poster-card');
      await expect(remainingCards).toHaveCount(0);
    });

    test('remove updates tab count', async ({ page }) => {
      // Add test items
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 1007,
            name: 'Remove Count Test',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv'
          });
          if (window.loadListContent) {
            window.loadListContent('watching');
          }
        }
      });

      const initialCount = await page.textContent('#watchingCount');
      
      // Simulate remove (this would be through overflow menu in Prompt 4)
      await page.evaluate(() => {
        if (window.appData && window.appData.tv) {
          window.appData.tv.watching = [];
          if (window.loadListContent) {
            window.loadListContent('watching');
          }
          if (window.updateTabCounts) {
            window.updateTabCounts();
          }
        }
      });

      await page.waitForTimeout(100);
      const newCount = await page.textContent('#watchingCount');
      
      expect(parseInt(newCount || '0')).toBeLessThan(parseInt(initialCount || '0'));
    });
  });

  test.describe('Error Handling', () => {
    test('shows error toast on move failure', async ({ page }) => {
      // Mock a failed move
      await page.evaluate(() => {
        window.originalHandleMoveItem = window.handleMoveItem;
        window.handleMoveItem = () => {
          throw new Error('Simulated move failure');
        };
      });

      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 1008,
            name: 'Error Test Show',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv'
          });
          if (window.loadListContent) {
            window.loadListContent('watching');
          }
        }
      });

      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');
      
      const moveButton = page.locator('.poster-card__move-btn').first();
      await moveButton.click();
      
      // Check error toast appears
      await page.waitForSelector('.toast--error');
      const errorToast = page.locator('.toast--error');
      await expect(errorToast).toBeVisible();
      await expect(errorToast).toContainText('Move Failed');
    });
  });

  test.describe('Responsive Design', () => {
    test('desktop viewport (1440x900)', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 1009,
            name: 'Desktop Test',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv'
          });
          if (window.loadListContent) {
            window.loadListContent('watching');
          }
        }
      });

      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');
      
      const moveButtons = page.locator('.poster-card__move-btn');
      await expect(moveButtons).toHaveCount(2);
      
      // Check desktop layout (vertical buttons)
      const moveButtonsContainer = page.locator('.poster-card__move-buttons');
      await expect(moveButtonsContainer).toHaveCSS('flex-direction', 'column');
    });

    test('mobile viewport (390x844)', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 1010,
            name: 'Mobile Test',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv'
          });
          if (window.loadListContent) {
            window.loadListContent('watching');
          }
        }
      });

      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');
      
      const moveButtons = page.locator('.poster-card__move-btn');
      await expect(moveButtons).toHaveCount(2);
      
      // Check mobile layout (horizontal buttons)
      const moveButtonsContainer = page.locator('.poster-card__move-buttons');
      await expect(moveButtonsContainer).toHaveCSS('flex-direction', 'row');
    });
  });

  test.describe('Version Display', () => {
    test('version shows v24.3', async ({ page }) => {
      const title = page.locator('title');
      await expect(title).toContainText('v24.3');
      
      const metaBuild = page.locator('meta[name="build"]');
      await expect(metaBuild).toHaveAttribute('content', 'v24.3');
    });
  });
});
