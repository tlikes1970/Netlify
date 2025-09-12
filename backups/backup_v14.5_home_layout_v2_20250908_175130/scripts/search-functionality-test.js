/* ============== Search Functionality Test ==============
   Test script to verify search functionality is working
*/

(function() {
  'use strict';
  
  function testSearchFunctionality() {
    FlickletDebug.info('🧪 Testing search functionality...');
    
    // Test 1: Check if search elements exist
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput) {
      FlickletDebug.error('❌ searchInput element not found');
      return false;
    }
    if (!searchBtn) {
      FlickletDebug.error('❌ searchBtn element not found');
      return false;
    }
    if (!clearSearchBtn) {
      FlickletDebug.error('❌ clearSearchBtn element not found');
      return false;
    }
    if (!searchResults) {
      FlickletDebug.error('❌ searchResults element not found');
      return false;
    }
    
    FlickletDebug.info('✅ All search elements found');
    
    // Test 2: Check if search functions are available
    if (typeof window.performSearch !== 'function') {
      FlickletDebug.error('❌ window.performSearch function not available');
      return false;
    }
    if (typeof window.clearSearch !== 'function') {
      FlickletDebug.error('❌ window.clearSearch function not available');
      return false;
    }
    
    FlickletDebug.info('✅ Search functions available');
    
    // Test 3: Check if tmdbGet function is available
    if (typeof window.tmdbGet !== 'function') {
      FlickletDebug.warn('⚠️ window.tmdbGet function not available - search may not work');
    } else {
      FlickletDebug.info('✅ tmdbGet function available');
    }
    
    // Test 4: Check event listeners
    const hasClickListener = searchBtn.onclick !== null;
    const hasKeyListener = searchInput.onkeydown !== null;
    
    FlickletDebug.info('📊 Event listeners:', {
      searchBtnClick: hasClickListener,
      searchInputKeydown: hasKeyListener
    });
    
    // Test 5: Test search with a simple query
    FlickletDebug.info('🔍 Testing search with query "test"...');
    searchInput.value = 'test';
    
    // Trigger search
    try {
      window.performSearch();
      FlickletDebug.info('✅ Search function executed successfully');
    } catch (error) {
      FlickletDebug.error('❌ Search function failed:', error);
      return false;
    }
    
    // Clear the test
    searchInput.value = '';
    window.clearSearch();
    
    return true;
  }
  
  // Run test after a delay to ensure everything is loaded
  setTimeout(() => {
    testSearchFunctionality();
  }, 3000);
  
  FlickletDebug.info('🧪 Search functionality test loaded');
})();
