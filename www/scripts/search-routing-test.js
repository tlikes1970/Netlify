// Search Routing Test - Verify search results appear in correct location
// Run this in DevTools console to test search routing functionality

(function() {
  'use strict';
  
  console.log('🧪 Search Routing Test Starting...');
  
  // Test 1: Check if router is available
  const routerAvailable = !!(window.router && typeof window.router.navigate === 'function');
  console.log('✅ Router available:', routerAvailable ? 'PASS' : 'FAIL');
  
  // Test 2: Check if search elements exist
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const searchResults = document.getElementById('searchResults');
  const homeSection = document.getElementById('homeSection');
  
  console.log('✅ Search input exists:', !!searchInput ? 'PASS' : 'FAIL');
  console.log('✅ Search button exists:', !!searchBtn ? 'PASS' : 'FAIL');
  console.log('✅ Search results container exists:', !!searchResults ? 'PASS' : 'FAIL');
  console.log('✅ Home section exists:', !!homeSection ? 'PASS' : 'FAIL');
  
  // Test 3: Check initial state
  const homeVisible = homeSection ? window.getComputedStyle(homeSection).display !== 'none' : false;
  const searchVisible = searchResults ? window.getComputedStyle(searchResults).display !== 'none' : false;
  
  console.log('✅ Home section initially visible:', homeVisible ? 'PASS' : 'FAIL');
  console.log('✅ Search results initially hidden:', !searchVisible ? 'PASS' : 'FAIL');
  
  // Test 4: Test search navigation
  if (routerAvailable && searchInput && searchBtn) {
    console.log('🔍 Testing search navigation...');
    
    // Set a test query
    const testQuery = 'test movie';
    searchInput.value = testQuery;
    
    // Test router navigation
    try {
      window.router.navigate('/search', { q: testQuery });
      console.log('✅ Router navigation successful');
      
      // Check if home is hidden and search is shown
      setTimeout(() => {
        const homeVisibleAfter = homeSection ? window.getComputedStyle(homeSection).display !== 'none' : false;
        const searchVisibleAfter = searchResults ? window.getComputedStyle(searchResults).display !== 'none' : false;
        
        console.log('✅ Home hidden after search:', !homeVisibleAfter ? 'PASS' : 'FAIL');
        console.log('✅ Search results shown after search:', searchVisibleAfter ? 'PASS' : 'FAIL');
        
        // Test back to home
        console.log('🏠 Testing back to home...');
        window.router.navigate('/');
        
        setTimeout(() => {
          const homeVisibleBack = homeSection ? window.getComputedStyle(homeSection).display !== 'none' : false;
          const searchVisibleBack = searchResults ? window.getComputedStyle(searchResults).display !== 'none' : false;
          
          console.log('✅ Home shown after back:', homeVisibleBack ? 'PASS' : 'FAIL');
          console.log('✅ Search hidden after back:', !searchVisibleBack ? 'PASS' : 'FAIL');
          
          // Overall result
          const routingWorks = !homeVisibleAfter && searchVisibleAfter && homeVisibleBack && !searchVisibleBack;
          console.log('🎯 Overall result:', routingWorks ? '✅ ROUTING WORKS CORRECTLY' : '❌ ROUTING ISSUES DETECTED');
          
          if (!routingWorks) {
            console.log('🔧 Debug info:');
            console.log('- Home after search:', homeVisibleAfter);
            console.log('- Search after search:', searchVisibleAfter);
            console.log('- Home after back:', homeVisibleBack);
            console.log('- Search after back:', searchVisibleBack);
          }
        }, 100);
      }, 100);
      
    } catch (error) {
      console.error('❌ Router navigation failed:', error);
    }
  } else {
    console.log('❌ Cannot test navigation - missing components');
  }
  
  // Test 5: Check search button click handler
  if (searchBtn) {
    const hasClickHandler = searchBtn.onclick !== null;
    console.log('✅ Search button has click handler:', hasClickHandler ? 'PASS' : 'FAIL');
    
    if (hasClickHandler) {
      console.log('  - Handler type:', typeof searchBtn.onclick);
    }
  }
  
  // Test 6: Check performSearch function availability
  const performSearchAvailable = typeof window.performSearch === 'function';
  console.log('✅ performSearch function available:', performSearchAvailable ? 'PASS' : 'FAIL');
  
  if (performSearchAvailable) {
    console.log('  - Function source: inline-script-02.js');
  }
  
  console.log('🧪 Search Routing Test Complete');
  
})();
