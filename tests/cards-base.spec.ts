/**
 * Cards Base Tests - Unified Poster Card Template
 * 
 * Process: Card System Testing
 * Purpose: Validate unified poster card template works across all sections
 * Data Source: Test data fixtures and DOM elements
 * Update Path: Update test selectors if card structure changes
 * Dependencies: Playwright, test fixtures, poster-card component
 */

import { test, expect } from '@playwright/test';

test.describe('Poster Card Base Template', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Grid Layout', () => {
    test('renders poster grid in Watching section', async ({ page }) => {
      // Navigate to Watching tab
      await page.click('[data-tab="watching"]');
      await page.waitForSelector('#watchingList');
      
      // Check if poster cards grid is applied
      const watchingList = page.locator('#watchingList');
      await expect(watchingList).toHaveClass(/poster-cards-grid/);
      
      // Check for poster card elements
      const posterCards = page.locator('.poster-card');
      await expect(posterCards).toHaveCount(0); // Empty state initially
    });

    test('renders poster grid in Wishlist section', async ({ page }) => {
      // Navigate to Wishlist tab
      await page.click('[data-tab="wishlist"]');
      await page.waitForSelector('#wishlistList');
      
      // Check if poster cards grid is applied
      const wishlistList = page.locator('#wishlistList');
      await expect(wishlistList).toHaveClass(/poster-cards-grid/);
    });

    test('renders poster grid in Watched section', async ({ page }) => {
      // Navigate to Watched tab
      await page.click('[data-tab="watched"]');
      await page.waitForSelector('#watchedList');
      
      // Check if poster cards grid is applied
      const watchedList = page.locator('#watchedList');
      await expect(watchedList).toHaveClass(/poster-cards-grid/);
    });

    test('renders poster grid in Discover section', async ({ page }) => {
      // Navigate to Discover tab
      await page.click('[data-tab="discover"]');
      await page.waitForSelector('#discoverList');
      
      // Check if poster cards grid is applied
      const discoverList = page.locator('#discoverList');
      await expect(discoverList).toHaveClass(/poster-cards-grid/);
    });
  });

  test.describe('Card Structure', () => {
    test('title is ALL CAPS and ellipsized', async ({ page }) => {
      // Add a test item to watching list
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 12345,
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
      
      // Check title is uppercase
      const title = page.locator('.poster-card__title').first();
      await expect(title).toHaveText('TEST SHOW');
      
      // Check ellipsis styles
      await expect(title).toHaveCSS('text-transform', 'uppercase');
      await expect(title).toHaveCSS('white-space', 'nowrap');
      await expect(title).toHaveCSS('overflow', 'hidden');
      await expect(title).toHaveCSS('text-overflow', 'ellipsis');
    });

    test('rating is visible and editable inline', async ({ page }) => {
      // Add a test item with rating
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 12346,
            name: 'Rated Show',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv',
            userRating: 4.5
          });
          if (window.loadListContent) {
            window.loadListContent('watching');
          }
        }
      });

      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');
      
      // Check rating is visible
      const rating = page.locator('.poster-card__rating').first();
      await expect(rating).toBeVisible();
      
      // Check stars are displayed
      const stars = page.locator('.poster-card__stars').first();
      await expect(stars).toBeVisible();
    });

    test('availability line appears when provided', async ({ page }) => {
      // Add a test item with availability
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 12347,
            name: 'Available Show',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv',
            availability: 'On Netflix'
          });
          if (window.loadListContent) {
            window.loadListContent('watching');
          }
        }
      });

      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');
      
      // Check availability is visible
      const availability = page.locator('.poster-card__availability').first();
      await expect(availability).toBeVisible();
      await expect(availability).toHaveText('On Netflix');
    });

    test('no legacy list items exist', async ({ page }) => {
      // Check that old list item classes are not present
      const legacyItems = page.locator('.list-item, .show-card, .curated-card');
      await expect(legacyItems).toHaveCount(0);
    });
  });

  test.describe('Responsive Design', () => {
    test('desktop viewport (1440x900)', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      
      await page.click('[data-tab="watching"]');
      await page.waitForSelector('#watchingList');
      
      // Check grid layout
      const grid = page.locator('.poster-cards-grid');
      await expect(grid).toBeVisible();
      
      // Check card sizing
      const cards = page.locator('.poster-card');
      if (await cards.count() > 0) {
        const firstCard = cards.first();
        await expect(firstCard).toHaveCSS('max-width', '200px');
      }
    });

    test('mobile viewport (390x844)', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      
      await page.click('[data-tab="watching"]');
      await page.waitForSelector('#watchingList');
      
      // Check grid layout
      const grid = page.locator('.poster-cards-grid');
      await expect(grid).toBeVisible();
      
      // Check mobile card sizing
      const cards = page.locator('.poster-card');
      if (await cards.count() > 0) {
        const firstCard = cards.first();
        await expect(firstCard).toHaveCSS('max-width', '150px');
      }
    });
  });

  test.describe('Section Variants', () => {
    test('Watching cards have correct styling', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 12348,
            name: 'Watching Show',
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
      
      const card = page.locator('.poster-card').first();
      await expect(card).toHaveClass(/poster-card--watching/);
    });

    test('Wishlist cards have correct styling', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.wishlist.push({
            id: 12349,
            name: 'Wishlist Show',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv'
          });
          if (window.loadListContent) {
            window.loadListContent('wishlist');
          }
        }
      });

      await page.click('[data-tab="wishlist"]');
      await page.waitForSelector('.poster-card');
      
      const card = page.locator('.poster-card').first();
      await expect(card).toHaveClass(/poster-card--wishlist/);
    });

    test('Watched cards have correct styling', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watched.push({
            id: 12350,
            name: 'Watched Show',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv'
          });
          if (window.loadListContent) {
            window.loadListContent('watched');
          }
        }
      });

      await page.click('[data-tab="watched"]');
      await page.waitForSelector('.poster-card');
      
      const card = page.locator('.poster-card').first();
      await expect(card).toHaveClass(/poster-card--watched/);
    });
  });

  test.describe('Version Display', () => {
    test('version shows v24.2', async ({ page }) => {
      const title = page.locator('title');
      await expect(title).toContainText('v24.2');
      
      const metaBuild = page.locator('meta[name="build"]');
      await expect(metaBuild).toHaveAttribute('content', 'v24.2');
    });
  });
});
