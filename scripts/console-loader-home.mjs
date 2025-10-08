/**
 * Console Loader for Home Layout Evidence Collection
 * Self-invoking snippet for easy browser console testing
 */

// Self-invoking loader function
const loadHomeEvidence = async () => {
  console.log('🔍 Loading Home Layout Evidence Collector...');
  
  try {
    // Create script element
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '/scripts/dom-audit-home.mjs?cb=' + Date.now();
    
    // Add to head
    document.head.appendChild(script);
    
    // Wait for script to load and execute
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      setTimeout(resolve, 2000); // Fallback timeout
    });
    
    // Check if evidence was collected
    if (window.__HOME_EVIDENCE__) {
      console.log('✅ Evidence collection complete!');
      console.log('📊 Summary:', {
        panels: window.__HOME_EVIDENCE__.panels.length,
        actions: window.__HOME_EVIDENCE__.actions.length,
        rails: window.__HOME_EVIDENCE__.rails.length,
        suspects: window.__HOME_EVIDENCE__.suspects?.length || 0,
        skipped: window.__HOME_EVIDENCE__.skipped?.length || 0
      });
      
      // Show suspects if any
      if (window.__HOME_EVIDENCE__.suspects?.length > 0) {
        console.log('🚨 Layout Violations Found:');
        console.table(window.__HOME_EVIDENCE__.suspects);
      }
      
      // Show CSS variables
      if (window.__HOME_EVIDENCE__.variables) {
        console.log('🎨 CSS Variables:');
        console.table(window.__HOME_EVIDENCE__.variables);
      }
      
      return window.__HOME_EVIDENCE__;
    } else {
      console.warn('⚠️ Evidence collection may have failed - no data found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error loading evidence collector:', error);
    return null;
  }
};

// Export for manual use
window.loadHomeEvidence = loadHomeEvidence;

// Auto-run if in console context
if (typeof window !== 'undefined' && window.console) {
  console.log('🚀 Home Layout Evidence Collector Ready');
  console.log('📝 Paste this in console to run: loadHomeEvidence()');
  console.log('📝 Or use the one-liner: await (async()=>{const s=document.createElement("script");s.type="module";s.src="/scripts/dom-audit-home.mjs?cb="+Date.now();document.head.appendChild(s);})();');
}

