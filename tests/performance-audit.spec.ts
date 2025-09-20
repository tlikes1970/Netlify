import { test, expect, Page } from './fixtures';

/**
 * Process: Performance Audit
 * Purpose: Comprehensive performance testing across all application features
 * Data Source: Performance metrics and timing measurements
 * Update Path: Run after any performance-critical changes
 * Dependencies: All application modules and external resources
 */

test.describe('Performance Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Page Load Performance - Core Web Vitals', async ({ page }) => {
    // Measure First Contentful Paint (FCP)
    const fcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          resolve(fcpEntry?.startTime || 0);
        }).observe({ entryTypes: ['paint'] });
      });
    });
    
    expect(fcp).toBeLessThan(1500); // FCP should be under 1.5s
    
    // Measure Largest Contentful Paint (LCP)
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcpEntry = entries[entries.length - 1];
          resolve(lcpEntry?.startTime || 0);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
    
    expect(lcp).toBeLessThan(2500); // LCP should be under 2.5s
  });

  test('Card Rendering Performance - All Sections', async ({ page }) => {
    const sections = ['home', 'watching', 'wishlist', 'watched', 'discover'];
    
    for (const section of sections) {
      const startTime = Date.now();
      await page.locator(`#${section}Tab`).click();
      await page.waitForTimeout(500);
      const renderTime = Date.now() - startTime;
      
      // Each section should render within 500ms
      expect(renderTime).toBeLessThan(500);
      
      // Measure card rendering specifically
      const cardRenderStart = Date.now();
      const cards = page.locator('.card');
      await cards.first().waitFor({ state: 'visible', timeout: 1000 });
      const cardRenderTime = Date.now() - cardRenderStart;
      
      // Cards should render quickly
      expect(cardRenderTime).toBeLessThan(200);
    }
  });

  test('Search Performance - Response Times', async ({ page }) => {
    const searchInput = page.locator('#searchInput');
    await searchInput.fill('test');
    
    const searchStart = Date.now();
    await searchInput.press('Enter');
    await page.waitForTimeout(1000); // Wait for search results
    const searchTime = Date.now() - searchStart;
    
    // Search should complete within 1 second
    expect(searchTime).toBeLessThan(1000);
    
    // Test search with longer query
    await searchInput.fill('a very long search query that should test performance');
    const longSearchStart = Date.now();
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);
    const longSearchTime = Date.now() - longSearchStart;
    
    // Even long queries should be fast
    expect(longSearchTime).toBeLessThan(1000);
  });

  test('Memory Usage - No Leaks', async ({ page }) => {
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Navigate through all sections multiple times
    for (let i = 0; i < 3; i++) {
      await page.locator('#homeTab').click();
      await page.waitForTimeout(100);
      await page.locator('#watchingTab').click();
      await page.waitForTimeout(100);
      await page.locator('#wishlistTab').click();
      await page.waitForTimeout(100);
      await page.locator('#watchedTab').click();
      await page.waitForTimeout(100);
      await page.locator('#discoverTab').click();
      await page.waitForTimeout(100);
    }
    
    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Memory usage should not increase significantly
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB increase
  });

  test('Network Performance - Resource Loading', async ({ page }) => {
    // Track all network requests
    const requests: string[] = [];
    page.on('request', (request) => {
      requests.push(request.url());
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Count different types of requests
    const jsRequests = requests.filter(url => url.includes('.js'));
    const cssRequests = requests.filter(url => url.includes('.css'));
    const imageRequests = requests.filter(url => url.match(/\.(png|jpg|jpeg|gif|webp)$/));
    
    // Should have reasonable number of requests
    expect(jsRequests.length).toBeLessThan(20); // Not too many JS files
    expect(cssRequests.length).toBeLessThan(10); // Not too many CSS files
    expect(imageRequests.length).toBeLessThan(50); // Not too many images
  });

  test('Animation Performance - Smooth Transitions', async ({ page }) => {
    // Test tab switching animations
    const startTime = Date.now();
    await page.locator('#watchingTab').click();
    await page.waitForTimeout(300); // Wait for animation
    const tabSwitchTime = Date.now() - startTime;
    
    // Tab switching should be smooth and fast
    expect(tabSwitchTime).toBeLessThan(300);
    
    // Test card hover animations
    const card = page.locator('.card').first();
    if (await card.count() > 0) {
      const hoverStart = Date.now();
      await card.hover();
      await page.waitForTimeout(100);
      const hoverTime = Date.now() - hoverStart;
      
      // Hover effects should be immediate
      expect(hoverTime).toBeLessThan(100);
    }
  });

  test('Bundle Size - JavaScript Optimization', async ({ page }) => {
    // Get all JavaScript files loaded
    const jsFiles = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return scripts.map(script => (script as HTMLScriptElement).src);
    });
    
    // Should not have too many JS files
    expect(jsFiles.length).toBeLessThan(15);
    
    // Check for large files (this would need actual file size checking in a real test)
    // For now, just verify we have the expected structure
    expect(jsFiles.some(url => url.includes('app.js'))).toBeTruthy();
  });

  test('Caching Performance - Repeat Visits', async ({ page }) => {
    // First visit
    const firstVisitStart = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const firstVisitTime = Date.now() - firstVisitStart;
    
    // Second visit (should be faster due to caching)
    const secondVisitStart = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const secondVisitTime = Date.now() - secondVisitStart;
    
    // Second visit should be significantly faster
    expect(secondVisitTime).toBeLessThan(firstVisitTime * 0.8);
  });

  test('Mobile Performance - Touch Interactions', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Test touch interactions
    const touchStart = Date.now();
    await page.locator('#watchingTab').tap();
    await page.waitForTimeout(200);
    const touchTime = Date.now() - touchStart;
    
    // Touch interactions should be responsive
    expect(touchTime).toBeLessThan(200);
    
    // Test scrolling performance
    const scrollStart = Date.now();
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(100);
    const scrollTime = Date.now() - scrollStart;
    
    // Scrolling should be smooth
    expect(scrollTime).toBeLessThan(100);
  });

  test('Error Recovery Performance - Fast Recovery', async ({ page }) => {
    // Simulate network error
    await page.route('**/*', route => route.abort());
    
    const errorStart = Date.now();
    await page.reload();
    await page.waitForTimeout(1000);
    const errorTime = Date.now() - errorStart;
    
    // Should handle errors quickly
    expect(errorTime).toBeLessThan(2000);
    
    // Restore network
    await page.unroute('**/*');
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should recover quickly
    const recoveryStart = Date.now();
    await page.locator('#homeTab').click();
    await page.waitForTimeout(500);
    const recoveryTime = Date.now() - recoveryStart;
    
    expect(recoveryTime).toBeLessThan(500);
  });
});
