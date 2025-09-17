/**
 * Process: Script Bundler
 * Purpose: Load non-critical scripts after DOM ready and idle
 * Data Source: Script files that can be deferred
 * Update Path: Loaded after DOMContentLoaded + idle
 * Dependencies: None
 */

// Scripts to load after DOM ready (non-critical)
const deferredScripts = [
  '/scripts/inline-script-01.js',
  '/scripts/inline-script-02.js',
  '/scripts/inline-script-03.js',
  '/scripts/trivia.js',
  '/scripts/flickword-home-only.js.txt',
  '/scripts/community-player.js',
  '/scripts/quotes-enhanced.js',
  '/scripts/settings-tie-ins.js',
  '/scripts/notifications-test.js',
  '/scripts/pro-preview.js',
  '/scripts/share-enhanced.js',
  '/scripts/export-csv.js',
  '/scripts/episode-tracking.js',
  '/scripts/community-spotlight.js',
  '/scripts/curated-rows.js',
  '/scripts/curated-seed.js',
  '/scripts/list-actions.js',
  '/scripts/data/user-settings.js',
  '/scripts/api/content.js',
  '/scripts/rows/personalized.js',
  '/scripts/settings/my-rows.js',
  '/scripts/share-modal.js',
  '/scripts/search-tips.js',
  '/scripts/series-org.js',
  '/scripts/tmdb-seed.js',
  '/scripts/pro-gate.js',
  '/scripts/currently-watching-preview.js',
  '/scripts/next-up-this-week.js',
  '/scripts/community-spotlight.js',
  '/scripts/curated-rows.js',
  '/scripts/curated-seed.js',
  '/scripts/list-actions.js',
  '/scripts/router.js',
  '/scripts/home.js',
  '/scripts/performance-monitor.js',
  '/scripts/components/ActionBar.js',
  '/scripts/components/Card.js',
  '/scripts/auth.js',
  '/scripts/notifications.js',
  '/scripts/centralized-add-handler.js',
  '/scripts/tmdb-images.js',
  '/scripts/language-manager.js',
  '/scripts/i18n.js'
];

// Load script dynamically
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.type = 'module';
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Load all deferred scripts
async function loadDeferredScripts() {
  console.log('📦 Loading deferred scripts...');
  
  try {
    // Load scripts in batches to avoid overwhelming the browser
    const batchSize = 5;
    for (let i = 0; i < deferredScripts.length; i += batchSize) {
      const batch = deferredScripts.slice(i, i + batchSize);
      await Promise.all(batch.map(loadScript));
      
      // Small delay between batches
      if (i + batchSize < deferredScripts.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    console.log('✅ All deferred scripts loaded');
  } catch (error) {
    console.error('❌ Failed to load some scripts:', error);
  }
}

// Load scripts after DOM ready and idle
function setupDeferredLoading() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.requestIdleCallback) {
        requestIdleCallback(() => loadDeferredScripts());
      } else {
        setTimeout(() => loadDeferredScripts(), 100);
      }
    });
  } else {
    // DOM already ready
    if (window.requestIdleCallback) {
      requestIdleCallback(() => loadDeferredScripts());
    } else {
      setTimeout(() => loadDeferredScripts(), 100);
    }
  }
}

// Initialize
setupDeferredLoading();

// Export for manual triggering
window.loadDeferredScripts = loadDeferredScripts;
