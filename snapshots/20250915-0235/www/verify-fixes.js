/**
 * Process: Core Stabilization Verification
 * Purpose: Verify all fixes from Phase B are working correctly
 * Data Source: DOM elements, CSS properties, and JavaScript functions
 * Update Path: Run this script after Phase B fixes are applied
 * Dependencies: All core systems (tabs, themes, auth, i18n, mobile, containers)
 */

(function() {
  console.log('🔍 Starting Core Stabilization Verification...');
  
  const results = {
    tabsAboveResults: false,
    themingConsistent: false,
    i18nWorking: false,
    authProfileDisplay: false,
    mobileStable: false,
    gameContainers: false
  };
  
  // Test 1: Tabs Above Results
  function testTabsAboveResults() {
    console.log('🔍 Testing tabs above results...');
    
    const tabContainer = document.querySelector('.tab-container');
    const searchResults = document.querySelector('#searchResults');
    
    if (tabContainer && searchResults) {
      const tabZIndex = parseInt(getComputedStyle(tabContainer).zIndex);
      const searchZIndex = parseInt(getComputedStyle(searchResults).zIndex);
      
      results.tabsAboveResults = tabZIndex > searchZIndex;
      console.log(`✅ Tabs z-index: ${tabZIndex}, Search z-index: ${searchZIndex}`);
    } else {
      console.log('❌ Missing tab container or search results');
    }
  }
  
  // Test 2: Theming Consistency
  function testThemingConsistency() {
    console.log('🔍 Testing theming consistency...');
    
    const root = document.documentElement;
    const hasFg = getComputedStyle(root).getPropertyValue('--fg');
    const hasBg = getComputedStyle(root).getPropertyValue('--bg');
    const hasCard = getComputedStyle(root).getPropertyValue('--card');
    
    results.themingConsistent = !!(hasFg && hasBg && hasCard);
    console.log(`✅ Theme tokens: fg=${hasFg}, bg=${hasBg}, card=${hasCard}`);
  }
  
  // Test 3: i18n Working
  function testI18nWorking() {
    console.log('🔍 Testing i18n pipeline...');
    
    const hasTranslationFunction = typeof window.t === 'function';
    const hasApplyTranslations = typeof window.applyTranslations === 'function';
    const allGenresTranslated = document.querySelector('[data-i18n="all_genres"]')?.textContent !== 'all_genres';
    
    results.i18nWorking = hasTranslationFunction && hasApplyTranslations && allGenresTranslated;
    console.log(`✅ Translation function: ${hasTranslationFunction}, Apply function: ${hasApplyTranslations}, All genres translated: ${allGenresTranslated}`);
  }
  
  // Test 4: Auth Profile Display
  function testAuthProfileDisplay() {
    console.log('🔍 Testing auth profile display...');
    
    const hasUserViewModel = typeof window.UserViewModel === 'object';
    const accountBtn = document.getElementById('accountBtn');
    const hasAccountBtn = !!accountBtn;
    
    results.authProfileDisplay = hasUserViewModel && hasAccountBtn;
    console.log(`✅ UserViewModel: ${hasUserViewModel}, Account button: ${hasAccountBtn}`);
  }
  
  // Test 5: Mobile Stability
  function testMobileStability() {
    console.log('🔍 Testing mobile stability...');
    
    const isMobile = window.innerWidth <= 768;
    const hasMobileClass = document.body.classList.contains('mobile');
    const mobileClassCorrect = isMobile === hasMobileClass;
    
    results.mobileStable = mobileClassCorrect;
    console.log(`✅ Mobile detection: isMobile=${isMobile}, hasClass=${hasMobileClass}, correct=${mobileClassCorrect}`);
  }
  
  // Test 6: Game Containers
  function testGameContainers() {
    console.log('🔍 Testing game containers...');
    
    const flickwordContainer = document.querySelector('#flickwordTile');
    const triviaContainer = document.querySelector('#triviaTile');
    
    results.gameContainers = !!(flickwordContainer && triviaContainer);
    console.log(`✅ FlickWord container: ${!!flickwordContainer}, Trivia container: ${!!triviaContainer}`);
  }
  
  // Run all tests
  testTabsAboveResults();
  testThemingConsistency();
  testI18nWorking();
  testAuthProfileDisplay();
  testMobileStability();
  testGameContainers();
  
  // Summary
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log('📊 Verification Results:');
  console.log(`✅ Tabs Above Results: ${results.tabsAboveResults}`);
  console.log(`✅ Theming Consistent: ${results.themingConsistent}`);
  console.log(`✅ i18n Working: ${results.i18nWorking}`);
  console.log(`✅ Auth Profile Display: ${results.authProfileDisplay}`);
  console.log(`✅ Mobile Stable: ${results.mobileStable}`);
  console.log(`✅ Game Containers: ${results.gameContainers}`);
  console.log(`📈 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All core stabilization fixes verified successfully!');
  } else {
    console.log('⚠️ Some fixes need attention. Check the logs above.');
  }
  
  // Expose results globally for debugging
  window.verificationResults = results;
  
})();
