/**
 * Process: Mobile Card Grid Test - Swipe Target
 * Purpose: Verify 2-column grid is now on .swipe-target instead of .card-mobile
 * Data Source: DOM elements and computed styles
 * Update Path: Run this in browser console on mobile view ≤640px
 * Dependencies: Mobile card components loaded
 */

(() => {
  console.log('🧪 Testing Mobile Card Grid on Swipe Target...');
  
  // Test 1: Grid sanity check
  const target = document.querySelector('.swipe-target');
  const card = document.querySelector('.card-mobile');
  const poster = document.querySelector('.poster');
  const content = document.querySelector('.content');
  
  const targetStyles = target && getComputedStyle(target);
  const cardStyles = card && getComputedStyle(card);
  const posterStyles = poster && getComputedStyle(poster);
  const contentStyles = content && getComputedStyle(content);
  
  const gridTest = {
    targetFound: !!target,
    targetDisplay: targetStyles?.display,
    targetColumns: targetStyles?.gridTemplateColumns,
    cardDisplay: cardStyles?.display,
    posterCol: posterStyles?.gridColumn,
    contentCol: contentStyles?.gridColumn,
    posterWidth: posterStyles?.width,
    posterHeight: posterStyles?.height
  };
  
  console.table(gridTest);
  
  // Expected results:
  // - targetFound: true
  // - targetDisplay: "grid"
  // - targetColumns: "112px 1fr"
  // - cardDisplay: "block" (not grid)
  // - posterCol: "1"
  // - contentCol: "2"
  // - posterWidth: "112px"
  // - posterHeight: "168px"
  
  // Test 2: Visual layout verification
  const layoutTest = {
    cardPosition: cardStyles?.position,
    targetPosition: targetStyles?.position,
    targetWillChange: targetStyles?.willChange,
    hasSwipeRow: !!card?.querySelector('.swipe-row'),
    swipeRowPosition: card?.querySelector('.swipe-row') && getComputedStyle(card.querySelector('.swipe-row')).position
  };
  
  console.table(layoutTest);
  
  // Expected:
  // - cardPosition: "relative"
  // - targetPosition: "relative"
  // - targetWillChange: "transform"
  // - hasSwipeRow: true
  // - swipeRowPosition: "absolute"
  
  // Test 3: Content structure
  const contentTest = {
    titleText: document.querySelector('.card-title')?.textContent?.trim() || '(none)',
    metaText: document.querySelector('.card-meta')?.textContent?.trim() || '(none)',
    summaryText: document.querySelector('.card-summary')?.textContent?.trim() || '(none)',
    hasActions: !!document.querySelector('.actions'),
    providersCount: document.querySelectorAll('.provider-chip').length || 0
  };
  
  console.table(contentTest);
  
  console.log('🎉 Mobile card swipe-target grid test complete!');
  console.log('Key changes:');
  console.log('- .card-mobile is now display: block (shell only)');
  console.log('- .swipe-target is now display: grid with 2 columns');
  console.log('- Poster and content are direct children of .swipe-target');
  console.log('- Swipe still translates the entire .swipe-target element');
})();

