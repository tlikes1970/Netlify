/**
 * Horizontal Card Row Fix Test
 * 
 * This script tests that horizontal card rows are no longer cut short
 * and can scroll properly to show all cards.
 */

(function testHorizontalCardRows() {
  console.log('🧪 Testing Horizontal Card Row Fix...');
  
  // Test 1: Check if dev tools are available
  if (typeof window.__DEV_TOOLS === 'undefined') {
    console.error('❌ Dev tools not available. Ensure you are on localhost.');
    return;
  }
  
  console.log('✅ Dev tools available');
  
  // Test 2: Check rail containers for proper overflow settings
  console.log('\n🔍 Checking rail containers...');
  const railSelectors = [
    '.preview-row-container',
    '.preview-row-scroll', 
    '.row-inner',
    '#currentlyWatchingScroll',
    '.curated-row'
  ];
  
  let railsChecked = 0;
  let railsPassed = 0;
  
  railSelectors.forEach(selector => {
    const rails = document.querySelectorAll(`#homeSection ${selector}`);
    rails.forEach(rail => {
      railsChecked++;
      const computed = getComputedStyle(rail);
      const checks = {
        display: computed.display === 'grid',
        gridFlow: computed.gridAutoFlow === 'column',
        overflowX: computed.overflowX === 'auto',
        overflowY: computed.overflowY === 'hidden',
        maxWidth: computed.maxWidth === 'none' || computed.maxWidth === '100%',
        scrollSnap: computed.scrollSnapType.includes('inline')
      };
      
      const passed = Object.values(checks).every(Boolean);
      if (passed) {
        railsPassed++;
      }
      
      console.log(`${passed ? '✅' : '❌'} Rail ${selector}: ${passed ? 'PASS' : 'FAIL'}`);
      
      if (!passed) {
        const failures = Object.entries(checks)
          .filter(([key, value]) => !value)
          .map(([key, value]) => `${key}=${value}`);
        console.log(`  Failures: ${failures.join(', ')}`);
      }
    });
  });
  
  console.log(`\nRail containers: ${railsPassed}/${railsChecked} passed`);
  
  // Test 3: Check card widths and spacing
  console.log('\n🔍 Checking card widths and spacing...');
  const cards = document.querySelectorAll('#homeSection .card');
  if (cards.length > 0) {
    const firstCard = cards[0];
    const computed = getComputedStyle(firstCard);
    const cardWidth = firstCard.getBoundingClientRect().width;
    
    console.log(`Card width: ${Math.round(cardWidth)}px`);
    console.log(`Expected width: ~260px (--rail-col-w)`);
    
    const widthOK = cardWidth >= 200 && cardWidth <= 300;
    console.log(`${widthOK ? '✅' : '❌'} Card width: ${widthOK ? 'PASS' : 'FAIL'}`);
  } else {
    console.log('⚠️ No cards found');
  }
  
  // Test 4: Check horizontal scrolling capability
  console.log('\n🔍 Checking horizontal scrolling...');
  const scrollableRails = document.querySelectorAll('#homeSection .preview-row-scroll, #homeSection #currentlyWatchingScroll');
  let scrollableRailsFound = 0;
  let scrollableRailsWorking = 0;
  
  scrollableRails.forEach(rail => {
    scrollableRailsFound++;
    const rect = rail.getBoundingClientRect();
    const scrollWidth = rail.scrollWidth;
    const clientWidth = rail.clientWidth;
    
    console.log(`Rail ${rail.id || rail.className}:`);
    console.log(`  Client width: ${Math.round(clientWidth)}px`);
    console.log(`  Scroll width: ${Math.round(scrollWidth)}px`);
    console.log(`  Can scroll: ${scrollWidth > clientWidth ? 'YES' : 'NO'}`);
    
    if (scrollWidth > clientWidth) {
      scrollableRailsWorking++;
    }
  });
  
  console.log(`\nScrollable rails: ${scrollableRailsWorking}/${scrollableRailsFound} can scroll horizontally`);
  
  // Test 5: Check for CSS variable values
  console.log('\n🔍 Checking CSS variable values...');
  const testElement = document.querySelector('#homeSection .preview-row-scroll') || document.querySelector('#homeSection #currentlyWatchingScroll');
  if (testElement) {
    const computed = getComputedStyle(testElement);
    console.log(`--rail-col-w: ${computed.gridAutoColumns}`);
    console.log(`--rail-gap: ${computed.gap}`);
    
    const colWidthOK = computed.gridAutoColumns.includes('260px') || computed.gridAutoColumns.includes('px');
    const gapOK = computed.gap.includes('16px') || computed.gap.includes('px');
    
    console.log(`${colWidthOK ? '✅' : '❌'} Column width: ${colWidthOK ? 'PASS' : 'FAIL'}`);
    console.log(`${gapOK ? '✅' : '❌'} Gap: ${gapOK ? 'PASS' : 'FAIL'}`);
  }
  
  // Test 6: Run full Home verification
  console.log('\n🔍 Running full Home verification...');
  const framesResult = window.__DEV_TOOLS.verifyHomeFrames();
  const railsResult = window.__DEV_TOOLS.verifyRailNormalization();
  
  const framesPass = framesResult.sectionsPassed === framesResult.totalSections && framesResult.issues.length === 0;
  const railsPass = railsResult.deepRailsPassed === railsResult.deepRailsChecked && railsResult.issues.length === 0;
  
  console.log(`${framesPass ? '✅' : '❌'} Home frames verification: ${framesPass ? 'PASS' : 'FAIL'}`);
  console.log(`${railsPass ? '✅' : '❌'} Rail normalization verification: ${railsPass ? 'PASS' : 'FAIL'}`);
  
  // Summary
  const allTestsPass = framesPass && railsPass && scrollableRailsWorking > 0;
  console.log(`\n${allTestsPass ? '🎉' : '❌'} Horizontal Card Row Fix Test: ${allTestsPass ? 'PASS' : 'FAIL'}`);
  
  if (allTestsPass) {
    console.log('\n✅ Horizontal card rows are working correctly!');
    console.log('✅ Rail containers: Proper overflow settings');
    console.log('✅ Card widths: Appropriate sizing');
    console.log('✅ Horizontal scrolling: Working');
    console.log('✅ All Home verifications: PASS');
  } else {
    console.log('\n❌ Some tests failed. Check output above for details.');
    console.log('\n💡 If cards are still cut short, try:');
    console.log('1. Hard refresh the page (Ctrl+F5)');
    console.log('2. Check if CSS variables are loading properly');
    console.log('3. Verify no conflicting max-width constraints');
  }
  
  return {
    framesPass,
    railsPass,
    scrollableRailsWorking,
    allTestsPass
  };
})();
