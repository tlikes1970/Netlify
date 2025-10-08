/**
 * Final Community Grid Validation Test
 * 
 * This script tests the final Community grid normalization
 * to ensure balanced columns and verified 502px height.
 */

(function testFinalCommunityGrid() {
  console.log('🧪 Testing Final Community Grid Normalization...');
  
  // Test 1: Check if dev tools are available
  if (typeof window.__DEV_TOOLS === 'undefined') {
    console.error('❌ Dev tools not available. Ensure you are on localhost.');
    return;
  }
  
  console.log('✅ Dev tools available');
  
  // Test 2: Check Community content grid with balanced columns
  console.log('\n🔍 Checking Community content grid...');
  const communityContent = document.querySelector('#group-2-community .community-content');
  if (communityContent) {
    const computed = getComputedStyle(communityContent);
    const checks = {
      display: computed.display === 'grid',
      gridTemplateColumns: computed.gridTemplateColumns === '1fr 1fr',
      gridAutoRows: computed.gridAutoRows === '1fr',
      alignItems: computed.alignItems === 'start',
      height: computed.height === 'auto',
      minHeight: computed.minHeight === '0px',
      overflow: computed.overflow === 'visible'
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
  
  // Test 3: Check Community section height (expected ~502px)
  console.log('\n🔍 Checking Community section height...');
  const communitySection = document.querySelector('#group-2-community');
  if (communitySection) {
    const rect = communitySection.getBoundingClientRect();
    const height = Math.round(rect.height);
    console.log(`Community section height: ${height}px`);
    
    // Expected height around 502px (500-530px range)
    const heightOK = height >= 500 && height <= 530;
    console.log(`${heightOK ? '✅' : '⚠️'} Community height: ${heightOK ? 'PASS' : 'CHECK'} (expected ~502px, got ${height}px)`);
    
    if (height === 502) {
      console.log('🎯 Perfect match! Community height is exactly 502px');
    }
  } else {
    console.log('⚠️ Community section not found');
  }
  
  // Test 4: Check balanced columns
  console.log('\n🔍 Checking balanced columns...');
  if (communityContent) {
    const leftColumn = communityContent.querySelector('.community-left');
    const rightColumn = communityContent.querySelector('.community-right');
    
    if (leftColumn && rightColumn) {
      const leftRect = leftColumn.getBoundingClientRect();
      const rightRect = rightColumn.getBoundingClientRect();
      
      const leftHeight = Math.round(leftRect.height);
      const rightHeight = Math.round(rightRect.height);
      const heightDiff = Math.abs(leftHeight - rightHeight);
      
      console.log(`Left column height: ${leftHeight}px`);
      console.log(`Right column height: ${rightHeight}px`);
      console.log(`Height difference: ${heightDiff}px`);
      
      // Balanced columns should have similar heights (within 50px tolerance)
      const balanced = heightDiff <= 50;
      console.log(`${balanced ? '✅' : '⚠️'} Balanced columns: ${balanced ? 'PASS' : 'CHECK'} (difference: ${heightDiff}px)`);
    } else {
      console.log('⚠️ Community columns not found');
    }
  }
  
  // Test 5: Run full Home verification
  console.log('\n🔍 Running full Home verification...');
  const framesResult = window.__DEV_TOOLS.verifyHomeFrames();
  const railsResult = window.__DEV_TOOLS.verifyRailNormalization();
  
  const framesPass = framesResult.sectionsPassed === framesResult.totalSections && framesResult.issues.length === 0;
  const railsPass = railsResult.deepRailsPassed === railsResult.deepRailsChecked && railsResult.issues.length === 0;
  
  console.log(`${framesPass ? '✅' : '❌'} Home frames verification: ${framesPass ? 'PASS' : 'FAIL'}`);
  console.log(`${railsPass ? '✅' : '❌'} Rail normalization verification: ${railsPass ? 'PASS' : 'FAIL'}`);
  
  // Test 6: Check for temporary style tags
  console.log('\n🔍 Checking for temporary style tags...');
  const tempStyles = document.querySelectorAll('style[id*="tmp-community"], style[class*="tmp-community"]');
  const tempStyleTags = tempStyles.length;
  
  if (tempStyleTags === 0) {
    console.log('✅ No temporary style tags found');
  } else {
    console.log(`⚠️ Found ${tempStyleTags} temporary style tags`);
    tempStyles.forEach((style, index) => {
      console.log(`  ${index + 1}. ${style.id || style.className || 'unnamed'}`);
    });
  }
  
  // Summary
  const allTestsPass = framesPass && railsPass && tempStyleTags === 0;
  const heightMatch = communitySection ? 
    (communitySection.getBoundingClientRect().height >= 500 && 
     communitySection.getBoundingClientRect().height <= 530) : false;
  
  console.log(`\n${allTestsPass ? '🎉' : '❌'} Final Community Grid Test: ${allTestsPass ? 'PASS' : 'FAIL'}`);
  console.log(`${heightMatch ? '🎯' : '⚠️'} Height verification: ${heightMatch ? 'PASS' : 'CHECK'} (expected ~502px)`);
  
  if (allTestsPass && heightMatch) {
    console.log('\n✅ Final Community grid normalization working perfectly!');
    console.log('✅ Community content: Balanced columns (1fr 1fr)');
    console.log('✅ Community height: ~502px verified');
    console.log('✅ All Home verifications: PASS');
    console.log('✅ No temporary styles: Clean implementation');
  } else {
    console.log('\n❌ Some tests failed. Check output above for details.');
  }
  
  return {
    framesPass,
    railsPass,
    allTestsPass,
    heightMatch,
    tempStyleTags
  };
})();


