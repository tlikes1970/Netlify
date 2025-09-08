/* ============== Duplicate Fix Test ==============
   Test script to verify duplicate curated sections are removed and content still works
*/

(function() {
  'use strict';
  
  // Test duplicate removal
  function testDuplicateRemoval() {
    FlickletDebug.info('🧪 Testing duplicate curated sections removal...');
    
    // Test 1: Check that curated-row section is removed
    const curatedRow = document.getElementById('curated-row');
    if (curatedRow) {
      FlickletDebug.error('❌ curated-row section still exists - should be removed');
      return false;
    }
    FlickletDebug.info('✅ curated-row section successfully removed');
    
    // Test 2: Check that curatedSections still exists
    const curatedSections = document.getElementById('curatedSections');
    if (!curatedSections) {
      FlickletDebug.error('❌ curatedSections not found - should still exist');
      return false;
    }
    FlickletDebug.info('✅ curatedSections still exists');
    
    // Test 3: Check that curated-rows.js script is still loaded
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const curatedRowsScript = scripts.find(script => script.src.includes('curated-rows.js'));
    if (!curatedRowsScript) {
      FlickletDebug.error('❌ curated-rows.js script not found');
      return false;
    }
    FlickletDebug.info('✅ curated-rows.js script still loaded');
    
    // Test 4: Check that curated-lists.js script is removed
    const curatedListsScript = scripts.find(script => script.src.includes('curated-lists.js'));
    if (curatedListsScript) {
      FlickletDebug.error('❌ curated-lists.js script still loaded - should be removed');
      return false;
    }
    FlickletDebug.info('✅ curated-lists.js script successfully removed');
    
    // Test 5: Check feature flag is removed
    if (window.FLAGS && window.FLAGS.homeRowCurated) {
      FlickletDebug.error('❌ homeRowCurated feature flag still exists - should be removed');
      return false;
    }
    FlickletDebug.info('✅ homeRowCurated feature flag successfully removed');
    
    return true;
  }
  
  // Test curated content functionality
  function testCuratedContent() {
    FlickletDebug.info('🧪 Testing curated content functionality...');
    
    // Test 1: Check if curated data exists in localStorage
    const trending = localStorage.getItem('curated:trending');
    const staff = localStorage.getItem('curated:staff');
    const newData = localStorage.getItem('curated:new');
    
    FlickletDebug.info('📊 Curated data status:', {
      trending: trending ? `${trending.length} chars` : 'null',
      staff: staff ? `${staff.length} chars` : 'null',
      newData: newData ? `${newData.length} chars` : 'null'
    });
    
    // Test 2: Check if curated-rows.js functions are available
    if (typeof window.renderCuratedCard !== 'function') {
      FlickletDebug.warn('⚠️ renderCuratedCard function not available');
    } else {
      FlickletDebug.info('✅ renderCuratedCard function available');
    }
    
    // Test 3: Check if curated sections are populated
    const curatedSections = document.getElementById('curatedSections');
    if (curatedSections) {
      const sections = curatedSections.querySelectorAll('.curated-section');
      FlickletDebug.info(`📊 Found ${sections.length} curated sections`);
      
      sections.forEach((section, index) => {
        const title = section.querySelector('.section-title');
        const cards = section.querySelectorAll('.curated-card');
        FlickletDebug.info(`   Section ${index + 1}: "${title?.textContent || 'Unknown'}" with ${cards.length} cards`);
      });
    }
    
    return true;
  }
  
  // Test home sections configuration
  function testHomeSectionsConfig() {
    FlickletDebug.info('🧪 Testing home sections configuration...');
    
    if (!window.HomeSectionsConfig) {
      FlickletDebug.error('❌ HomeSectionsConfig not available');
      return false;
    }
    
    // Test that curated-row is removed from ALL_SECTIONS
    const allSections = window.HomeSectionsConfig.ALL_SECTIONS;
    if (allSections.includes('curated-row')) {
      FlickletDebug.error('❌ curated-row still in ALL_SECTIONS - should be removed');
      return false;
    }
    FlickletDebug.info('✅ curated-row removed from ALL_SECTIONS');
    
    // Test that curated-row is removed from SEARCH_HIDDEN_SECTIONS
    const searchHiddenSections = window.HomeSectionsConfig.SEARCH_HIDDEN_SECTIONS;
    if (searchHiddenSections.includes('curated-row')) {
      FlickletDebug.error('❌ curated-row still in SEARCH_HIDDEN_SECTIONS - should be removed');
      return false;
    }
    FlickletDebug.info('✅ curated-row removed from SEARCH_HIDDEN_SECTIONS');
    
    return true;
  }
  
  // Run all tests
  function runDuplicateFixTests() {
    FlickletDebug.info('🧪 Starting duplicate fix tests...');
    
    const test1 = testDuplicateRemoval();
    const test2 = testCuratedContent();
    const test3 = testHomeSectionsConfig();
    
    if (test1 && test2 && test3) {
      FlickletDebug.info('🎉 All duplicate fix tests passed!');
    } else {
      FlickletDebug.error('❌ Some duplicate fix tests failed');
    }
    
    return test1 && test2 && test3;
  }
  
  // Run tests after a short delay to ensure everything is loaded
  setTimeout(() => {
    runDuplicateFixTests();
  }, 2000);
  
  // Expose test functions
  window.testDuplicateRemoval = testDuplicateRemoval;
  window.testCuratedContent = testCuratedContent;
  window.testHomeSectionsConfig = testHomeSectionsConfig;
  window.runDuplicateFixTests = runDuplicateFixTests;
  
  FlickletDebug.info('🧪 Duplicate fix test script loaded');
})();
