/**
 * Quick Evidence Test - Run this in browser console
 * This will load the evidence collector and test the layout fixes
 */

// Load the evidence collector
(async () => {
  console.log('🔍 Loading Home Layout Evidence Collector...');
  
  try {
    // Create and load the script
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '/scripts/dom-audit-home.mjs?cb=' + Date.now();
    document.head.appendChild(script);
    
    // Wait for evidence collection
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    // Test the fixes
    if (window.__HOME_EVIDENCE__) {
      const ev = window.__HOME_EVIDENCE__;
      const badPanels = ev.panels.filter(p => 
        p.visibility?.display !== 'none' && 
        (p.display !== 'block' || 
         !(p.paddingLeft === '32px' && p.paddingRight === '32px'))
      ).length;
      
      const badActions = ev.actions.filter(a => a.display !== 'grid').length;
      
      console.log('📊 Layout Fix Test Results:');
      console.log({ badPanels, badActions });
      
      if (badPanels === 0 && badActions === 0) {
        console.log('✅ SUCCESS: All layout issues fixed!');
      } else {
        console.log('❌ ISSUES REMAIN:');
        if (badPanels > 0) console.log(`  - ${badPanels} panels with wrong display/padding`);
        if (badActions > 0) console.log(`  - ${badActions} actions with wrong display`);
        
        // Show details
        console.log('🔍 Panel Issues:');
        ev.panels.filter(p => 
          p.visibility?.display !== 'none' && 
          (p.display !== 'block' || 
           !(p.paddingLeft === '32px' && p.paddingRight === '32px'))
        ).forEach(p => {
          console.log(`  ${p.cssPath}: display=${p.display}, padding=${p.paddingLeft}/${p.paddingRight}`);
        });
        
        console.log('🔍 Action Issues:');
        ev.actions.filter(a => a.display !== 'grid').forEach(a => {
          console.log(`  ${a.cssPath}: display=${a.display}`);
        });
      }
      
      return { badPanels, badActions };
    } else {
      console.warn('⚠️ Evidence collection failed - no data found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
})();

