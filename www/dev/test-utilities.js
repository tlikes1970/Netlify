/**
 * Test script for Home verification utilities
 * Run this in the browser console to test all utilities
 */

(function testHomeUtilities() {
  console.log('🧪 Testing Home verification utilities...');
  
  // Test 1: Check if utilities are available
  if (!window.__DEV_TOOLS) {
    console.error('❌ window.__DEV_TOOLS not found. Make sure dev utilities are loaded.');
    return;
  }
  
  const requiredUtils = [
    'verifyHomeFrames',
    'verifyRailNormalization', 
    'forceHomeVisible',
    'HOME_CARD_MATCHERS'
  ];
  
  const missingUtils = requiredUtils.filter(util => !window.__DEV_TOOLS[util]);
  if (missingUtils.length > 0) {
    console.error('❌ Missing utilities:', missingUtils);
    return;
  }
  
  console.log('✅ All utilities available');
  
  // Test 2: Check HOME_CARD_MATCHERS structure
  const matchers = window.__DEV_TOOLS.HOME_CARD_MATCHERS;
  const requiredProps = ['cards', 'rails', 'groups', 'panels'];
  const missingProps = requiredProps.filter(prop => !matchers[prop]);
  
  if (missingProps.length > 0) {
    console.error('❌ Missing matcher properties:', missingProps);
    return;
  }
  
  console.log('✅ HOME_CARD_MATCHERS structure valid');
  console.log('Matchers:', matchers);
  
  // Test 3: Test forceHomeVisible
  console.log('\n🔧 Testing forceHomeVisible...');
  
  const initialState = window.__DEV_TOOLS.forceHomeVisible(true);
  console.log('Initial enable:', initialState);
  
  const disableState = window.__DEV_TOOLS.forceHomeVisible(false);
  console.log('Disable:', disableState);
  
  const reEnableState = window.__DEV_TOOLS.forceHomeVisible(true);
  console.log('Re-enable:', reEnableState);
  
  // Check if style element was created
  const styleEl = document.getElementById('force-home-visible');
  if (styleEl) {
    console.log('✅ forceHomeVisible created style element');
  } else {
    console.error('❌ forceHomeVisible did not create style element');
  }
  
  // Test 4: Test verification functions (if Home section exists)
  const homeSection = document.getElementById('homeSection');
  if (homeSection) {
    console.log('\n🔍 Testing verification functions...');
    
    try {
      const framesResult = window.__DEV_TOOLS.verifyHomeFrames();
      console.log('✅ verifyHomeFrames executed successfully');
      console.log('Frames result:', framesResult);
    } catch (error) {
      console.error('❌ verifyHomeFrames failed:', error);
    }
    
    try {
      const railsResult = window.__DEV_TOOLS.verifyRailNormalization();
      console.log('✅ verifyRailNormalization executed successfully');
      console.log('Rails result:', railsResult);
    } catch (error) {
      console.error('❌ verifyRailNormalization failed:', error);
    }
  } else {
    console.log('⚠️  Home section not found, skipping verification tests');
    console.log('Try: window.__DEV_TOOLS.forceHomeVisible(true) to make it visible');
  }
  
  // Test 5: Cleanup
  window.__DEV_TOOLS.forceHomeVisible(false);
  console.log('\n🧹 Cleanup completed');
  
  console.log('\n✅ All tests completed successfully!');
  console.log('\nAvailable utilities:');
  console.log('- window.__DEV_TOOLS.verifyHomeFrames()');
  console.log('- window.__DEV_TOOLS.verifyRailNormalization()');
  console.log('- window.__DEV_TOOLS.forceHomeVisible(enable)');
  console.log('- window.__DEV_TOOLS.HOME_CARD_MATCHERS');
  
})();



