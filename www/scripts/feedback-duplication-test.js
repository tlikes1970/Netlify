// Feedback Duplication Test - Verify only one feedback system is visible on home page
// Run this in DevTools console to check for duplicate feedback systems

(function() {
  'use strict';
  
  console.log('🧪 Feedback Duplication Test Starting...');
  
  // Test 1: Check if Home Layout v2 is active
  const homeLayoutV2Active = document.body.hasAttribute('data-home-layout-v2');
  console.log('✅ Home Layout v2 active:', homeLayoutV2Active ? 'PASS' : 'FAIL');
  
  // Test 2: Count feedback sections on home page
  const originalFeedbackSection = document.getElementById('feedbackSection');
  const v2FeedbackSection = document.getElementById('section-feedback');
  const settingsFeedbackForm = document.querySelector('#settingsSection form[name="feedback"]');
  
  const originalExists = !!originalFeedbackSection;
  const v2Exists = !!v2FeedbackSection;
  const settingsExists = !!settingsFeedbackForm;
  
  console.log('✅ Original feedback section exists:', originalExists ? 'PASS' : 'FAIL');
  console.log('✅ V2 feedback section exists:', v2Exists ? 'PASS' : 'FAIL');
  console.log('✅ Settings feedback form exists:', settingsExists ? 'PASS' : 'FAIL');
  
  // Test 3: Check visibility of home page feedback sections
  let originalVisible = false;
  let v2Visible = false;
  
  if (originalFeedbackSection) {
    const originalStyle = window.getComputedStyle(originalFeedbackSection);
    originalVisible = originalStyle.display !== 'none';
  }
  
  if (v2FeedbackSection) {
    const v2Style = window.getComputedStyle(v2FeedbackSection);
    v2Visible = v2Style.display !== 'none';
  }
  
  console.log('✅ Original feedback section visible:', originalVisible ? 'FAIL (should be hidden)' : 'PASS');
  console.log('✅ V2 feedback section visible:', v2Visible ? 'PASS' : 'FAIL (should be visible)');
  
  // Test 4: Check feedback banner in V2 section
  if (v2FeedbackSection) {
    const v2Body = document.getElementById('section-feedback-body');
    const feedbackBanner = v2Body?.querySelector('.feedback-banner');
    const feedbackForm = v2Body?.querySelector('form[name="feedback"]');
    
    const hasBanner = !!feedbackBanner;
    const hasForm = !!feedbackForm;
    
    console.log('✅ V2 section has feedback banner:', hasBanner ? 'PASS' : 'FAIL');
    console.log('✅ V2 section has NO feedback form:', !hasForm ? 'PASS' : 'FAIL (should be banner only)');
    
    if (feedbackBanner) {
      const bannerBtn = feedbackBanner.querySelector('.feedback-banner__btn');
      console.log('✅ Feedback banner has button:', !!bannerBtn ? 'PASS' : 'FAIL');
    }
  }
  
  // Test 5: Count all feedback forms (should be 1 - in settings only)
  const allFeedbackForms = document.querySelectorAll('form[name="feedback"]');
  const homePageForms = Array.from(allFeedbackForms).filter(form => {
    const section = form.closest('#homeSection, #feedbackSection, #section-feedback');
    return !!section;
  });
  
  console.log('✅ Total feedback forms:', allFeedbackForms.length === 1 ? 'PASS' : 'FAIL');
  console.log('  - Total forms found:', allFeedbackForms.length);
  console.log('  - Home page forms:', homePageForms.length);
  
  // Test 6: Check for duplicate feedback titles
  const allFeedbackTitles = document.querySelectorAll('h2, h3, h4');
  const feedbackTitles = Array.from(allFeedbackTitles).filter(el => 
    el.textContent.toLowerCase().includes('feedback') || 
    el.textContent.toLowerCase().includes('share your thoughts') ||
    el.textContent.toLowerCase().includes('help us improve')
  );
  
  console.log('✅ Feedback titles count:', feedbackTitles.length <= 2 ? 'PASS' : 'FAIL');
  console.log('  - Found', feedbackTitles.length, 'feedback-related titles');
  feedbackTitles.forEach((title, index) => {
    console.log(`  - Title ${index + 1}:`, title.textContent.trim());
  });
  
  // Test 7: Check feedback banner functionality
  const feedbackBannerBtn = document.querySelector('.feedback-banner__btn');
  if (feedbackBannerBtn) {
    console.log('✅ Feedback banner button found:', 'PASS');
    console.log('  - Button text:', feedbackBannerBtn.textContent.trim());
    console.log('  - Button clickable:', !feedbackBannerBtn.disabled ? 'PASS' : 'FAIL');
  } else {
    console.log('❌ Feedback banner button not found');
  }
  
  // Overall result
  const noDuplication = !originalVisible && v2Visible && allFeedbackForms.length === 1;
  console.log('🎯 Overall result:', noDuplication ? '✅ NO DUPLICATION - FIXED' : '❌ DUPLICATION STILL EXISTS');
  
  if (!noDuplication) {
    console.log('🔧 Debug info:');
    console.log('- Original section:', originalFeedbackSection);
    console.log('- V2 section:', v2FeedbackSection);
    console.log('- Settings form:', settingsFeedbackForm);
    console.log('- All forms:', allFeedbackForms);
    console.log('- Feedback titles:', feedbackTitles);
  }
  
  return noDuplication;
})();
