/**
 * Performance Monitor
 * Purpose: Track loading performance and identify bottlenecks
 * Data Source: Performance API, custom timing events
 * Update Path: Add new performance markers as needed
 * Dependencies: None
 */

(function () {
  'use strict';

  console.log('📊 Performance Monitor loaded');

  const performanceData = {
    homeLoadStart: null,
    homeLoadEnd: null,
    sectionLoadTimes: {},
    totalLoadTime: 0,
  };

  // Start timing home load
  function startHomeLoad() {
    performanceData.homeLoadStart = performance.now();
    console.log('📊 Home load started at:', performanceData.homeLoadStart);
  }

  // End timing home load
  function endHomeLoad() {
    performanceData.homeLoadEnd = performance.now();
    performanceData.totalLoadTime = performanceData.homeLoadEnd - performanceData.homeLoadStart;
    console.log('📊 Home load completed in:', performanceData.totalLoadTime.toFixed(2), 'ms');

    // Log performance summary
    logPerformanceSummary();
  }

  // Track section load time
  function trackSectionLoad(sectionId, startTime, endTime) {
    const loadTime = endTime - startTime;
    performanceData.sectionLoadTimes[sectionId] = loadTime;
    console.log(`📊 Section ${sectionId} loaded in:`, loadTime.toFixed(2), 'ms');
  }

  // Log performance summary
  function logPerformanceSummary() {
    console.log('📊 === PERFORMANCE SUMMARY ===');
    console.log('📊 Total home load time:', performanceData.totalLoadTime.toFixed(2), 'ms');
    console.log('📊 Section load times:');

    Object.entries(performanceData.sectionLoadTimes).forEach(([section, time]) => {
      console.log(`📊   ${section}: ${time.toFixed(2)}ms`);
    });

    // Performance recommendations
    if (performanceData.totalLoadTime > 1000) {
      console.warn('⚠️ Home load time is slow (>1000ms). Consider optimization.');
    }

    if (performanceData.totalLoadTime > 2000) {
      console.error('❌ Home load time is very slow (>2000ms). Critical optimization needed.');
    }

    console.log('📊 === END PERFORMANCE SUMMARY ===');
  }

  // Get performance data
  function getPerformanceData() {
    return {
      ...performanceData,
      isSlow: performanceData.totalLoadTime > 1000,
      isVerySlow: performanceData.totalLoadTime > 2000,
    };
  }

  // Reset performance data
  function resetPerformanceData() {
    performanceData.homeLoadStart = null;
    performanceData.homeLoadEnd = null;
    performanceData.sectionLoadTimes = {};
    performanceData.totalLoadTime = 0;
  }

  // Expose performance monitoring functions
  window.PerformanceMonitor = {
    startHomeLoad,
    endHomeLoad,
    trackSectionLoad,
    getPerformanceData,
    resetPerformanceData,
    logPerformanceSummary,
  };

  console.log('✅ Performance Monitor ready');
})();
