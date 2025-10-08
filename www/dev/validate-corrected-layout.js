/**
 * Community V2 Corrected Layout Validation Script
 * Tests the corrected layout: 1:1 columns, no sticky behavior
 */

(function validateCorrectedLayout() {
  'use strict';
  
  console.log('🔧 Community V2 Corrected Layout Validation Starting...');
  
  // Check if the community section exists
  const communitySection = document.querySelector('#group-2-community');
  if (!communitySection) {
    console.error('❌ Community section not found');
    return;
  }
  
  // Check if the v2 class is applied
  if (!communitySection.classList.contains('community-v2')) {
    console.error('❌ community-v2 class not found on #group-2-community');
    return;
  }
  
  console.log('✅ Community section found with v2 class');
  
  // Get the key elements
  const content = communitySection.querySelector('.community-content');
  const left = communitySection.querySelector('.community-left');
  const right = communitySection.querySelector('.community-right');
  const games = communitySection.querySelector('#home-games');
  
  if (!content || !left || !right || !games) {
    console.error('❌ Required elements not found:', { content: !!content, left: !!left, right: !!right, games: !!games });
    return;
  }
  
  // Get computed styles
  const contentStyles = getComputedStyle(content);
  const leftStyles = getComputedStyle(left);
  const rightStyles = getComputedStyle(right);
  const gamesStyles = getComputedStyle(games);
  
  // Check viewport width
  const viewportWidth = window.innerWidth;
  const isDesktop = viewportWidth > 960;
  
  console.log(`📱 Viewport: ${viewportWidth}px (${isDesktop ? 'Desktop' : 'Mobile'})`);
  
  // Validation results
  const results = [];
  
  // Content validation
  results.push({
    element: 'community-content',
    property: 'display',
    expected: 'grid',
    actual: contentStyles.display,
    pass: contentStyles.display === 'grid'
  });
  
  results.push({
    element: 'community-content',
    property: 'grid-template-columns',
    expected: isDesktop ? '1fr 1fr' : '1fr',
    actual: contentStyles.gridTemplateColumns,
    pass: isDesktop ? 
      contentStyles.gridTemplateColumns === '1fr 1fr' :
      contentStyles.gridTemplateColumns === '1fr'
  });
  
  // Left validation - NO STICKY BEHAVIOR
  results.push({
    element: 'community-left',
    property: 'position',
    expected: 'static',
    actual: leftStyles.position,
    pass: leftStyles.position === 'static'
  });
  
  results.push({
    element: 'community-left',
    property: 'top',
    expected: 'auto',
    actual: leftStyles.top,
    pass: leftStyles.top === 'auto'
  });
  
  // Right validation
  results.push({
    element: 'community-right',
    property: 'display',
    expected: 'block',
    actual: rightStyles.display,
    pass: rightStyles.display === 'block'
  });
  
  // Games validation
  results.push({
    element: 'home-games',
    property: 'display',
    expected: 'grid',
    actual: gamesStyles.display,
    pass: gamesStyles.display === 'grid'
  });
  
  results.push({
    element: 'home-games',
    property: 'grid-template-columns',
    expected: isDesktop ? '1fr' : '1fr 1fr',
    actual: gamesStyles.gridTemplateColumns,
    pass: isDesktop ? 
      gamesStyles.gridTemplateColumns === '1fr' :
      gamesStyles.gridTemplateColumns === '1fr 1fr'
  });
  
  // Check for !important usage (should be minimal now)
  const hasImportant = results.some(r => 
    r.actual && r.actual.includes('!important')
  );
  
  if (hasImportant) {
    console.warn('⚠️ Found !important in computed styles');
  } else {
    console.log('✅ No !important found in computed styles');
  }
  
  // Display results
  console.table(results);
  
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  
  console.log(`\n📊 Validation Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('✅ Corrected Layout SUCCESSFUL! Community V2 layout is working correctly.');
    console.log('✅ Desktop: Equal columns (1fr 1fr), no sticky behavior');
    console.log('✅ Mobile: Single column (1fr), no sticky behavior');
  } else {
    console.log('❌ Some tests failed. Check the table above for details.');
  }
  
  // Layout Summary
  console.log('\n🎯 Layout Summary:');
  console.log(`- Viewport: ${viewportWidth}px (${isDesktop ? 'Desktop' : 'Mobile'})`);
  console.log(`- Columns: ${contentStyles.gridTemplateColumns}`);
  console.log(`- Left position: ${leftStyles.position}`);
  console.log(`- Games layout: ${gamesStyles.gridTemplateColumns}`);
  
  return {
    passed: passed === total,
    results: results,
    viewportWidth: viewportWidth,
    isDesktop: isDesktop,
    hasImportant: hasImportant
  };
})();
