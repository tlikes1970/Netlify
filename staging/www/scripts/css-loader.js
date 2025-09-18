/**
 * Process: Async CSS Loader
 * Purpose: Load non-critical CSS asynchronously to improve initial page load
 * Data Source: CSS link elements
 * Update Path: Update CSS files list if needed
 * Dependencies: DOM API
 */

export function loadCSSAsync() {
  // List of non-critical CSS files to load asynchronously
  const nonCriticalCSS = [
    '/styles/consolidated.css',
    '/styles/action-bar.css',
    '/styles/card-system.css', 
    '/styles/components.css',
    '/styles/consolidated-layout.css',
    '/styles/mobile.css'
  ];

  // Function to load a single CSS file
  function loadCSSFile(href) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = 'print';
      link.onload = () => {
        link.media = 'all';
        resolve();
      };
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }

  // Load all non-critical CSS files
  function loadAllCSS() {
    console.log('🎨 Loading non-critical CSS asynchronously...');
    
    const loadPromises = nonCriticalCSS.map(href => 
      loadCSSFile(href).catch(error => {
        console.warn(`⚠️ Failed to load CSS: ${href}`, error);
      })
    );

    Promise.all(loadPromises).then(() => {
      console.log('✅ All non-critical CSS loaded');
    });
  }

  // Load CSS after page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllCSS);
  } else {
    loadAllCSS();
  }
}

// Auto-initialize if loaded as module
if (typeof window !== 'undefined') {
  loadCSSAsync();
}
