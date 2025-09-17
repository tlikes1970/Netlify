/**
 * Overflow Modals Tests - Overflow Menus + Modals
 * 
 * Process: Modal System Testing
 * Purpose: Validate overflow menus and modals work correctly
 * Data Source: Test data fixtures and DOM elements
 * Update Path: Update test selectors if modal structure changes
 * Dependencies: Playwright, test fixtures, poster-card component
 */

import { test, expect } from '@playwright/test';

test.describe('Overflow Menus & Modals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Overflow Menu Display', () => {
    test('shows overflow menu when ••• clicked', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 3001,
            name: 'Overflow Test Show',
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
      
      const overflowBtn = page.locator('.poster-card__overflow-btn');
      await overflowBtn.click();
      
      const overflowMenu = page.locator('.overflow-menu');
      await expect(overflowMenu).toBeVisible();
    });

    test('shows correct menu items for TV show', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 3002,
            name: 'TV Show Test',
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
      
      const overflowBtn = page.locator('.poster-card__overflow-btn');
      await overflowBtn.click();
      
      const menuItems = page.locator('.overflow-menu__item');
      await expect(menuItems).toHaveCount(4);
      
      await expect(menuItems.nth(0)).toContainText('Notes');
      await expect(menuItems.nth(1)).toContainText('Episode Guide');
      await expect(menuItems.nth(2)).toContainText('Remove');
      await expect(menuItems.nth(3)).toContainText('PRO Features');
    });

    test('shows correct menu items for movie', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.movies = window.appData.movies || { watching: [], wishlist: [], watched: [] };
          window.appData.movies.watching.push({
            id: 3003,
            name: 'Movie Test',
            poster_path: '/test-poster.jpg',
            release_date: '2023-01-01',
            media_type: 'movie'
          });
          if (window.loadListContent) {
            window.loadListContent('watching');
          }
        }
      });

      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');
      
      const overflowBtn = page.locator('.poster-card__overflow-btn');
      await overflowBtn.click();
      
      const menuItems = page.locator('.overflow-menu__item');
      await expect(menuItems).toHaveCount(3); // No Episode Guide for movies
      
      await expect(menuItems.nth(0)).toContainText('Notes');
      await expect(menuItems.nth(1)).toContainText('Remove');
      await expect(menuItems.nth(2)).toContainText('PRO Features');
    });

    test('closes overflow menu on outside click', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 3004,
            name: 'Close Test Show',
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
      
      const overflowBtn = page.locator('.poster-card__overflow-btn');
      await overflowBtn.click();
      
      let overflowMenu = page.locator('.overflow-menu');
      await expect(overflowMenu).toBeVisible();
      
      // Click outside the menu
      await page.click('body', { position: { x: 50, y: 50 } });
      
      overflowMenu = page.locator('.overflow-menu');
      await expect(overflowMenu).toHaveCount(0);
    });
  });

  test.describe('Notes Modal', () => {
    test('opens notes modal when Notes clicked', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 3005,
            name: 'Notes Test Show',
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
      
      const overflowBtn = page.locator('.poster-card__overflow-btn');
      await overflowBtn.click();
      
      const notesItem = page.locator('.overflow-menu__item').first();
      await notesItem.click();
      
      const modal = page.locator('.modal--notes');
      await expect(modal).toBeVisible();
      
      const modalTitle = page.locator('.modal__title');
      await expect(modalTitle).toContainText('Notes for Notes Test Show');
      
      const textarea = page.locator('.modal__textarea');
      await expect(textarea).toBeVisible();
    });

    test('saves notes and shows success toast', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 3006,
            name: 'Save Notes Test',
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
      
      const overflowBtn = page.locator('.poster-card__overflow-btn');
      await overflowBtn.click();
      
      const notesItem = page.locator('.overflow-menu__item').first();
      await notesItem.click();
      
      const textarea = page.locator('.modal__textarea');
      await textarea.fill('This is a test note for the show');
      
      const saveBtn = page.locator('.modal__save');
      await saveBtn.click();
      
      const toast = page.locator('.toast--success');
      await expect(toast).toBeVisible();
      await expect(toast).toContainText('Notes Saved');
    });
  });

  test.describe('Episode Guide Modal', () => {
    test('opens episode guide modal for TV show', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 3007,
            name: 'Episode Guide Test',
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
      
      const overflowBtn = page.locator('.poster-card__overflow-btn');
      await overflowBtn.click();
      
      const episodeItem = page.locator('.overflow-menu__item').nth(1);
      await episodeItem.click();
      
      const modal = page.locator('.modal--episodes');
      await expect(modal).toBeVisible();
      
      const modalTitle = page.locator('.modal__title');
      await expect(modalTitle).toContainText('Episode Guide - Episode Guide Test');
      
      const seasonSelect = page.locator('.episode-guide__select');
      await expect(seasonSelect).toBeVisible();
      
      const episodes = page.locator('.episode-guide__episode');
      await expect(episodes).toHaveCount(2);
    });
  });

  test.describe('Remove Confirmation Modal', () => {
    test('opens remove confirmation modal', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 3008,
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
      
      const overflowBtn = page.locator('.poster-card__overflow-btn');
      await overflowBtn.click();
      
      const removeItem = page.locator('.overflow-menu__item--destructive');
      await removeItem.click();
      
      const modal = page.locator('.modal--remove');
      await expect(modal).toBeVisible();
      
      const modalTitle = page.locator('.modal__title');
      await expect(modalTitle).toContainText('Remove Item');
      
      const warning = page.locator('.modal__warning');
      await expect(warning).toContainText('This action cannot be undone');
    });

    test('removes item when confirmed', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 3009,
            name: 'Remove Confirm Test',
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
      
      const overflowBtn = page.locator('.poster-card__overflow-btn');
      await overflowBtn.click();
      
      const removeItem = page.locator('.overflow-menu__item--destructive');
      await removeItem.click();
      
      const confirmBtn = page.locator('.modal__confirm');
      await confirmBtn.click();
      
      const toast = page.locator('.toast--success');
      await expect(toast).toBeVisible();
      await expect(toast).toContainText('Item Removed');
      
      const cards = page.locator('.poster-card');
      await expect(cards).toHaveCount(0);
    });
  });

  test.describe('PRO Teaser Modal', () => {
    test('opens PRO teaser modal', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 3010,
            name: 'PRO Test Show',
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
      
      const overflowBtn = page.locator('.poster-card__overflow-btn');
      await overflowBtn.click();
      
      const proItem = page.locator('.overflow-menu__item--pro');
      await proItem.click();
      
      const modal = page.locator('.modal--pro');
      await expect(modal).toBeVisible();
      
      const modalTitle = page.locator('.modal__title');
      await expect(modalTitle).toContainText('⭐ Flicklet PRO');
      
      const proTitle = page.locator('.pro-teaser__title');
      await expect(proTitle).toContainText('Unlock Premium Features');
      
      const features = page.locator('.pro-teaser__features li');
      await expect(features).toHaveCount(5);
      
      const price = page.locator('.pro-teaser__amount');
      await expect(price).toContainText('$4.99');
    });

    test('shows coming soon toast when upgrade clicked', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 3011,
            name: 'PRO Upgrade Test',
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
      
      const overflowBtn = page.locator('.poster-card__overflow-btn');
      await overflowBtn.click();
      
      const proItem = page.locator('.overflow-menu__item--pro');
      await proItem.click();
      
      const upgradeBtn = page.locator('.modal__upgrade');
      await upgradeBtn.click();
      
      const toast = page.locator('.toast--info');
      await expect(toast).toBeVisible();
      await expect(toast).toContainText('Coming Soon');
    });
  });

  test.describe('Version Display', () => {
    test('version shows v24.5', async ({ page }) => {
      const title = page.locator('title');
      await expect(title).toContainText('v24.5');
      
      const metaBuild = page.locator('meta[name="build"]');
      await expect(metaBuild).toHaveAttribute('content', 'v24.5');
    });
  });
});
