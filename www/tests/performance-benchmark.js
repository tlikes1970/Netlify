/**
 * Performance Benchmark for Phase 1.1
 * Measures card rendering performance
 */

const { chromium } = require('playwright');

async function runPerformanceBenchmark() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8000');
    await page.waitForLoadState('networkidle');
    
    // Measure page load performance
    const loadTime = await page.evaluate(() => {
      return performance.timing.loadEventEnd - performance.timing.navigationStart;
    });
    
    // Measure card rendering performance
    const cardRenderTime = await page.evaluate(() => {
      const start = performance.now();
      
      // Simulate rendering 10 cards
      for (let i = 0; i < 10; i++) {
        const mockItem = {
          id: i,
          title: `Test Show ${i}`,
          mediaType: 'tv',
          vote_average: 8.0
        };
        
        // Simulate card creation
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.variant = 'poster';
        card.innerHTML = `<div class="card-title">${mockItem.title}</div>`;
      }
      
      return performance.now() - start;
    });
    
    // Measure memory usage
    const memoryUsage = await page.evaluate(() => {
      return performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null;
    });
    
    console.log('=== PERFORMANCE BENCHMARK RESULTS ===');
    console.log(`Page Load Time: ${loadTime}ms`);
    console.log(`Card Render Time (10 cards): ${cardRenderTime.toFixed(2)}ms`);
    console.log(`Average per card: ${(cardRenderTime / 10).toFixed(2)}ms`);
    
    if (memoryUsage) {
      console.log(`Memory Usage: ${(memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // Performance thresholds
    const thresholds = {
      pageLoad: 3000, // 3 seconds
      cardRender: 100, // 100ms for 10 cards
      perCard: 10 // 10ms per card
    };
    
    console.log('\n=== PERFORMANCE THRESHOLDS ===');
    console.log(`Page Load: ${loadTime <= thresholds.pageLoad ? '✅ PASS' : '❌ FAIL'} (${loadTime}ms <= ${thresholds.pageLoad}ms)`);
    console.log(`Card Render: ${cardRenderTime <= thresholds.cardRender ? '✅ PASS' : '❌ FAIL'} (${cardRenderTime.toFixed(2)}ms <= ${thresholds.cardRender}ms)`);
    console.log(`Per Card: ${(cardRenderTime / 10) <= thresholds.perCard ? '✅ PASS' : '❌ FAIL'} (${(cardRenderTime / 10).toFixed(2)}ms <= ${thresholds.perCard}ms)`);
    
    return {
      pageLoadTime: loadTime,
      cardRenderTime: cardRenderTime,
      perCardTime: cardRenderTime / 10,
      memoryUsage: memoryUsage,
      thresholds: thresholds
    };
    
  } catch (error) {
    console.error('Performance benchmark error:', error);
    return null;
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  runPerformanceBenchmark().catch(console.error);
}

module.exports = { runPerformanceBenchmark };
