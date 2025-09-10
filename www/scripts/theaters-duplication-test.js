// Theaters Duplication Test - Verify only one theaters section is visible
// Run this in DevTools console to check for duplicate theaters sections

(function() {
  'use strict';
  
  console.log('🧪 Theaters Duplication Test Starting...');
  
  // Test 1: Check if Home Layout v2 is active
  const homeLayoutV2Active = document.body.hasAttribute('data-home-layout-v2');
  console.log('✅ Home Layout v2 active:', homeLayoutV2Active ? 'PASS' : 'FAIL');
  
  // Test 2: Count theaters sections
  const originalTheatersSection = document.getElementById('theaters-section');
  const v2TheatersSection = document.getElementById('section-theaters');
  
  const originalExists = !!originalTheatersSection;
  const v2Exists = !!v2TheatersSection;
  
  console.log('✅ Original theaters section exists:', originalExists ? 'PASS' : 'FAIL');
  console.log('✅ V2 theaters section exists:', v2Exists ? 'PASS' : 'FAIL');
  
  // Test 3: Check visibility
  let originalVisible = false;
  let v2Visible = false;
  
  if (originalTheatersSection) {
    const originalStyle = window.getComputedStyle(originalTheatersSection);
    originalVisible = originalStyle.display !== 'none';
  }
  
  if (v2TheatersSection) {
    const v2Style = window.getComputedStyle(v2TheatersSection);
    v2Visible = v2Style.display !== 'none';
  }
  
  console.log('✅ Original theaters section visible:', originalVisible ? 'FAIL (should be hidden)' : 'PASS');
  console.log('✅ V2 theaters section visible:', v2Visible ? 'PASS' : 'FAIL (should be visible)');
  
  // Test 4: Check content migration
  if (v2TheatersSection) {
    const v2Body = document.getElementById('section-theaters-body');
    const theatersContainer = v2Body?.querySelector('.theaters-container');
    const theatersInfo = v2Body?.querySelector('.theaters-info');
    
    const contentMigrated = !!(theatersContainer || theatersInfo);
    console.log('✅ Theaters content migrated to V2:', contentMigrated ? 'PASS' : 'FAIL');
    
    if (theatersContainer) {
      console.log('  - Theaters container found in V2 section');
    }
    if (theatersInfo) {
      console.log('  - Theaters info found in V2 section');
    }
  }
  
  // Test 5: Check for duplicate content
  const allTheatersContainers = document.querySelectorAll('.theaters-container');
  const allTheatersInfo = document.querySelectorAll('.theaters-info');
  
  console.log('✅ Theaters containers count:', allTheatersContainers.length === 1 ? 'PASS' : 'FAIL');
  console.log('  - Found', allTheatersContainers.length, 'theaters containers');
  
  console.log('✅ Theaters info count:', allTheatersInfo.length === 1 ? 'PASS' : 'FAIL');
  console.log('  - Found', allTheatersInfo.length, 'theaters info sections');
  
  // Test 6: Check section titles
  const allTheatersTitles = document.querySelectorAll('h2, h3');
  const theatersTitles = Array.from(allTheatersTitles).filter(el => 
    el.textContent.toLowerCase().includes('theaters') || 
    el.textContent.toLowerCase().includes('near me')
  );
  
  console.log('✅ Theaters titles count:', theatersTitles.length <= 2 ? 'PASS' : 'FAIL');
  console.log('  - Found', theatersTitles.length, 'theaters-related titles');
  theatersTitles.forEach((title, index) => {
    console.log(`  - Title ${index + 1}:`, title.textContent.trim());
  });
  
  // Overall result
  const noDuplication = !originalVisible && v2Visible && allTheatersContainers.length === 1;
  console.log('🎯 Overall result:', noDuplication ? '✅ NO DUPLICATION - FIXED' : '❌ DUPLICATION STILL EXISTS');
  
  if (!noDuplication) {
    console.log('🔧 Debug info:');
    console.log('- Original section:', originalTheatersSection);
    console.log('- V2 section:', v2TheatersSection);
    console.log('- All containers:', allTheatersContainers);
    console.log('- All info sections:', allTheatersInfo);
  }
  
  return noDuplication;
})();
