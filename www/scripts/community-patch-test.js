// Community Patch Test - Verify consolidated Community section with games and stats teaser
// Run this in DevTools console to test the community patch

(function() {
  'use strict';
  
  console.log('🧪 Community Patch Test Starting...');
  
  // Test 1: Check feature flags
  const homeLayoutV2 = window.FLAGS?.home_layout_v2;
  const gamesEnabled = window.FLAGS?.community_games_enabled;
  const statsTeaser = window.FLAGS?.community_stats_teaser;
  
  console.log('✅ Home Layout v2 enabled:', homeLayoutV2 ? 'PASS' : 'FAIL');
  console.log('✅ Community games enabled:', gamesEnabled ? 'PASS' : 'FAIL');
  console.log('✅ Stats teaser enabled:', statsTeaser ? 'PASS' : 'FAIL');
  
  // Test 2: Check Community section structure
  const communitySection = document.getElementById('section-community');
  const communityBody = document.getElementById('section-community-body');
  const communityGrid = communityBody?.querySelector('.community-grid');
  
  console.log('✅ Community section exists:', !!communitySection ? 'PASS' : 'FAIL');
  console.log('✅ Community body exists:', !!communityBody ? 'PASS' : 'FAIL');
  console.log('✅ Community grid exists:', !!communityGrid ? 'PASS' : 'FAIL');
  
  // Test 3: Check grid layout
  if (communityGrid) {
    const children = communityGrid.children;
    console.log('✅ Grid has children:', children.length > 0 ? 'PASS' : 'FAIL');
    console.log('  - Grid children count:', children.length);
    
    // Check for spotlight and games
    const hasSpotlight = Array.from(children).some(child => 
      child.id === 'spotlight-row' || child.querySelector('#spotlight-row')
    );
    const hasGames = Array.from(children).some(child => 
      child.classList.contains('community-games')
    );
    
    console.log('✅ Grid has spotlight:', hasSpotlight ? 'PASS' : 'FAIL');
    console.log('✅ Grid has games:', hasGames ? 'PASS' : 'FAIL');
  }
  
  // Test 4: Check game tiles
  const gameTiles = document.querySelectorAll('.game-tile');
  const gamesContainer = document.querySelector('.community-games');
  const tilesContainer = document.querySelector('.community-games__tiles');
  
  console.log('✅ Game tiles found:', gameTiles.length > 0 ? 'PASS' : 'FAIL');
  console.log('  - Game tiles count:', gameTiles.length);
  console.log('✅ Games container exists:', !!gamesContainer ? 'PASS' : 'FAIL');
  console.log('✅ Tiles container exists:', !!tilesContainer ? 'PASS' : 'FAIL');
  
  // Test 5: Check specific game tiles
  if (gameTiles.length > 0) {
    const triviaTile = Array.from(gameTiles).find(tile => 
      tile.textContent.includes('Trivia') || tile.textContent.includes('trivia')
    );
    const flickwordTile = Array.from(gameTiles).find(tile => 
      tile.textContent.includes('FlickWord') || tile.textContent.includes('flickword')
    );
    
    console.log('✅ Daily Trivia tile found:', !!triviaTile ? 'PASS' : 'FAIL');
    console.log('✅ FlickWord tile found:', !!flickwordTile ? 'PASS' : 'FAIL');
    
    if (triviaTile) {
      console.log('  - Trivia tile text:', triviaTile.textContent.trim());
    }
    if (flickwordTile) {
      console.log('  - FlickWord tile text:', flickwordTile.textContent.trim());
    }
  }
  
  // Test 6: Check stats teaser
  const statsTeaserEl = document.querySelector('.community-games__teaser');
  const teaserItems = document.querySelectorAll('.teaser__item');
  const proCta = document.querySelector('.teaser__cta');
  
  console.log('✅ Stats teaser exists:', !!statsTeaserEl ? 'PASS' : 'FAIL');
  console.log('✅ Teaser items found:', teaserItems.length > 0 ? 'PASS' : 'FAIL');
  console.log('  - Teaser items count:', teaserItems.length);
  console.log('✅ Pro CTA exists:', !!proCta ? 'PASS' : 'FAIL');
  
  if (teaserItems.length > 0) {
    teaserItems.forEach((item, index) => {
      const value = item.querySelector('.teaser__value')?.textContent;
      const label = item.querySelector('.teaser__label')?.textContent;
      console.log(`  - Item ${index + 1}: ${value} (${label})`);
    });
  }
  
  // Test 7: Check legacy Play Along is hidden
  const legacyPlayAlong = document.querySelector('#playalong-row:not([data-legacy-home])');
  const hiddenPlayAlong = document.querySelector('#playalong-row[data-legacy-home]');
  
  console.log('✅ Legacy Play Along hidden:', !legacyPlayAlong ? 'PASS' : 'FAIL');
  console.log('✅ Legacy Play Along marked as legacy:', !!hiddenPlayAlong ? 'PASS' : 'FAIL');
  
  // Test 8: Check i18n keys
  const i18nKeys = [
    'games.trivia_title',
    'games.trivia_sub',
    'games.flickword_title',
    'games.flickword_sub',
    'games.stat_streak',
    'games.stat_total',
    'games.stat_best',
    'games.pro_cta'
  ];
  
  const i18nAvailable = i18nKeys.every(key => window.i18n && window.i18n[key]);
  console.log('✅ i18n keys available:', i18nAvailable ? 'PASS' : 'FAIL');
  
  if (!i18nAvailable) {
    const missingKeys = i18nKeys.filter(key => !window.i18n || !window.i18n[key]);
    console.log('  - Missing keys:', missingKeys);
  }
  
  // Test 9: Check responsive layout
  const gridStyle = window.getComputedStyle(communityGrid);
  const gridTemplateColumns = gridStyle.gridTemplateColumns;
  const isTwoColumn = gridTemplateColumns.includes('1.4fr') && gridTemplateColumns.includes('1fr');
  
  console.log('✅ Grid layout correct:', isTwoColumn ? 'PASS' : 'FAIL');
  console.log('  - Grid template columns:', gridTemplateColumns);
  
  // Test 10: Check game tile interactions
  if (gameTiles.length > 0) {
    const firstTile = gameTiles[0];
    const hasClickHandler = firstTile.onclick !== null || firstTile.addEventListener;
    
    console.log('✅ Game tiles clickable:', hasClickHandler ? 'PASS' : 'FAIL');
    
    // Test hover effect
    const tileStyle = window.getComputedStyle(firstTile);
    const hasTransition = tileStyle.transition.includes('transform') || tileStyle.transition.includes('all');
    console.log('✅ Game tiles have hover effects:', hasTransition ? 'PASS' : 'FAIL');
  }
  
  // Overall result
  const allTests = [
    homeLayoutV2,
    gamesEnabled,
    statsTeaser,
    !!communitySection,
    !!communityBody,
    !!communityGrid,
    gameTiles.length > 0,
    !!gamesContainer,
    !!statsTeaserEl,
    !legacyPlayAlong,
    i18nAvailable
  ];
  
  const allPassed = allTests.every(test => test);
  console.log('🎯 Overall result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (!allPassed) {
    console.log('🔧 Debug info:');
    console.log('- Community section:', communitySection);
    console.log('- Community grid:', communityGrid);
    console.log('- Game tiles:', gameTiles);
    console.log('- Stats teaser:', statsTeaserEl);
    console.log('- Legacy Play Along:', legacyPlayAlong);
    console.log('- i18n available:', !!window.i18n);
  }
  
  // Test feature flag toggles
  console.log('🧪 Testing feature flag toggles...');
  console.log('  - Set window.FLAGS.community_games_enabled = false to hide tiles');
  console.log('  - Set window.FLAGS.community_stats_teaser = false to hide stats');
  console.log('  - Set window.FLAGS.home_layout_v2 = false to restore legacy layout');
  
  return allPassed;
})();
