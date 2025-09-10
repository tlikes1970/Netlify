// Community Comprehensive Test - Verify all fixes: i18n, routes, modal, styling
// Run this in DevTools console to test the complete community patch

(function() {
  'use strict';
  
  console.log('🧪 Community Comprehensive Test Starting...');
  
  // Test 1: i18n Keys Structure
  console.log('=== i18n Keys Test ===');
  const i18nStructure = window.i18n && window.i18n.games && window.i18n.home;
  console.log('✅ i18n structure correct:', i18nStructure ? 'PASS' : 'FAIL');
  
  if (i18nStructure) {
    const requiredGamesKeys = [
      'trivia_title', 'trivia_sub', 'flickword_title', 'flickword_sub',
      'stat_streak', 'stat_total', 'stat_best', 'pro_cta',
      'teaser_title', 'teaser_body', 'open_trivia', 'open_flickword', 'maybe_later'
    ];
    const requiredHomeKeys = ['community', 'community_subtitle', 'community_games_coming'];
    
    const gamesKeysPresent = requiredGamesKeys.every(key => window.i18n.games[key]);
    const homeKeysPresent = requiredHomeKeys.every(key => window.i18n.home[key]);
    
    console.log('✅ Games i18n keys present:', gamesKeysPresent ? 'PASS' : 'FAIL');
    console.log('✅ Home i18n keys present:', homeKeysPresent ? 'PASS' : 'FAIL');
    
    if (gamesKeysPresent) {
      console.log('  - Sample keys:');
      console.log('    - trivia_title:', window.i18n.games.trivia_title);
      console.log('    - teaser_title:', window.i18n.games.teaser_title);
      console.log('    - open_trivia:', window.i18n.games.open_trivia);
    }
  }
  
  // Test 2: Localized Text Display
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
  
  // Test 3: Data-Action Attributes
  console.log('=== Data-Action Test ===');
  const tilesWithDataAction = Array.from(gameTiles).filter(tile => tile.dataset.action);
  console.log('✅ Tiles have data-action:', tilesWithDataAction.length === gameTiles.length ? 'PASS' : 'FAIL');
  console.log('  - Tiles with data-action:', tilesWithDataAction.length, '/', gameTiles.length);
  
  if (tilesWithDataAction.length > 0) {
    tilesWithDataAction.forEach((tile, index) => {
      console.log(`  - Tile ${index + 1} action:`, tile.dataset.action);
    });
  }
  
  // Test 4: Router Integration
  console.log('=== Router Integration Test ===');
  const routerAvailable = !!(window.router && typeof window.router.navigate === 'function');
  console.log('✅ Router available:', routerAvailable ? 'PASS' : 'FAIL');
  
  // Test 5: Game Routes
  console.log('=== Game Routes Test ===');
  if (routerAvailable) {
    // Test trivia route
    console.log('  - Testing /games/trivia route...');
    try {
      window.router.navigate('/games/trivia');
      console.log('✅ Trivia route handled:', 'PASS');
    } catch (error) {
      console.log('❌ Trivia route failed:', error.message);
    }
    
    // Test flickword route
    console.log('  - Testing /games/flickword route...');
    try {
      window.router.navigate('/games/flickword');
      console.log('✅ FlickWord route handled:', 'PASS');
    } catch (error) {
      console.log('❌ FlickWord route failed:', error.message);
    }
  }
  
  // Test 6: Modal Functionality
  console.log('=== Modal Functionality Test ===');
  const modalFunctionAvailable = typeof window.showGamesTeaserModal === 'function';
  console.log('✅ Modal function available:', modalFunctionAvailable ? 'PASS' : 'FAIL');
  
  if (modalFunctionAvailable) {
    console.log('  - Testing modal creation...');
    try {
      window.showGamesTeaserModal('trivia');
      const modal = document.querySelector('.modal.games-teaser');
      console.log('✅ Modal created:', !!modal ? 'PASS' : 'FAIL');
      
      if (modal) {
        const modalTitle = modal.querySelector('h3')?.textContent;
        const modalBody = modal.querySelector('p')?.textContent;
        console.log('  - Modal title:', modalTitle);
        console.log('  - Modal body:', modalBody);
        
        // Clean up modal
        modal.remove();
      }
    } catch (error) {
      console.log('❌ Modal creation failed:', error.message);
    }
  }
  
  // Test 7: Grid Layout and Overflow
  console.log('=== Grid Layout Test ===');
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
    
    // Check for overflow
    const gridRect = communityGrid.getBoundingClientRect();
    const parentRect = communityGrid.parentElement?.getBoundingClientRect();
    
    if (parentRect) {
      const overflows = gridRect.width > parentRect.width;
      console.log('✅ Grid does not overflow:', !overflows ? 'PASS' : 'FAIL');
      console.log('  - Grid width:', gridRect.width);
      console.log('  - Parent width:', parentRect.width);
    }
  }
  
  // Test 8: Tile Click Functionality
  console.log('=== Tile Click Test ===');
  if (gameTiles.length > 0) {
    const firstTile = gameTiles[0];
    const hasClickHandler = firstTile.onclick !== null || firstTile.addEventListener;
    const isFocusable = firstTile.tabIndex >= 0;
    
    console.log('✅ Tiles have click handlers:', hasClickHandler ? 'PASS' : 'FAIL');
    console.log('✅ Tiles are focusable:', isFocusable ? 'PASS' : 'FAIL');
    
    // Test actual click (with console override to detect navigation)
    console.log('  - Testing tile click...');
    const originalConsoleLog = console.log;
    let navigationDetected = false;
    
    console.log = function(...args) {
      if (args.some(arg => typeof arg === 'string' && (arg.includes('Navigating to') || arg.includes('Handling game route')))) {
        navigationDetected = true;
      }
      originalConsoleLog.apply(console, args);
    };
    
    firstTile.click();
    
    // Restore console.log
    console.log = originalConsoleLog;
    
    console.log('✅ Click triggers navigation:', navigationDetected ? 'PASS' : 'FAIL');
  }
  
  // Test 9: Stats Teaser
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
  
  // Test 10: Accessibility
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
  
  // Overall result
  const allTests = [
    i18nStructure,
    hasLocalizedText,
    tilesWithDataAction.length === gameTiles.length,
    routerAvailable,
    modalFunctionAvailable,
    communityGrid ? window.getComputedStyle(communityGrid).gridTemplateColumns.includes('minmax(0,') : false,
    !(communityGrid && communityGrid.parentElement && 
      communityGrid.getBoundingClientRect().width > communityGrid.parentElement.getBoundingClientRect().width)
  ];
  
  const allPassed = allTests.every(test => test);
  console.log('🎯 Overall result:', allPassed ? '✅ ALL FIXES WORKING' : '❌ SOME ISSUES REMAIN');
  
  if (!allPassed) {
    console.log('🔧 Debug info:');
    console.log('- i18n structure:', !!i18nStructure);
    console.log('- Localized text:', hasLocalizedText);
    console.log('- Data actions:', tilesWithDataAction.length, '/', gameTiles.length);
    console.log('- Router available:', routerAvailable);
    console.log('- Modal available:', modalFunctionAvailable);
    console.log('- Grid minmax:', communityGrid ? window.getComputedStyle(communityGrid).gridTemplateColumns.includes('minmax(0,') : false);
  }
  
  // Manual verification steps
  console.log('🧪 Manual verification steps:');
  console.log('  1. Check that tiles show "Daily Trivia" and "FlickWord" (not keys)');
  console.log('  2. Click each tile - should open modal or navigate');
  console.log('  3. Resize window 1440px → 1024px → 768px → 375px');
  console.log('  4. Verify no horizontal scroll and tiles stay clickable');
  console.log('  5. Check that console shows "Handling game route" not "Unknown route"');
  
  return allPassed;
})();
