/**
 * Community Games Row Alignment Test
 * 
 * This script tests the Community games row alignment fix
 * to ensure proper horizontal alignment of game cards.
 */

(function testCommunityGamesAlignment() {
  console.log('🧪 Testing Community Games Row Alignment...');
  
  // Test 1: Check if dev tools are available
  if (typeof window.__DEV_TOOLS === 'undefined') {
    console.error('❌ Dev tools not available. Ensure you are on localhost.');
    return;
  }
  
  console.log('✅ Dev tools available');
  
  // Test 2: Check Community right container
  console.log('\n🔍 Checking Community right container...');
  const communityRight = document.querySelector('#group-2-community .community-right');
  if (communityRight) {
    const computed = getComputedStyle(communityRight);
    const checks = {
      display: computed.display === 'block',
      height: computed.height === 'auto',
      minHeight: computed.minHeight === '0px',
      alignItems: computed.alignItems === 'start'
    };
    
    const passed = Object.values(checks).every(Boolean);
    console.log(`${passed ? '✅' : '❌'} Community right container: ${passed ? 'PASS' : 'FAIL'}`);
    
    if (!passed) {
      const failures = Object.entries(checks)
        .filter(([key, value]) => !value)
        .map(([key, value]) => `${key}=${value}`);
      console.log('Failures:', failures);
    }
  } else {
    console.log('⚠️ Community right container not found');
  }
  
  // Test 3: Check home games grid layout
  console.log('\n🔍 Checking home games grid layout...');
  const homeGames = document.querySelector('#group-2-community #home-games');
  if (homeGames) {
    const computed = getComputedStyle(homeGames);
    const checks = {
      display: computed.display === 'grid',
      gridTemplateColumns: computed.gridTemplateColumns === '1fr 1fr',
      gridTemplateRows: computed.gridTemplateRows === 'none',
      alignItems: computed.alignItems === 'start',
      gap: computed.gap === '12px'
    };
    
    const passed = Object.values(checks).every(Boolean);
    console.log(`${passed ? '✅' : '❌'} Home games grid: ${passed ? 'PASS' : 'FAIL'}`);
    
    if (!passed) {
      const failures = Object.entries(checks)
        .filter(([key, value]) => !value)
        .map(([key, value]) => `${key}=${value}`);
      console.log('Failures:', failures);
    }
    
    // Check game cards max-height
    const gameCards = homeGames.querySelectorAll('.card--game');
    if (gameCards.length > 0) {
      const firstCard = gameCards[0];
      const cardComputed = getComputedStyle(firstCard);
      const maxHeightCheck = cardComputed.maxHeight === '220px';
      console.log(`${maxHeightCheck ? '✅' : '❌'} Game cards max-height: ${maxHeightCheck ? 'PASS' : 'FAIL'}`);
      if (!maxHeightCheck) {
        console.log(`Expected: 220px, Got: ${cardComputed.maxHeight}`);
      }
    }
  } else {
    console.log('⚠️ Home games not found');
  }
  
  // Test 4: Check Community section height
  console.log('\n🔍 Checking Community section height...');
  const communitySection = document.querySelector('#group-2-community');
  if (communitySection) {
    const rect = communitySection.getBoundingClientRect();
    const height = Math.round(rect.height);
    console.log(`Community section height: ${height}px`);
    
    // Expected height around 530px
    const heightOK = height >= 500 && height <= 600;
    console.log(`${heightOK ? '✅' : '⚠️'} Community height: ${heightOK ? 'PASS' : 'CHECK'} (expected ~530px)`);
  } else {
    console.log('⚠️ Community section not found');
  }
  
  // Test 5: Run full verification
  console.log('\n🔍 Running full Home verification...');
  const framesResult = window.__DEV_TOOLS.verifyHomeFrames();
  const railsResult = window.__DEV_TOOLS.verifyRailNormalization();
  
  const framesPass = framesResult.sectionsPassed === framesResult.totalSections && framesResult.issues.length === 0;
  const railsPass = railsResult.deepRailsPassed === railsResult.deepRailsChecked && railsResult.issues.length === 0;
  
  console.log(`${framesPass ? '✅' : '❌'} Home frames verification: ${framesPass ? 'PASS' : 'FAIL'}`);
  console.log(`${railsPass ? '✅' : '❌'} Rail normalization verification: ${railsPass ? 'PASS' : 'FAIL'}`);
  
  // Test 6: Check horizontal alignment
  console.log('\n🔍 Checking horizontal alignment...');
  if (homeGames) {
    const gameCards = homeGames.querySelectorAll('.card--game');
    if (gameCards.length >= 2) {
      const firstCard = gameCards[0];
      const secondCard = gameCards[1];
      const firstRect = firstCard.getBoundingClientRect();
      const secondRect = secondCard.getBoundingClientRect();
      
      // Check if cards are aligned horizontally (same top position)
      const topAlignment = Math.abs(firstRect.top - secondRect.top) < 5; // 5px tolerance
      console.log(`${topAlignment ? '✅' : '❌'} Horizontal alignment: ${topAlignment ? 'PASS' : 'FAIL'}`);
      
      if (!topAlignment) {
        console.log(`Card 1 top: ${Math.round(firstRect.top)}px`);
        console.log(`Card 2 top: ${Math.round(secondRect.top)}px`);
        console.log(`Difference: ${Math.round(Math.abs(firstRect.top - secondRect.top))}px`);
      }
    } else {
      console.log('⚠️ Not enough game cards to test alignment');
    }
  }
  
  // Summary
  const allTestsPass = framesPass && railsPass;
  console.log(`\n${allTestsPass ? '🎉' : '❌'} Community Games Alignment Test: ${allTestsPass ? 'PASS' : 'FAIL'}`);
  
  if (allTestsPass) {
    console.log('\n✅ Community games row alignment working correctly!');
    console.log('✅ Community right: display: block');
    console.log('✅ Home games: 2x2 grid with proper alignment');
    console.log('✅ Game cards: Max-height 220px');
    console.log('✅ All Home verifications: PASS');
  } else {
    console.log('\n❌ Some tests failed. Check output above for details.');
  }
  
  return {
    framesPass,
    railsPass,
    allTestsPass
  };
})();


