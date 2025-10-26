// Debug script for Actions Split Gate
// Run this in the browser console to debug why data-actions-split is not being set

console.log('🔍 DEBUGGING ACTIONS SPLIT GATE');
console.log('================================');

// Step 1: Check the flag function
console.log('\n📊 FLAG FUNCTION TEST:');
console.log('flag function exists:', typeof flag === 'function');
console.log('flag("mobile_actions_split_v1"):', flag('mobile_actions_split_v1'));
console.log('localStorage flag:mobile_actions_split_v1:', localStorage.getItem('flag:mobile_actions_split_v1'));

// Step 2: Check gate conditions manually
console.log('\n🚪 GATE CONDITIONS:');
const html = document.documentElement;
const conditions = {
  compactGate: html.getAttribute('data-compact-mobile-v1') === 'true',
  flagEnabled: flag('mobile_actions_split_v1'),
  mobileViewport: matchMedia('(max-width: 768px)').matches,
  allConditionsMet: html.getAttribute('data-compact-mobile-v1') === 'true' && 
                    flag('mobile_actions_split_v1') && 
                    matchMedia('(max-width: 768px)').matches
};
console.log('Conditions:', conditions);

// Step 3: Test the gate logic manually
console.log('\n🧪 MANUAL GATE TEST:');
console.log('Before - data-actions-split:', html.getAttribute('data-actions-split'));

// Enable the flag
localStorage.setItem('flag:mobile_actions_split_v1', 'true');
console.log('Set flag:mobile_actions_split_v1 to true');

// Test the gate logic manually
const compactGate = html.getAttribute('data-compact-mobile-v1') === 'true';
const flagEnabled = flag('mobile_actions_split_v1');
const mobileViewport = matchMedia('(max-width: 768px)').matches;

console.log('Manual gate check:', {
  compactGate,
  flagEnabled,
  mobileViewport,
  shouldSet: compactGate && flagEnabled && mobileViewport
});

if (compactGate && flagEnabled && mobileViewport) {
  html.setAttribute('data-actions-split', 'true');
  console.log('✅ Manually set data-actions-split="true"');
} else {
  console.log('❌ Conditions not met for setting data-actions-split');
}

console.log('After - data-actions-split:', html.getAttribute('data-actions-split'));

// Step 4: Trigger the gate manually
console.log('\n🔄 TRIGGERING GATE MANUALLY:');
window.dispatchEvent(new Event('storage'));
console.log('Dispatched storage event');

setTimeout(() => {
  console.log('After storage event - data-actions-split:', html.getAttribute('data-actions-split'));
  
  // Step 5: Check SwipeRow conditions
  console.log('\n📱 SWIPE ROW CONDITIONS:');
  const swipeRowConditions = {
    gate: html.getAttribute('data-compact-mobile-v1') === 'true',
    flagEnabled: html.getAttribute('data-actions-split') === 'true',
    isMobile: window.matchMedia('(max-width: 768px)').matches,
    shouldShowSwipeRow: html.getAttribute('data-compact-mobile-v1') === 'true' && 
                       html.getAttribute('data-actions-split') === 'true' && 
                       window.matchMedia('(max-width: 768px)').matches
  };
  console.log('SwipeRow conditions:', swipeRowConditions);
  
  // Step 6: Check TabCard count
  const tabCardCount = document.querySelectorAll('.tab-card').length;
  const swipeRowCount = document.querySelectorAll('.swipe-row-container').length;
  console.log('TabCard count:', tabCardCount);
  console.log('SwipeRow count:', swipeRowCount);
  
  if (swipeRowConditions.shouldShowSwipeRow && swipeRowCount === 0) {
    console.log('❌ ISSUE: SwipeRow should be active but containers not created');
    console.log('   This suggests SwipeRow component has a bug');
  } else if (swipeRowConditions.shouldShowSwipeRow && swipeRowCount > 0) {
    console.log('✅ SwipeRow is working correctly');
  } else {
    console.log('ℹ️ SwipeRow not expected to be active');
  }
}, 100);

