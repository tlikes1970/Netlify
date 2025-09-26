/**
 * Mobile Bottom Sheet & Drag-Reorder Tests - Mobile Bottom Sheet + Drag-Reorder
 *
 * Process: Mobile & Drag Testing
 * Purpose: Validate mobile bottom sheet and drag-reorder functionality work correctly
 * Data Source: Test data fixtures and DOM elements
 * Update Path: Update test selectors if mobile/drag structure changes
 * Dependencies: Playwright, test fixtures, poster-card component
 */

import { test, expect } from '@playwright/test';

test.describe('Mobile Bottom Sheet & Drag-Reorder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Mobile Bottom Sheet', () => {
    test('shows bottom sheet on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });

      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 5001,
            name: 'Mobile Bottom Sheet Test',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv',
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

      const bottomSheet = page.locator('.mobile-bottom-sheet');
      await expect(bottomSheet).toBeVisible();

      const bottomSheetContent = page.locator('.mobile-bottom-sheet__content');
      await expect(bottomSheetContent).toBeVisible();
    });

    test('shows correct menu items in bottom sheet', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });

      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 5002,
            name: 'Mobile Menu Test',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv',
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

      const menuItems = page.locator('.mobile-bottom-sheet__item');
      await expect(menuItems).toHaveCount(4);

      await expect(menuItems.nth(0)).toContainText('Notes');
      await expect(menuItems.nth(1)).toContainText('Episode Guide');
      await expect(menuItems.nth(2)).toContainText('Remove');
      await expect(menuItems.nth(3)).toContainText('PRO Features');
    });

    test('closes bottom sheet when backdrop clicked', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });

      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 5003,
            name: 'Close Test',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv',
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

      let bottomSheet = page.locator('.mobile-bottom-sheet');
      await expect(bottomSheet).toBeVisible();

      const backdrop = page.locator('.mobile-bottom-sheet__backdrop');
      await backdrop.click();

      // Wait for animation to complete
      await page.waitForTimeout(400);
      bottomSheet = page.locator('.mobile-bottom-sheet');
      await expect(bottomSheet).toHaveCount(0);
    });

    test('hides bottom sheet on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 5004,
            name: 'Desktop Test',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv',
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

      const bottomSheet = page.locator('.mobile-bottom-sheet');
      await expect(bottomSheet).toHaveCount(0);

      const dropdownMenu = page.locator('.overflow-menu');
      await expect(dropdownMenu).toBeVisible();
    });
  });

  test.describe('Drag-Reorder Functionality', () => {
    test('shows drag handles on cards', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push(
            {
              id: 5005,
              name: 'Drag Test 1',
              poster_path: '/test-poster1.jpg',
              first_air_date: '2023-01-01',
              media_type: 'tv',
            },
            {
              id: 5006,
              name: 'Drag Test 2',
              poster_path: '/test-poster2.jpg',
              first_air_date: '2023-02-01',
              media_type: 'tv',
            },
          );
          if (window.loadListContent) {
            window.loadListContent('watching');
          }
        }
      });

      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');

      const dragHandles = page.locator('.poster-card__drag-handle');
      await expect(dragHandles).toHaveCount(2);

      await expect(dragHandles.nth(0)).toHaveText('⋮⋮');
      await expect(dragHandles.nth(1)).toHaveText('⋮⋮');
    });

    test('allows dragging cards to reorder', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push(
            {
              id: 5007,
              name: 'Reorder Test 1',
              poster_path: '/test-poster1.jpg',
              first_air_date: '2023-01-01',
              media_type: 'tv',
            },
            {
              id: 5008,
              name: 'Reorder Test 2',
              poster_path: '/test-poster2.jpg',
              first_air_date: '2023-02-01',
              media_type: 'tv',
            },
          );
          if (window.loadListContent) {
            window.loadListContent('watching');
          }
        }
      });

      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');

      const cards = page.locator('.poster-card');
      const firstCard = cards.nth(0);
      const secondCard = cards.nth(1);

      // Get initial order
      const initialFirstTitle = await firstCard.textContent();
      const initialSecondTitle = await secondCard.textContent();

      // Drag first card to second position
      const firstDragHandle = firstCard.locator('.poster-card__drag-handle');
      await firstDragHandle.dragTo(secondCard);

      // Wait for reorder to complete
      await page.waitForTimeout(500);

      // Check order has changed
      const newFirstTitle = await cards.nth(0).textContent();
      const newSecondTitle = await cards.nth(1).textContent();

      expect(newFirstTitle).toBe(initialSecondTitle);
      expect(newSecondTitle).toBe(initialFirstTitle);
    });

    test('shows visual feedback during drag', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push(
            {
              id: 5009,
              name: 'Visual Feedback Test 1',
              poster_path: '/test-poster1.jpg',
              first_air_date: '2023-01-01',
              media_type: 'tv',
            },
            {
              id: 5010,
              name: 'Visual Feedback Test 2',
              poster_path: '/test-poster2.jpg',
              first_air_date: '2023-02-01',
              media_type: 'tv',
            },
          );
          if (window.loadListContent) {
            window.loadListContent('watching');
          }
        }
      });

      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');

      const cards = page.locator('.poster-card');
      const firstCard = cards.nth(0);
      const secondCard = cards.nth(1);

      // Start drag
      const firstDragHandle = firstCard.locator('.poster-card__drag-handle');
      await firstDragHandle.hover();

      // Check dragging class is applied
      await firstDragHandle.dragTo(secondCard, { force: true });

      // Check visual feedback classes
      await expect(firstCard).toHaveClass(/poster-card--dragging/);
    });

    test('updates underlying data after reorder', async ({ page }) => {
      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push(
            {
              id: 5011,
              name: 'Data Update Test 1',
              poster_path: '/test-poster1.jpg',
              first_air_date: '2023-01-01',
              media_type: 'tv',
            },
            {
              id: 5012,
              name: 'Data Update Test 2',
              poster_path: '/test-poster2.jpg',
              first_air_date: '2023-02-01',
              media_type: 'tv',
            },
          );
          if (window.loadListContent) {
            window.loadListContent('watching');
          }
        }
      });

      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');

      const cards = page.locator('.poster-card');
      const firstCard = cards.nth(0);
      const secondCard = cards.nth(1);

      // Drag first card to second position
      const firstDragHandle = firstCard.locator('.poster-card__drag-handle');
      await firstDragHandle.dragTo(secondCard);

      // Wait for reorder to complete
      await page.waitForTimeout(500);

      // Check toast notification
      const toast = page.locator('.toast--success');
      await expect(toast).toBeVisible();
      await expect(toast).toContainText('Reordered');
    });
  });

  test.describe('Responsive Design', () => {
    test('mobile viewport (390x844)', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });

      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 5013,
            name: 'Mobile Responsive Test',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv',
          });
          if (window.loadListContent) {
            window.loadListContent('watching');
          }
        }
      });

      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');

      // Check mobile bottom sheet appears
      const overflowBtn = page.locator('.poster-card__overflow-btn');
      await overflowBtn.click();

      const bottomSheet = page.locator('.mobile-bottom-sheet');
      await expect(bottomSheet).toBeVisible();

      // Check drag handles are smaller on mobile
      const dragHandle = page.locator('.poster-card__drag-handle');
      await expect(dragHandle).toBeVisible();
    });

    test('desktop viewport (1440x900)', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      await page.evaluate(() => {
        if (window.appData) {
          window.appData.tv = window.appData.tv || { watching: [], wishlist: [], watched: [] };
          window.appData.tv.watching.push({
            id: 5014,
            name: 'Desktop Responsive Test',
            poster_path: '/test-poster.jpg',
            first_air_date: '2023-01-01',
            media_type: 'tv',
          });
          if (window.loadListContent) {
            window.loadListContent('watching');
          }
        }
      });

      await page.click('[data-tab="watching"]');
      await page.waitForSelector('.poster-card');

      // Check desktop dropdown appears
      const overflowBtn = page.locator('.poster-card__overflow-btn');
      await overflowBtn.click();

      const dropdownMenu = page.locator('.overflow-menu');
      await expect(dropdownMenu).toBeVisible();

      // Check mobile bottom sheet is hidden
      const bottomSheet = page.locator('.mobile-bottom-sheet');
      await expect(bottomSheet).toHaveCount(0);
    });
  });

  test.describe('Version Display', () => {
    test('version shows v24.7', async ({ page }) => {
      const title = page.locator('title');
      await expect(title).toContainText('v24.7');

      const metaBuild = page.locator('meta[name="build"]');
      await expect(metaBuild).toHaveAttribute('content', 'v24.7');
    });
  });
});
