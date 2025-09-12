/* ============== Simple Search Test ==============
   Simple test to verify search functionality works
*/

(function() {
  'use strict';
  
  function testSearch() {
    console.log('🧪 Testing search functionality...');
    
    // Test 1: Check if search elements exist
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (!searchInput) {
      console.error('❌ searchInput not found');
      return;
    }
    if (!searchBtn) {
      console.error('❌ searchBtn not found');
      return;
    }
    
    console.log('✅ Search elements found');
    
    // Test 2: Check if search functions exist
    if (typeof window.performSearch !== 'function') {
      console.error('❌ window.performSearch not available');
      console.log('Available functions:', Object.keys(window).filter(k => k.includes('search')));
      return;
    }
    
    console.log('✅ performSearch function available');
    
    // Test 3: Test search with a simple query
    console.log('🔍 Testing search with "test" query...');
    searchInput.value = 'test';
    
    // Test button click
    console.log('🖱️ Testing search button click...');
    searchBtn.click();
    
    // Test Enter key
    console.log('⌨️ Testing Enter key...');
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    searchInput.dispatchEvent(enterEvent);
    
    // Clear the test
    setTimeout(() => {
      searchInput.value = '';
      if (typeof window.clearSearch === 'function') {
        window.clearSearch();
      }
    }, 2000);
  }
  
  // Run test after everything loads
  setTimeout(testSearch, 5000);
  
  console.log('🧪 Simple search test loaded');
})();
