import { test, expect } from '@playwright/test';
import { enableCompactGate, disableCompactGate } from '../../_helpers/gate';
import { stubContextApis } from '../../_helpers/network';
import { seedLocalData } from '../../_helpers/data';
import { stubServiceWorker } from '../../_helpers/sw';
import { gotoWatchingTab } from '../../_helpers/nav';

test.describe('Actions Split (Mobile Compact V2)', () => {
  test.beforeEach(async ({ context }) => { 
    await stubServiceWorker(context);
    await stubContextApis(context); 
  });

  test('A) OFF: flag OFF → no primary button, no overflow, no swipe tray', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
    await seedLocalData(page, { watching: [
      { id: '1', title: 'Stub 1', posterUrl: '/p1.png' },
      { id: '2', title: 'Stub 2', posterUrl: '/p2.png' }
    ]});
    
    await page.goto('/');
    await enableCompactGate(page);
    
    // Ensure actions split flag is OFF
    await page.evaluate(() => {
      localStorage.removeItem('flag:mobile_actions_split_v1');
    });
    
    // Trigger gate update
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    
    // Check that actions split data attribute is not set
    const actionsSplitAttr = await page.evaluate(() => 
      document.documentElement.dataset.actionsSplit || ''
    );
    expect(actionsSplitAttr).toBe('');
    
    // Check Home page - should not have compact primary actions
    const homePrimaryActions = page.locator('.compact-primary-action');
    await expect(homePrimaryActions).toHaveCount(0);
    
    const homeOverflowMenus = page.locator('.compact-overflow-trigger');
    await expect(homeOverflowMenus).toHaveCount(0);
    
    // Navigate to watching tab
    await gotoWatchingTab(page);
    
    // Check TabCard - should not have swipe functionality
    const swipeRows = page.locator('.swipe-row-container');
    await expect(swipeRows).toHaveCount(0);
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test('B) Home ON: gate+flag ON → one visible primary action on Home cards; overflow trigger present; clicking primary calls existing handler', async ({ page }) => {
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
    
    // Check that actions split data attribute is set
    const actionsSplitAttr = await page.evaluate(() => 
      document.documentElement.dataset.actionsSplit || ''
    );
    expect(actionsSplitAttr).toBe('true');
    
    // Check Home page - should have compact primary actions
    const homePrimaryActions = page.locator('.compact-primary-action');
    await expect(homePrimaryActions).toHaveCount(1);
    
    const homeOverflowMenus = page.locator('.compact-overflow-trigger');
    await expect(homeOverflowMenus).toHaveCount(1);
    
    // Verify primary action is visible and clickable
    const primaryAction = homePrimaryActions.first();
    await expect(primaryAction).toBeVisible();
    
    // Click the primary action and verify it calls the handler
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('Add to want list')) {
        consoleMessages.push(msg.text());
      }
    });
    
    await primaryAction.click();
    
    // Wait for console message
    await page.waitForTimeout(100);
    
    // Verify the action was called (spy via console)
    expect(consoleMessages.length).toBeGreaterThan(0);
    expect(consoleMessages[0]).toContain('Add to want list');
    
    // Verify overflow menu is present
    const overflowTrigger = homeOverflowMenus.first();
    await expect(overflowTrigger).toBeVisible();
    
    // Click overflow trigger to open menu
    await overflowTrigger.click();
    
    // Verify menu is open
    const overflowMenu = page.locator('.compact-overflow-menu');
    await expect(overflowMenu).toBeVisible();
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test('C) Tabs swipe: gate+flag ON → swipe left reveals action tray; clicking action calls existing handler', async ({ page }) => {
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
    
    // Perform swipe gesture (simulate touch events)
    const contentBox = await swipeContent.boundingBox();
    if (contentBox) {
      const startX = contentBox.x + contentBox.width / 2;
      const startY = contentBox.y + contentBox.height / 2;
      const endX = startX - 100; // Swipe left
      
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, startY);
      await page.mouse.up();
    }
    
    // Wait for swipe animation
    await page.waitForTimeout(500);
    
    // Verify action tray is revealed
    const actionTray = page.locator('.swipe-row-actions');
    await expect(actionTray).toBeVisible();
    
    // Verify swipe action buttons are present
    const swipeActionButtons = page.locator('.swipe-action-button');
    await expect(swipeActionButtons).toHaveCount(2); // Should have 2 actions
    
    // Click on a swipe action button
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('Mark as watched')) {
        consoleMessages.push(msg.text());
      }
    });
    
    const firstActionButton = swipeActionButtons.first();
    await firstActionButton.click();
    
    // Wait for console message
    await page.waitForTimeout(100);
    
    // Verify the action was called
    expect(consoleMessages.length).toBeGreaterThan(0);
    expect(consoleMessages[0]).toContain('Mark as watched');
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test('D) A11y: overflow trigger is focusable; menu has role="menu"; Esc closes', async ({ page }) => {
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
    
    // Check Home page
    const overflowTrigger = page.locator('.compact-overflow-trigger');
    await expect(overflowTrigger).toBeVisible();
    
    // Verify overflow trigger is focusable
    await overflowTrigger.focus();
    await expect(overflowTrigger).toBeFocused();
    
    // Verify accessibility attributes
    await expect(overflowTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(overflowTrigger).toHaveAttribute('aria-haspopup', 'menu');
    
    // Click to open menu
    await overflowTrigger.click();
    
    // Verify menu is open
    const overflowMenu = page.locator('.compact-overflow-menu');
    await expect(overflowMenu).toBeVisible();
    
    // Verify menu has proper role
    await expect(overflowMenu).toHaveAttribute('role', 'menu');
    
    // Verify trigger aria-expanded is updated
    await expect(overflowTrigger).toHaveAttribute('aria-expanded', 'true');
    
    // Test Escape key closes menu
    await page.keyboard.press('Escape');
    
    // Wait for menu to close
    await page.waitForTimeout(100);
    
    // Verify menu is closed
    await expect(overflowMenu).not.toBeVisible();
    
    // Verify trigger aria-expanded is updated
    await expect(overflowTrigger).toHaveAttribute('aria-expanded', 'false');
    
    // Verify focus returns to trigger
    await expect(overflowTrigger).toBeFocused();
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test.afterEach(async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    expect(errors).toEqual([]);
  });
});









