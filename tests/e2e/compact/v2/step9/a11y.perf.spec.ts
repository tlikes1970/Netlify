import { test, expect } from '@playwright/test';
import { enableCompactGate, disableCompactGate } from '../../_helpers/gate';
import { stubContextApis } from '../../_helpers/network';
import { seedLocalData } from '../../_helpers/data';
import { stubServiceWorker } from '../../_helpers/sw';
import { gotoWatchingTab } from '../../_helpers/nav';

test.describe('Accessibility & Performance (Mobile Compact V2)', () => {
  test.beforeEach(async ({ context }) => { 
    await stubServiceWorker(context);
    await stubContextApis(context); 
  });

  test('A) Focus ring: gate ON → Tab to overflow trigger and primary action; expect :focus-visible styles applied', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
    await seedLocalData(page, { watching: [
      { id: '1', title: 'Stub 1', posterUrl: '/p1.png' },
      { id: '2', title: 'Stub 2', posterUrl: '/p2.png' }
    ]});
    
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
    
    // Tab to overflow trigger
    await page.keyboard.press('Tab');
    
    // Check if overflow trigger is focused and has focus-visible styles
    const overflowTrigger = page.locator('.compact-overflow-trigger');
    await expect(overflowTrigger).toBeFocused();
    
    // Check computed styles for focus-visible
    const overflowFocusStyles = await page.evaluate(() => {
      const element = document.querySelector('.compact-overflow-trigger:focus-visible');
      if (!element) return null;
      const style = window.getComputedStyle(element);
      return {
        outline: style.outline,
        outlineOffset: style.outlineOffset,
        boxShadow: style.boxShadow
      };
    });
    
    // Verify focus-visible styles are applied
    expect(overflowFocusStyles).not.toBeNull();
    expect(overflowFocusStyles!.outline).toContain('2px solid');
    expect(overflowFocusStyles!.outlineOffset).toBe('2px');
    
    // Tab to primary action
    await page.keyboard.press('Tab');
    
    // Check if primary action is focused and has focus-visible styles
    const primaryAction = page.locator('.compact-primary-action');
    await expect(primaryAction).toBeFocused();
    
    // Check computed styles for focus-visible
    const primaryFocusStyles = await page.evaluate(() => {
      const element = document.querySelector('.compact-primary-action:focus-visible');
      if (!element) return null;
      const style = window.getComputedStyle(element);
      return {
        outline: style.outline,
        outlineOffset: style.outlineOffset,
        boxShadow: style.boxShadow
      };
    });
    
    // Verify focus-visible styles are applied
    expect(primaryFocusStyles).not.toBeNull();
    expect(primaryFocusStyles!.outline).toContain('2px solid');
    expect(primaryFocusStyles!.outlineOffset).toBe('2px');
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test('B) Escape closes: open overflow and sheet; press Escape; assert closed', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
    await seedLocalData(page, { watching: [
      { id: '1', title: 'Stub 1', posterUrl: '/p1.png' },
      { id: '2', title: 'Stub 2', posterUrl: '/p2.png' }
    ]});
    
    await page.goto('/');
    await enableCompactGate(page);
    
    // Enable actions split flag
    await page.evaluate(() => {
      localStorage.setItem('flag:mobile_actions_split_v1', 'true');
    });
    
    // Trigger gate update
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    
    // Test overflow menu escape
    const overflowTrigger = page.locator('.compact-overflow-trigger');
    await overflowTrigger.click();
    
    // Verify menu is open
    const overflowMenu = page.locator('.compact-overflow-menu');
    await expect(overflowMenu).toBeVisible();
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    // Verify menu is closed
    await expect(overflowMenu).not.toBeVisible();
    
    // Test settings sheet escape
    // Enable settings sheet flag
    await page.evaluate(() => {
      localStorage.setItem('flag:settings_mobile_sheet_v1', 'true');
    });
    
    // Click settings button
    const settingsButton = page.locator('button[aria-label="Open Settings"]');
    await settingsButton.click();
    
    // Wait for settings sheet to appear
    await page.waitForSelector('.settings-sheet', { timeout: 5000 });
    
    // Verify sheet is open
    const settingsSheet = page.locator('.settings-sheet');
    await expect(settingsSheet).toBeVisible();
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    // Verify sheet is closed
    await expect(settingsSheet).not.toBeVisible();
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test('C) Reduced motion: emulate reduced motion context; measure computed transition-duration on sheet = 0s', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
    await seedLocalData(page, { watching: [
      { id: '1', title: 'Stub 1', posterUrl: '/p1.png' },
      { id: '2', title: 'Stub 2', posterUrl: '/p2.png' }
    ]});
    
    await page.goto('/');
    await enableCompactGate(page);
    
    // Enable settings sheet flag
    await page.evaluate(() => {
      localStorage.setItem('flag:settings_mobile_sheet_v1', 'true');
    });
    
    // Trigger gate update
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Click settings button to open sheet
    const settingsButton = page.locator('button[aria-label="Open Settings"]');
    await settingsButton.click();
    
    // Wait for settings sheet to appear
    await page.waitForSelector('.settings-sheet', { timeout: 5000 });
    
    // Check computed transition duration
    const transitionDuration = await page.evaluate(() => {
      const sheet = document.querySelector('.settings-sheet');
      if (!sheet) return null;
      const style = window.getComputedStyle(sheet);
      return style.transitionDuration;
    });
    
    // Verify transition duration is 0s (reduced motion)
    expect(transitionDuration).toBe('0s');
    
    // Check overflow menu transition duration
    const overflowTrigger = page.locator('.compact-overflow-trigger');
    await overflowTrigger.click();
    
    const menuTransitionDuration = await page.evaluate(() => {
      const menu = document.querySelector('.compact-overflow-menu');
      if (!menu) return null;
      const style = window.getComputedStyle(menu);
      return style.transitionDuration;
    });
    
    // Verify menu transition duration is 0s (reduced motion)
    expect(menuTransitionDuration).toBe('0s');
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test('D) Touch target: check bounding box of overflow trigger ≥ 44x44', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
    await seedLocalData(page, { watching: [
      { id: '1', title: 'Stub 1', posterUrl: '/p1.png' },
      { id: '2', title: 'Stub 2', posterUrl: '/p2.png' }
    ]});
    
    await page.goto('/');
    await enableCompactGate(page);
    
    // Enable actions split flag
    await page.evaluate(() => {
      localStorage.setItem('flag:mobile_actions_split_v1', 'true');
    });
    
    // Trigger gate update
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    
    // Check overflow trigger bounding box
    const overflowTrigger = page.locator('.compact-overflow-trigger');
    await expect(overflowTrigger).toBeVisible();
    
    const overflowBox = await overflowTrigger.boundingBox();
    expect(overflowBox).not.toBeNull();
    expect(overflowBox!.width).toBeGreaterThanOrEqual(44);
    expect(overflowBox!.height).toBeGreaterThanOrEqual(44);
    
    // Check primary action bounding box
    const primaryAction = page.locator('.compact-primary-action');
    await expect(primaryAction).toBeVisible();
    
    const primaryBox = await primaryAction.boundingBox();
    expect(primaryBox).not.toBeNull();
    expect(primaryBox!.width).toBeGreaterThanOrEqual(44);
    expect(primaryBox!.height).toBeGreaterThanOrEqual(44);
    
    // Navigate to watching tab to check swipe action buttons
    await gotoWatchingTab(page);
    
    // Perform a swipe to reveal action buttons
    const swipeContent = page.locator('.swipe-row-content');
    if (await swipeContent.count() > 0) {
      const contentBox = await swipeContent.boundingBox();
      if (contentBox) {
        const startX = contentBox.x + contentBox.width / 2;
        const startY = contentBox.y + contentBox.height / 2;
        const endX = startX - 100; // Swipe left
        
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(endX, startY);
        await page.mouse.up();
        
        // Wait for swipe animation
        await page.waitForTimeout(500);
        
        // Check swipe action button bounding box
        const swipeActionButton = page.locator('.swipe-action-button').first();
        if (await swipeActionButton.count() > 0) {
          const swipeBox = await swipeActionButton.boundingBox();
          expect(swipeBox).not.toBeNull();
          expect(swipeBox!.width).toBeGreaterThanOrEqual(44);
          expect(swipeBox!.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test('E) Swipe perf: swipe left on a Tab row; assert during swipe root has [data-swipe-active="true"]; after release it\'s removed', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
    await seedLocalData(page, { watching: [
      { id: '1', title: 'Stub 1', posterUrl: '/p1.png' },
      { id: '2', title: 'Stub 2', posterUrl: '/p2.png' }
    ]});
    
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
    await expect(swipeRows).toHaveCount(1);
    
    // Get the swipe row content
    const swipeContent = page.locator('.swipe-row-content');
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
    }
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test('F) Gate OFF control: sample one case to confirm no diffs', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
    await seedLocalData(page, { watching: [
      { id: '1', title: 'Stub 1', posterUrl: '/p1.png' },
      { id: '2', title: 'Stub 2', posterUrl: '/p2.png' }
    ]});
    
    await page.goto('/');
    await disableCompactGate(page);
    
    // Ensure compact gate is OFF
    const compactAttr = await page.evaluate(() => 
      document.documentElement.dataset.compactMobileV1 || ''
    );
    expect(compactAttr).toBe('');
    
    // Check that compact components are not present
    const compactPrimaryAction = page.locator('.compact-primary-action');
    await expect(compactPrimaryAction).toHaveCount(0);
    
    const compactOverflowTrigger = page.locator('.compact-overflow-trigger');
    await expect(compactOverflowTrigger).toHaveCount(0);
    
    // Check that first card is visible and not overlapped
    const firstCard = page.locator('[data-testid="cardv2"]').first();
    await expect(firstCard).toBeVisible();
    
    // Get card position
    const cardBox = await firstCard.boundingBox();
    expect(cardBox).not.toBeNull();
    
    // Get viewport height
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    
    // Card should be visible in viewport (not overlapped by bottom nav)
    expect(cardBox!.y + cardBox!.height).toBeLessThan(viewportHeight - 50); // Allow 50px for bottom nav
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test.afterEach(async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    expect(errors).toEqual([]);
  });
});

























