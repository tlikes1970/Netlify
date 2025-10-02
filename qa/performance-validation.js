/**
 * Performance Validation Script
 * Purpose: Check for performance regressions and monitor key metrics
 * Tests: Load times, memory usage, DOM performance, network performance
 */

(function() {
  'use strict';
  
  console.log('⚡ [Performance Validation] Starting performance validation...');
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      userAgent: navigator.userAgent,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null,
      deviceMemory: navigator.deviceMemory || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
    },
    metrics: {
      pageLoad: {},
      domPerformance: {},
      memoryUsage: {},
      networkPerformance: {},
      renderingPerformance: {}
    },
    performance: {
      loadTime: 0,
      domContentLoaded: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0,
      totalBlockingTime: 0
    },
    regression: {
      detected: false,
      issues: [],
      recommendations: []
    },
    validation: {
      loadTimeAcceptable: false,
      memoryUsageAcceptable: false,
      domPerformanceAcceptable: false,
      networkPerformanceAcceptable: false,
      renderingPerformanceAcceptable: false
    },
    errors: [],
    warnings: []
  };
  
  // Test 1: Page Load Performance
  function testPageLoadPerformance() {
    console.log('⚡ [Performance Validation] Testing page load performance...');
    
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      results.metrics.pageLoad = {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domInteractive: navigation.domInteractive - navigation.navigationStart,
        totalLoadTime: navigation.loadEventEnd - navigation.navigationStart
      };
      
      results.performance.loadTime = results.metrics.pageLoad.totalLoadTime;
      results.performance.domContentLoaded = results.metrics.pageLoad.domContentLoaded;
      
      // Check if load time is acceptable (< 3 seconds)
      results.validation.loadTimeAcceptable = results.metrics.pageLoad.totalLoadTime < 3000;
      
      if (results.validation.loadTimeAcceptable) {
        console.log('✅ [Performance Validation] Page load time acceptable');
      } else {
        results.regression.issues.push(`Page load time too slow: ${results.metrics.pageLoad.totalLoadTime.toFixed(2)}ms`);
        results.regression.recommendations.push('Optimize page load time - consider code splitting or lazy loading');
      }
      
      console.log('📊 [Performance Validation] Load metrics:', results.metrics.pageLoad);
    } else {
      results.warnings.push('Navigation timing not available');
    }
  }
  
  // Test 2: Core Web Vitals
  function testCoreWebVitals() {
    console.log('⚡ [Performance Validation] Testing Core Web Vitals...');
    
    // First Contentful Paint
    const fcpEntries = performance.getEntriesByName('first-contentful-paint');
    if (fcpEntries.length > 0) {
      results.performance.firstContentfulPaint = fcpEntries[0].startTime;
      if (results.performance.firstContentfulPaint > 1800) {
        results.regression.issues.push(`FCP too slow: ${results.performance.firstContentfulPaint.toFixed(2)}ms`);
      }
    }
    
    // Largest Contentful Paint
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      results.performance.largestContentfulPaint = lcpEntries[lcpEntries.length - 1].startTime;
      if (results.performance.largestContentfulPaint > 2500) {
        results.regression.issues.push(`LCP too slow: ${results.performance.largestContentfulPaint.toFixed(2)}ms`);
      }
    }
    
    // Cumulative Layout Shift
    const clsEntries = performance.getEntriesByType('layout-shift');
    if (clsEntries.length > 0) {
      results.performance.cumulativeLayoutShift = clsEntries.reduce((sum, entry) => {
        return sum + (entry.hadRecentInput ? 0 : entry.value);
      }, 0);
      if (results.performance.cumulativeLayoutShift > 0.1) {
        results.regression.issues.push(`CLS too high: ${results.performance.cumulativeLayoutShift.toFixed(3)}`);
      }
    }
    
    console.log('📊 [Performance Validation] Core Web Vitals:', {
      FCP: results.performance.firstContentfulPaint,
      LCP: results.performance.largestContentfulPaint,
      CLS: results.performance.cumulativeLayoutShift
    });
  }
  
  // Test 3: Memory Usage
  function testMemoryUsage() {
    console.log('⚡ [Performance Validation] Testing memory usage...');
    
    if ('memory' in performance) {
      const memory = performance.memory;
      results.metrics.memoryUsage = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
      
      // Check if memory usage is acceptable (< 80% of limit)
      results.validation.memoryUsageAcceptable = results.metrics.memoryUsage.usagePercentage < 80;
      
      if (results.validation.memoryUsageAcceptable) {
        console.log('✅ [Performance Validation] Memory usage acceptable');
      } else {
        results.regression.issues.push(`Memory usage too high: ${results.metrics.memoryUsage.usagePercentage.toFixed(1)}%`);
        results.regression.recommendations.push('Optimize memory usage - check for memory leaks');
      }
      
      console.log('📊 [Performance Validation] Memory metrics:', results.metrics.memoryUsage);
    } else {
      results.warnings.push('Memory API not available');
    }
  }
  
  // Test 4: DOM Performance
  function testDOMPerformance() {
    console.log('⚡ [Performance Validation] Testing DOM performance...');
    
    const startTime = performance.now();
    
    // Test DOM query performance
    const elements = document.querySelectorAll('*');
    const queryTime = performance.now() - startTime;
    
    results.metrics.domPerformance = {
      totalElements: elements.length,
      queryTime: queryTime,
      elementsPerMs: elements.length / queryTime
    };
    
    // Check if DOM performance is acceptable
    results.validation.domPerformanceAcceptable = queryTime < 10; // < 10ms for DOM query
    
    if (results.validation.domPerformanceAcceptable) {
      console.log('✅ [Performance Validation] DOM performance acceptable');
    } else {
      results.regression.issues.push(`DOM query too slow: ${queryTime.toFixed(2)}ms`);
      results.regression.recommendations.push('Optimize DOM structure - reduce element count');
    }
    
    console.log('📊 [Performance Validation] DOM metrics:', results.metrics.domPerformance);
  }
  
  // Test 5: Network Performance
  function testNetworkPerformance() {
    console.log('⚡ [Performance Validation] Testing network performance...');
    
    const resourceEntries = performance.getEntriesByType('resource');
    const totalSize = resourceEntries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);
    const totalTime = resourceEntries.reduce((sum, entry) => sum + entry.duration, 0);
    
    results.metrics.networkPerformance = {
      totalResources: resourceEntries.length,
      totalSize: totalSize,
      totalTime: totalTime,
      averageSize: totalSize / resourceEntries.length,
      averageTime: totalTime / resourceEntries.length
    };
    
    // Check if network performance is acceptable
    results.validation.networkPerformanceAcceptable = totalSize < 5000000; // < 5MB total
    
    if (results.validation.networkPerformanceAcceptable) {
      console.log('✅ [Performance Validation] Network performance acceptable');
    } else {
      results.regression.issues.push(`Total resource size too large: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
      results.regression.recommendations.push('Optimize resource sizes - compress images and minify code');
    }
    
    console.log('📊 [Performance Validation] Network metrics:', results.metrics.networkPerformance);
  }
  
  // Test 6: Rendering Performance
  function testRenderingPerformance() {
    console.log('⚡ [Performance Validation] Testing rendering performance...');
    
    const paintEntries = performance.getEntriesByType('paint');
    const measureEntries = performance.getEntriesByType('measure');
    
    results.metrics.renderingPerformance = {
      paintEntries: paintEntries.length,
      measureEntries: measureEntries.length,
      paintTimes: paintEntries.map(entry => ({
        name: entry.name,
        startTime: entry.startTime
      }))
    };
    
    // Check if rendering performance is acceptable
    results.validation.renderingPerformanceAcceptable = paintEntries.length > 0;
    
    if (results.validation.renderingPerformanceAcceptable) {
      console.log('✅ [Performance Validation] Rendering performance acceptable');
    } else {
      results.regression.issues.push('No paint entries found - rendering may be blocked');
      results.regression.recommendations.push('Check for rendering blocking resources');
    }
    
    console.log('📊 [Performance Validation] Rendering metrics:', results.metrics.renderingPerformance);
  }
  
  // Test 7: JavaScript Performance
  function testJavaScriptPerformance() {
    console.log('⚡ [Performance Validation] Testing JavaScript performance...');
    
    const scriptEntries = performance.getEntriesByType('resource').filter(entry => 
      entry.name.includes('.js') || entry.initiatorType === 'script'
    );
    
    const totalScriptSize = scriptEntries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);
    const totalScriptTime = scriptEntries.reduce((sum, entry) => sum + entry.duration, 0);
    
    results.metrics.javascriptPerformance = {
      scriptCount: scriptEntries.length,
      totalSize: totalScriptSize,
      totalTime: totalScriptTime,
      averageSize: totalScriptSize / scriptEntries.length,
      averageTime: totalScriptTime / scriptEntries.length
    };
    
    // Check if JavaScript performance is acceptable
    const jsPerformanceAcceptable = totalScriptSize < 1000000 && totalScriptTime < 1000; // < 1MB and < 1s
    
    if (jsPerformanceAcceptable) {
      console.log('✅ [Performance Validation] JavaScript performance acceptable');
    } else {
      results.regression.issues.push(`JavaScript performance issues: ${(totalScriptSize / 1024).toFixed(1)}KB, ${totalScriptTime.toFixed(2)}ms`);
      results.regression.recommendations.push('Optimize JavaScript - minify, compress, and lazy load');
    }
    
    console.log('📊 [Performance Validation] JavaScript metrics:', results.metrics.javascriptPerformance);
  }
  
  // Test 8: Feature Flag Performance Impact
  function testFeatureFlagPerformanceImpact() {
    console.log('⚡ [Performance Validation] Testing feature flag performance impact...');
    
    if (window.FLAGS) {
      const enabledFlags = Object.entries(window.FLAGS).filter(([key, value]) => value === true);
      const disabledFlags = Object.entries(window.FLAGS).filter(([key, value]) => value === false);
      
      results.metrics.featureFlags = {
        totalFlags: Object.keys(window.FLAGS).length,
        enabledFlags: enabledFlags.length,
        disabledFlags: disabledFlags.length,
        enabledFlagNames: enabledFlags.map(([key]) => key),
        disabledFlagNames: disabledFlags.map(([key]) => key)
      };
      
      // Check if feature flags are impacting performance
      if (enabledFlags.length > 20) {
        results.warnings.push(`Many feature flags enabled: ${enabledFlags.length} - may impact performance`);
      }
      
      console.log('📊 [Performance Validation] Feature flags:', results.metrics.featureFlags);
    } else {
      results.warnings.push('Feature flags not available');
    }
  }
  
  // Test 9: Regression Detection
  function testRegressionDetection() {
    console.log('⚡ [Performance Validation] Detecting performance regressions...');
    
    // Check for common regression patterns
    const issues = results.regression.issues;
    
    if (issues.length > 0) {
      results.regression.detected = true;
      console.log('⚠️ [Performance Validation] Performance regressions detected:', issues);
    } else {
      console.log('✅ [Performance Validation] No performance regressions detected');
    }
    
    // Calculate overall performance score
    const totalTests = 6; // loadTime, memory, dom, network, rendering, javascript
    const passedTests = Object.values(results.validation).filter(Boolean).length;
    const performanceScore = (passedTests / totalTests) * 100;
    
    results.performanceScore = performanceScore;
    
    console.log(`📈 [Performance Validation] Performance Score: ${performanceScore.toFixed(1)}%`);
  }
  
  // Run all tests
  async function runAllTests() {
    console.log('🚀 [Performance Validation] Running all performance validation tests...');
    
    try {
      testPageLoadPerformance();
      testCoreWebVitals();
      testMemoryUsage();
      testDOMPerformance();
      testNetworkPerformance();
      testRenderingPerformance();
      testJavaScriptPerformance();
      testFeatureFlagPerformanceImpact();
      testRegressionDetection();
      
      console.log('📊 [Performance Validation] Validation complete!');
      console.log('📋 [Performance Validation] Results:', results);
      
      // Store results globally
      window.performanceValidationResult = results;
      
      return results;
      
    } catch (error) {
      results.errors.push(`Validation failed: ${error.message}`);
      console.error('❌ [Performance Validation] Validation failed:', error);
      window.performanceValidationResult = results;
      return results;
    }
  }
  
  // Start validation
  runAllTests();
  
  console.log('✅ [Performance Validation] Performance validation script loaded');
})();



