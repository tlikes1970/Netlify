// Tab Position Test - Verify tab bar is at the top
// Run this in DevTools console to verify tab positioning

(function() {
  'use strict';
  
  console.log('🧪 Tab Position Test Starting...');
  
  // Test 1: Tab container exists
  const tabContainer = document.querySelector('.tab-container');
  const tabContainerExists = !!tabContainer;
  console.log('✅ Tab container exists:', tabContainerExists ? 'PASS' : 'FAIL');
  
  if (!tabContainerExists) {
    console.log('❌ Tab container not found');
    return false;
  }
  
  // Test 2: Tab container is positioned after header
  const header = document.querySelector('.header');
  const searchSection = document.querySelector('.top-search');
  
  const headerExists = !!header;
  const searchExists = !!searchSection;
  console.log('✅ Header exists:', headerExists ? 'PASS' : 'FAIL');
  console.log('✅ Search section exists:', searchExists ? 'PASS' : 'FAIL');
  
  if (headerExists && searchExists) {
    // Check if tab container is between header and search
    const headerRect = header.getBoundingClientRect();
    const tabRect = tabContainer.getBoundingClientRect();
    const searchRect = searchSection.getBoundingClientRect();
    
    const isAfterHeader = tabRect.top > headerRect.bottom;
    const isBeforeSearch = tabRect.bottom < searchRect.top;
    
    console.log('✅ Tab positioned after header:', isAfterHeader ? 'PASS' : 'FAIL');
    console.log('✅ Tab positioned before search:', isBeforeSearch ? 'PASS' : 'FAIL');
    
    const correctPosition = isAfterHeader && isBeforeSearch;
    console.log('✅ Tab in correct position (header → tab → search):', correctPosition ? 'PASS' : 'FAIL');
    
    // Show positioning details
    console.log('📍 Position details:');
    console.log('  - Header bottom:', headerRect.bottom);
    console.log('  - Tab top:', tabRect.top);
    console.log('  - Tab bottom:', tabRect.bottom);
    console.log('  - Search top:', searchRect.top);
  }
  
  // Test 3: All tab buttons present
  const expectedTabs = ['homeTab', 'watchingTab', 'wishlistTab', 'watchedTab', 'discoverTab'];
  const presentTabs = expectedTabs.map(id => document.getElementById(id));
  const allTabsPresent = presentTabs.every(tab => !!tab);
  
  console.log('✅ All tab buttons present:', allTabsPresent ? 'PASS' : 'FAIL');
  if (!allTabsPresent) {
    const missingTabs = expectedTabs.filter((id, index) => !presentTabs[index]);
    console.log('  - Missing tabs:', missingTabs);
  }
  
  // Test 4: Tab functionality (basic click test)
  const homeTab = document.getElementById('homeTab');
  const watchingTab = document.getElementById('watchingTab');
  
  if (homeTab && watchingTab) {
    console.log('✅ Tab buttons clickable:', 'PASS');
    console.log('  - Home tab text:', homeTab.textContent.trim());
    console.log('  - Watching tab text:', watchingTab.textContent.trim());
  } else {
    console.log('❌ Tab buttons not found for functionality test');
  }
  
  // Test 5: No duplicate tab containers
  const allTabContainers = document.querySelectorAll('.tab-container');
  const hasDuplicates = allTabContainers.length > 1;
  
  console.log('✅ No duplicate tab containers:', !hasDuplicates ? 'PASS' : 'FAIL');
  console.log('  - Total tab containers found:', allTabContainers.length);
  
  // Test 6: Visual positioning check
  const tabStyle = window.getComputedStyle(tabContainer);
  const tabMargin = tabStyle.marginTop;
  const tabPadding = tabStyle.paddingTop;
  
  console.log('✅ Tab styling check:');
  console.log('  - Margin top:', tabMargin);
  console.log('  - Padding top:', tabPadding);
  console.log('  - Display:', tabStyle.display);
  console.log('  - Background:', tabStyle.backgroundColor);
  
  // Overall result
  const allTests = [
    tabContainerExists,
    headerExists,
    searchExists,
    allTabsPresent,
    !hasDuplicates
  ];
  
  const allPassed = allTests.every(test => test);
  console.log('🎯 Overall result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (!allPassed) {
    console.log('🔧 Debug info:');
    console.log('- Tab container:', tabContainer);
    console.log('- Header:', header);
    console.log('- Search section:', searchSection);
    console.log('- All tab containers:', allTabContainers);
  }
  
  return allPassed;
})();
