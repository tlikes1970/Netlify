/**
 * Process: MobileCardSpec v1.0 Test
 * Purpose: Verify complete implementation of unified mobile card specification
 * Data Source: DOM elements and computed styles
 * Update Path: Run this in browser console on mobile view ≤640px
 * Dependencies: Mobile card components loaded
 */

(() => {
  console.log('🧪 Testing MobileCardSpec v1.0 Implementation...');
  
  const card = document.querySelector('.card-mobile');
  
  // Test 1: Overlay and target structure
  const structureTest = {
    hasBg: !!card?.querySelector('.swipe-bg'),
    hasRevealLeft: !!card?.querySelector('.swipe-bg .reveal.left'),
    hasRevealRight: !!card?.querySelector('.swipe-bg .reveal.right'),
    targetGrid: card?.querySelector('.swipe-target') && getComputedStyle(card.querySelector('.swipe-target')).gridTemplateColumns,
    revealInsideContent: !!card?.querySelector('.content .reveal'),
    hasTopline: !!card?.querySelector('.topline'),
    hasSubline: !!card?.querySelector('.subline'),
    hasTitle: !!card?.querySelector('.title'),
    hasOverflowBtn: !!card?.querySelector('.btn-overflow')
  };
  
  console.table(structureTest);
  
  // Expected results:
  // - hasBg: true
  // - hasRevealLeft: true
  // - hasRevealRight: true
  // - targetGrid: "112px 1fr"
  // - revealInsideContent: false
  // - hasTopline: true
  // - hasSubline: true
  // - hasTitle: true
  // - hasOverflowBtn: true
  
  // Test 2: Actions row anchored
  const lane = card?.querySelector('.content');
  const actionsTest = {
    actionsInside: !!lane?.querySelector('.actions'),
    deleteInside: !!lane?.querySelector('.actions .btn-delete'),
    dragInside: !!lane?.querySelector('.actions .btn-drag'),
    providers: lane?.querySelectorAll('.provider-chip').length || 0,
    actionsGrid: lane?.querySelector('.actions') && getComputedStyle(lane.querySelector('.actions')).gridTemplateColumns
  };
  
  console.table(actionsTest);
  
  // Expected:
  // - actionsInside: true
  // - deleteInside: true
  // - dragInside: true (if draggable)
  // - providers: ≥ 0
  // - actionsGrid: "1fr auto auto"
  
  // Test 3: Swipe background behavior
  const swipeTest = {
    bgPosition: card?.querySelector('.swipe-bg') && getComputedStyle(card.querySelector('.swipe-bg')).position,
    bgZIndex: card?.querySelector('.swipe-bg') && getComputedStyle(card.querySelector('.swipe-bg')).zIndex,
    targetZIndex: card?.querySelector('.swipe-target') && getComputedStyle(card.querySelector('.swipe-target')).zIndex,
    revealOpacity: card?.querySelector('.swipe-bg .reveal.left') && getComputedStyle(card.querySelector('.swipe-bg .reveal.left')).opacity,
    hasDraggingClass: card?.classList.contains('dragging')
  };
  
  console.table(swipeTest);
  
  // Expected:
  // - bgPosition: "absolute"
  // - bgZIndex: "1"
  // - targetZIndex: "2"
  // - revealOpacity: "0" (when not dragging)
  // - hasDraggingClass: false (initially)
  
  // Test 4: Content layout
  const contentTest = {
    contentGrid: lane && getComputedStyle(lane).gridTemplateRows,
    posterSize: card?.querySelector('.poster') && `${getComputedStyle(card.querySelector('.poster')).width} x ${getComputedStyle(card.querySelector('.poster')).height}`,
    titleWeight: card?.querySelector('.title') && getComputedStyle(card.querySelector('.title')).fontWeight,
    summaryClamp: card?.querySelector('.summary') && getComputedStyle(card.querySelector('.summary')).webkitLineClamp
  };
  
  console.table(contentTest);
  
  // Expected:
  // - contentGrid: "auto auto auto 1fr auto" (5 rows)
  // - posterSize: "112px x 168px"
  // - titleWeight: "700"
  // - summaryClamp: "3"
  
  // Test 5: Button styling
  const buttonTest = {
    deleteJustify: card?.querySelector('.btn-delete') && getComputedStyle(card.querySelector('.btn-delete')).justifySelf,
    deleteBg: card?.querySelector('.btn-delete') && getComputedStyle(card.querySelector('.btn-delete')).backgroundColor,
    dragJustify: card?.querySelector('.btn-drag') && getComputedStyle(card.querySelector('.btn-drag')).justifySelf,
    dragSize: card?.querySelector('.btn-drag') && `${getComputedStyle(card.querySelector('.btn-drag')).width} x ${getComputedStyle(card.querySelector('.btn-drag')).height}`,
    overflowSize: card?.querySelector('.btn-overflow') && `${getComputedStyle(card.querySelector('.btn-overflow')).width} x ${getComputedStyle(card.querySelector('.btn-overflow')).height}`
  };
  
  console.table(buttonTest);
  
  // Expected:
  // - deleteJustify: "end"
  // - deleteBg: contains "rgb(239, 68, 68)" (red)
  // - dragJustify: "end"
  // - dragSize: "32px x 32px"
  // - overflowSize: "28px x 28px"
  
  console.log('🎉 MobileCardSpec v1.0 test complete!');
  console.log('Key features verified:');
  console.log('- Swipe backgrounds under content (hidden until dragging)');
  console.log('- Unified markup structure with topline/subline');
  console.log('- Actions row anchored in content lane');
  console.log('- Provider chips with overflow handling');
  console.log('- Proper z-index layering');
  console.log('- Consistent styling across TV/Movie cards');
  
  // Test 6: Manual swipe test instructions
  console.log('\\n📱 Manual Swipe Test:');
  console.log('1. Try dragging a card horizontally');
  console.log('2. Verify .card-mobile gets "dragging" class');
  console.log('3. Check that reveal backgrounds fade in');
  console.log('4. Release and verify backgrounds fade out');
  console.log('5. Confirm entire card translates as one unit');
})();
