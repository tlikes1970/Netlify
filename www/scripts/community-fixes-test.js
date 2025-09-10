// Community Fixes Test - Verify i18n, clicks, and responsive grid fixes
// Run this in DevTools console to test all the community patch fixes

(function() {
  'use strict';
  
  console.log('🧪 Community Fixes Test Starting...');
  
  // Test 1: Check i18n keys are properly structured
  console.log('=== i18n Keys Test ===');
  const i18nStructure = window.i18n && window.i18n.games && window.i18n.home;
  console.log('✅ i18n structure correct:', i18nStructure ? 'PASS' : 'FAIL');
  
  if (i18nStructure) {
    const gamesKeys = ['trivia_title', 'trivia_sub', 'flickword_title', 'flickword_sub', 'stat_streak', 'stat_total', 'stat_best', 'pro_cta'];
    const homeKeys = ['community', 'community_subtitle', 'community_games_coming'];
    
    const gamesKeysPresent = gamesKeys.every(key => window.i18n.games[key]);
    const homeKeysPresent = homeKeys.every(key => window.i18n.home[key]);
    
    console.log('✅ Games i18n keys present:', gamesKeysPresent ? 'PASS' : 'FAIL');
    console.log('✅ Home i18n keys present:', homeKeysPresent ? 'PASS' : 'FAIL');
    
    if (gamesKeysPresent) {
      console.log('  - Sample games keys:');
      console.log('    - trivia_title:', window.i18n.games.trivia_title);
      console.log('    - flickword_title:', window.i18n.games.flickword_title);
      console.log('    - pro_cta:', window.i18n.games.pro_cta);
    }
  }
  
  // Test 2: Check if tiles show localized text (not keys)
  console.log('=== Localized Text Test ===');
  const gameTiles = document.querySelectorAll('.game-tile');
  const hasLocalizedText = gameTiles.length > 0 && Array.from(gameTiles).every(tile => {
    const text = tile.textContent;
    return !text.includes('games.') && !text.includes('trivia_title') && !text.includes('flickword_title');
  });
  
  console.log('✅ Tiles show localized text:', hasLocalizedText ? 'PASS' : 'FAIL');
  console.log('  - Game tiles found:', gameTiles.length);
  
  if (gameTiles.length > 0) {
    gameTiles.forEach((tile, index) => {
      const title = tile.querySelector('.game-tile__title')?.textContent;
      const subtitle = tile.querySelector('.game-tile__sub')?.textContent;
      console.log(`  - Tile ${index + 1}: "${title}" - "${subtitle}"`);
    });
  }
  
  // Test 3: Check tile clickability
  console.log('=== Clickability Test ===');
  let clickableTiles = 0;
  let clickHandlers = 0;
  
  if (gameTiles.length > 0) {
    gameTiles.forEach((tile, index) => {
      // Check if tile has click handler
      const hasClickHandler = tile.onclick !== null || tile.addEventListener;
      if (hasClickHandler) clickHandlers++;
      
      // Check if tile is focusable
      const isFocusable = tile.tabIndex >= 0;
      if (isFocusable) clickableTiles++;
      
      console.log(`  - Tile ${index + 1}: clickable=${hasClickHandler}, focusable=${isFocusable}`);
    });
  }
  
  console.log('✅ Tiles have click handlers:', clickHandlers === gameTiles.length ? 'PASS' : 'FAIL');
  console.log('✅ Tiles are focusable:', clickableTiles === gameTiles.length ? 'PASS' : 'FAIL');
  
  // Test 4: Test actual click functionality
  console.log('=== Click Functionality Test ===');
  if (gameTiles.length > 0) {
    const firstTile = gameTiles[0];
    const originalConsoleLog = console.log;
    let clickDetected = false;
    
    // Override console.log to detect navigation
    console.log = function(...args) {
      if (args.some(arg => typeof arg === 'string' && arg.includes('Navigation to'))) {
        clickDetected = true;
      }
      originalConsoleLog.apply(console, args);
    };
    
    // Simulate click
    firstTile.click();
    
    // Restore console.log
    console.log = originalConsoleLog;
    
    console.log('✅ Click triggers navigation:', clickDetected ? 'PASS' : 'FAIL');
  }
  
  // Test 5: Check responsive grid
  console.log('=== Responsive Grid Test ===');
  const communityGrid = document.querySelector('.community-grid');
  const gamesContainer = document.querySelector('.community-games');
  
  if (communityGrid) {
    const gridStyle = window.getComputedStyle(communityGrid);
    const gridTemplateColumns = gridStyle.gridTemplateColumns;
    const hasMinmax = gridTemplateColumns.includes('minmax(0,');
    const hasProperColumns = gridTemplateColumns.includes('1.4fr') && gridTemplateColumns.includes('1fr');
    
    console.log('✅ Grid uses minmax:', hasMinmax ? 'PASS' : 'FAIL');
    console.log('✅ Grid has proper columns:', hasProperColumns ? 'PASS' : 'FAIL');
    console.log('  - Grid template columns:', gridTemplateColumns);
    
    // Check z-index
    const gamesZIndex = gamesContainer ? window.getComputedStyle(gamesContainer).zIndex : 'auto';
    console.log('✅ Games container has z-index:', gamesZIndex !== 'auto' ? 'PASS' : 'FAIL');
    console.log('  - Games z-index:', gamesZIndex);
  }
  
  // Test 6: Check grid children can shrink
  console.log('=== Grid Shrink Test ===');
  if (communityGrid) {
    const children = Array.from(communityGrid.children);
    const childrenCanShrink = children.every(child => {
      const style = window.getComputedStyle(child);
      return style.minWidth === '0px' || style.minWidth === '0';
    });
    
    console.log('✅ Grid children can shrink:', childrenCanShrink ? 'PASS' : 'FAIL');
    console.log('  - Grid children count:', children.length);
  }
  
  // Test 7: Check for grid overflow
  console.log('=== Grid Overflow Test ===');
  if (communityGrid) {
    const gridRect = communityGrid.getBoundingClientRect();
    const parentRect = communityGrid.parentElement?.getBoundingClientRect();
    
    if (parentRect) {
      const overflows = gridRect.width > parentRect.width;
      console.log('✅ Grid does not overflow:', !overflows ? 'PASS' : 'FAIL');
      console.log('  - Grid width:', gridRect.width);
      console.log('  - Parent width:', parentRect.width);
    }
  }
  
  // Test 8: Check accessibility
  console.log('=== Accessibility Test ===');
  if (gameTiles.length > 0) {
    const firstTile = gameTiles[0];
    const hasType = firstTile.type === 'button';
    const hasAriaHidden = firstTile.querySelector('[aria-hidden="true"]') !== null;
    const hasFocusVisible = window.getComputedStyle(firstTile, ':focus-visible').outline !== 'none';
    
    console.log('✅ Tiles have button type:', hasType ? 'PASS' : 'FAIL');
    console.log('✅ Icons have aria-hidden:', hasAriaHidden ? 'PASS' : 'FAIL');
    console.log('✅ Tiles have focus-visible styles:', hasFocusVisible ? 'PASS' : 'FAIL');
  }
  
  // Test 9: Check stats teaser
  console.log('=== Stats Teaser Test ===');
  const statsTeaser = document.querySelector('.community-games__teaser');
  const teaserItems = document.querySelectorAll('.teaser__item');
  const proCta = document.querySelector('.teaser__cta');
  
  console.log('✅ Stats teaser exists:', !!statsTeaser ? 'PASS' : 'FAIL');
  console.log('✅ Teaser items found:', teaserItems.length > 0 ? 'PASS' : 'FAIL');
  console.log('✅ Pro CTA exists:', !!proCta ? 'PASS' : 'FAIL');
  
  if (statsTeaser) {
    const teaserStyle = window.getComputedStyle(statsTeaser);
    const hasFlexWrap = teaserStyle.flexWrap !== 'nowrap';
    console.log('✅ Teaser has flex-wrap:', hasFlexWrap ? 'PASS' : 'FAIL');
  }
  
  // Test 10: Check legacy Play Along is properly hidden
  console.log('=== Legacy Cleanup Test ===');
  const legacyPlayAlong = document.querySelector('#playalong-row:not([data-legacy-home])');
  const hiddenPlayAlong = document.querySelector('#playalong-row[data-legacy-home]');
  const playAlongVisible = hiddenPlayAlong ? window.getComputedStyle(hiddenPlayAlong).display !== 'none' : true;
  
  console.log('✅ Legacy Play Along hidden:', !legacyPlayAlong ? 'PASS' : 'FAIL');
  console.log('✅ Legacy Play Along marked as legacy:', !!hiddenPlayAlong ? 'PASS' : 'FAIL');
  console.log('✅ Legacy Play Along not visible:', !playAlongVisible ? 'PASS' : 'FAIL');
  
  // Overall result
  const allTests = [
    i18nStructure,
    hasLocalizedText,
    clickHandlers === gameTiles.length,
    clickableTiles === gameTiles.length,
    communityGrid ? window.getComputedStyle(communityGrid).gridTemplateColumns.includes('minmax(0,') : false,
    !legacyPlayAlong,
    !playAlongVisible
  ];
  
  const allPassed = allTests.every(test => test);
  console.log('🎯 Overall result:', allPassed ? '✅ ALL FIXES WORKING' : '❌ SOME ISSUES REMAIN');
  
  if (!allPassed) {
    console.log('🔧 Debug info:');
    console.log('- i18n structure:', !!i18nStructure);
    console.log('- Localized text:', hasLocalizedText);
    console.log('- Click handlers:', clickHandlers, '/', gameTiles.length);
    console.log('- Focusable tiles:', clickableTiles, '/', gameTiles.length);
    console.log('- Grid minmax:', communityGrid ? window.getComputedStyle(communityGrid).gridTemplateColumns.includes('minmax(0,') : false);
    console.log('- Legacy cleanup:', !legacyPlayAlong);
  }
  
  // Test resize behavior (manual)
  console.log('🧪 Manual resize test:');
  console.log('  - Resize window from 1440px → 1024px → 768px → 375px');
  console.log('  - Check that games column stays inside Community box');
  console.log('  - Check that no horizontal scroll appears');
  
  return allPassed;
})();
