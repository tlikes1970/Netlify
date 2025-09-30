/**
 * Debug Integration Test - v28.81
 * Simple test to debug data operations integration
 */

import { test, expect } from '@playwright/test';

test.describe('Debug Integration', () => {
  test('Check if new functions are available', async ({ page }) => {
    await page.goto('http://localhost:8888');
    await page.waitForSelector('#homeSection', { timeout: 10000 });
    
    // Check if new functions are available
    const functionsAvailable = await page.evaluate(() => {
      return {
        dataMigration: !!window.DataMigration,
        watchlistsAdapterV2: !!window.WatchlistsAdapterV2,
        dataOperations: !!window.DataOperations,
        addToListFromCacheV2: !!window.addToListFromCacheV2,
        moveItemV2: !!window.moveItemV2,
        removeItemFromCurrentListV2: !!window.removeItemFromCurrentListV2,
        addToListFromCache: !!window.addToListFromCache,
        moveItem: !!window.moveItem,
        removeItemFromCurrentList: !!window.removeItemFromCurrentList
      };
    });
    
    console.log('Functions available:', functionsAvailable);
    
    // Check console for errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait a bit to catch any errors
    await page.waitForTimeout(2000);
    
    console.log('Console errors:', consoleErrors);
    
    // Basic checks
    expect(functionsAvailable.dataMigration).toBe(true);
    expect(functionsAvailable.watchlistsAdapterV2).toBe(true);
    expect(functionsAvailable.dataOperations).toBe(true);
  });
  
  test('Test simple data operation', async ({ page }) => {
    // Capture console logs
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    await page.goto('http://localhost:8888');
    await page.waitForSelector('#homeSection', { timeout: 10000 });
    
    // Try to add a test item
    const result = await page.evaluate(async () => {
      try {
        // Check if DataOperations is available
        if (!window.DataOperations) {
          return { error: 'DataOperations not available' };
        }
        
        // Try to initialize
        await window.DataOperations.init();
        
        // Try to add an item
        const success = await window.DataOperations.addItem('12345', 'wishlist', {
          id: 12345,
          title: 'Test Movie',
          media_type: 'movie'
        });
        
        return { success, error: null };
      } catch (error) {
        return { error: error.message, success: false };
      }
    });
    
    console.log('Data operation result:', result);
    console.log('Console logs:', consoleLogs.filter(log => log.includes('[data-ops]') || log.includes('[WL-v2]')));
    
    if (result.error) {
      console.error('Data operation failed:', result.error);
    }
  });
});
