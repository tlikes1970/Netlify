/**
 * Discover & Not Interested Tests - Search/Discover Rules + Not Interested DB
 * 
 * Process: Discover & Not Interested Testing
 * Purpose: Validate Discover section loads recommendations and Not Interested filtering works
 * Data Source: Test data fixtures and TMDB API mocks
 * Update Path: Update test selectors if discover structure changes
 * Dependencies: Playwright, test fixtures, TMDB API
 */

import { test, expect } from '@playwright/test';

test.describe('Discover & Not Interested', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Discover Section', () => {
    test('shows loading state initially', async ({ page }) => {
      await page.click('[data-tab="discover"]');
      
      const loadingState = page.locator('.poster-cards-loading');
      await expect(loadingState).toBeVisible();
      await expect(loadingState).toContainText('Loading recommendations...');
    });

    test('loads recommendations from TMDB', async ({ page }) => {
      // Mock TMDB API responses
      await page.route('**/api.themoviedb.org/3/movie/popular*', async route => {
        const mockResponse = {
          results: [
            {
              id: 4001,
              title: 'Test Movie 1',
              poster_path: '/test-poster1.jpg',
              release_date: '2023-01-01',
              media_type: 'movie'
            },
            {
              id: 4002,
              title: 'Test Movie 2',
              poster_path: '/test-poster2.jpg',
              release_date: '2023-02-01',
              media_type: 'movie'
            }
          ]
        };
        await route.fulfill({ json: mockResponse });
      });

      await page.route('**/api.themoviedb.org/3/tv/popular*', async route => {
        const mockResponse = {
          results: [
            {
              id: 4003,
              name: 'Test TV Show 1',
              poster_path: '/test-poster3.jpg',
              first_air_date: '2023-01-01',
              media_type: 'tv'
            },
            {
              id: 4004,
              name: 'Test TV Show 2',
              poster_path: '/test-poster4.jpg',
              first_air_date: '2023-02-01',
              media_type: 'tv'
            }
          ]
        };
        await route.fulfill({ json: mockResponse });
      });

      await page.click('[data-tab="discover"]');
      await page.waitForSelector('.poster-card');
      
      const cards = page.locator('.poster-card');
      await expect(cards).toHaveCount(4);
      
      // Check that cards have correct content
      await expect(cards.nth(0)).toContainText('TEST MOVIE 1');
      await expect(cards.nth(1)).toContainText('TEST MOVIE 2');
      await expect(cards.nth(2)).toContainText('TEST TV SHOW 1');
      await expect(cards.nth(3)).toContainText('TEST TV SHOW 2');
    });

    test('shows error state on API failure', async ({ page }) => {
      // Mock API failure
      await page.route('**/api.themoviedb.org/3/movie/popular*', async route => {
        await route.abort('failed');
      });

      await page.route('**/api.themoviedb.org/3/tv/popular*', async route => {
        await route.abort('failed');
      });

      await page.click('[data-tab="discover"]');
      await page.waitForSelector('.poster-cards-error');
      
      const errorState = page.locator('.poster-cards-error');
      await expect(errorState).toBeVisible();
      await expect(errorState).toContainText('Failed to Load');
      await expect(errorState).toContainText('Try Again');
    });

    test('shows empty state when no recommendations', async ({ page }) => {
      // Mock empty API responses
      await page.route('**/api.themoviedb.org/3/movie/popular*', async route => {
        await route.fulfill({ json: { results: [] } });
      });

      await page.route('**/api.themoviedb.org/3/tv/popular*', async route => {
        await route.fulfill({ json: { results: [] } });
      });

      await page.click('[data-tab="discover"]');
      await page.waitForSelector('.poster-cards-empty');
      
      const emptyState = page.locator('.poster-cards-empty');
      await expect(emptyState).toBeVisible();
      await expect(emptyState).toContainText('No Recommendations');
    });
  });

  test.describe('Not Interested Functionality', () => {
    test('shows Not Interested button on discover cards', async ({ page }) => {
      // Mock TMDB API responses
      await page.route('**/api.themoviedb.org/3/movie/popular*', async route => {
        const mockResponse = {
          results: [{
            id: 4005,
            title: 'Not Interested Test Movie',
            poster_path: '/test-poster.jpg',
            release_date: '2023-01-01',
            media_type: 'movie'
          }]
        };
        await route.fulfill({ json: mockResponse });
      });

      await page.route('**/api.themoviedb.org/3/tv/popular*', async route => {
        await route.fulfill({ json: { results: [] } });
      });

      await page.click('[data-tab="discover"]');
      await page.waitForSelector('.poster-card');
      
      const notInterestedBtn = page.locator('.poster-card__not-interested');
      await expect(notInterestedBtn).toBeVisible();
      await expect(notInterestedBtn).toHaveText('Not Interested');
    });

    test('adds item to Not Interested when button clicked', async ({ page }) => {
      // Mock TMDB API responses
      await page.route('**/api.themoviedb.org/3/movie/popular*', async route => {
        const mockResponse = {
          results: [{
            id: 4006,
            title: 'Add Not Interested Test',
            poster_path: '/test-poster.jpg',
            release_date: '2023-01-01',
            media_type: 'movie'
          }]
        };
        await route.fulfill({ json: mockResponse });
      });

      await page.route('**/api.themoviedb.org/3/tv/popular*', async route => {
        await route.fulfill({ json: { results: [] } });
      });

      await page.click('[data-tab="discover"]');
      await page.waitForSelector('.poster-card');
      
      const notInterestedBtn = page.locator('.poster-card__not-interested');
      await notInterestedBtn.click();
      
      // Check toast notification
      const toast = page.locator('.toast--info');
      await expect(toast).toBeVisible();
      await expect(toast).toContainText('Added to Not Interested');
      
      // Check card is removed
      const cards = page.locator('.poster-card');
      await expect(cards).toHaveCount(0);
    });

    test('filters out Not Interested items from recommendations', async ({ page }) => {
      // Add item to Not Interested first
      await page.evaluate(() => {
        const notInterested = [{
          id: 4007,
          title: 'Filtered Out Movie',
          media_type: 'movie',
          added_date: new Date().toISOString()
        }];
        localStorage.setItem('flicklet-not-interested', JSON.stringify(notInterested));
      });

      // Mock TMDB API responses
      await page.route('**/api.themoviedb.org/3/movie/popular*', async route => {
        const mockResponse = {
          results: [
            {
              id: 4007,
              title: 'Filtered Out Movie',
              poster_path: '/test-poster.jpg',
              release_date: '2023-01-01',
              media_type: 'movie'
            },
            {
              id: 4008,
              title: 'Should Show Movie',
              poster_path: '/test-poster2.jpg',
              release_date: '2023-02-01',
              media_type: 'movie'
            }
          ]
        };
        await route.fulfill({ json: mockResponse });
      });

      await page.route('**/api.themoviedb.org/3/tv/popular*', async route => {
        await route.fulfill({ json: { results: [] } });
      });

      await page.click('[data-tab="discover"]');
      await page.waitForSelector('.poster-card');
      
      const cards = page.locator('.poster-card');
      await expect(cards).toHaveCount(1);
      await expect(cards.nth(0)).toContainText('SHOULD SHOW MOVIE');
    });
  });

  test.describe('Settings Management', () => {
    test('shows Not Interested management in settings', async ({ page }) => {
      await page.click('[data-tab="settings"]');
      await page.click('[data-target="#data"]');
      
      const notInterestedSection = page.locator('.settings-control-group').filter({ hasText: 'Not Interested List' });
      await expect(notInterestedSection).toBeVisible();
      
      const viewBtn = page.locator('#viewNotInterestedBtn');
      const clearBtn = page.locator('#clearNotInterestedBtn');
      
      await expect(viewBtn).toBeVisible();
      await expect(clearBtn).toBeVisible();
    });

    test('displays Not Interested list when view clicked', async ({ page }) => {
      // Add some Not Interested items
      await page.evaluate(() => {
        const notInterested = [
          {
            id: 4009,
            title: 'Test Movie 1',
            media_type: 'movie',
            added_date: new Date().toISOString()
          },
          {
            id: 4010,
            title: 'Test TV Show 1',
            media_type: 'tv',
            added_date: new Date().toISOString()
          }
        ];
        localStorage.setItem('flicklet-not-interested', JSON.stringify(notInterested));
      });

      await page.click('[data-tab="settings"]');
      await page.click('[data-target="#data"]');
      
      const viewBtn = page.locator('#viewNotInterestedBtn');
      await viewBtn.click();
      
      const notInterestedList = page.locator('#notInterestedList');
      await expect(notInterestedList).toBeVisible();
      
      const items = page.locator('.not-interested-item');
      await expect(items).toHaveCount(2);
      
      await expect(items.nth(0)).toContainText('Test Movie 1');
      await expect(items.nth(1)).toContainText('Test TV Show 1');
    });

    test('removes item from Not Interested list', async ({ page }) => {
      // Add Not Interested item
      await page.evaluate(() => {
        const notInterested = [{
          id: 4011,
          title: 'Remove Test Movie',
          media_type: 'movie',
          added_date: new Date().toISOString()
        }];
        localStorage.setItem('flicklet-not-interested', JSON.stringify(notInterested));
      });

      await page.click('[data-tab="settings"]');
      await page.click('[data-target="#data"]');
      
      const viewBtn = page.locator('#viewNotInterestedBtn');
      await viewBtn.click();
      
      const removeBtn = page.locator('.not-interested-item__remove');
      await removeBtn.click();
      
      const toast = page.locator('.toast--success');
      await expect(toast).toBeVisible();
      await expect(toast).toContainText('Removed');
      
      const items = page.locator('.not-interested-item');
      await expect(items).toHaveCount(0);
    });

    test('clears all Not Interested items', async ({ page }) => {
      // Add Not Interested items
      await page.evaluate(() => {
        const notInterested = [
          {
            id: 4012,
            title: 'Clear Test Movie',
            media_type: 'movie',
            added_date: new Date().toISOString()
          },
          {
            id: 4013,
            title: 'Clear Test TV Show',
            media_type: 'tv',
            added_date: new Date().toISOString()
          }
        ];
        localStorage.setItem('flicklet-not-interested', JSON.stringify(notInterested));
      });

      await page.click('[data-tab="settings"]');
      await page.click('[data-target="#data"]');
      
      const clearBtn = page.locator('#clearNotInterestedBtn');
      await clearBtn.click();
      
      // Confirm dialog
      page.on('dialog', dialog => dialog.accept());
      
      const toast = page.locator('.toast--success');
      await expect(toast).toBeVisible();
      await expect(toast).toContainText('Cleared');
    });
  });

  test.describe('Version Display', () => {
    test('version shows v24.6', async ({ page }) => {
      const title = page.locator('title');
      await expect(title).toContainText('v24.6');
      
      const metaBuild = page.locator('meta[name="build"]');
      await expect(metaBuild).toHaveAttribute('content', 'v24.6');
    });
  });
});

