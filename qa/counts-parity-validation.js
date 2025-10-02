// qa/counts-parity-validation.js
// Comprehensive counts parity validation between data and UI

(async () => {
  const out = { ok: true, notes: [], errors: [] };
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  console.log('[COUNTS PARITY VALIDATION] Starting comprehensive validation...');

  // 1) Data Sources Check
  console.log('[COUNTS] Checking data sources...');
  
  // Check window.appData
  if (window.appData) {
    out.notes.push('✅ window.appData available');
    
    const tvCounts = {
      watching: window.appData.tv?.watching?.length || 0,
      wishlist: window.appData.tv?.wishlist?.length || 0,
      watched: window.appData.tv?.watched?.length || 0
    };
    
    const movieCounts = {
      watching: window.appData.movies?.watching?.length || 0,
      wishlist: window.appData.movies?.wishlist?.length || 0,
      watched: window.appData.movies?.watched?.length || 0
    };
    
    out.notes.push(`📊 TV Counts: watching=${tvCounts.watching}, wishlist=${tvCounts.wishlist}, watched=${tvCounts.watched}`);
    out.notes.push(`📊 Movie Counts: watching=${movieCounts.watching}, wishlist=${movieCounts.wishlist}, watched=${movieCounts.watched}`);
  } else {
    out.errors.push('❌ window.appData not available');
  }

  // Check window.__wl (WatchlistsAdapterV2 debug object)
  if (window.__wl) {
    out.notes.push('✅ window.__wl debug object available');
    out.notes.push(`📊 __wl Counts: watching=${window.__wl.watchingIds?.length || 0}, wishlist=${window.__wl.wishlistIds?.length || 0}, watched=${window.__wl.watchedIds?.length || 0}`);
  } else {
    out.notes.push('ℹ️ window.__wl debug object not available (may be normal)');
  }

  // 2) Badge Elements Check
  console.log('[COUNTS] Checking badge elements...');
  
  const badgeSelectors = [
    { id: 'watchingBadge', selector: '#watchingBadge' },
    { id: 'wishlistBadge', selector: '#wishlistBadge' },
    { id: 'watchedBadge', selector: '#watchedBadge' },
    { id: 'watchingCount', selector: '#watchingCount' },
    { id: 'wishlistCount', selector: '#wishlistCount' },
    { id: 'watchedCount', selector: '#watchedCount' }
  ];

  const badgeElements = {};
  badgeSelectors.forEach(({ id, selector }) => {
    const element = $(selector);
    if (element) {
      badgeElements[id] = element;
      out.notes.push(`✅ ${id} found: "${element.textContent}"`);
    } else {
      out.errors.push(`❌ ${id} not found`);
    }
  });

  // 3) Data Count Functions Check
  console.log('[COUNTS] Checking count functions...');
  
  if (typeof window.updateTabCounts === 'function') {
    out.notes.push('✅ updateTabCounts function available');
    
    try {
      const counts = window.updateTabCounts();
      if (counts) {
        out.notes.push(`📊 updateTabCounts result: watching=${counts.watching}, wishlist=${counts.wishlist}, watched=${counts.watched}`);
      }
    } catch (error) {
      out.errors.push(`❌ updateTabCounts failed: ${error.message}`);
    }
  } else {
    out.errors.push('❌ updateTabCounts function not available');
  }

  // 4) WatchlistsAdapterV2 Check
  console.log('[COUNTS] Checking WatchlistsAdapterV2...');
  
  if (window.WatchlistsAdapterV2) {
    out.notes.push('✅ WatchlistsAdapterV2 available');
    
    if (typeof window.WatchlistsAdapterV2.getCounts === 'function') {
      try {
        const adapterCounts = window.WatchlistsAdapterV2.getCounts();
        if (adapterCounts) {
          out.notes.push(`📊 Adapter counts: watching=${adapterCounts.watching}, wishlist=${adapterCounts.wishlist}, watched=${adapterCounts.watched}`);
        }
      } catch (error) {
        out.errors.push(`❌ WatchlistsAdapterV2.getCounts failed: ${error.message}`);
      }
    } else {
      out.notes.push('ℹ️ WatchlistsAdapterV2.getCounts not available');
    }
  } else {
    out.notes.push('ℹ️ WatchlistsAdapterV2 not available');
  }

  // 5) Tab Elements Check
  console.log('[COUNTS] Checking tab elements...');
  
  const tabs = $$('[role="tab"]');
  out.notes.push(`✅ Found ${tabs.length} tab elements`);
  
  tabs.forEach((tab, index) => {
    const tabId = tab.id || `tab-${index}`;
    const ariaControls = tab.getAttribute('aria-controls');
    const badge = tab.querySelector('.badge, [data-count]');
    
    if (badge) {
      out.notes.push(`  ${tabId} (${ariaControls}): badge="${badge.textContent}"`);
    } else {
      out.notes.push(`  ${tabId} (${ariaControls}): no badge found`);
    }
  });

  // 6) Event System Check
  console.log('[COUNTS] Checking event system...');
  
  // Check if cards:changed event is dispatched
  let cardsChangedEventReceived = false;
  const cardsChangedListener = () => {
    cardsChangedEventReceived = true;
    out.notes.push('✅ cards:changed event received');
  };
  
  document.addEventListener('cards:changed', cardsChangedListener, { once: true });
  
  // Check if watchlists:updated event is dispatched
  let watchlistsUpdatedEventReceived = false;
  const watchlistsUpdatedListener = () => {
    watchlistsUpdatedEventReceived = true;
    out.notes.push('✅ watchlists:updated event received');
  };
  
  document.addEventListener('watchlists:updated', watchlistsUpdatedListener, { once: true });

  // 7) Manual Count Verification
  console.log('[COUNTS] Manual count verification...');
  
  // Count actual DOM elements in each section
  const sections = [
    { id: 'watchingSection', name: 'Watching' },
    { id: 'wishlistSection', name: 'Wishlist' },
    { id: 'watchedSection', name: 'Watched' }
  ];

  sections.forEach(({ id, name }) => {
    const section = document.getElementById(id);
    if (section) {
      const cards = section.querySelectorAll('.card, .unified-card, [data-id]');
      out.notes.push(`📊 ${name} section: ${cards.length} cards found`);
      
      // Check if section is visible
      const isVisible = section.style.display !== 'none' && getComputedStyle(section).display !== 'none';
      out.notes.push(`  ${name} section visible: ${isVisible}`);
    } else {
      out.errors.push(`❌ ${name} section not found`);
    }
  });

  // 8) Counter Bootstrap System Check
  console.log('[COUNTS] Checking Counter Bootstrap System...');
  
  if (window.CounterBootstrap) {
    out.notes.push('✅ CounterBootstrap system available');
    
    if (typeof window.CounterBootstrap.getCounts === 'function') {
      try {
        const bootstrapCounts = window.CounterBootstrap.getCounts();
        if (bootstrapCounts) {
          out.notes.push(`📊 Bootstrap counts: watching=${bootstrapCounts.watching}, wishlist=${bootstrapCounts.wishlist}, watched=${bootstrapCounts.watched}`);
        }
      } catch (error) {
        out.errors.push(`❌ CounterBootstrap.getCounts failed: ${error.message}`);
      }
    } else {
      out.notes.push('ℹ️ CounterBootstrap.getCounts not available');
    }
  } else {
    out.notes.push('ℹ️ CounterBootstrap system not available');
  }

  // 9) Data Consistency Check
  console.log('[COUNTS] Data consistency check...');
  
  if (window.appData && window.__wl) {
    const appDataTotal = (window.appData.tv?.watching?.length || 0) + (window.appData.movies?.watching?.length || 0);
    const wlTotal = window.__wl.watchingIds?.length || 0;
    
    if (appDataTotal === wlTotal) {
      out.notes.push('✅ Data consistency: appData and __wl counts match');
    } else {
      out.errors.push(`❌ Data inconsistency: appData watching=${appDataTotal}, __wl watching=${wlTotal}`);
    }
  }

  // Clean up event listeners
  document.removeEventListener('cards:changed', cardsChangedListener);
  document.removeEventListener('watchlists:updated', watchlistsUpdatedListener);

  // Summary
  console.log('[COUNTS PARITY VALIDATION]', out.ok ? '✅ PASS' : '❌ FAIL');
  console.log('[COUNTS PARITY VALIDATION] Notes:', out.notes);
  if (out.errors.length > 0) {
    console.log('[COUNTS PARITY VALIDATION] Errors:', out.errors);
    out.ok = false;
  }
  
  // Return result for external use
  window.countsParityValidationResult = out;
  return out;
})();
