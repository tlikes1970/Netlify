// Tab Activation System Validation Script
// Run this in the browser console to validate the implementation

console.log('🧪 Testing Tab Activation System...');

// Test 1: Body class management
function testBodyClassManagement() {
  console.log('\n1️⃣ Testing Body Class Management:');
  
  const bodyClasses = document.body.className.split(' ');
  const tabClasses = bodyClasses.filter(c => c.startsWith('tab-'));
  
  console.log(`   Current body classes: ${document.body.className}`);
  console.log(`   Tab classes found: ${tabClasses.length} (${tabClasses.join(', ')})`);
  
  if (tabClasses.length === 1) {
    console.log('   ✅ PASS: Exactly one tab-* class found');
  } else if (tabClasses.length === 0) {
    console.log('   ❌ FAIL: No tab-* class found');
  } else {
    console.log('   ❌ FAIL: Multiple tab-* classes found');
  }
  
  return tabClasses.length === 1;
}

// Test 2: Home-only elements
function testHomeOnlyElements() {
  console.log('\n2️⃣ Testing Home-Only Elements:');
  
  const quoteBar = document.getElementById('quote-bar');
  if (!quoteBar) {
    console.log('   ❌ FAIL: quote-bar element not found');
    return false;
  }
  
  const hasHomeOnlyClass = quoteBar.classList.contains('home-only');
  const isVisible = getComputedStyle(quoteBar).display !== 'none';
  const currentTab = document.body.className.split(' ').find(c => c.startsWith('tab-'));
  
  console.log(`   Current tab: ${currentTab}`);
  console.log(`   quote-bar has home-only class: ${hasHomeOnlyClass}`);
  console.log(`   quote-bar is visible: ${isVisible}`);
  
  if (hasHomeOnlyClass) {
    console.log('   ✅ PASS: quote-bar has home-only class');
  } else {
    console.log('   ❌ FAIL: quote-bar missing home-only class');
  }
  
  return hasHomeOnlyClass;
}

// Test 3: Search policy
function testSearchPolicy() {
  console.log('\n3️⃣ Testing Search Policy:');
  
  const topSearch = document.querySelector('.top-search');
  const searchRow = document.querySelector('.search-row');
  const hasSearchClass = document.body.classList.contains('has-search');
  const currentTab = document.body.className.split(' ').find(c => c.startsWith('tab-'));
  
  console.log(`   Current tab: ${currentTab}`);
  console.log(`   Body has has-search class: ${hasSearchClass}`);
  
  if (topSearch) {
    const topSearchVisible = getComputedStyle(topSearch).display !== 'none';
    console.log(`   .top-search is visible: ${topSearchVisible}`);
  }
  
  if (searchRow) {
    const searchRowVisible = getComputedStyle(searchRow).display !== 'none';
    console.log(`   .search-row is visible: ${searchRowVisible}`);
  }
  
  const searchAllowedTabs = ['tab-home', 'tab-discover'];
  const shouldHaveSearch = searchAllowedTabs.includes(currentTab);
  
  if (shouldHaveSearch === hasSearchClass) {
    console.log('   ✅ PASS: Search policy correctly applied');
  } else {
    console.log('   ❌ FAIL: Search policy mismatch');
  }
  
  return shouldHaveSearch === hasSearchClass;
}

// Test 4: Tab switching simulation
function testTabSwitching() {
  console.log('\n4️⃣ Testing Tab Switching:');
  
  const tabs = document.querySelectorAll('[role="tab"]');
  const panels = document.querySelectorAll('[role="tabpanel"]');
  
  console.log(`   Found ${tabs.length} tabs and ${panels.length} panels`);
  
  let allTestsPass = true;
  
  tabs.forEach((tab, index) => {
    const tabId = tab.getAttribute('aria-controls');
    const panel = document.getElementById(tabId);
    
    if (panel) {
      const isActive = tab.getAttribute('aria-selected') === 'true';
      const isVisible = !panel.hidden;
      
      console.log(`   Tab ${index + 1} (${tabId}): active=${isActive}, visible=${isVisible}`);
      
      if (isActive !== isVisible) {
        console.log(`   ❌ FAIL: Tab ${tabId} state mismatch`);
        allTestsPass = false;
      }
    }
  });
  
  if (allTestsPass) {
    console.log('   ✅ PASS: All tab states consistent');
  }
  
  return allTestsPass;
}

// Run all tests
function runAllTests() {
  const test1 = testBodyClassManagement();
  const test2 = testHomeOnlyElements();
  const test3 = testSearchPolicy();
  const test4 = testTabSwitching();
  
  const allPassed = test1 && test2 && test3 && test4;
  
  console.log('\n📊 Test Results Summary:');
  console.log(`   Body Class Management: ${test1 ? '✅' : '❌'}`);
  console.log(`   Home-Only Elements: ${test2 ? '✅' : '❌'}`);
  console.log(`   Search Policy: ${test3 ? '✅' : '❌'}`);
  console.log(`   Tab Switching: ${test4 ? '✅' : '❌'}`);
  console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  return allPassed;
}

// Auto-run tests
runAllTests();

// Export functions for manual testing
window.testTabActivation = {
  testBodyClassManagement,
  testHomeOnlyElements,
  testSearchPolicy,
  testTabSwitching,
  runAllTests
};

console.log('\n💡 Manual testing available:');
console.log('   testTabActivation.runAllTests() - Run all tests');
console.log('   testTabActivation.testBodyClassManagement() - Test body classes');
console.log('   testTabActivation.testHomeOnlyElements() - Test home-only elements');
console.log('   testTabActivation.testSearchPolicy() - Test search policy');
console.log('   testTabActivation.testTabSwitching() - Test tab switching');

