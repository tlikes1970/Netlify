/* ============== Curated Sections Debug Test ==============
   Test script to diagnose why curated sections are missing
*/

(function() {
  'use strict';
  
  function testCuratedSections() {
    FlickletDebug.info('🧪 Testing curated sections...');
    
    // Test 1: Check if curatedSections element exists
    const curatedSections = document.getElementById('curatedSections');
    if (!curatedSections) {
      FlickletDebug.error('❌ curatedSections element not found');
      return false;
    }
    FlickletDebug.info('✅ curatedSections element found');
    
    // Test 2: Check localStorage data
    const trending = localStorage.getItem('curated:trending');
    const staff = localStorage.getItem('curated:staff');
    const newData = localStorage.getItem('curated:new');
    
    FlickletDebug.info('📊 localStorage data:', {
      trending: trending ? `${trending.length} chars` : 'null',
      staff: staff ? `${staff.length} chars` : 'null',
      newData: newData ? `${newData.length} chars` : 'null'
    });
    
    // Test 3: Check if renderCuratedHomepage function exists
    if (typeof window.renderCuratedHomepage !== 'function') {
      FlickletDebug.error('❌ renderCuratedHomepage function not available');
      return false;
    }
    FlickletDebug.info('✅ renderCuratedHomepage function available');
    
    // Test 4: Check curated sections content
    const content = curatedSections.innerHTML.trim();
    if (!content) {
      FlickletDebug.warn('⚠️ curatedSections is empty');
      
      // Try to trigger render
      FlickletDebug.info('🔄 Attempting to trigger curated render...');
      try {
        window.renderCuratedHomepage();
        setTimeout(() => {
          const newContent = curatedSections.innerHTML.trim();
          if (newContent) {
            FlickletDebug.info('✅ Curated sections rendered after trigger');
          } else {
            FlickletDebug.warn('⚠️ Curated sections still empty after trigger');
          }
        }, 1000);
      } catch (error) {
        FlickletDebug.error('❌ Error triggering curated render:', error);
      }
    } else {
      FlickletDebug.info('✅ curatedSections has content:', content.length, 'characters');
    }
    
    return true;
  }
  
  // Run test after a delay to ensure everything is loaded
  setTimeout(() => {
    testCuratedSections();
  }, 2000);
  
  FlickletDebug.info('🧪 Curated sections debug test loaded');
})();
