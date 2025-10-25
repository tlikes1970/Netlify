// Comprehensive Compact Mobile System Diagnostic
// Run this in the browser console to understand why compact mobile breaks

console.log('🔍 COMPACT MOBILE SYSTEM DIAGNOSTIC');
console.log('=====================================');

// Step 1: Check current state
console.log('\n📊 CURRENT STATE:');
const currentState = {
  flags: {
    mobile_compact_v1: localStorage.getItem('flag:mobile_compact_v1'),
    mobile_actions_split_v1: localStorage.getItem('flag:mobile_actions_split_v1')
  },
  attributes: {
    density: document.documentElement.dataset.density,
    compactMobileV1: document.documentElement.dataset.compactMobileV1,
    actionsSplit: document.documentElement.dataset.actionsSplit
  },
  viewport: {
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768
  }
};

console.log('Flags:', currentState.flags);
console.log('Attributes:', currentState.attributes);
console.log('Viewport:', currentState.viewport);

// Step 2: Check TabCard elements
console.log('\n🎴 TAB CARD ANALYSIS:');
const tabCards = document.querySelectorAll('.tab-card');
console.log('TabCard count:', tabCards.length);

if (tabCards.length > 0) {
  const firstCard = tabCards[0];
  console.log('First card classes:', firstCard.className);
  console.log('First card computed styles:', {
    display: getComputedStyle(firstCard).display,
    visibility: getComputedStyle(firstCard).visibility,
    opacity: getComputedStyle(firstCard).opacity,
    height: getComputedStyle(firstCard).height,
    minHeight: getComputedStyle(firstCard).minHeight
  });
  
  // Check for action elements
  const actionElements = {
    mobileActions: firstCard.querySelector('.mobile-actions'),
    desktopActions: firstCard.querySelector('.desktop-actions'),
    compactActions: firstCard.querySelector('.compact-actions-container'),
    swipeRow: firstCard.closest('.swipe-row-container')
  };
  
  console.log('Action elements found:', Object.entries(actionElements).map(([key, el]) => ({
    [key]: !!el,
    display: el ? getComputedStyle(el).display : 'N/A'
  })));
}

// Step 3: Check SwipeRow elements
console.log('\n📱 SWIPE ROW ANALYSIS:');
const swipeRows = document.querySelectorAll('.swipe-row-container');
console.log('SwipeRow count:', swipeRows.length);

if (swipeRows.length > 0) {
  const firstSwipeRow = swipeRows[0];
  console.log('First SwipeRow classes:', firstSwipeRow.className);
  console.log('First SwipeRow computed styles:', {
    display: getComputedStyle(firstSwipeRow).display,
    visibility: getComputedStyle(firstSwipeRow).visibility,
    opacity: getComputedStyle(firstSwipeRow).opacity
  });
}

// Step 4: Test gate conditions step by step
console.log('\n🚪 GATE CONDITION TESTING:');

// Test 1: Enable only mobile_compact_v1
console.log('\n🧪 TEST 1: Enable mobile_compact_v1 only');
localStorage.setItem('flag:mobile_compact_v1', 'true');
document.documentElement.dataset.density = 'compact';
window.dispatchEvent(new Event('storage'));
window.dispatchEvent(new Event('resize'));

setTimeout(() => {
  const test1State = {
    compactMobileV1: document.documentElement.dataset.compactMobileV1,
    actionsSplit: document.documentElement.dataset.actionsSplit,
    tabCardCount: document.querySelectorAll('.tab-card').length,
    swipeRowCount: document.querySelectorAll('.swipe-row-container').length
  };
  console.log('Test 1 results:', test1State);
  
  // Test 2: Enable both flags
  console.log('\n🧪 TEST 2: Enable both flags');
  localStorage.setItem('flag:mobile_actions_split_v1', 'true');
  window.dispatchEvent(new Event('storage'));
  
  setTimeout(() => {
    const test2State = {
      compactMobileV1: document.documentElement.dataset.compactMobileV1,
      actionsSplit: document.documentElement.dataset.actionsSplit,
      tabCardCount: document.querySelectorAll('.tab-card').length,
      swipeRowCount: document.querySelectorAll('.swipe-row-container').length
    };
    console.log('Test 2 results:', test2State);
    
    // Test 3: Check SwipeRow component logic
    console.log('\n🧪 TEST 3: SwipeRow component logic');
    const swipeRowLogic = {
      gate: document.documentElement.dataset.compactMobileV1 === 'true',
      flagEnabled: document.documentElement.dataset.actionsSplit === 'true',
      isMobile: window.innerWidth < 768,
      shouldRenderSwipeRow: document.documentElement.dataset.compactMobileV1 === 'true' && 
                            document.documentElement.dataset.actionsSplit === 'true' && 
                            window.innerWidth < 768
    };
    console.log('SwipeRow logic:', swipeRowLogic);
    
    // Test 4: Check compact actions
    console.log('\n🧪 TEST 4: Compact actions analysis');
    const compactActions = document.querySelectorAll('.compact-actions-container');
    console.log('Compact actions count:', compactActions.length);
    
    if (compactActions.length > 0) {
      const firstCompactAction = compactActions[0];
      console.log('First compact action:', {
        display: getComputedStyle(firstCompactAction).display,
        visibility: getComputedStyle(firstCompactAction).visibility,
        opacity: getComputedStyle(firstCompactAction).opacity,
        children: firstCompactAction.children.length
      });
    }
    
    // Test 5: Check CSS tokens
    console.log('\n🧪 TEST 5: CSS tokens analysis');
    const computedStyle = getComputedStyle(document.documentElement);
    const tokens = {
      '--poster-w': computedStyle.getPropertyValue('--poster-w'),
      '--poster-h': computedStyle.getPropertyValue('--poster-h'),
      '--space-1': computedStyle.getPropertyValue('--space-1'),
      '--space-2': computedStyle.getPropertyValue('--space-2'),
      '--space-3': computedStyle.getPropertyValue('--space-3'),
      '--space-4': computedStyle.getPropertyValue('--space-4')
    };
    console.log('CSS tokens:', tokens);
    
    // Final analysis
    console.log('\n📋 FINAL ANALYSIS:');
    if (test2State.tabCardCount === 0) {
      console.log('❌ ISSUE: TabCards disappear when both flags are enabled');
      console.log('   This suggests SwipeRow is failing to render children');
    } else if (test2State.swipeRowCount === 0) {
      console.log('❌ ISSUE: SwipeRow containers not being created');
      console.log('   This suggests SwipeRow component is not activating');
    } else {
      console.log('✅ SwipeRow is working, but cards might be hidden by CSS');
    }
    
    console.log('\n🔧 RECOMMENDED NEXT STEPS:');
    console.log('1. Check SwipeRow component for rendering errors');
    console.log('2. Check compact actions for null returns');
    console.log('3. Check CSS for display:none rules');
    console.log('4. Check console for JavaScript errors');
    
  }, 1000);
}, 1000);
