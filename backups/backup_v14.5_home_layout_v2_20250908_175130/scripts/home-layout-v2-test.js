// Home Layout v2 Test - Phase 2 Verification Script
// Run this in DevTools console to verify Home Layout v2 is working

(function() {
  'use strict';
  
  console.log('🧪 Home Layout v2 Test Starting...');
  
  // Test 1: Feature flag enabled
  const flagCheck = !!(window.FLAGS && window.FLAGS.home_layout_v2);
  console.log('✅ Feature flag check:', flagCheck ? 'PASS' : 'FAIL', '- window.FLAGS.home_layout_v2 =', window.FLAGS?.home_layout_v2);
  
  // Test 2: Section structure exists
  const sections = [
    'section-my-library',
    'section-community', 
    'section-curated',
    'section-personalized',
    'section-theaters',
    'section-feedback'
  ];
  
  const sectionChecks = sections.map(id => {
    const section = document.getElementById(id);
    const hasHeader = section && section.querySelector('.section__header');
    const hasBody = section && section.querySelector('.section__body');
    return { id, exists: !!section, hasHeader, hasBody };
  });
  
  console.log('✅ Section structure check:', sectionChecks.every(s => s.exists && s.hasHeader && s.hasBody) ? 'PASS' : 'FAIL');
  sectionChecks.forEach(s => {
    console.log(`  - ${s.id}: ${s.exists ? 'EXISTS' : 'MISSING'} ${s.hasHeader ? 'HAS_HEADER' : 'NO_HEADER'} ${s.hasBody ? 'HAS_BODY' : 'NO_BODY'}`);
  });
  
  // Test 3: Section order (Option B)
  const sectionOrder = sections.map(id => {
    const section = document.getElementById(id);
    return section ? section.offsetTop : Infinity;
  });
  
  const isOrdered = sectionOrder.every((top, i) => i === 0 || top >= sectionOrder[i - 1]);
  console.log('✅ Section order check (Option B):', isOrdered ? 'PASS' : 'FAIL');
  
  // Test 4: Community section layout
  const communitySection = document.getElementById('section-community');
  const hasCommunityClass = communitySection && communitySection.classList.contains('section--community');
  const hasTwoColumnLayout = communitySection && communitySection.querySelector('.section--community .section__body');
  console.log('✅ Community layout check:', hasCommunityClass && hasTwoColumnLayout ? 'PASS' : 'FAIL');
  
  // Test 5: Router functionality
  const routerExists = !!(window.router && typeof window.router.navigate === 'function');
  console.log('✅ Router check:', routerExists ? 'PASS' : 'FAIL', '- window.router =', typeof window.router);
  
  // Test 6: Search route
  const searchSection = document.getElementById('searchSection');
  const hasSearchSection = !!searchSection;
  const searchHidden = searchSection && searchSection.style.display === 'none';
  console.log('✅ Search route check:', hasSearchSection && searchHidden ? 'PASS' : 'FAIL');
  
  // Test 7: Feedback banner
  const feedbackBanner = document.querySelector('.feedback-banner');
  const feedbackBtn = document.getElementById('feedback-banner-btn');
  const hasFeedbackBanner = !!(feedbackBanner && feedbackBtn);
  console.log('✅ Feedback banner check:', hasFeedbackBanner ? 'PASS' : 'FAIL');
  
  // Test 8: i18n keys
  const i18nKeys = [
    'home.my_library',
    'home.community', 
    'home.curated',
    'home.personalized',
    'home.theaters',
    'home.feedback',
    'feedback.banner_cta',
    'feedback.modal_title'
  ];
  
  const i18nChecks = i18nKeys.map(key => {
    const element = document.querySelector(`[data-i18n="${key}"]`);
    return { key, exists: !!element };
  });
  
  const i18nPassed = i18nChecks.every(check => check.exists);
  console.log('✅ i18n keys check:', i18nPassed ? 'PASS' : 'FAIL');
  i18nChecks.forEach(check => {
    if (!check.exists) {
      console.log(`  - Missing: ${check.key}`);
    }
  });
  
  // Test 9: Sticky search preservation (no overflow/transform/contain on ancestors)
  const topSearch = document.querySelector('.top-search');
  const stickySearchPreserved = !topSearch || !hasOverflowTransformContain(topSearch);
  console.log('✅ Sticky search preservation:', stickySearchPreserved ? 'PASS' : 'FAIL');
  
  // Helper function to check for problematic CSS properties
  function hasOverflowTransformContain(element) {
    const style = window.getComputedStyle(element);
    const parent = element.parentElement;
    
    if (style.overflow !== 'visible' || style.transform !== 'none' || style.contain !== 'none') {
      return true;
    }
    
    if (parent && parent !== document.body) {
      return hasOverflowTransformContain(parent);
    }
    
    return false;
  }
  
  // Test 10: Card v2 integration
  const cardV2Enabled = !!(window.FLAGS && window.FLAGS.cards_v2);
  const cardComponentExists = !!(window.Card && typeof window.Card === 'function');
  const v2CardsInDOM = document.querySelectorAll('.card.card--compact').length > 0;
  console.log('✅ Card v2 integration:', cardV2Enabled && cardComponentExists ? 'PASS' : 'FAIL');
  console.log('  - Card v2 enabled:', cardV2Enabled);
  console.log('  - Card component exists:', cardComponentExists);
  console.log('  - V2 cards in DOM:', v2CardsInDOM);
  
  // Overall result
  const allTests = [
    flagCheck,
    sectionChecks.every(s => s.exists && s.hasHeader && s.hasBody),
    isOrdered,
    hasCommunityClass && hasTwoColumnLayout,
    routerExists,
    hasSearchSection && searchHidden,
    hasFeedbackBanner,
    i18nPassed,
    stickySearchPreserved,
    cardV2Enabled && cardComponentExists
  ];
  
  const allPassed = allTests.every(test => test);
  console.log('🎯 Overall result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (!allPassed) {
    console.log('🔧 Debug info:');
    console.log('- window.FLAGS:', window.FLAGS);
    console.log('- window.router:', window.router);
    console.log('- window.Card:', window.Card);
    console.log('- Section elements:', sections.map(id => document.getElementById(id)));
    console.log('- Search section:', searchSection);
    console.log('- Feedback banner:', feedbackBanner);
  }
  
  // Test navigation
  console.log('🧪 Testing navigation...');
  if (window.router) {
    console.log('  - Current route:', window.router.getCurrentRoute());
    console.log('  - Current params:', window.router.getCurrentParams());
    
    // Test search navigation
    console.log('  - Testing search navigation...');
    window.router.navigate('/search?q=test');
    setTimeout(() => {
      console.log('  - After search navigation:', window.router.getCurrentRoute(), window.router.getCurrentParams());
      
      // Test back to home
      console.log('  - Testing back to home...');
      window.router.navigate('/');
      setTimeout(() => {
        console.log('  - After home navigation:', window.router.getCurrentRoute(), window.router.getCurrentParams());
      }, 100);
    }, 100);
  }
  
  return allPassed;
})();
