/**
 * Debug Verification Script
 * Tests the three main issues: tabs position, Spanish language, game containers
 */

console.log('🔍 Starting Debug Verification...');

// Test 1: Tabs Position
function testTabsPosition() {
  console.log('\n=== TEST 1: TABS POSITION ===');
  
  const searchBar = document.querySelector('.top-search');
  const searchResults = document.querySelector('#searchResults');
  const tabContainer = document.querySelector('.tab-container');
  
  if (!searchBar || !searchResults || !tabContainer) {
    console.error('❌ Missing elements:', {
      searchBar: !!searchBar,
      searchResults: !!searchResults,
      tabContainer: !!tabContainer
    });
    return false;
  }
  
  // Check DOM order
  const searchBarIndex = Array.from(document.body.children).indexOf(searchBar);
  const searchResultsIndex = Array.from(document.body.children).indexOf(searchResults);
  const tabContainerIndex = Array.from(document.body.children).indexOf(tabContainer);
  
  console.log('📊 DOM Order:', {
    searchBar: searchBarIndex,
    searchResults: searchResultsIndex,
    tabContainer: tabContainerIndex
  });
  
  const correctOrder = searchBarIndex < tabContainerIndex && tabContainerIndex < searchResultsIndex;
  console.log('✅ Correct order (search bar → tabs → search results):', correctOrder);
  
  // Check z-index
  const tabZIndex = parseInt(getComputedStyle(tabContainer).zIndex);
  const searchZIndex = parseInt(getComputedStyle(searchResults).zIndex);
  console.log('📊 Z-Index:', {
    tabs: tabZIndex,
    searchResults: searchZIndex,
    tabsAbove: tabZIndex > searchZIndex
  });
  
  return correctOrder && tabZIndex > searchZIndex;
}

// Test 2: Spanish Language
function testSpanishLanguage() {
  console.log('\n=== TEST 2: SPANISH LANGUAGE ===');
  
  // Check if translation functions exist
  const hasT = typeof window.t === 'function';
  const hasApplyTranslations = typeof window.applyTranslations === 'function';
  const hasLanguageManager = typeof window.LanguageManager === 'object';
  
  console.log('📊 Translation Functions:', {
    t: hasT,
    applyTranslations: hasApplyTranslations,
    LanguageManager: hasLanguageManager
  });
  
  // Test a few key translations
  const testKeys = ['home', 'currently_watching', 'want_to_watch', 'settings'];
  const currentLang = window.appData?.settings?.lang || 'en';
  
  console.log('📊 Current Language:', currentLang);
  
  if (hasT) {
    testKeys.forEach(key => {
      const enTranslation = window.t(key, 'en');
      const esTranslation = window.t(key, 'es');
      console.log(`📝 ${key}: EN="${enTranslation}", ES="${esTranslation}"`);
    });
  }
  
  // Check if elements have data-i18n attributes
  const elementsWithI18n = document.querySelectorAll('[data-i18n]');
  console.log('📊 Elements with data-i18n:', elementsWithI18n.length);
  
  // Check a few specific elements
  const homeTab = document.querySelector('#homeTab [data-i18n="home"]');
  const watchingTab = document.querySelector('#watchingTab [data-i18n="currently_watching"]');
  
  console.log('📊 Key Elements:', {
    homeTab: !!homeTab,
    watchingTab: !!watchingTab,
    homeTabText: homeTab?.textContent,
    watchingTabText: watchingTab?.textContent
  });
  
  return hasT && hasApplyTranslations && elementsWithI18n.length > 0;
}

// Test 3: Game Containers
function testGameContainers() {
  console.log('\n=== TEST 3: GAME CONTAINERS ===');
  
  const flickwordTile = document.querySelector('#flickwordTile');
  const triviaTile = document.querySelector('#triviaTile');
  
  console.log('📊 Game Containers:', {
    flickwordTile: !!flickwordTile,
    triviaTile: !!triviaTile
  });
  
  if (flickwordTile) {
    const flickwordRect = flickwordTile.getBoundingClientRect();
    console.log('📊 FlickWord Container:', {
      width: flickwordRect.width,
      height: flickwordRect.height,
      visible: flickwordRect.width > 0 && flickwordRect.height > 0
    });
  }
  
  if (triviaTile) {
    const triviaRect = triviaTile.getBoundingClientRect();
    console.log('📊 Trivia Container:', {
      width: triviaRect.width,
      height: triviaRect.height,
      visible: triviaRect.width > 0 && triviaRect.height > 0
    });
  }
  
  // Check for any errors in console
  const hasErrors = window.console && window.console.error;
  console.log('📊 Console Errors:', hasErrors ? 'Check console for errors' : 'No obvious errors');
  
  return !!flickwordTile && !!triviaTile;
}

// Test 4: Mobile Detection
function testMobileDetection() {
  console.log('\n=== TEST 4: MOBILE DETECTION ===');
  
  const isMobileSize = window.innerWidth <= 768;
  const hasMobileClass = document.body.classList.contains('mobile');
  
  console.log('📊 Mobile Detection:', {
    viewportWidth: window.innerWidth,
    isMobileSize: isMobileSize,
    hasMobileClass: hasMobileClass,
    correct: isMobileSize === hasMobileClass
  });
  
  return isMobileSize === hasMobileClass;
}

// Run all tests
function runAllTests() {
  const results = {
    tabsPosition: testTabsPosition(),
    spanishLanguage: testSpanishLanguage(),
    gameContainers: testGameContainers(),
    mobileDetection: testMobileDetection()
  };
  
  console.log('\n=== SUMMARY ===');
  console.log('📊 Results:', results);
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log(`✅ Passed: ${passed}/${total} tests`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️ Some tests failed. Check the details above.');
  }
  
  return results;
}

// Auto-run tests
runAllTests();

// Expose for manual testing
window.debugVerification = {
  runAllTests,
  testTabsPosition,
  testSpanishLanguage,
  testGameContainers,
  testMobileDetection
};

console.log('🔍 Debug verification complete. Use window.debugVerification to run individual tests.');
