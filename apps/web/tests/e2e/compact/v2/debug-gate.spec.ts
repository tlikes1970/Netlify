import { test, expect } from '@playwright/test';

test.describe('Debug Mobile Compact Gate', () => {
  test('Debug gate conditions', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });
    
    await page.goto('/');
    
    // Set up conditions
    await page.evaluate(() => {
      localStorage.setItem('flag:mobile_compact_v1', 'true');
    });
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Set density after page loads and wait for app to initialize
    await page.evaluate(() => {
      document.documentElement.dataset.density = 'compact';
    });
    
    // Wait for app to fully initialize
    await page.waitForTimeout(2000);
    
    // Set density again after app initialization
    await page.evaluate(() => {
      document.documentElement.dataset.density = 'compact';
      // Trigger the gate manually
      window.dispatchEvent(new Event('resize'));
    });
    
    // Wait a bit for the gate to process
    await page.waitForTimeout(100);
    
    // Debug all conditions
    const debug = await page.evaluate(() => {
      const flag = localStorage.getItem('flag:mobile_compact_v1');
      const density = document.documentElement.dataset.density;
      const mobile = matchMedia('(max-width: 768px)').matches;
      const attr = document.documentElement.dataset.compactMobileV1 || '';
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      return {
        flag,
        density,
        mobile,
        attr,
        viewport
      };
    });
    
    console.log('Debug info:', debug);
    console.log('Console messages:', consoleMessages);
    
    // Check if gate should be active
    expect(debug.flag).toBe('true');
    expect(debug.density).toBe('compact');
    expect(debug.mobile).toBe(true);
    expect(debug.attr).toBe('true');
  });
});
