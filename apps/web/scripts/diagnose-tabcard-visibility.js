// Comprehensive TabCard Visibility Diagnostic
// Run this in the browser console

console.log('🔍 TabCard Visibility Diagnostic');
console.log('================================');

// Check localStorage flags
const flags = {
  mobile_compact_v1: localStorage.getItem('flag:mobile_compact_v1'),
  actions_split: localStorage.getItem('flag:actions_split')
};
console.log('📋 LocalStorage Flags:');
console.log('- mobile_compact_v1:', flags.mobile_compact_v1);
console.log('- actions_split:', flags.actions_split);
console.log('');

// Check HTML attributes
const html = document.documentElement;
const attrs = {
  density: html.dataset.density,
  compactMobileV1: html.dataset.compactMobileV1,
  actionsSplit: html.dataset.actionsSplit
};
console.log('🏷️ HTML Attributes:');
console.log('- data-density:', attrs.density);
console.log('- data-compact-mobile-v1:', attrs.compactMobileV1);
console.log('- data-actions-split:', attrs.actionsSplit);
console.log('');

// Check viewport
const viewport = {
  width: window.innerWidth,
  height: window.innerHeight,
  isMobile: window.matchMedia('(max-width: 768px)').matches
};
console.log('📱 Viewport:');
console.log('- Width:', viewport.width);
console.log('- Height:', viewport.height);
console.log('- Is Mobile (≤768px):', viewport.isMobile);
console.log('');

// Check gate conditions
const gateConditions = {
  flagEnabled: flags.mobile_compact_v1 === 'true',
  densityOk: attrs.density === 'compact',
  mobileOk: viewport.isMobile,
  allConditionsMet: flags.mobile_compact_v1 === 'true' && attrs.density === 'compact' && viewport.isMobile
};
console.log('🚪 Gate Conditions:');
console.log('- Flag enabled:', gateConditions.flagEnabled);
console.log('- Density compact:', gateConditions.densityOk);
console.log('- Mobile viewport:', gateConditions.mobileOk);
console.log('- All conditions met:', gateConditions.allConditionsMet);
console.log('');

// Check SwipeRow conditions
const swipeRowConditions = {
  gate: attrs.compactMobileV1 === 'true',
  flagEnabled: attrs.actionsSplit === 'true',
  isMobile: viewport.isMobile,
  shouldShowSwipeRow: attrs.compactMobileV1 === 'true' && attrs.actionsSplit === 'true' && viewport.isMobile
};
console.log('📱 SwipeRow Conditions:');
console.log('- Gate active:', swipeRowConditions.gate);
console.log('- Actions split flag:', swipeRowConditions.flagEnabled);
console.log('- Is mobile:', swipeRowConditions.isMobile);
console.log('- Should show SwipeRow:', swipeRowConditions.shouldShowSwipeRow);
console.log('');

// Check for TabCard elements in DOM
const tabCards = document.querySelectorAll('.tab-card');
console.log('🎴 TabCard Elements in DOM:');
console.log('- Count:', tabCards.length);
if (tabCards.length > 0) {
  const firstCard = tabCards[0];
  console.log('- First card classes:', firstCard.className);
  console.log('- First card computed display:', getComputedStyle(firstCard).display);
  console.log('- First card computed visibility:', getComputedStyle(firstCard).visibility);
  console.log('- First card computed opacity:', getComputedStyle(firstCard).opacity);
  
  // Check for action buttons
  const mobileActions = firstCard.querySelector('.mobile-actions');
  const desktopActions = firstCard.querySelector('.desktop-actions');
  const compactActions = firstCard.querySelector('.compact-actions-container');
  
  console.log('- Mobile actions found:', !!mobileActions);
  console.log('- Desktop actions found:', !!desktopActions);
  console.log('- Compact actions found:', !!compactActions);
  
  if (mobileActions) {
    console.log('- Mobile actions display:', getComputedStyle(mobileActions).display);
  }
  if (desktopActions) {
    console.log('- Desktop actions display:', getComputedStyle(desktopActions).display);
  }
  if (compactActions) {
    console.log('- Compact actions display:', getComputedStyle(compactActions).display);
  }
}

// Check for SwipeRow elements
const swipeRows = document.querySelectorAll('.swipe-row-container');
console.log('📱 SwipeRow Elements in DOM:');
console.log('- Count:', swipeRows.length);
if (swipeRows.length > 0) {
  console.log('- First SwipeRow classes:', swipeRows[0].className);
  console.log('- First SwipeRow computed display:', getComputedStyle(swipeRows[0]).display);
}

console.log('');
console.log('🔧 Quick Fixes to Try:');
console.log('1. Enable actions_split flag: localStorage.setItem("flag:actions_split", "true"); location.reload();');
console.log('2. Disable compact mobile: localStorage.removeItem("flag:mobile_compact_v1"); location.reload();');
console.log('3. Set density to normal: document.documentElement.dataset.density = "normal"; location.reload();');
console.log('');

// Determine the issue
if (tabCards.length > 0) {
  if (swipeRowConditions.shouldShowSwipeRow) {
    console.log('✅ SwipeRow should be active - cards should be swipeable');
  } else if (gateConditions.allConditionsMet && !swipeRowConditions.flagEnabled) {
    console.log('❌ ISSUE FOUND: Compact mobile gate is active but actions_split flag is disabled');
    console.log('   This causes TabCards to render without visible action buttons');
    console.log('   SOLUTION: Enable actions_split flag');
  } else {
    console.log('✅ Normal TabCard rendering - should show standard action buttons');
  }
} else {
  console.log('❌ No TabCard elements found in DOM - this is a different issue');
}
