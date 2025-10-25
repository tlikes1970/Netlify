/**
 * Test script to verify unified mobile card implementation
 * Run this in browser console on mobile viewport (≤640px)
 */

console.log('🧪 Testing Unified Mobile Cards Implementation...');

// Test 1: Check if all cards use mobile classes
const testMobileClasses = () => {
  const lists = [...document.querySelectorAll('[data-tab]')];
  const results = lists.map(l => ({
    tab: l.getAttribute('data-tab') || '(unknown)',
    mobileCards: l.querySelectorAll('.card-mobile').length,
    rogueCards: l.querySelectorAll('.card-v2, [class*="DesktopCard"]').length
  }));
  
  console.table(results);
  
  const allGood = results.every(r => r.rogueCards === 0);
  console.log(allGood ? '✅ All cards use mobile classes' : '❌ Some cards still use desktop classes');
  return allGood;
};

// Test 2: Check proper grid and swipe underlay
const testGridAndSwipe = () => {
  const c = document.querySelector('.card-mobile');
  const t = c?.querySelector('.swipe-target');
  const bg = c?.querySelector('.swipe-bg');
  
  const result = {
    hasBg: !!bg,
    targetGrid: t && getComputedStyle(t).gridTemplateColumns,
    hasRevealLeft: !!c?.querySelector('.swipe-bg .left'),
    hasRevealRight: !!c?.querySelector('.swipe-bg .right')
  };
  
  console.table(result);
  
  const allGood = result.hasBg && result.targetGrid === '112px 1fr';
  console.log(allGood ? '✅ Grid and swipe underlay correct' : '❌ Grid or swipe underlay issues');
  return allGood;
};

// Test 3: Check actions, overflow, and providers
const testActionsAndOverflow = () => {
  const lane = document.querySelector('.card-mobile .content');
  const result = {
    actionsInside: !!lane?.querySelector('.actions'),
    deleteInside: !!lane?.querySelector('.actions .btn-delete'),
    overflowTopline: !!document.querySelector('.card-mobile .topline .btn-overflow'),
    providers: lane?.querySelectorAll('.provider-chip').length || 0,
    hasRatingRow: !!lane?.querySelector('.rating-row'),
    hasStars: lane?.querySelectorAll('.star').length || 0
  };
  
  console.table(result);
  
  const allGood = result.actionsInside && result.overflowTopline && result.hasRatingRow && result.hasStars === 5;
  console.log(allGood ? '✅ Actions, overflow, and rating correct' : '❌ Missing actions, overflow, or rating');
  return allGood;
};

// Test 4: Check drag rail isolation
const testDragRail = () => {
  const c = document.querySelector('.card-mobile');
  const result = {
    rail: !!c?.querySelector('.drag-rail'),
    railWidth: c?.querySelector('.drag-rail') && getComputedStyle(c.querySelector('.drag-rail')).width,
    targetCols: getComputedStyle(c.querySelector('.swipe-target')).gridTemplateColumns,
    cardPadding: getComputedStyle(c).paddingRight
  };
  
  console.table(result);
  
  const allGood = result.rail && result.railWidth === '36px' && result.targetCols === '112px 1fr';
  console.log(allGood ? '✅ Drag rail properly isolated' : '❌ Drag rail issues');
  return allGood;
};

// Test 5: Check rating behavior
const testRatingBehavior = () => {
  const stars = document.querySelectorAll('.star');
  const ratingRow = document.querySelector('.rating-row');
  
  const result = {
    hasFiveStars: stars.length === 5,
    allStarsHaveDataValue: [...stars].every(s => s.dataset.value),
    hasPointerEvents: ratingRow && getComputedStyle(ratingRow.querySelector('.stars')).touchAction === 'none',
    hasKeyboardSupport: [...stars].every(s => s.onkeydown !== null)
  };
  
  console.table(result);
  
  const allGood = result.hasFiveStars && result.allStarsHaveDataValue && result.hasPointerEvents;
  console.log(allGood ? '✅ Rating behavior correct' : '❌ Rating behavior issues');
  return allGood;
};

// Run all tests
const runAllTests = () => {
  console.log('🚀 Running all mobile card tests...\n');
  
  const results = [
    testMobileClasses(),
    testGridAndSwipe(),
    testActionsAndOverflow(),
    testDragRail(),
    testRatingBehavior()
  ];
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Mobile cards are unified and working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the issues above.');
  }
  
  return passed === total;
};

// Auto-run tests if in mobile viewport
if (window.innerWidth <= 640) {
  setTimeout(runAllTests, 1000); // Wait for cards to load
} else {
  console.log('📱 Please resize browser to mobile viewport (≤640px) and run runAllTests()');
}

// Export for manual testing
window.testMobileCards = {
  testMobileClasses,
  testGridAndSwipe,
  testActionsAndOverflow,
  testDragRail,
  testRatingBehavior,
  runAllTests
};
