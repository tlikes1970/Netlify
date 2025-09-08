/* ============== Search Page Functionality Test ==============
   Test script to verify search page functionality works correctly
*/

(function() {
  'use strict';
  
  // Test search page functionality
  function testSearchPage() {
    FlickletDebug.info('🧪 Testing search page functionality...');
    
    // Test 1: Check if search tab exists
    const searchTab = document.getElementById('searchTab');
    if (!searchTab) {
      FlickletDebug.error('❌ Search tab not found');
      return false;
    }
    FlickletDebug.info('✅ Search tab found');
    
    // Test 2: Check if search section exists
    const searchSection = document.getElementById('searchSection');
    if (!searchSection) {
      FlickletDebug.error('❌ Search section not found');
      return false;
    }
    FlickletDebug.info('✅ Search section found');
    
    // Test 3: Check if search input exists
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) {
      FlickletDebug.error('❌ Search input not found');
      return false;
    }
    FlickletDebug.info('✅ Search input found');
    
    // Test 4: Check if search button exists
    const searchBtn = document.getElementById('searchBtn');
    if (!searchBtn) {
      FlickletDebug.error('❌ Search button not found');
      return false;
    }
    FlickletDebug.info('✅ Search button found');
    
    // Test 5: Check if search results container exists
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) {
      FlickletDebug.error('❌ Search results container not found');
      return false;
    }
    FlickletDebug.info('✅ Search results container found');
    
    // Test 6: Test tab switching to search
    if (window.FlickletApp && typeof window.FlickletApp.switchToTab === 'function') {
      try {
        window.FlickletApp.switchToTab('search');
        if (window.FlickletApp.currentTab === 'search') {
          FlickletDebug.info('✅ Successfully switched to search tab');
        } else {
          FlickletDebug.error('❌ Failed to switch to search tab');
          return false;
        }
      } catch (error) {
        FlickletDebug.error('❌ Error switching to search tab:', error);
        return false;
      }
    } else {
      FlickletDebug.warn('⚠️ FlickletApp.switchToTab not available');
    }
    
    // Test 7: Test switching back to home
    if (window.FlickletApp && typeof window.FlickletApp.switchToTab === 'function') {
      try {
        window.FlickletApp.switchToTab('home');
        if (window.FlickletApp.currentTab === 'home') {
          FlickletDebug.info('✅ Successfully switched back to home tab');
        } else {
          FlickletDebug.error('❌ Failed to switch back to home tab');
          return false;
        }
      } catch (error) {
        FlickletDebug.error('❌ Error switching back to home tab:', error);
        return false;
      }
    }
    
    FlickletDebug.info('🎉 All search page tests passed!');
    return true;
  }
  
  // Run test after a short delay to ensure everything is loaded
  setTimeout(() => {
    testSearchPage();
  }, 1000);
  
  // Expose test function
  window.testSearchPage = testSearchPage;
  
  FlickletDebug.info('🧪 Search page test script loaded');
})();
