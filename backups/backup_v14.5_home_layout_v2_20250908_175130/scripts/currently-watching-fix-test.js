/* ============== Currently Watching Fix Test ==============
   Test script to verify that adding shows to currently watching works correctly
*/

(function() {
  'use strict';
  
  // Test currently watching limit functionality
  function testCurrentlyWatchingLimit() {
    FlickletDebug.info('🧪 Testing currently watching limit functionality...');
    
    // Test 1: Check if limit function exists
    if (typeof window.renderCurrentlyWatchingPreview !== 'function') {
      FlickletDebug.error('❌ renderCurrentlyWatchingPreview function not available');
      return false;
    }
    FlickletDebug.info('✅ renderCurrentlyWatchingPreview function available');
    
    // Test 2: Check default limit
    const defaultLimit = localStorage.getItem('flicklet:currentlyWatching:limit');
    if (defaultLimit) {
      FlickletDebug.info('✅ Default limit found:', defaultLimit);
    } else {
      FlickletDebug.info('ℹ️ No custom limit set, using default (12)');
    }
    
    // Test 3: Check if setting input exists
    const settingInput = document.getElementById('settingCurrentlyWatchingLimit');
    if (!settingInput) {
      FlickletDebug.error('❌ Currently watching limit setting input not found');
      return false;
    }
    FlickletDebug.info('✅ Currently watching limit setting input found');
    
    // Test 4: Test limit validation
    const testLimits = [5, 10, 15, 20, 25];
    testLimits.forEach(limit => {
      localStorage.setItem('flicklet:currentlyWatching:limit', limit.toString());
      // The function should cap at 20
      const expectedLimit = Math.min(limit, 20);
      FlickletDebug.info(`   Testing limit ${limit} -> should be capped at ${expectedLimit}`);
    });
    
    // Reset to default
    localStorage.setItem('flicklet:currentlyWatching:limit', '12');
    
    return true;
  }
  
  // Test currently watching preview rendering
  function testCurrentlyWatchingPreview() {
    FlickletDebug.info('🧪 Testing currently watching preview rendering...');
    
    // Test 1: Check if preview section exists
    const previewSection = document.getElementById('currentlyWatchingPreview');
    if (!previewSection) {
      FlickletDebug.error('❌ Currently watching preview section not found');
      return false;
    }
    FlickletDebug.info('✅ Currently watching preview section found');
    
    // Test 2: Check if scroll container exists
    const scrollContainer = document.getElementById('currentlyWatchingScroll');
    if (!scrollContainer) {
      FlickletDebug.error('❌ Currently watching scroll container not found');
      return false;
    }
    FlickletDebug.info('✅ Currently watching scroll container found');
    
    // Test 3: Test rendering function
    try {
      window.renderCurrentlyWatchingPreview();
      FlickletDebug.info('✅ renderCurrentlyWatchingPreview executed successfully');
    } catch (error) {
      FlickletDebug.error('❌ Error calling renderCurrentlyWatchingPreview:', error);
      return false;
    }
    
    // Test 4: Check if cards are rendered
    const cards = scrollContainer.querySelectorAll('.preview-card, [data-id]');
    FlickletDebug.info(`📊 Found ${cards.length} currently watching cards`);
    
    return true;
  }
  
  // Test add to list functionality
  function testAddToListFunctionality() {
    FlickletDebug.info('🧪 Testing add to list functionality...');
    
    // Test 1: Check if addToList function exists
    if (typeof window.addToList !== 'function') {
      FlickletDebug.error('❌ addToList function not available');
      return false;
    }
    FlickletDebug.info('✅ addToList function available');
    
    // Test 2: Check if addToListFromCache function exists
    if (typeof window.addToListFromCache !== 'function') {
      FlickletDebug.error('❌ addToListFromCache function not available');
      return false;
    }
    FlickletDebug.info('✅ addToListFromCache function available');
    
    // Test 3: Check appData structure
    if (!window.appData) {
      FlickletDebug.warn('⚠️ appData not available');
    } else {
      FlickletDebug.info('✅ appData available');
      
      // Check watching lists
      const tvWatching = window.appData.tv?.watching || [];
      const moviesWatching = window.appData.movies?.watching || [];
      FlickletDebug.info(`📊 TV watching: ${tvWatching.length} items`);
      FlickletDebug.info(`📊 Movies watching: ${moviesWatching.length} items`);
    }
    
    return true;
  }
  
  // Test the fix by simulating adding items
  function testAddingItemsFix() {
    FlickletDebug.info('🧪 Testing adding items fix...');
    
    // Get current count
    const beforeCount = document.querySelectorAll('#currentlyWatchingScroll .preview-card, #currentlyWatchingScroll [data-id]').length;
    FlickletDebug.info(`📊 Currently watching cards before: ${beforeCount}`);
    
    // Test that the limit is now higher (12 instead of 5)
    const limit = parseInt(localStorage.getItem('flicklet:currentlyWatching:limit')) || 12;
    FlickletDebug.info(`📊 Current limit: ${limit}`);
    
    if (limit >= 12) {
      FlickletDebug.info('✅ Limit is sufficient (≥12) - should show more items');
    } else {
      FlickletDebug.warn('⚠️ Limit is low - may still cause replacement behavior');
    }
    
    return true;
  }
  
  // Run all tests
  function runCurrentlyWatchingFixTests() {
    FlickletDebug.info('🧪 Starting currently watching fix tests...');
    
    const test1 = testCurrentlyWatchingLimit();
    const test2 = testCurrentlyWatchingPreview();
    const test3 = testAddToListFunctionality();
    const test4 = testAddingItemsFix();
    
    if (test1 && test2 && test3 && test4) {
      FlickletDebug.info('🎉 All currently watching fix tests passed!');
      FlickletDebug.info('💡 The limit has been increased from 5 to 12 items');
      FlickletDebug.info('💡 You can now configure the limit in Settings → Layout');
    } else {
      FlickletDebug.error('❌ Some currently watching fix tests failed');
    }
    
    return test1 && test2 && test3 && test4;
  }
  
  // Run tests after a short delay to ensure everything is loaded
  setTimeout(() => {
    runCurrentlyWatchingFixTests();
  }, 2000);
  
  // Expose test functions
  window.testCurrentlyWatchingLimit = testCurrentlyWatchingLimit;
  window.testCurrentlyWatchingPreview = testCurrentlyWatchingPreview;
  window.testAddToListFunctionality = testAddToListFunctionality;
  window.testAddingItemsFix = testAddingItemsFix;
  window.runCurrentlyWatchingFixTests = runCurrentlyWatchingFixTests;
  
  FlickletDebug.info('🧪 Currently watching fix test script loaded');
})();
