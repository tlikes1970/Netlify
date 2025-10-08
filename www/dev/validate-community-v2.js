/**
 * Community V2 Layout Validation Script
 * Run this in the browser console to validate the new scoped CSS implementation
 */

(function validateCommunityV2() {
  'use strict';
  
  console.log('🔍 Community V2 Layout Validation Starting...');
  
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
    expected: isDesktop ? 'minmax(0, 2fr) minmax(280px, 1fr)' : '1fr',
    actual: contentStyles.gridTemplateColumns,
    pass: isDesktop ? 
      contentStyles.gridTemplateColumns.includes('2fr') && contentStyles.gridTemplateColumns.includes('1fr') :
      contentStyles.gridTemplateColumns === '1fr'
  });
  
  // Left validation
  results.push({
    element: 'community-left',
    property: 'position',
    expected: isDesktop ? 'sticky' : 'static',
    actual: leftStyles.position,
    pass: leftStyles.position === (isDesktop ? 'sticky' : 'static')
  });
  
  if (isDesktop) {
    results.push({
      element: 'community-left',
      property: 'top',
      expected: '72px',
      actual: leftStyles.top,
      pass: leftStyles.top === '72px'
    });
  }
  
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
    expected: 'repeat(2, minmax(0, 1fr))',
    actual: gamesStyles.gridTemplateColumns,
    pass: gamesStyles.gridTemplateColumns.includes('repeat(2,') || gamesStyles.gridTemplateColumns.includes('1fr 1fr')
  });
  
  // Check for !important usage
  const hasImportant = results.some(r => 
    r.actual && r.actual.includes('!important')
  );
  
  if (hasImportant) {
    console.warn('⚠️ Found !important in computed styles - this should not happen with v2 scoping');
  }
  
  // Display results
  console.table(results);
  
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  
  console.log(`\n📊 Validation Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('✅ All tests passed! Community V2 layout is working correctly.');
  } else {
    console.log('❌ Some tests failed. Check the table above for details.');
  }
  
  // Additional checks
  console.log('\n🔍 Additional Checks:');
  
  // Check if old CSS is being overridden
  const oldContentStyles = window.getComputedStyle ? 
    window.getComputedStyle(content) : 
    contentStyles;
  
  console.log('CSS Specificity Check:', {
    'content display': oldContentStyles.display,
    'content columns': oldContentStyles.gridTemplateColumns,
    'left position': leftStyles.position,
    'right display': rightStyles.display,
    'games display': gamesStyles.display
  });
  
  // Check for CSS conflicts
  const conflictingRules = [];
  if (contentStyles.display !== 'grid') {
    conflictingRules.push('community-content display is not grid');
  }
  if (leftStyles.position !== (isDesktop ? 'sticky' : 'static')) {
    conflictingRules.push(`community-left position is not ${isDesktop ? 'sticky' : 'static'}`);
  }
  
  if (conflictingRules.length > 0) {
    console.warn('⚠️ Potential CSS conflicts detected:', conflictingRules);
  } else {
    console.log('✅ No CSS conflicts detected');
  }
  
  return {
    passed: passed === total,
    results: results,
    viewportWidth: viewportWidth,
    isDesktop: isDesktop
  };
})();

