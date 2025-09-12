// Card v2 Test - Verification Script
// Run this in DevTools console to verify Card v2 is working

(function() {
  'use strict';
  
  console.log('🧪 Card v2 Test Starting...');
  
  // Test 1: Flag present
  const flagCheck = !!(window.FLAGS && window.FLAGS.cards_v2);
  console.log('✅ Flag check:', flagCheck ? 'PASS' : 'FAIL', '- window.FLAGS.cards_v2 =', window.FLAGS?.cards_v2);
  
  // Test 2: Card global
  const cardCheck = !!(window.Card && typeof window.Card === 'function');
  console.log('✅ Card global check:', cardCheck ? 'PASS' : 'FAIL', '- window.Card =', typeof window.Card);
  
  // Test 3: DOM has v2 cards
  const v2Cards = document.querySelectorAll('.card.card--compact');
  const legacyCards = document.querySelectorAll('.preview-card, .curated-card');
  console.log('✅ DOM check:', v2Cards.length > 0 ? 'PASS' : 'FAIL', '- Found', v2Cards.length, 'v2 cards,', legacyCards.length, 'legacy cards');
  
  // Test 4: No synopsis on Home
  const synopsisBlocks = document.querySelectorAll('.card .synopsis, .preview-card .synopsis, .curated-card .synopsis');
  console.log('✅ Synopsis check:', synopsisBlocks.length === 0 ? 'PASS' : 'FAIL', '- Found', synopsisBlocks.length, 'synopsis blocks');
  
  // Overall result
  const allPassed = flagCheck && cardCheck && v2Cards.length > 0 && synopsisBlocks.length === 0;
  console.log('🎯 Overall result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (!allPassed) {
    console.log('🔧 Debug info:');
    console.log('- window.FLAGS:', window.FLAGS);
    console.log('- window.Card:', window.Card);
    console.log('- Card v2 elements:', v2Cards);
    console.log('- Legacy elements:', legacyCards);
  }
  
  return allPassed;
})();
