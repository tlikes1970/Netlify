// Phase 2 Cleanup Test - Deduplication Verification Script
// Run this in DevTools console to verify no duplicates remain

(function() {
  'use strict';
  
  console.log('🧪 Phase 2 Cleanup Test Starting...');
  
  // Test 1: Home Layout v2 enabled
  const v2Enabled = !!(window.FLAGS && window.FLAGS.home_layout_v2);
  console.log('✅ Home Layout v2 enabled:', v2Enabled ? 'PASS' : 'FAIL');
  
  // Test 2: Body attribute set
  const bodyAttribute = document.body.hasAttribute('data-home-layout-v2');
  console.log('✅ Body attribute set:', bodyAttribute ? 'PASS' : 'FAIL');
  
  // Test 3: Community section structure
  const communitySection = document.getElementById('section-community');
  const communityBody = communitySection?.querySelector('.section__body');
  const communityChildren = communityBody?.children || [];
  
  const hasSpotlight = Array.from(communityChildren).some(child => 
    child.id === 'spotlight-row' || child.classList.contains('spotlight')
  );
  const hasGames = Array.from(communityChildren).some(child => 
    child.id === 'community-games' || child.classList.contains('community-games')
  );
  
  console.log('✅ Community section structure:', (hasSpotlight && hasGames) ? 'PASS' : 'FAIL');
  console.log('  - Spotlight present:', hasSpotlight);
  console.log('  - Games present:', hasGames);
  console.log('  - Total children:', communityChildren.length);
  
  // Test 4: No duplicate Play Along sections (moved to Community section)
  const playAlongSections = document.querySelectorAll('#playalong-row, [data-feature="homeRowPlayAlong"]');
  const visiblePlayAlong = Array.from(playAlongSections).filter(section => 
    section.offsetParent !== null && !section.hidden
  );
  
  console.log('✅ No duplicate Play Along sections:', playAlongSections.length === 0 ? 'PASS' : 'FAIL');
  console.log('  - Total Play Along sections found:', playAlongSections.length);
  console.log('  - Note: Play Along games moved to Community section');
  
  // Test 5: Feedback banner only (no form)
  const feedbackSections = document.querySelectorAll('[id*="feedback"], .feedback-card, .feedback-form');
  const feedbackBanners = document.querySelectorAll('.feedback-banner');
  const feedbackForms = document.querySelectorAll('form[name="feedback"]');
  
  const hasOnlyBanner = feedbackBanners.length > 0 && feedbackForms.length === 0;
  console.log('✅ Feedback banner only (no form):', hasOnlyBanner ? 'PASS' : 'FAIL');
  console.log('  - Feedback banners:', feedbackBanners.length);
  console.log('  - Feedback forms:', feedbackForms.length);
  console.log('  - Total feedback elements:', feedbackSections.length);
  
  // Test 6: Legacy sections hidden
  const legacySections = document.querySelectorAll('[data-legacy-home]');
  const visibleLegacy = Array.from(legacySections).filter(section => 
    section.offsetParent !== null && !section.hidden
  );
  
  console.log('✅ Legacy sections hidden:', visibleLegacy.length === 0 ? 'PASS' : 'FAIL');
  console.log('  - Total legacy sections:', legacySections.length);
  console.log('  - Visible legacy sections:', visibleLegacy.length);
  
  // Test 7: Section order maintained (Option B)
  const expectedOrder = [
    'section-my-library',
    'section-community',
    'section-curated',
    'section-personalized',
    'section-theaters',
    'section-feedback'
  ];
  
  const sections = expectedOrder.map(id => document.getElementById(id));
  const sectionPositions = sections.map(section => section?.offsetTop || Infinity);
  const isOrdered = sectionPositions.every((pos, i) => i === 0 || pos >= sectionPositions[i - 1]);
  
  console.log('✅ Section order maintained:', isOrdered ? 'PASS' : 'FAIL');
  console.log('  - Expected order:', expectedOrder);
  console.log('  - Actual positions:', sectionPositions);
  
  // Test 8: No duplicate section headers
  const sectionHeaders = document.querySelectorAll('.section__header h3, .section-title');
  const headerTexts = Array.from(sectionHeaders).map(h => h.textContent.trim());
  const uniqueHeaders = [...new Set(headerTexts)];
  
  const hasDuplicates = headerTexts.length !== uniqueHeaders.length;
  console.log('✅ No duplicate section headers:', !hasDuplicates ? 'PASS' : 'FAIL');
  console.log('  - Total headers:', headerTexts.length);
  console.log('  - Unique headers:', uniqueHeaders.length);
  if (hasDuplicates) {
    const duplicates = headerTexts.filter((text, index) => headerTexts.indexOf(text) !== index);
    console.log('  - Duplicate headers:', [...new Set(duplicates)]);
  }
  
  // Test 9: Community games integration
  const communityGames = document.getElementById('community-games');
  const gamesPlaceholder = document.querySelector('.community-games-placeholder');
  const hasGamesContent = !!(communityGames || gamesPlaceholder);
  
  console.log('✅ Community games integration:', hasGamesContent ? 'PASS' : 'FAIL');
  console.log('  - Games container:', !!communityGames);
  console.log('  - Games placeholder:', !!gamesPlaceholder);
  
  // Test 10: Router functionality
  const routerExists = !!(window.router && typeof window.router.navigate === 'function');
  const searchSection = document.getElementById('searchSection');
  const searchHidden = searchSection && searchSection.style.display === 'none';
  
  console.log('✅ Router functionality:', routerExists && searchHidden ? 'PASS' : 'FAIL');
  console.log('  - Router exists:', routerExists);
  console.log('  - Search section hidden:', searchHidden);
  
  // Overall result
  const allTests = [
    v2Enabled,
    bodyAttribute,
    hasSpotlight && hasGames,
    visiblePlayAlong.length === 0,
    hasOnlyBanner,
    visibleLegacy.length === 0,
    isOrdered,
    !hasDuplicates,
    hasGamesContent,
    routerExists && searchHidden
  ];
  
  const allPassed = allTests.every(test => test);
  console.log('🎯 Overall result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (!allPassed) {
    console.log('🔧 Debug info:');
    console.log('- window.FLAGS:', window.FLAGS);
    console.log('- Community section:', communitySection);
    console.log('- Play Along sections:', playAlongSections);
    console.log('- Feedback elements:', feedbackSections);
    console.log('- Legacy sections:', legacySections);
    console.log('- Section headers:', headerTexts);
  }
  
  // Test navigation to verify no duplicates appear
  console.log('🧪 Testing navigation to verify no duplicates...');
  if (window.router) {
    console.log('  - Current route:', window.router.getCurrentRoute());
    
    // Test search navigation
    console.log('  - Testing search navigation...');
    window.router.navigate('/search?q=test');
    setTimeout(() => {
      console.log('  - After search navigation - checking for duplicates...');
      
      // Re-run duplicate checks after navigation
      const playAlongAfterNav = document.querySelectorAll('#playalong-row, [data-feature="homeRowPlayAlong"]');
      const visiblePlayAlongAfterNav = Array.from(playAlongAfterNav).filter(section => 
        section.offsetParent !== null && !section.hidden
      );
      console.log('  - Play Along sections after nav:', visiblePlayAlongAfterNav.length);
      
      // Test back to home
      console.log('  - Testing back to home...');
      window.router.navigate('/');
      setTimeout(() => {
        console.log('  - After home navigation - checking for duplicates...');
        const playAlongAfterHome = document.querySelectorAll('#playalong-row, [data-feature="homeRowPlayAlong"]');
        const visiblePlayAlongAfterHome = Array.from(playAlongAfterHome).filter(section => 
          section.offsetParent !== null && !section.hidden
        );
        console.log('  - Play Along sections after home:', visiblePlayAlongAfterHome.length);
      }, 100);
    }, 100);
  }
  
  return allPassed;
})();
