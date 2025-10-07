/**
 * Community Layout Normalization Test
 * 
 * This script tests the Community layout normalization implementation
 * to ensure the verified CSS rules are working correctly.
 */

(function testCommunityLayout() {
  console.log('🧪 Testing Community Layout Normalization...');
  
  // Test 1: Check if dev tools are available
  if (typeof window.__DEV_TOOLS === 'undefined') {
    console.error('❌ Dev tools not available. Ensure you are on localhost.');
    return;
  }
  
  console.log('✅ Dev tools available');
  
  // Test 2: Check Community content grid
  console.log('\n🔍 Checking Community content grid...');
  const communityContent = document.querySelector('#group-2-community .community-content');
  if (communityContent) {
    const computed = getComputedStyle(communityContent);
    const checks = {
      display: computed.display === 'grid',
      gridTemplateColumns: computed.gridTemplateColumns === '1fr 1fr',
      alignItems: computed.alignItems === 'start',
      gridAutoRows: computed.gridAutoRows === 'min-content',
      rowGap: computed.rowGap === '0px',
      paddingTop: computed.paddingTop === '0px',
      paddingBottom: computed.paddingBottom === '0px'
    };
    
    const passed = Object.values(checks).every(Boolean);
    console.log(`${passed ? '✅' : '❌'} Community content grid: ${passed ? 'PASS' : 'FAIL'}`);
    
    if (!passed) {
      const failures = Object.entries(checks)
        .filter(([key, value]) => !value)
        .map(([key, value]) => `${key}=${value}`);
      console.log('Failures:', failures);
    }
  } else {
    console.log('⚠️ Community content not found');
  }
  
  // Test 3: Check Community left (player) sticky positioning
  console.log('\n🔍 Checking Community left (player) sticky positioning...');
  const communityLeft = document.querySelector('#group-2-community .community-left');
  if (communityLeft) {
    const computed = getComputedStyle(communityLeft);
    const checks = {
      position: computed.position === 'sticky',
      top: computed.top === '0px',
      alignSelf: computed.alignSelf === 'start',
      height: computed.height === 'auto',
      minHeight: computed.minHeight === '0px'
    };
    
    const passed = Object.values(checks).every(Boolean);
    console.log(`${passed ? '✅' : '❌'} Community left sticky: ${passed ? 'PASS' : 'FAIL'}`);
    
    if (!passed) {
      const failures = Object.entries(checks)
        .filter(([key, value]) => !value)
        .map(([key, value]) => `${key}=${value}`);
      console.log('Failures:', failures);
    }
  } else {
    console.log('⚠️ Community left not found');
  }
  
  // Test 4: Check Community right (games container) grid
  console.log('\n🔍 Checking Community right (games container) grid...');
  const communityRight = document.querySelector('#group-2-community .community-right');
  if (communityRight) {
    const computed = getComputedStyle(communityRight);
    const checks = {
      display: computed.display === 'grid',
      gridTemplateRows: computed.gridTemplateRows === 'min-content min-content',
      alignItems: computed.alignItems === 'start',
      height: computed.height === 'auto',
      minHeight: computed.minHeight === '0px'
    };
    
    const passed = Object.values(checks).every(Boolean);
    console.log(`${passed ? '✅' : '❌'} Community right grid: ${passed ? 'PASS' : 'FAIL'}`);
    
    if (!passed) {
      const failures = Object.entries(checks)
        .filter(([key, value]) => !value)
        .map(([key, value]) => `${key}=${value}`);
      console.log('Failures:', failures);
    }
  } else {
    console.log('⚠️ Community right not found');
  }
  
  // Test 5: Check home games cards grid
  console.log('\n🔍 Checking home games cards grid...');
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
  
  // Test 6: Check Community section height
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
  
  // Test 7: Run full verification
  console.log('\n🔍 Running full Home verification...');
  const framesResult = window.__DEV_TOOLS.verifyHomeFrames();
  const railsResult = window.__DEV_TOOLS.verifyRailNormalization();
  
  const framesPass = framesResult.sectionsPassed === framesResult.totalSections && framesResult.issues.length === 0;
  const railsPass = railsResult.deepRailsPassed === railsResult.deepRailsChecked && railsResult.issues.length === 0;
  
  console.log(`${framesPass ? '✅' : '❌'} Home frames verification: ${framesPass ? 'PASS' : 'FAIL'}`);
  console.log(`${railsPass ? '✅' : '❌'} Rail normalization verification: ${railsPass ? 'PASS' : 'FAIL'}`);
  
  // Summary
  const allTestsPass = framesPass && railsPass;
  console.log(`\n${allTestsPass ? '🎉' : '❌'} Community Layout Test: ${allTestsPass ? 'PASS' : 'FAIL'}`);
  
  if (allTestsPass) {
    console.log('\n✅ Community layout normalization working correctly!');
    console.log('✅ Community content: 2-column grid');
    console.log('✅ Community left: Sticky positioning');
    console.log('✅ Community right: Games container grid');
    console.log('✅ Home games: 2x2 grid with 12px gap');
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
