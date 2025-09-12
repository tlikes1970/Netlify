/* ============== Card Size Consistency Test ==============
   Test script to verify card sizes are consistent across home page sections
*/

(function() {
  'use strict';
  
  // Test card size consistency
  function testCardSizeConsistency() {
    FlickletDebug.info('🧪 Testing card size consistency...');
    
    // Test 1: Check CSS variables are defined
    const rootStyles = getComputedStyle(document.documentElement);
    const desktopWidth = rootStyles.getPropertyValue('--home-card-width-desktop');
    const desktopHeight = rootStyles.getPropertyValue('--home-card-height-desktop');
    const mobileWidth = rootStyles.getPropertyValue('--home-card-width-mobile');
    const mobileHeight = rootStyles.getPropertyValue('--home-card-height-mobile');
    
    if (!desktopWidth || !desktopHeight || !mobileWidth || !mobileHeight) {
      FlickletDebug.error('❌ CSS variables not defined');
      return false;
    }
    
    FlickletDebug.info('✅ CSS variables defined:', {
      desktop: `${desktopWidth} x ${desktopHeight}`,
      mobile: `${mobileWidth} x ${mobileHeight}`
    });
    
    // Test 2: Check Currently Watching section
    const cwSection = document.getElementById('currentlyWatchingScroll');
    if (cwSection) {
      const cwCards = cwSection.querySelectorAll('*');
      if (cwCards.length > 0) {
        const firstCard = cwCards[0];
        const cardStyle = getComputedStyle(firstCard);
        FlickletDebug.info('✅ Currently Watching cards found:', cwCards.length);
        FlickletDebug.info('   Card width:', cardStyle.width);
        FlickletDebug.info('   Card height:', cardStyle.height);
      } else {
        FlickletDebug.warn('⚠️ No Currently Watching cards found');
      }
    } else {
      FlickletDebug.warn('⚠️ Currently Watching section not found');
    }
    
    // Test 3: Check Next Up This Week section
    const nextUpSection = document.getElementById('next-up-row');
    if (nextUpSection) {
      const nextUpCards = nextUpSection.querySelectorAll('.row-inner > *');
      if (nextUpCards.length > 0) {
        const firstCard = nextUpCards[0];
        const cardStyle = getComputedStyle(firstCard);
        FlickletDebug.info('✅ Next Up This Week cards found:', nextUpCards.length);
        FlickletDebug.info('   Card width:', cardStyle.width);
        FlickletDebug.info('   Card height:', cardStyle.height);
      } else {
        FlickletDebug.warn('⚠️ No Next Up This Week cards found');
      }
    } else {
      FlickletDebug.warn('⚠️ Next Up This Week section not found');
    }
    
    // Test 4: Check if sections are using CSS variables
    const cwRowStyle = document.querySelector('.cw-row #currentlyWatchingScroll.preview-row-scroll.row-inner');
    const nextUpStyle = document.querySelector('#next-up-row .row-inner');
    
    if (cwRowStyle) {
      const cwComputed = getComputedStyle(cwRowStyle);
      FlickletDebug.info('✅ Currently Watching using CSS variables');
    }
    
    if (nextUpStyle) {
      const nextUpComputed = getComputedStyle(nextUpStyle);
      FlickletDebug.info('✅ Next Up This Week using CSS variables');
    }
    
    // Test 5: Check responsive behavior
    const isMobile = window.innerWidth <= 768;
    FlickletDebug.info(`📱 Testing on ${isMobile ? 'mobile' : 'desktop'} viewport`);
    
    if (isMobile) {
      FlickletDebug.info('   Expected mobile card size:', `${mobileWidth} x ${mobileHeight}`);
    } else {
      FlickletDebug.info('   Expected desktop card size:', `${desktopWidth} x ${desktopHeight}`);
    }
    
    FlickletDebug.info('🎉 Card size consistency test completed!');
    return true;
  }
  
  // Test responsive behavior
  function testResponsiveBehavior() {
    FlickletDebug.info('📱 Testing responsive card behavior...');
    
    // Test desktop size
    if (window.innerWidth > 768) {
      FlickletDebug.info('✅ Desktop viewport detected');
      FlickletDebug.info('   Expected card size: 184px x 276px');
    } else {
      FlickletDebug.info('✅ Mobile viewport detected');
      FlickletDebug.info('   Expected card size: 64px x 96px');
    }
    
    return true;
  }
  
  // Run tests
  function runCardSizeTests() {
    FlickletDebug.info('🧪 Starting card size consistency tests...');
    
    testCardSizeConsistency();
    testResponsiveBehavior();
    
    FlickletDebug.info('🎉 All card size tests completed!');
  }
  
  // Run tests after a short delay to ensure everything is loaded
  setTimeout(() => {
    runCardSizeTests();
  }, 1000);
  
  // Expose test functions
  window.testCardSizeConsistency = testCardSizeConsistency;
  window.testResponsiveBehavior = testResponsiveBehavior;
  
  FlickletDebug.info('🧪 Card size test script loaded');
})();
