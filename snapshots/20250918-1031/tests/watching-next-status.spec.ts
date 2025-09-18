/**
 * Watching Next Status Tests - Next Episode/Status + Availability Line
 * 
 * Process: Next Episode Status Testing
 * Purpose: Validate next episode status shows correctly on Watching cards only
 * Data Source: Test data fixtures with next episode and status information
 * Update Path: Update test selectors if next episode structure changes
 * Dependencies: Playwright, test fixtures, poster-card component
 */

import { test, expect } from '@playwright/test';

test.describe('Watching Next Status', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Next Episode Display', () => {
    test('shows NEXT line when next episode known', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 2001,
            name: 'Next Episode Show',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv',
            next_episode: {
              episode_number: 5,
              season_number: 2,
              air_date: '2024-02-15'
            }
          });
          if (window.loadListContent) {
            window.loadListContent('watching');
          }
        }
      });

      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');
      
      const nextEpisode = page.locator('.poster-card__next-episode');
      await expect(nextEpisode).toBeVisible();
      
      const nextLabel = page.locator('.poster-card__next-label');
      await expect(nextLabel).toHaveText('NEXT:');
      
      const nextDetails = page.locator('.poster-card__next-details');
      await expect(nextDetails).toContainText('S2E5');
      await expect(nextDetails).toContainText('(Thu, Feb 15)');
    });

    test('shows UPCOMING/ENDED fallback otherwise', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 2002,
            name: 'Status Show',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv',
            status: 'returning_series'
          });
          if (window.loadListContent) {
            window.loadListContent('watching');
          }
        }
      });

      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');
      
      const nextEpisode = page.locator('.poster-card__next-episode');
      await expect(nextEpisode).toBeVisible();
      
      const nextLabel = page.locator('.poster-card__next-label');
      await expect(nextLabel).toHaveText('STATUS:');
      
      const nextDetails = page.locator('.poster-card__next-details');
      await expect(nextDetails).toHaveText('UPCOMING');
    });

    test('shows ENDED status for ended series', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 2003,
            name: 'Ended Show',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv',
            status: 'ended'
          });
          if (window.loadListContent) {
            window.loadListContent('watching');
          }
        }
      });

      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');
      
      const nextEpisode = page.locator('.poster-card__next-episode');
      await expect(nextEpisode).toBeVisible();
      
      const nextDetails = page.locator('.poster-card__next-details');
      await expect(nextDetails).toHaveText('ENDED');
    });
  });

  test.describe('Availability Line', () => {
    test('availability line shown when provided', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 2004,
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
      
      const availability = page.locator('.poster-card__availability');
      await expect(availability).toBeVisible();
      await expect(availability).toHaveText('On Netflix');
    });

    test('availability line hidden when not provided', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 2005,
            name: 'No Availability Show',
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
      
      const availability = page.locator('.poster-card__availability');
      await expect(availability).toHaveCount(0);
    });

    test('availability line appears on all sections', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 2006,
            name: 'Watching Available',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv',
            availability: 'On Hulu'
          });
          window.appData.tv.wishlist.push({
            id: 2007,
            name: 'Wishlist Available',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv',
            availability: 'On Disney+'
          });
          window.appData.tv.watched.push({
            id: 2008,
            name: 'Watched Available',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv',
            availability: 'On Prime Video'
          });
          if (window.loadListContent) {
            window.loadListContent('watching');
            window.loadListContent('wishlist');
            window.loadListContent('watched');
          }
        }
      });

      // Check Watching section
      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');
      let availability = page.locator('.poster-card__availability');
      await expect(availability).toHaveText('On Hulu');

      // Check Wishlist section
      await page.click('[data-tab="wishlist"]');
      await page.waitForSelector('.poster-card');
      availability = page.locator('.poster-card__availability');
      await expect(availability).toHaveText('On Disney+');

      // Check Watched section
      await page.click('[data-tab="watched"]');
      await page.waitForSelector('.poster-card');
      availability = page.locator('.poster-card__availability');
      await expect(availability).toHaveText('On Prime Video');
    });
  });

  test.describe('Section-Specific Display', () => {
    test('next episode line not present on Wishlist', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.wishlist.push({
            id: 2009,
            name: 'Wishlist Show',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv',
            next_episode: {
              episode_number: 3,
              season_number: 1,
              air_date: '2024-03-01'
            }
          });
          if (window.loadListContent) {
            window.loadListContent('wishlist');
          }
        }
      });

      await page.click('[data-tab="wishlist"]');
      await page.waitForSelector('.poster-card');
      
      const nextEpisode = page.locator('.poster-card__next-episode');
      await expect(nextEpisode).toHaveCount(0);
    });

    test('next episode line not present on Watched', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watched.push({
            id: 2010,
            name: 'Watched Show',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv',
            next_episode: {
              episode_number: 10,
              season_number: 2,
              air_date: '2024-04-01'
            }
          });
          if (window.loadListContent) {
            window.loadListContent('watched');
          }
        }
      });

      await page.click('[data-tab="watched"]');
      await page.waitForSelector('.poster-card');
      
      const nextEpisode = page.locator('.poster-card__next-episode');
      await expect(nextEpisode).toHaveCount(0);
    });

    test('next episode line only present on Watching', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 2011,
            name: 'Watching Show',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv',
            next_episode: {
              episode_number: 7,
              season_number: 3,
              air_date: '2024-05-01'
            }
          });
          if (window.loadListContent) {
            window.loadListContent('watching');
          }
        }
      });

      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');
      
      const nextEpisode = page.locator('.poster-card__next-episode');
      await expect(nextEpisode).toHaveCount(1);
      await expect(nextEpisode).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('desktop viewport (1440x900)', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 2012,
            name: 'Desktop Test',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv',
            next_episode: {
              episode_number: 4,
              season_number: 1,
              air_date: '2024-06-01'
            },
            availability: 'On HBO Max'
          });
          if (window.loadListContent) {
            window.loadListContent('watching');
          }
        }
      });

      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');
      
      const nextEpisode = page.locator('.poster-card__next-episode');
      await expect(nextEpisode).toBeVisible();
      
      const availability = page.locator('.poster-card__availability');
      await expect(availability).toBeVisible();
    });

    test('mobile viewport (390x844)', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 2013,
            name: 'Mobile Test',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv',
            next_episode: {
              episode_number: 8,
              season_number: 2,
              air_date: '2024-07-01'
            },
            availability: 'On Apple TV+'
          });
          if (window.loadListContent) {
            window.loadListContent('watching');
          }
        }
      });

      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');
      
      const nextEpisode = page.locator('.poster-card__next-episode');
      await expect(nextEpisode).toBeVisible();
      
      const availability = page.locator('.poster-card__availability');
      await expect(availability).toBeVisible();
    });
  });

  test.describe('Version Display', () => {
    test('version shows v24.4', async ({ page }) => {
      const title = page.locator('title');
      await expect(title).toContainText('v24.4');
      
      const metaBuild = page.locator('meta[name="build"]');
      await expect(metaBuild).toHaveAttribute('content', 'v24.4');
    });
  });
});

