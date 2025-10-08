/**
 * Test script for module loading behavior
 * Run this in the browser console to test localhost vs production behavior
 */

(function testModuleLoading() {
  console.log('🧪 Testing Home verification module loading...');
  
  // Test 1: Check if we're on localhost
  const isLocalhost = location.hostname === 'localhost';
  console.log(`📍 Hostname: ${location.hostname}`);
  console.log(`🏠 Is localhost: ${isLocalhost}`);
  
  // Test 2: Check if dev tools are available
  const devToolsAvailable = typeof window.__DEV_TOOLS !== 'undefined';
  console.log(`🛠️  Dev tools available: ${devToolsAvailable}`);
  
  if (devToolsAvailable) {
    console.log('✅ Dev tools loaded successfully!');
    
    // Test 3: Check if all utilities are available
    const requiredUtils = [
      'verifyHomeFrames',
      'verifyRailNormalization', 
      'forceHomeVisible',
      'HOME_CARD_MATCHERS'
    ];
    
    const missingUtils = requiredUtils.filter(util => !window.__DEV_TOOLS[util]);
    if (missingUtils.length > 0) {
      console.error('❌ Missing utilities:', missingUtils);
    } else {
      console.log('✅ All utilities available:', requiredUtils);
    }
    
    // Test 4: Test utility functions
    try {
      const framesResult = window.__DEV_TOOLS.verifyHomeFrames();
      console.log('✅ verifyHomeFrames() executed successfully');
    } catch (error) {
      console.error('❌ verifyHomeFrames() failed:', error);
    }
    
    try {
      const railsResult = window.__DEV_TOOLS.verifyRailNormalization();
      console.log('✅ verifyRailNormalization() executed successfully');
    } catch (error) {
      console.error('❌ verifyRailNormalization() failed:', error);
    }
    
    try {
      const visibilityResult = window.__DEV_TOOLS.forceHomeVisible(true);
      console.log('✅ forceHomeVisible() executed successfully');
      window.__DEV_TOOLS.forceHomeVisible(false); // Cleanup
    } catch (error) {
      console.error('❌ forceHomeVisible() failed:', error);
    }
    
    // Test 5: Check HOME_CARD_MATCHERS structure
    const matchers = window.__DEV_TOOLS.HOME_CARD_MATCHERS;
    const requiredProps = ['cardsList', 'railsList', 'groupIds', 'panelCandidates'];
    const missingProps = requiredProps.filter(prop => !matchers[prop]);
    
    if (missingProps.length > 0) {
      console.error('❌ Missing matcher properties:', missingProps);
    } else {
      console.log('✅ HOME_CARD_MATCHERS structure valid');
    }
    
  } else {
    console.log('⚠️  Dev tools not available');
    
    if (isLocalhost) {
      console.log('❌ Expected dev tools on localhost but they are not loaded');
      console.log('Check browser console for import errors');
    } else {
      console.log('✅ Expected behavior: dev tools not loaded on non-localhost');
    }
  }
  
  // Test 6: Check for network requests
  console.log('\n🌐 Network requests check:');
  console.log('Look for /dev/verify-home.mjs in Network tab');
  console.log('Should only see request on localhost, not on production');
  
  // Summary
  const expectedBehavior = isLocalhost ? devToolsAvailable : !devToolsAvailable;
  console.log(`\n${expectedBehavior ? '✅' : '❌'} Module loading: ${expectedBehavior ? 'CORRECT' : 'INCORRECT'}`);
  
  if (isLocalhost && devToolsAvailable) {
    console.log('\n🎉 Localhost loading working correctly!');
    console.log('Available utilities:');
    console.log('- window.__DEV_TOOLS.verifyHomeFrames()');
    console.log('- window.__DEV_TOOLS.verifyRailNormalization()');
    console.log('- window.__DEV_TOOLS.forceHomeVisible(enable)');
    console.log('- window.__DEV_TOOLS.HOME_CARD_MATCHERS');
  } else if (!isLocalhost && !devToolsAvailable) {
    console.log('\n🎉 Production behavior working correctly!');
    console.log('No dev utilities loaded on production host');
  } else {
    console.log('\n⚠️  Unexpected behavior detected');
  }
  
})();


