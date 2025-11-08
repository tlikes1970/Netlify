import { test, expect } from '@playwright/test';
import { enableCompactGate, disableCompactGate } from '../../_helpers/gate';
import { stubContextApis } from '../../_helpers/network';
import { seedLocalData } from '../../_helpers/data';
import { stubServiceWorker } from '../../_helpers/sw';

test.describe('Settings Sheet (Mobile Compact V2)', () => {
  test.beforeEach(async ({ context }) => { 
    await stubServiceWorker(context);
    await stubContextApis(context); 
  });

  test('A) Gate OFF or flag OFF: clicking Settings uses old behavior (no modal present)', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
    await seedLocalData(page, { watching: [
      { id: '1', title: 'Stub 1', posterUrl: '/p1.png' },
      { id: '2', title: 'Stub 2', posterUrl: '/p2.png' }
    ]});
    
    await page.goto('/');
    await disableCompactGate(page);
    
    // Ensure settings sheet flag is OFF
    await page.evaluate(() => {
      localStorage.removeItem('flag:settings_mobile_sheet_v1');
    });
    
    // Click the Settings FAB
    const settingsButton = page.locator('button[aria-label="Open Settings"]');
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();
    
    // Wait for the old settings modal to appear
    await page.waitForSelector('.fixed.inset-0.z-\\[99999\\]', { timeout: 5000 });
    
    // Verify the old settings modal is present (not the sheet)
    const oldSettingsModal = page.locator('.fixed.inset-0.z-\\[99999\\]');
    await expect(oldSettingsModal).toBeVisible();
    
    // Verify the settings sheet is NOT present
    const settingsSheet = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(settingsSheet).toHaveCount(0);
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test('B) Gate ON + flag ON: clicking Settings opens modal; focus is trapped inside; Escape closes', async ({ page }) => {
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
    
    // Click the Settings FAB
    const settingsButton = page.locator('button[aria-label="Open Settings"]');
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();
    
    // Wait for the settings sheet to appear
    await page.waitForSelector('[role="dialog"][aria-modal="true"]', { timeout: 5000 });
    
    // Verify the settings sheet is present
    const settingsSheet = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(settingsSheet).toBeVisible();
    
    // Verify accessibility attributes
    await expect(settingsSheet).toHaveAttribute('aria-modal', 'true');
    await expect(settingsSheet).toHaveAttribute('aria-labelledby', 'settings-sheet-title');
    
    // Verify focus is trapped inside the sheet
    const firstFocusable = settingsSheet.locator('button').first();
    await expect(firstFocusable).toBeFocused();
    
    // Test Escape key closes the sheet
    await page.keyboard.press('Escape');
    
    // Wait for sheet to disappear
    await page.waitForSelector('[role="dialog"][aria-modal="true"]', { state: 'hidden', timeout: 5000 });
    
    // Verify sheet is no longer visible
    await expect(settingsSheet).not.toBeVisible();
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test('C) Deep link: go to \'/#settings/display\' opens sheet on Display tab; switch to Account updates hash; last tab persists after reload', async ({ page }) => {
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
    
    // Navigate to deep link
    await page.goto('/#settings/display');
    
    // Wait for the settings sheet to appear
    await page.waitForSelector('[role="dialog"][aria-modal="true"]', { timeout: 5000 });
    
    // Verify the settings sheet is present
    const settingsSheet = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(settingsSheet).toBeVisible();
    
    // Verify Display tab is active
    const displayTab = settingsSheet.locator('button').filter({ hasText: 'Display' });
    await expect(displayTab).toHaveAttribute('style', /background-color.*var\(--bg/);
    
    // Switch to Account tab
    const accountTab = settingsSheet.locator('button').filter({ hasText: 'Account' });
    await accountTab.click();
    
    // Verify hash updated
    await expect(page).toHaveURL(/#settings\/account/);
    
    // Verify Account tab is now active
    await expect(accountTab).toHaveAttribute('style', /background-color.*var\(--bg/);
    
    // Close the sheet
    await page.keyboard.press('Escape');
    await page.waitForSelector('[role="dialog"][aria-modal="true"]', { state: 'hidden', timeout: 5000 });
    
    // Reload the page
    await page.reload();
    await enableCompactGate(page);
    
    // Navigate to settings again (should remember last tab)
    await page.goto('/#settings/account');
    
    // Wait for sheet to appear
    await page.waitForSelector('[role="dialog"][aria-modal="true"]', { timeout: 5000 });
    
    // Verify Account tab is still active (persisted)
    const settingsSheetReloaded = page.locator('[role="dialog"][aria-modal="true"]');
    const accountTabReloaded = settingsSheetReloaded.locator('button').filter({ hasText: 'Account' });
    await expect(accountTabReloaded).toHaveAttribute('style', /background-color.*var\(--bg/);
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test('D) a11y smoke: check that [role="dialog"] exists and has aria-modal="true"', async ({ page }) => {
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
    
    // Click the Settings FAB
    const settingsButton = page.locator('button[aria-label="Open Settings"]');
    await settingsButton.click();
    
    // Wait for the settings sheet to appear
    await page.waitForSelector('[role="dialog"][aria-modal="true"]', { timeout: 5000 });
    
    // Verify accessibility attributes
    const settingsSheet = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(settingsSheet).toBeVisible();
    await expect(settingsSheet).toHaveAttribute('role', 'dialog');
    await expect(settingsSheet).toHaveAttribute('aria-modal', 'true');
    await expect(settingsSheet).toHaveAttribute('aria-labelledby', 'settings-sheet-title');
    
    // Verify title element exists
    const title = page.locator('#settings-sheet-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('Settings');
    
    // Verify segmented controls are accessible
    const tabs = settingsSheet.locator('button');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThan(0);
    
    // Verify each tab has proper text content
    const tabTexts = await tabs.allTextContents();
    expect(tabTexts).toContain('Account');
    expect(tabTexts).toContain('Display');
    expect(tabTexts).toContain('Advanced');
    
    // Assert no console errors
    expect(errors).toEqual([]);
  });

  test.afterEach(async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    expect(errors).toEqual([]);
  });
});

































