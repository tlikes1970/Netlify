/**
 * Process: CSS Async Loader
 * Purpose: Load non-critical CSS asynchronously after page load
 * Data Source: CSS files in /styles/ directory
 * Update Path: Loaded after DOMContentLoaded
 * Dependencies: None
 */

// CSS files to load asynchronously (non-critical)
const asyncCSSFiles = [
  '/styles/main.css',
  '/styles/card-system.css',
  '/styles/components.css',
  '/styles/consolidated-layout.css',
  '/styles/action-bar.css',
  '/styles/mobile.css',
  '/styles/inline-style-01.css',
  '/styles/inline-style-02.css'
];

// Load CSS file asynchronously
function loadCSS(href) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
    document.head.appendChild(link);
  });
}

// Load all async CSS files
async function loadAsyncCSS() {
  console.log('🎨 Loading non-critical CSS...');
  
  try {
    // Load CSS files in parallel
    const loadPromises = asyncCSSFiles.map(href => loadCSS(href));
    await Promise.all(loadPromises);
    console.log('✅ All CSS loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load some CSS files:', error);
  }
}

// Load CSS after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Use requestIdleCallback if available, otherwise setTimeout
    if (window.requestIdleCallback) {
      requestIdleCallback(() => loadAsyncCSS());
    } else {
      setTimeout(() => loadAsyncCSS(), 100);
    }
  });
} else {
  // DOM already ready
  if (window.requestIdleCallback) {
    requestIdleCallback(() => loadAsyncCSS());
  } else {
    setTimeout(() => loadAsyncCSS(), 100);
  }
}

// Export for manual triggering
window.loadAsyncCSS = loadAsyncCSS;
