/**
 * Debug UI Integration Test - v28.82
 * Test if UI integration is working properly
 */

import { test, expect } from '@playwright/test';

test.describe('Debug UI Integration', () => {
  test('Check if UI integration systems are available', async ({ page }) => {
    await page.goto('http://localhost:8888');
    await page.waitForSelector('#homeSection', { timeout: 10000 });
    
    // Check if systems are available
    const systemsAvailable = await page.evaluate(() => {
      return {
        notificationSystem: !!window.NotificationSystem,
        uiIntegration: !!window.UIIntegration,
        dataOperations: !!window.DataOperations,
        showNotification: !!window.showNotification
      };
    });
    
    console.log('Systems available:', systemsAvailable);
    
    expect(systemsAvailable.notificationSystem).toBe(true);
    expect(systemsAvailable.uiIntegration).toBe(true);
    expect(systemsAvailable.dataOperations).toBe(true);
  });
  
  test('Test notification system directly', async ({ page }) => {
    await page.goto('http://localhost:8888');
    await page.waitForSelector('#homeSection', { timeout: 10000 });
    
    // Test notification system directly
    const result = await page.evaluate(() => {
      try {
        if (window.NotificationSystem) {
          const id = window.NotificationSystem.show('Test notification', 'success', 3000);
          return { success: true, id };
        } else {
          return { success: false, error: 'NotificationSystem not available' };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('Notification test result:', result);
    
    if (result.success) {
      // Check if notification appears
      const notification = page.locator('.notification.success');
      await expect(notification).toBeVisible({ timeout: 5000 });
      
      // Check notification text
      const notificationText = await notification.locator('.notification__message').textContent();
      expect(notificationText).toBe('Test notification');
    }
  });
  
  test('Test data operation with UI integration', async ({ page }) => {
    // Capture console logs
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && (msg.text().includes('[ui-integration]') || msg.text().includes('[notifications]'))) {
        consoleLogs.push(`${msg.type()}: ${msg.text()}`);
      }
    });
    
    await page.goto('http://localhost:8888');
    await page.waitForSelector('#homeSection', { timeout: 10000 });
    
    // Try to add an item and see if UI integration works
    const result = await page.evaluate(async () => {
      try {
        if (!window.DataOperations) {
          return { error: 'DataOperations not available' };
        }
        
        // Initialize
        await window.DataOperations.init();
        
        // Add item
        const success = await window.DataOperations.addItem('99999', 'wishlist', {
          id: 99999,
          title: 'UI Test Movie',
          media_type: 'movie'
        });
        
        return { success, error: null };
      } catch (error) {
        return { error: error.message, success: false };
      }
    });
    
    console.log('Data operation result:', result);
    console.log('UI integration logs:', consoleLogs);
    
    // Check if notification appeared
    const notification = page.locator('.notification.success');
    await expect(notification).toBeVisible({ timeout: 5000 });
    
    const notificationText = await notification.locator('.notification__message').textContent();
    expect(notificationText).toContain('Added to wishlist');
  });
});
