/* ============== Refactor Validation Script ==============
   Comprehensive testing to ensure all functionality works after refactoring
   This script validates that no functionality was broken during the safe refactoring
*/

(function () {
  'use strict';

  // Test results tracking
  const testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: [],
  };

  // Test function wrapper
  function runTest(testName, testFunction) {
    try {
      const result = testFunction();
      if (result === true) {
        testResults.passed++;
        testResults.tests.push({ name: testName, status: 'PASS', message: 'OK' });
        FlickletDebug.info(`✅ ${testName}: PASS`);
      } else {
        testResults.failed++;
        testResults.tests.push({
          name: testName,
          status: 'FAIL',
          message: result || 'Unknown failure',
        });
        FlickletDebug.error(`❌ ${testName}: FAIL - ${result}`);
      }
    } catch (error) {
      testResults.failed++;
      testResults.tests.push({ name: testName, status: 'ERROR', message: error.message });
      FlickletDebug.error(`💥 ${testName}: ERROR - ${error.message}`);
    }
  }

  // Test: Debug system functionality
  function testDebugSystem() {
    if (!window.FlickletDebug) return 'FlickletDebug not available';
    if (typeof window.FlickletDebug.info !== 'function') return 'FlickletDebug.info not a function';
    if (typeof window.FlickletDebug.error !== 'function')
      return 'FlickletDebug.error not a function';
    if (typeof window.FlickletDebug.warn !== 'function') return 'FlickletDebug.warn not a function';

    // Test debug level switching
    const originalLevel = window.FlickletDebug.getLevel();
    window.FlickletDebug.setLevel(window.FlickletDebug.LEVELS.ERROR);
    window.FlickletDebug.setLevel(originalLevel);

    return true;
  }

  // Test: Home sections configuration
  function testHomeSectionsConfig() {
    if (!window.HomeSectionsConfig) return 'HomeSectionsConfig not available';
    if (!Array.isArray(window.HomeSectionsConfig.ALL_SECTIONS)) return 'ALL_SECTIONS not an array';
    if (typeof window.HomeSectionsConfig.getSections !== 'function')
      return 'getSections not a function';
    if (typeof window.HomeSectionsConfig.getSectionElements !== 'function')
      return 'getSectionElements not a function';

    // Test getting sections
    const tabSections = window.HomeSectionsConfig.getSections('tab-switch');
    if (!Array.isArray(tabSections)) return 'getSections did not return array';

    return true;
  }

  // Test: DOM caching system
  function testDOMCaching() {
    if (!window.DOMCache) return 'DOMCache not available';
    if (typeof window.DOMCache.get !== 'function') return 'DOMCache.get not a function';
    if (typeof window.DOMCache.getMultiple !== 'function')
      return 'DOMCache.getMultiple not a function';

    // Test caching functionality
    const testElement = document.getElementById('versionIndicator');
    if (testElement) {
      const cached = window.DOMCache.get('versionIndicator');
      if (cached !== testElement) return 'DOM caching not working correctly';
    }

    return true;
  }

  // Test: Error handling system
  function testErrorHandling() {
    if (!window.ErrorHandler) return 'ErrorHandler not available';
    if (typeof window.ErrorHandler.handle !== 'function')
      return 'ErrorHandler.handle not a function';
    if (typeof window.ErrorHandler.safe !== 'function') return 'ErrorHandler.safe not a function';

    // Test safe execution
    const result = window.ErrorHandler.safe(
      () => {
        return 'test';
      },
      'test-context',
      'fallback',
    );

    if (result !== 'test') return 'ErrorHandler.safe not working correctly';

    return true;
  }

  // Test: Visibility management
  function testVisibilityManagement() {
    if (!window.VisibilityManager) return 'VisibilityManager not available';
    if (typeof window.VisibilityManager.show !== 'function')
      return 'VisibilityManager.show not a function';
    if (typeof window.VisibilityManager.hide !== 'function')
      return 'VisibilityManager.hide not a function';
    if (typeof window.VisibilityManager.manageHomeSections !== 'function')
      return 'manageHomeSections not a function';

    return true;
  }

  // Test: Common utilities
  function testCommonUtils() {
    if (!window.FlickletUtils) return 'FlickletUtils not available';
    if (typeof window.FlickletUtils.createElement !== 'function')
      return 'createElement not a function';
    if (typeof window.FlickletUtils.storage !== 'object') return 'storage not available';
    if (typeof window.FlickletUtils.storage.get !== 'function') return 'storage.get not a function';

    // Test element creation
    const testEl = window.FlickletUtils.createElement('div', { id: 'test-element' }, 'test');
    if (!testEl || testEl.tagName !== 'DIV') return 'createElement not working correctly';

    return true;
  }

  // Test: Core app functionality
  function testCoreAppFunctionality() {
    if (!window.FlickletApp) return 'FlickletApp not available';
    if (typeof window.FlickletApp.switchToTab !== 'function') return 'switchToTab not a function';
    if (typeof window.FlickletApp.init !== 'function') return 'init not a function';

    return true;
  }

  // Test: Tab switching functionality
  function testTabSwitching() {
    if (!window.FlickletApp) return 'FlickletApp not available';

    // Test switching to different tabs
    const tabs = ['home', 'watching', 'wishlist', 'watched', 'discover', 'settings'];

    for (const tab of tabs) {
      try {
        window.FlickletApp.switchToTab(tab);
        if (window.FlickletApp.currentTab !== tab) {
          return `Tab switch to ${tab} failed - current tab is ${window.FlickletApp.currentTab}`;
        }
      } catch (error) {
        return `Error switching to tab ${tab}: ${error.message}`;
      }
    }

    return true;
  }

  // Test: Home sections visibility
  function testHomeSectionsVisibility() {
    // Switch to home tab
    window.FlickletApp.switchToTab('home');

    // Check if home sections are visible
    const homeSections = window.HomeSectionsConfig.getSections('tab-switch');
    const sectionElements = window.HomeSectionsConfig.getSectionElements('tab-switch');

    for (const sectionId of homeSections) {
      const element = sectionElements[sectionId];
      if (element) {
        const isVisible = window.VisibilityManager
          ? window.VisibilityManager.getState(element) === 'visible'
          : element.style.display !== 'none';

        if (!isVisible) {
          return `Home section ${sectionId} is not visible on home tab`;
        }
      }
    }

    // Switch to another tab
    window.FlickletApp.switchToTab('watching');

    // Check if home sections are hidden
    for (const sectionId of homeSections) {
      const element = sectionElements[sectionId];
      if (element) {
        const isHidden = window.VisibilityManager
          ? window.VisibilityManager.getState(element) === 'none'
          : element.style.display === 'none';

        if (!isHidden) {
          return `Home section ${sectionId} is not hidden on watching tab`;
        }
      }
    }

    return true;
  }

  // Test: Search functionality
  function testSearchFunctionality() {
    if (typeof window.performSearch !== 'function') return 'performSearch not available';
    if (typeof window.clearSearch !== 'function') return 'clearSearch not available';

    // Test search input
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return 'Search input not found';

    // Test search button
    const searchBtn = document.getElementById('searchBtn');
    if (!searchBtn) return 'Search button not found';

    return true;
  }

  // Test: Data persistence
  function testDataPersistence() {
    if (typeof window.saveAppData !== 'function') return 'saveAppData not available';
    if (typeof window.loadAppData !== 'function') return 'loadAppData not available';

    // Test data storage
    const testData = { test: 'value', timestamp: Date.now() };
    window.FlickletUtils.storage.set('test-data', testData);
    const retrieved = window.FlickletUtils.storage.get('test-data');

    if (JSON.stringify(retrieved) !== JSON.stringify(testData)) {
      return 'Data persistence not working correctly';
    }

    // Clean up
    window.FlickletUtils.storage.remove('test-data');

    return true;
  }

  // Run all tests
  function runAllTests() {
    FlickletDebug.info('🧪 Starting refactor validation tests...');

    // Core system tests
    runTest('Debug System', testDebugSystem);
    runTest('Home Sections Config', testHomeSectionsConfig);
    runTest('DOM Caching', testDOMCaching);
    runTest('Error Handling', testErrorHandling);
    runTest('Visibility Management', testVisibilityManagement);
    runTest('Common Utilities', testCommonUtils);

    // App functionality tests
    runTest('Core App Functionality', testCoreAppFunctionality);
    runTest('Tab Switching', testTabSwitching);
    runTest('Home Sections Visibility', testHomeSectionsVisibility);
    runTest('Search Functionality', testSearchFunctionality);
    runTest('Data Persistence', testDataPersistence);

    // Generate report
    generateTestReport();
  }

  // Generate test report
  function generateTestReport() {
    const total = testResults.passed + testResults.failed;
    const passRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;

    FlickletDebug.info('📊 Test Results Summary:');
    FlickletDebug.info(`✅ Passed: ${testResults.passed}`);
    FlickletDebug.info(`❌ Failed: ${testResults.failed}`);
    FlickletDebug.info(`📈 Pass Rate: ${passRate}%`);

    if (testResults.failed > 0) {
      FlickletDebug.warn('⚠️ Some tests failed - check functionality');
      testResults.tests
        .filter((t) => t.status === 'FAIL' || t.status === 'ERROR')
        .forEach((test) => {
          FlickletDebug.error(`  - ${test.name}: ${test.message}`);
        });
    } else {
      FlickletDebug.info('🎉 All tests passed - refactoring successful!');
    }

    // Store results for external access
    window.RefactorValidationResults = testResults;
  }

  // Expose test functions
  window.RefactorValidation = {
    runAll: runAllTests,
    runTest: runTest,
    results: testResults,
  };

  // Auto-run tests after a short delay to ensure everything is loaded
  setTimeout(() => {
    runAllTests();
  }, 2000);

  FlickletDebug.info('🧪 Refactor Validation system loaded');
})();
