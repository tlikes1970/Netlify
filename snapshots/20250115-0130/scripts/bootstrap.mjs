/**
 * Process: Bootstrap Script
 * Purpose: Initialize core systems and defer heavy modules
 * Data Source: Core app initialization
 * Update Path: Runs on DOMContentLoaded
 * Dependencies: flags.js, other core modules
 */

// Initialize core systems on DOM ready
function initializeCore() {
  console.log('🚀 Bootstrap: Initializing core systems...');
  
  // Initialize flags first
  if (typeof window.FLAGS !== 'undefined') {
    console.log('✅ Flags system ready');
  }
  
  // Initialize other core systems
  if (typeof window.appData !== 'undefined') {
    console.log('✅ App data ready');
  }
  
  // Defer heavy modules after paint/idle
  if (window.requestIdleCallback) {
    requestIdleCallback(() => {
      loadHeavyModules();
    });
  } else {
    setTimeout(() => {
      loadHeavyModules();
    }, 100);
  }
}

// Load heavy modules dynamically - only after user interaction or idle
async function loadHeavyModules() {
  console.log('📦 Bootstrap: Loading heavy modules...');
  
  try {
    // Load i18n first (lightweight)
    await import('/js/i18n.js');
    console.log('✅ i18n loaded');
    
    // Load app (medium weight)
    await import('/js/app.js');
    console.log('✅ app loaded');
    
    // Load functions last (heaviest)
    await import('/js/functions.js');
    console.log('✅ functions loaded');
    
    console.log('✅ All heavy modules loaded');
  } catch (error) {
    console.error('❌ Failed to load heavy modules:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCore);
} else {
  initializeCore();
}

// Export for manual triggering
window.initializeCore = initializeCore;
window.loadHeavyModules = loadHeavyModules;
