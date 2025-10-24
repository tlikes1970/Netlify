/**
 * Process: Mobile Card Grid Test
 * Purpose: Verify two-column grid layout and swipe functionality
 * Data Source: DOM elements and computed styles
 * Update Path: Run this in browser console on mobile view ≤640px
 * Dependencies: Mobile card components loaded
 */

(() => {
  console.log('🧪 Testing Mobile Card Grid Layout...');
  
  // Test 1: Grid present
  const card = document.querySelector('.card-mobile');
  const styles = card && getComputedStyle(card);
  
  const gridTest = {
    display: styles?.display,
    columns: styles?.gridTemplateColumns,
    poster: !!card?.querySelector('.poster'),
    content: !!card?.querySelector('.content'),
    swipeTarget: !!card?.querySelector('.swipe-target')
  };
  
  console.table(gridTest);
  
  // Expected: display "grid", columns "112px 1fr", all elements: true
  
  // Test 2: Height stable and swipe exists
  const overlay = card?.querySelector('.swipe-row');
  const gesturePlane = overlay?.querySelector('.gesture-plane');
  
  const layoutTest = {
    cardHeight: card?.clientHeight,
    overlay: !!overlay,
    overlayPosition: overlay && getComputedStyle(overlay).position,
    gesturePlane: !!gesturePlane,
    gesturePointerEvents: gesturePlane && getComputedStyle(gesturePlane).pointerEvents
  };
  
  console.table(layoutTest);
  
  // Expected: height ≈ 240-250px; overlay:true; position:"absolute"; gesturePlane:true; pointerEvents:"auto"
  
  // Test 3: Content structure
  const title = card?.querySelector('.card-title');
  const meta = card?.querySelector('.card-meta');
  const summary = card?.querySelector('.card-summary');
  const chips = card?.querySelector('.chips');
  const actions = card?.querySelector('.actions');
  
  const contentTest = {
    titleText: title?.textContent?.trim() || '(none)',
    metaText: meta?.textContent?.trim() || '(none)',
    summaryText: summary?.textContent?.trim() || '(none)',
    hasChips: !!chips?.children.length,
    hasActions: !!actions?.children.length,
    providers: card?.querySelectorAll('.provider-chip').length || 0
  };
  
  console.table(contentTest);
  
  // Test 4: Swipe functionality
  if (gesturePlane) {
    console.log('✅ Swipe gesture plane found');
    
    // Test touch action
    const touchAction = getComputedStyle(gesturePlane).touchAction;
    console.log(`👆 Touch action: ${touchAction}`);
    
    // Test cursor
    const cursor = getComputedStyle(gesturePlane).cursor;
    console.log(`🖱️ Cursor: ${cursor}`);
  }
  
  // Test 5: Text clamping
  if (title) {
    const titleOverflow = getComputedStyle(title).textOverflow;
    const titleWhiteSpace = getComputedStyle(title).whiteSpace;
    console.log(`📝 Title overflow: ${titleOverflow}, white-space: ${titleWhiteSpace}`);
  }
  
  if (summary) {
    const webkitLineClamp = getComputedStyle(summary).webkitLineClamp;
    const summaryDisplay = getComputedStyle(summary).display;
    console.log(`📄 Summary clamp: ${webkitLineClamp}, display: ${summaryDisplay}`);
  }
  
  console.log('🎉 Mobile card grid test complete!');
  console.log('Expected results:');
  console.log('- Display: grid');
  console.log('- Columns: 112px 1fr');
  console.log('- Height: ~240-250px');
  console.log('- Swipe: working with pointer events');
  console.log('- Text: clamped properly');
})();
