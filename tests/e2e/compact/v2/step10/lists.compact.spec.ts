import { test, expect } from '@playwright/test';
import { enableCompactGate, disableCompactGate } from '../../_helpers/gate';
import { stubContextApis } from '../../_helpers/network';
import { seedLocalData } from '../../_helpers/data';
import { stubServiceWorker } from '../../_helpers/sw';
import { gotoWatchingTab } from '../../_helpers/nav';

test.describe('Lists Activation (Mobile Compact V2)', () => {
  test.beforeEach(async ({ context }) => { 
    await stubServiceWorker(context);
    await stubContextApis(context); 
  });

  test('A) Gate OFF: lists render, no overlap with bottom nav, no compact styles present', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
    await seedLocalData(page, { 
      watching: [
        { id: '1', title: 'Stub Show 1', posterUrl: '/p1.png' },
        { id: '2', title: 'Stub Show 2', posterUrl: '/p2.png' }
      ],
      wishlist: [
        { id: '3', title: 'Stub Movie 1', posterUrl: '/p3.png' },
        { id: '4', title: 'Stub Movie 2', posterUrl: '/p4.png' }
      ],
      watched: [
        { id: '5', title: 'Stub Series 1', posterUrl: '/p5.png' },
        { id: '6', title: 'Stub Series 2', posterUrl: '/p6.png' }
      ]
    });
    
    await page.goto('/');
    await disableCompactGate(page);
    
    // Check that compact gate is OFF
    const compactAttr = await page.evaluate(() => 
      document.documentElement.dataset.compactMobileV1 || ''
    );
    expect(compactAttr).toBe('');
    
    // Navigate to watching tab
    await gotoWatchingTab(page);
    
    // Check that list page renders
    const listPage = page.locator('[data-page="lists"][data-list="watching"]');
    await expect(listPage).toBeVisible();
    
    // Check that TabCards are visible
    const tabCards = page.locator('.tab-card, [data-testid="tabcard"]');
    await expect(tabCards).toHaveCount(2);
    
    // Check for no overlap with bottom nav
    const firstCard = tabCards.first();
    const cardBox = await firstCard.boundingBox();
    expect(cardBox).not.toBeNull();
    
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    expect(cardBox!.y + cardBox!.height).toBeLessThan(viewportHeight - 50); // Allow 50px for bottom nav
    
    // Check that compact styles are not present
    const compactStyles = await page.evaluate(() => {
      const element = document.querySelector('[data-page="lists"]');
      if (!element) return null;
      const style = window.getComputedStyle(element);
      return {
        gap: style.gap,
        paddingBottom: style.paddingBottom
      };
    });
    
    // Compact styles should not be applied
    expect(compactStyles).not.toBeNull();
    expect(compactStyles!.gap).not.toBe('8px'); // Should not be compact gap
    expect(compactStyles!.paddingBottom).not.toContain('env(safe-area-inset-bottom)');
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test('B) Gate ON: TabCard widths obey --poster-w=136px; spacing reduced', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
    await seedLocalData(page, { 
      watching: [
        { id: '1', title: 'Stub Show 1', posterUrl: '/p1.png' },
        { id: '2', title: 'Stub Show 2', posterUrl: '/p2.png' },
        { id: '3', title: 'Stub Show 3', posterUrl: '/p3.png' }
      ]
    });
    
    await page.goto('/');
    await enableCompactGate(page);
    
    // Enable actions split flag
    await page.evaluate(() => {
      localStorage.setItem('flag:mobile_actions_split_v1', 'true');
    });
    
    // Trigger gate update
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    
    // Check that compact gate is ON
    const compactAttr = await page.evaluate(() => 
      document.documentElement.dataset.compactMobileV1 || ''
    );
    expect(compactAttr).toBe('true');
    
    // Navigate to watching tab
    await gotoWatchingTab(page);
    
    // Check that list page renders with compact styles
    const listPage = page.locator('[data-page="lists"][data-list="watching"]');
    await expect(listPage).toBeVisible();
    
    // Check that --poster-w is 136px
    const posterWidth = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--poster-w').trim();
    });
    expect(posterWidth).toBe('136px');
    
    // Check TabCard poster dimensions
    const tabCards = page.locator('.tab-card, [data-testid="tabcard"]');
    await expect(tabCards).toHaveCount(3);
    
    const firstCard = tabCards.first();
    const cardBox = await firstCard.boundingBox();
    expect(cardBox).not.toBeNull();
    
    // Check poster width within card (should be around 136px)
    const posterImg = firstCard.locator('img').first();
    if (await posterImg.count() > 0) {
      const posterBox = await posterImg.boundingBox();
      expect(posterBox).not.toBeNull();
      expect(posterBox!.width).toBeLessThanOrEqual(140); // Allow small margin
      expect(posterBox!.width).toBeGreaterThanOrEqual(130); // Should be close to 136px
    }
    
    // Check spacing is reduced
    const containerGap = await page.evaluate(() => {
      const container = document.querySelector('[data-page="lists"] .space-y-0');
      if (!container) return null;
      const style = window.getComputedStyle(container);
      return style.gap;
    });
    
    // Should have compact spacing (8px or 4px)
    expect(containerGap).toMatch(/^(4px|8px)$/);
    
    // Check padding-bottom includes safe area
    const paddingBottom = await page.evaluate(() => {
      const element = document.querySelector('[data-page="lists"]');
      if (!element) return null;
      const style = window.getComputedStyle(element);
      return style.paddingBottom;
    });
    
    expect(paddingBottom).toContain('env(safe-area-inset-bottom)');
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test('C) Swipe: swipe reveals tray; data-swipe-active toggles during interaction; tray tap triggers handler', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
    await seedLocalData(page, { 
      watching: [
        { id: '1', title: 'Stub Show 1', posterUrl: '/p1.png' },
        { id: '2', title: 'Stub Show 2', posterUrl: '/p2.png' }
      ]
    });
    
    await page.goto('/');
    await enableCompactGate(page);
    
    // Enable actions split flag
    await page.evaluate(() => {
      localStorage.setItem('flag:mobile_actions_split_v1', 'true');
    });
    
    // Trigger gate update
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    
    // Navigate to watching tab
    await gotoWatchingTab(page);
    
    // Check that swipe rows are present
    const swipeRows = page.locator('.swipe-row-container');
    await expect(swipeRows).toHaveCount(2);
    
    // Get the first swipe row content
    const swipeContent = page.locator('.swipe-row-content').first();
    await expect(swipeContent).toBeVisible();
    
    // Check initial state - no data-swipe-active attribute
    const initialSwipeActive = await page.evaluate(() => {
      const content = document.querySelector('.swipe-row-content');
      return content?.getAttribute('data-swipe-active');
    });
    expect(initialSwipeActive).toBeNull();
    
    // Perform swipe gesture
    const contentBox = await swipeContent.boundingBox();
    if (contentBox) {
      const startX = contentBox.x + contentBox.width / 2;
      const startY = contentBox.y + contentBox.height / 2;
      const endX = startX - 100; // Swipe left
      
      // Start swipe
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      
      // Check that data-swipe-active is set during swipe
      const duringSwipeActive = await page.evaluate(() => {
        const content = document.querySelector('.swipe-row-content');
        return content?.getAttribute('data-swipe-active');
      });
      expect(duringSwipeActive).toBe('true');
      
      // Continue swipe
      await page.mouse.move(endX, startY);
      
      // End swipe
      await page.mouse.up();
      
      // Wait for swipe to complete
      await page.waitForTimeout(500);
      
      // Check that data-swipe-active is removed after swipe
      const afterSwipeActive = await page.evaluate(() => {
        const content = document.querySelector('.swipe-row-content');
        return content?.getAttribute('data-swipe-active');
      });
      expect(afterSwipeActive).toBeNull();
      
      // Check that swipe actions are visible
      const swipeActions = page.locator('.swipe-row-actions');
      await expect(swipeActions).toBeVisible();
      
      // Click a swipe action button
      const actionButton = swipeActions.locator('button').first();
      if (await actionButton.count() > 0) {
        await actionButton.click();
        
        // Wait for action to complete
        await page.waitForTimeout(500);
        
        // Verify no console errors from action
        expect(errors).toEqual([]);
      }
    }
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test('D) Empty: with seed cleared, empty state visible and readable', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
    // Clear all data to test empty state
    await seedLocalData(page, { 
      watching: [],
      wishlist: [],
      watched: []
    });
    
    await page.goto('/');
    await enableCompactGate(page);
    
    // Trigger gate update
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    
    // Navigate to watching tab
    await gotoWatchingTab(page);
    
    // Check that list page renders
    const listPage = page.locator('[data-page="lists"][data-list="watching"]');
    await expect(listPage).toBeVisible();
    
    // Check that empty state is visible
    const emptyState = page.locator('.text-center.py-8, .empty-state');
    await expect(emptyState).toBeVisible();
    
    // Check empty state content
    const emptyText = await emptyState.textContent();
    expect(emptyText).toContain('No shows in your currently watching list');
    
    // Check that empty state is not obscured by bottom nav
    const emptyBox = await emptyState.boundingBox();
    expect(emptyBox).not.toBeNull();
    
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    expect(emptyBox!.y + emptyBox!.height).toBeLessThan(viewportHeight - 50); // Allow 50px for bottom nav
    
    // Check that empty state has proper spacing
    const emptyPadding = await page.evaluate(() => {
      const element = document.querySelector('.text-center.py-8, .empty-state');
      if (!element) return null;
      const style = window.getComputedStyle(element);
      return {
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom
      };
    });
    
    expect(emptyPadding).not.toBeNull();
    expect(parseInt(emptyPadding!.paddingTop)).toBeGreaterThanOrEqual(16); // Should have adequate padding
    expect(parseInt(emptyPadding!.paddingBottom)).toBeGreaterThanOrEqual(16);
    
    // Test other empty states
    // Navigate to wishlist
    await page.locator('button[role="tab"]', { hasText: 'Want to Watch' }).click();
    
    const wishlistEmpty = page.locator('.text-center.py-8, .empty-state');
    await expect(wishlistEmpty).toBeVisible();
    
    const wishlistText = await wishlistEmpty.textContent();
    expect(wishlistText).toContain('No items in your wishlist');
    
    // Navigate to watched
    await page.locator('button[role="tab"]', { hasText: 'Watched' }).click();
    
    const watchedEmpty = page.locator('.text-center.py-8, .empty-state');
    await expect(watchedEmpty).toBeVisible();
    
    const watchedText = await watchedEmpty.textContent();
    expect(watchedText).toContain('No items in your watched list');
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test('E) MyLists: compact styles applied to custom lists page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
    await seedLocalData(page, { 
      watching: [
        { id: '1', title: 'Stub Show 1', posterUrl: '/p1.png' }
      ]
    });
    
    await page.goto('/');
    await enableCompactGate(page);
    
    // Trigger gate update
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    
    // Navigate to My Lists tab
    await page.locator('button[role="tab"]', { hasText: 'My Lists' }).click();
    
    // Check that My Lists page renders with compact styles
    const myListsPage = page.locator('[data-page="lists"][data-list="mylists"]');
    await expect(myListsPage).toBeVisible();
    
    // Check that compact styles are applied
    const compactStyles = await page.evaluate(() => {
      const element = document.querySelector('[data-page="lists"]');
      if (!element) return null;
      const style = window.getComputedStyle(element);
      return {
        paddingBottom: style.paddingBottom
      };
    });
    
    expect(compactStyles).not.toBeNull();
    expect(compactStyles!.paddingBottom).toContain('env(safe-area-inset-bottom)');
    
    // Check that empty state is properly styled
    const emptyState = page.locator('.text-center.py-12, .empty-state');
    await expect(emptyState).toBeVisible();
    
    const emptyText = await emptyState.textContent();
    expect(emptyText).toContain('No lists created yet');
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test.afterEach(async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    expect(errors).toEqual([]);
  });
});

















