// Check Compact Mobile Gate Status
// Run this in the browser console

console.log('🔍 Checking Compact Mobile Gate Status...');
console.log('');

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
  compactMobileV1: html.getAttribute('data-compact-mobile-v1'),
  actionsSplit: html.getAttribute('data-actions-split')
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

// Check if TabCards should be visible
const shouldShowCards = !gateConditions.allConditionsMet || attrs.actionsSplit === 'true';
console.log('🎯 TabCard Visibility:');
console.log('- Should show cards:', shouldShowCards);
console.log('- Reason: Gate OFF or actions_split ON');
console.log('');

// Check for TabCard elements in DOM
const tabCards = document.querySelectorAll('.tab-card');
console.log('🎴 TabCard Elements in DOM:');
console.log('- Count:', tabCards.length);
if (tabCards.length > 0) {
  console.log('- First card classes:', tabCards[0].className);
  console.log('- First card computed display:', getComputedStyle(tabCards[0]).display);
  console.log('- First card computed visibility:', getComputedStyle(tabCards[0]).visibility);
  console.log('- First card computed opacity:', getComputedStyle(tabCards[0]).opacity);
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