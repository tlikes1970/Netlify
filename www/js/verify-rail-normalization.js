/**
 * Rail Normalization Verification Helper
 * Verifies that Home rails fill panel content box with zero padding and proper grid layout
 */

(function verifyRailNormalization() {
  console.log('🔍 Verifying Home rail normalization...');
  
  const groups = [
    'group-1-your-shows',
    'group-2-community', 
    'group-3-for-you',
    'group-4-theaters',
    'group-5-feedback'
  ];
  
  const railSelectors = [
    '.preview-row-container',
    '.preview-row-scroll', 
    '.row-inner',
    '#currentlyWatchingScroll',
    '.curated-row'
  ];
  
  const results = {
    totalGroups: groups.length,
    groupsWithRails: 0,
    railsChecked: 0,
    railsPassed: 0,
    issues: []
  };
  
  groups.forEach(groupId => {
    const group = document.getElementById(groupId);
    if (!group) {
      results.issues.push(`❌ Group ${groupId} not found`);
      return;
    }
    
    let groupHasRails = false;
    
    railSelectors.forEach(railSelector => {
      const rails = group.querySelectorAll(railSelector);
      
      rails.forEach((rail, index) => {
        results.railsChecked++;
        groupHasRails = true;
        
        const computed = getComputedStyle(rail);
        const rect = rail.getBoundingClientRect();
        
        const checks = {
          display: computed.display === 'grid',
          gridFlow: computed.gridAutoFlow === 'column',
          paddingLeft: computed.paddingLeft === '0px',
          paddingRight: computed.paddingRight === '0px', 
          overflowX: computed.overflowX === 'auto',
          overflowY: computed.overflowY === 'hidden',
          maxWidth: computed.maxWidth === '100%' || computed.maxWidth === 'none',
          minWidth: computed.minWidth === '0px',
          scrollSnap: computed.scrollSnapType.includes('mandatory'),
          hasWidth: rect.width > 0
        };
        
        const passed = Object.values(checks).every(Boolean);
        if (passed) {
          results.railsPassed++;
        } else {
          const failures = Object.entries(checks)
            .filter(([key, value]) => !value)
            .map(([key, value]) => `${key}=${value}`);
          
          results.issues.push(
            `❌ ${groupId} ${railSelector}[${index}]: ${failures.join(', ')}`
          );
        }
      });
    });
    
    if (groupHasRails) {
      results.groupsWithRails++;
    }
  });
  
  // Check for cards with proper snap alignment
  const cards = document.querySelectorAll('#homeSection .card');
  let cardsWithSnap = 0;
  
  cards.forEach(card => {
    const computed = getComputedStyle(card);
    if (computed.scrollSnapAlign === 'start') {
      cardsWithSnap++;
    }
  });
  
  results.cardsWithSnap = cardsWithSnap;
  results.totalCards = cards.length;
  
  // Summary
  console.log('\n📊 Rail Normalization Results:');
  console.log(`Groups with rails: ${results.groupsWithRails}/${results.totalGroups}`);
  console.log(`Rails checked: ${results.railsChecked}`);
  console.log(`Rails passed: ${results.railsPassed}/${results.railsChecked}`);
  console.log(`Cards with snap: ${results.cardsWithSnap}/${results.totalCards}`);
  
  if (results.issues.length > 0) {
    console.log('\n❌ Issues found:');
    results.issues.forEach(issue => console.log(issue));
  } else {
    console.log('\n✅ All rails normalized successfully!');
  }
  
  // Check for conflicting rules in home.css
  console.log('\n🔍 Checking for conflicting rules in home.css...');
  const homeCssConflicts = [
    'preview-row-container',
    'preview-row-scroll', 
    'row-inner',
    'currentlyWatchingScroll',
    'curated-row'
  ];
  
  const conflictResults = [];
  homeCssConflicts.forEach(selector => {
    const rules = Array.from(document.styleSheets)
      .filter(sheet => sheet.href && sheet.href.includes('home.css'))
      .flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules);
        } catch (e) {
          return [];
        }
      })
      .filter(rule => rule.selectorText && rule.selectorText.includes(selector));
    
    if (rules.length > 0) {
      conflictResults.push(`Found ${rules.length} rules for ${selector} in home.css`);
    }
  });
  
  if (conflictResults.length > 0) {
    console.log('⚠️  Potential conflicts in home.css:');
    conflictResults.forEach(result => console.log(result));
  } else {
    console.log('✅ No conflicting rail rules found in home.css');
  }
  
  // Overall status
  const overallPass = results.railsPassed === results.railsChecked && 
                     results.issues.length === 0 && 
                     conflictResults.length === 0;
  
  console.log(`\n${overallPass ? '✅' : '❌'} Rail normalization: ${overallPass ? 'PASS' : 'FAIL'}`);
  
  // Store results globally for debugging
  window.__railNormalizationResults = results;
  
  return results;
})();



