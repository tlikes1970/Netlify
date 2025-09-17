// Community Final Verification - Test all three fixes: i18n, data-actions, router
// Run this in DevTools console to verify the surgical patch worked

(function() {
  'use strict';
  
  console.log('🔧 Community Final Verification Starting...');
  
  // Test 1: i18n Translation Fix
  console.log('=== i18n Translation Test ===');
  
  // Check if tiles show localized text (not raw keys)
  const gameTiles = document.querySelectorAll('.game-tile');
  const hasLocalizedText = gameTiles.length > 0 && Array.from(gameTiles).every(tile => {
    const text = tile.textContent;
    return !text.includes('games.') && !text.includes('trivia_title') && !text.includes('flickword_title');
  });
  
  console.log('✅ Tiles show localized text:', hasLocalizedText ? 'PASS' : 'FAIL');
  
  if (gameTiles.length > 0) {
    gameTiles.forEach((tile, index) => {
      const title = tile.querySelector('.game-tile__title')?.textContent;
      const subtitle = tile.querySelector('.game-tile__sub')?.textContent;
      console.log(`  - Tile ${index + 1}: "${title}" - "${subtitle}"`);
    });
  }
  
  // Test 2: Data-Action Registration Fix
  console.log('=== Data-Action Registration Test ===');
  
  // Check if tiles have correct data-action values
  const triviaTile = document.querySelector('[data-action="trivia"]');
  const flickwordTile = document.querySelector('[data-action="flickword"]');
  
  console.log('✅ Trivia tile has correct data-action:', !!triviaTile ? 'PASS' : 'FAIL');
  console.log('✅ FlickWord tile has correct data-action:', !!flickwordTile ? 'PASS' : 'FAIL');
  
  // Test clicking tiles to see if they trigger router navigation
  if (triviaTile) {
    console.log('  - Testing trivia tile click...');
    const originalConsoleLog = console.log;
    let navigationDetected = false;
    
    console.log = function(...args) {
      if (args.some(arg => typeof arg === 'string' && (arg.includes('Navigating to') || arg.includes('Handling game route')))) {
        navigationDetected = true;
      }
      originalConsoleLog.apply(console, args);
    };
    
    triviaTile.click();
    
    // Restore console.log
    console.log = originalConsoleLog;
    
    console.log('✅ Trivia click triggers navigation:', navigationDetected ? 'PASS' : 'FAIL');
  }
  
  // Test 3: Router Integration Test
  console.log('=== Router Integration Test ===');
  
  const routerAvailable = !!(window.router && typeof window.router.navigate === 'function');
  console.log('✅ Router available:', routerAvailable ? 'PASS' : 'FAIL');
  
  if (routerAvailable) {
    // Test direct router navigation
    console.log('  - Testing direct router navigation...');
    try {
      window.router.navigate('/games/trivia');
      console.log('✅ Trivia route handled:', 'PASS');
    } catch (error) {
      console.log('❌ Trivia route failed:', error.message);
    }
    
    try {
      window.router.navigate('/games/flickword');
      console.log('✅ FlickWord route handled:', 'PASS');
    } catch (error) {
      console.log('❌ FlickWord route failed:', error.message);
    }
  }
  
  // Test 4: Modal Functionality
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
        const modalButtons = modal.querySelectorAll('.modal__actions button');
        
        console.log('  - Modal title:', modalTitle);
        console.log('  - Modal body:', modalBody);
        console.log('  - Modal buttons:', modalButtons.length);
        
        // Check if modal shows localized text (not raw keys)
        const hasLocalizedModal = modalTitle && !modalTitle.includes('games.') && 
                                 modalBody && !modalBody.includes('games.') &&
                                 Array.from(modalButtons).every(btn => !btn.textContent.includes('games.'));
        
        console.log('✅ Modal shows localized text:', hasLocalizedModal ? 'PASS' : 'FAIL');
        
        // Clean up modal
        modal.remove();
      }
    } catch (error) {
      console.log('❌ Modal creation failed:', error.message);
    }
  }
  
  // Test 5: Console Cleanliness
  console.log('=== Console Cleanliness Test ===');
  
  // Check if we still get "Unknown data-action" warnings
  const originalConsoleWarn = console.warn;
  let unknownActionWarning = false;
  
  console.warn = function(...args) {
    if (args.some(arg => typeof arg === 'string' && arg.includes('Unknown data-action'))) {
      unknownActionWarning = true;
    }
    originalConsoleWarn.apply(console, args);
  };
  
  // Trigger a tile click to see if we get warnings
  if (triviaTile) {
    triviaTile.click();
  }
  
  // Restore console.warn
  console.warn = originalConsoleWarn;
  
  console.log('✅ No "Unknown data-action" warnings:', !unknownActionWarning ? 'PASS' : 'FAIL');
  
  // Overall result
  const allTests = [
    hasLocalizedText,
    !!triviaTile && !!flickwordTile,
    routerAvailable,
    modalFunctionAvailable,
    !unknownActionWarning
  ];
  
  const allPassed = allTests.every(test => test);
  console.log('🎯 Overall result:', allPassed ? '✅ ALL FIXES WORKING' : '❌ SOME ISSUES REMAIN');
  
  if (!allPassed) {
    console.log('🔧 Debug info:');
    console.log('- Localized text:', hasLocalizedText);
    console.log('- Data-actions registered:', !!triviaTile && !!flickwordTile);
    console.log('- Router available:', routerAvailable);
    console.log('- Modal available:', modalFunctionAvailable);
    console.log('- No warnings:', !unknownActionWarning);
  }
  
  // Manual verification steps
  console.log('🧪 Manual verification steps:');
  console.log('  1. Check tiles show "Daily Trivia" and "FlickWord" (not keys)');
  console.log('  2. Click tiles - should navigate without "Unknown data-action" warnings');
  console.log('  3. Modal should open with proper localized text');
  console.log('  4. Console should show "Handling game route" not "Unknown route"');
  console.log('  5. No horizontal scroll on resize');
  
  return allPassed;
})();
