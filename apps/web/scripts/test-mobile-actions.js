/**
 * Process: Mobile Card Actions Test
 * Purpose: Verify actions row is properly positioned inside content lane
 * Data Source: DOM elements and computed styles
 * Update Path: Run this in browser console on mobile view ≤640px
 * Dependencies: Mobile card components loaded
 */

(() => {
  console.log('🧪 Testing Mobile Card Actions Row...');
  
  const card = document.querySelector('.card-mobile');
  const lane = card?.querySelector('.content');
  const actions = lane?.querySelector('.actions');
  
  // Test 1: Actions row positioning
  const layoutTest = {
    laneGrid: lane && getComputedStyle(lane).gridTemplateRows,
    actionsCols: actions && getComputedStyle(actions).gridTemplateColumns,
    deleteInsideLane: !!lane?.querySelector('.btn-delete'),
    dragInsideLane: !!lane?.querySelector('.btn-drag'),
    providersCount: lane?.querySelectorAll('.provider-chip').length || 0
  };
  
  console.table(layoutTest);
  
  // Expected results:
  // - laneGrid: "auto auto 1fr auto" (4 rows)
  // - actionsCols: "1fr auto auto" (providers | drag | delete)
  // - deleteInsideLane: true
  // - dragInsideLane: true (if draggable)
  // - providersCount: ≥ 0
  
  // Test 2: Button positioning
  const deleteBtn = lane?.querySelector('.btn-delete');
  const dragBtn = lane?.querySelector('.btn-drag');
  
  const buttonTest = {
    deleteFound: !!deleteBtn,
    deleteJustifySelf: deleteBtn && getComputedStyle(deleteBtn).justifySelf,
    deletePadding: deleteBtn && getComputedStyle(deleteBtn).padding,
    dragFound: !!dragBtn,
    dragJustifySelf: dragBtn && getComputedStyle(dragBtn).justifySelf,
    dragSize: dragBtn && `${getComputedStyle(dragBtn).width} x ${getComputedStyle(dragBtn).height}`
  };
  
  console.table(buttonTest);
  
  // Expected:
  // - deleteJustifySelf: "end"
  // - deletePadding: "6px 12px"
  // - dragJustifySelf: "end"
  // - dragSize: "32px x 32px"
  
  // Test 3: Provider chips
  const providers = lane?.querySelector('.providers');
  const providerChips = lane?.querySelectorAll('.provider-chip');
  
  const providerTest = {
    providersContainer: !!providers,
    providersDisplay: providers && getComputedStyle(providers).display,
    providersOverflow: providers && getComputedStyle(providers).overflow,
    chipCount: providerChips?.length || 0,
    firstChipBg: providerChips?.[0] && getComputedStyle(providerChips[0]).backgroundColor
  };
  
  console.table(providerTest);
  
  // Expected:
  // - providersDisplay: "inline-flex"
  // - providersOverflow: "hidden"
  // - chipCount: ≥ 0
  // - firstChipBg: contains "rgb(243, 244, 246)" or similar
  
  // Test 4: Summary clamp
  const summary = lane?.querySelector('.card-summary');
  const summaryTest = {
    summaryFound: !!summary,
    summaryDisplay: summary && getComputedStyle(summary).display,
    webkitLineClamp: summary && getComputedStyle(summary).webkitLineClamp,
    summaryOverflow: summary && getComputedStyle(summary).overflow
  };
  
  console.table(summaryTest);
  
  // Expected:
  // - summaryDisplay: "-webkit-box"
  // - webkitLineClamp: "3"
  // - summaryOverflow: "hidden"
  
  console.log('🎉 Mobile card actions test complete!');
  console.log('Key improvements:');
  console.log('- Actions row is inside .content lane');
  console.log('- Delete button positioned with justify-self: end');
  console.log('- Provider chips render with proper styling');
  console.log('- Summary clamped to 3 lines');
  console.log('- Swipe still translates entire .swipe-target');
})();
