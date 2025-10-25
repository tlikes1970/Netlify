/**
 * Process: Mobile Cards Acceptance Tests
 * Purpose: Verify unified mobile card implementation works correctly
 * Data Source: Browser DOM inspection at mobile viewport
 * Update Path: Run these tests after mobile card changes
 * Dependencies: Dev server running on localhost:8888
 */

// Test 1: Only mobile cards render; no desktop leaks
(() => {
  console.log('=== TEST 1: Mobile Card Rendering ===');
  const lists = [...document.querySelectorAll('[data-tab]')];
  const results = lists.map(l => ({
    tab: l.getAttribute('data-tab') || '(unknown)',
    mobileCards: l.querySelectorAll('.card-mobile').length,
    rogueCards: l.querySelectorAll('.card-v2,[class*="DesktopCard"]').length
  }));
  
  console.table(results);
  
  const hasRogueCards = results.some(r => r.rogueCards > 0);
  if (hasRogueCards) {
    console.error('❌ FAIL: Desktop cards found in mobile view');
  } else {
    console.log('✅ PASS: Only mobile cards found');
  }
})();

// Test 2: Swipe target grid + underlay
(() => {
  console.log('\n=== TEST 2: Swipe Target Structure ===');
  const c = document.querySelector('.card-mobile');
  const t = c?.querySelector('.swipe-target');
  const bg = c?.querySelector('.swipe-bg');
  
  const result = {
    hasCard: !!c,
    hasSwipeTarget: !!t,
    hasSwipeBg: !!bg,
    targetGrid: t ? getComputedStyle(t).gridTemplateColumns : 'none',
    cardPadding: c ? getComputedStyle(c).paddingRight : 'none'
  };
  
  console.table(result);
  
  if (result.hasCard && result.hasSwipeTarget && result.hasSwipeBg) {
    console.log('✅ PASS: Swipe structure complete');
  } else {
    console.error('❌ FAIL: Missing swipe structure elements');
  }
})();

// Test 3: Actions anchored, overflow present, providers sane
(() => {
  console.log('\n=== TEST 3: Card Actions & Content ===');
  const lane = document.querySelector('.card-mobile .content');
  const result = {
    hasContent: !!lane,
    actionsInside: !!lane?.querySelector('.actions'),
    deleteInside: !!lane?.querySelector('.actions .btn-delete'),
    overflowTopline: !!document.querySelector('.card-mobile .topline .btn-overflow'),
    providers: lane?.querySelectorAll('.provider-chip').length || 0,
    ratingRow: !!lane?.querySelector('.rating-row'),
    stars: lane?.querySelectorAll('.star').length || 0
  };
  
  console.table(result);
  
  if (result.hasContent && result.actionsInside && result.overflowTopline && result.ratingRow) {
    console.log('✅ PASS: Card content structure complete');
  } else {
    console.error('❌ FAIL: Missing card content elements');
  }
})();

// Test 4: Rail presence and padding
(() => {
  console.log('\n=== TEST 4: Drag Rail & Layout ===');
  const c = document.querySelector('.card-mobile');
  const result = {
    hasCard: !!c,
    hasRail: !!c?.querySelector('.drag-rail'),
    paddingRight: c ? getComputedStyle(c).paddingRight : 'none',
    targetCols: c ? getComputedStyle(c.querySelector('.swipe-target')).gridTemplateColumns : 'none',
    railWidth: c?.querySelector('.drag-rail') ? getComputedStyle(c.querySelector('.drag-rail')).width : 'none'
  };
  
  console.table(result);
  
  if (result.hasCard && result.hasRail && result.paddingRight.includes('48px')) {
    console.log('✅ PASS: Drag rail and padding correct');
  } else {
    console.error('❌ FAIL: Drag rail or padding issues');
  }
})();

// Test 5: Swipe hints and labels
(() => {
  console.log('\n=== TEST 5: Swipe Hints ===');
  const c = document.querySelector('.card-mobile');
  const hints = c?.querySelectorAll('.swipe-bg .hint');
  
  const result = {
    hasHints: !!hints?.length,
    hintCount: hints?.length || 0,
    leftHint: c?.querySelector('.swipe-bg .hint.left')?.textContent || 'none',
    rightHint: c?.querySelector('.swipe-bg .hint.right')?.textContent || 'none',
    hintsHidden: hints ? Array.from(hints).every(h => getComputedStyle(h).opacity === '0') : false
  };
  
  console.table(result);
  
  if (result.hasHints && result.hintCount === 2 && result.hintsHidden) {
    console.log('✅ PASS: Swipe hints present and hidden');
  } else {
    console.error('❌ FAIL: Swipe hints missing or visible');
  }
})();

console.log('\n=== ACCEPTANCE TESTS COMPLETE ===');
console.log('Manual tests needed:');
console.log('1. Drag from drag rail should reorder on Watching/Wishlist');
console.log('2. Content swipe should work elsewhere');
console.log('3. Dragging left shows left hint; dragging right shows right hint');
console.log('4. Star tap sets whole value; drag scrubs; arrow keys adjust');
console.log('5. onRate fires on release/click');
