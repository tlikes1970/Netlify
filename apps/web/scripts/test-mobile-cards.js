/**
 * Process: Mobile Card Runtime Test
 * Purpose: Verify mobile card functionality in browser
 * Data Source: DOM elements and computed styles
 * Update Path: Run this in browser console on mobile view
 * Dependencies: Mobile card components loaded
 */

(() => {
  console.log('🧪 Testing Mobile Card Functionality...');
  
  const card = document.querySelector('.card-mobile');
  const target = card?.querySelector('.swipe-target');
  const overlay = card?.querySelector('.swipe-row');
  const gesturePlane = overlay?.querySelector('.gesture-plane');
  
  const results = {
    card: !!card,
    target: !!target,
    overlay: !!overlay,
    gesturePlane: !!gesturePlane,
    overlayPosition: overlay && getComputedStyle(overlay).position,
    title: card?.querySelector('.card-title')?.textContent?.trim() || '(none)',
    hasActions: !!card?.querySelector('.actions'),
    providers: card?.querySelectorAll('.provider-chip').length || 0,
    hasDragHandle: !!card?.querySelector('.btn-drag'),
    hasDeleteButton: !!card?.querySelector('.btn-delete'),
    cardHeight: card && getComputedStyle(card).height,
    hasDebugColors: card && (
      getComputedStyle(card).backgroundColor.includes('rgb(240, 240, 240)') ||
      getComputedStyle(card).borderColor.includes('rgb(255, 0, 0)')
    )
  };
  
  console.table(results);
  
  // Test swipe functionality
  if (gesturePlane) {
    console.log('✅ Swipe gesture plane found');
    
    // Test pointer events
    const pointerEvents = getComputedStyle(gesturePlane).pointerEvents;
    console.log(`📱 Pointer events: ${pointerEvents}`);
    
    // Test touch action
    const touchAction = getComputedStyle(gesturePlane).touchAction;
    console.log(`👆 Touch action: ${touchAction}`);
  }
  
  // Test actions row
  const actions = card?.querySelector('.actions');
  if (actions) {
    const gridTemplate = getComputedStyle(actions).gridTemplateColumns;
    console.log(`🎯 Actions grid: ${gridTemplate}`);
  }
  
  // Test text clamping
  const title = card?.querySelector('.card-title');
  const summary = card?.querySelector('.card-summary');
  
  if (title) {
    const titleOverflow = getComputedStyle(title).textOverflow;
    console.log(`📝 Title overflow: ${titleOverflow}`);
  }
  
  if (summary) {
    const webkitLineClamp = getComputedStyle(summary).webkitLineClamp;
    console.log(`📄 Summary clamp: ${webkitLineClamp}`);
  }
  
  console.log('🎉 Mobile card test complete!');
})();
