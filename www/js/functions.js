/* ============== Core Application Functions (Cleaned) ============== */

// ==== Mobile polish guard (feature-flagged) ====
// Ensure a FLAGS bucket exists
window.FLAGS = window.FLAGS || {};
if (typeof window.FLAGS.mobilePolishGuard === 'undefined') {
  window.FLAGS.mobilePolishGuard = true; // default ON
}

window.mobilePolishGate = function mobilePolishGate() {
  if (!window.FLAGS.mobilePolishGuard) {
    FlickletDebug.info('📱 Mobile polish guard disabled via FLAGS.mobilePolishGuard=false');
    return;
  }

  // Prevent multiple initializations
  if (window._mobilePolishInitialized) {
    FlickletDebug.info('📱 Mobile polish already initialized, skipping');
    return;
  }
  window._mobilePolishInitialized = true;

  const MOBILE_BP = 640; // px
  const forced = localStorage.getItem('forceMobileV1') === '1';

  function applyMobileFlag() {
    const viewportWidth = window.innerWidth;
    const isMobileViewport = viewportWidth <= MOBILE_BP;
    
    // More comprehensive mobile device detection
    const userAgent = navigator.userAgent;
    const isMobileDevice = /iPhone|iPad|iPod|Android|Mobile|BlackBerry|IEMobile|Opera Mini|webOS|Windows Phone/i.test(userAgent);
    const isMobileSize = viewportWidth <= 640;
    const isIPhone = /iPhone/i.test(userAgent);
    
    // Debug info (only log once to prevent spam)
    if (!window._mobileDebugLogged) {
      FlickletDebug.info(`📱 Mobile detection debug:`, {
        viewportWidth,
        userAgent: userAgent.substring(0, 50) + '...',
        isMobileViewport,
        isMobileDevice,
        isMobileSize,
        isIPhone,
        forced
      });
      window._mobileDebugLogged = true;
    }
    
    // More aggressive mobile detection - force iPhone to mobile
    const enable = forced || isMobileDevice || isMobileViewport || isMobileSize || isIPhone || viewportWidth <= 768;
    
    document.body.classList.toggle('mobile-v1', enable);
    FlickletDebug.info(`📱 Mobile polish ${enable ? 'ENABLED' : 'DISABLED'} — vw:${viewportWidth} (device: ${isMobileDevice}, viewport: ${isMobileViewport}, size: ${isMobileSize})`);
  }

  // Apply immediately
  applyMobileFlag();
  
  // Listen for viewport changes (throttled to prevent loops)
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(applyMobileFlag, 250); // Throttle to 250ms
  }, { passive: true });
  
  window.addEventListener('orientationchange', () => {
    // Delay after orientation change to let viewport settle
    setTimeout(applyMobileFlag, 100);
  });
}

// Run mobile polish guard once
mobilePolishGate(); // Run immediately

// ---- Tab / Render Pipeline ----
// window.switchToTab is implemented in inline-script-02.js

window.updateTabContent = function updateTabContent(tab) {
  if (tab === 'home') {
    loadHomeContent();
  } else if (tab === 'watching' || tab === 'wishlist' || tab === 'watched') {
    loadListContent(tab);
  } else if (tab === 'discover') {
    loadDiscoverContent();
  } else if (tab === 'settings') {
    loadSettingsContent();
  }
};

window.updateUI = function updateUI() {
  if (typeof updateTabCounts === 'function') updateTabCounts();
  const tab = window.FlickletApp?.currentTab || 'home';
  updateTabContent(tab);
};

// STEP 3.2 — Rerender the active tab's content if it matches a given list
function rerenderIfVisible(list) {
  const current = window.FlickletApp?.currentTab;
  if (current && current === list) {
    if (typeof window.updateTabContent === 'function') {
      window.updateTabContent(list);
    } else if (typeof window.FlickletApp?.updateTabContent === 'function') {
      window.FlickletApp.updateTabContent(list);
    }
  }
}

window.updateTabCounts = function updateTabCounts() {
  console.log('🔢 Updating tab counts...');
  const counts = {
    watching: (window.appData?.tv?.watching?.length || 0) + (window.appData?.movies?.watching?.length || 0),
    wishlist: (window.appData?.tv?.wishlist?.length || 0) + (window.appData?.movies?.wishlist?.length || 0),
    watched:  (window.appData?.tv?.watched?.length  || 0) + (window.appData?.movies?.watched?.length  || 0),
  };
  
  console.log('📊 Calculated counts:', counts);
  
  ['watching','wishlist','watched'].forEach(list => {
    const badge = document.getElementById(`${list}Badge`);
    if (badge) {
      badge.textContent = counts[list];
      console.log(`✅ ${list} badge updated to:`, badge.textContent);
    } else {
      console.log(`❌ ${list} badge not found!`);
    }
  });
};

// Ensure the function is called when the page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔢 DOMContentLoaded - calling updateTabCounts');
  setTimeout(() => {
    if (typeof window.updateTabCounts === 'function') {
      window.updateTabCounts();
    }
  }, 1000);
});

// Also call when user data is loaded
document.addEventListener('userDataLoaded', function() {
  console.log('🔢 userDataLoaded event - calling updateTabCounts');
  setTimeout(() => {
    if (typeof window.updateTabCounts === 'function') {
      window.updateTabCounts();
    }
  }, 500);
});

// Note: Tab counts are now updated only when data changes, not periodically



// ---- Home ----
window.loadHomeContent = function loadHomeContent() {
  const container = document.getElementById('homeSection');
  if (!container) return;
  
  FlickletDebug.info('🏠 Loading home content - using improved loading');
  
  // Start performance monitoring
  if (window.PerformanceMonitor) {
    window.PerformanceMonitor.startHomeLoad();
  }
  
  // Load content with better sequencing
  setTimeout(() => {
    try { startDailyCountdown?.(); } catch {}
    try { updateFlickWordStats?.(); } catch {}
    
    // End performance monitoring
    if (window.PerformanceMonitor) {
      window.PerformanceMonitor.endHomeLoad();
    }
  }, 50);
};

// ---- Lists ----
/**
 * Process: Tab Content Loading with Unified Card Rendering
 * Purpose: Loads and displays list items (watching, wishlist, watched) using consistent card rendering
 * Data Source: appData.tv[listType] and appData.movies[listType] arrays, createShowCard function
 * Update Path: Modify listType parameter handling, update createShowCard call if card structure changes
 * Dependencies: createShowCard function, appData structure, container elements, moveItem and removeItemFromCurrentList functions
 */
window.loadListContent = function loadListContent(listType) {
  const container = document.getElementById(`${listType}List`);
  if (!container) return;
  
  FlickletDebug.info(`📋 Loading ${listType} content`);

  // Debug: Check appData structure
  console.log('🔍 appData structure:', {
    appData: window.appData,
    tv: window.appData?.tv,
    movies: window.appData?.movies,
    tvItems: window.appData?.tv?.[listType],
    movieItems: window.appData?.movies?.[listType]
  });

  const tvItems = appData.tv?.[listType] || [];
  const movieItems = appData.movies?.[listType] || [];
  const allItems = [...tvItems, ...movieItems];
  
  console.log(`📋 Found ${allItems.length} items for ${listType}:`, allItems);
  
  if (allItems.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No items in ${listType} list.</p></div>`;
    return;
  }

  // Clear container first
  container.innerHTML = '';
  
  // Set up horizontal row layout for list items
  container.className = 'list-container';
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 0;
  `;
  
  // Use Card v2 if available, otherwise create poster cards
  allItems.forEach(item => {
    if (window.FLAGS?.cards_v2 && window.Card) {
      // Use Card v2 for consistent poster display
      const card = window.Card({
        variant: 'poster',
        id: item.id,
        posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : '',
        title: item.name || item.title || 'Unknown Title',
        subtitle: item.release_date?.slice(0, 4) || item.first_air_date?.slice(0, 4) || '',
        rating: item.vote_average || 0,
        badges: [],
        primaryAction: {
          label: 'Move',
          onClick: () => moveItem(item.id, getNextList(listType))
        },
        overflowActions: [{
          label: 'Remove',
          onClick: () => removeItemFromCurrentList(item.id)
        }],
        onOpenDetails: () => openTMDBLink?.(item.id, item.media_type || 'movie')
      });
      container.appendChild(card);
    } else if (typeof window.createShowCard === 'function') {
      const card = window.createShowCard(item, false, listType);
      container.appendChild(card);
    } else {
      // Fallback to horizontal row layout
      const card = document.createElement('div');
      card.className = 'list-item';
      card.setAttribute('data-id', item.id);
      card.setAttribute('data-media-type', item.media_type || 'movie');
      
      const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : '';
      const title = item.name || item.title || 'Unknown Title';
      const year = item.release_date?.slice(0, 4) || item.first_air_date?.slice(0, 4) || '';
      const rating = item.vote_average || 0;
      const overview = item.overview || 'No description available';
      
      card.innerHTML = `
        <div class="list-item-poster">
          ${posterUrl ? `<img src="${posterUrl}" alt="${title}" loading="lazy">` : 
            '<div class="poster-placeholder">📺</div>'}
        </div>
        <div class="list-item-content">
          <div class="list-item-header">
            <h3 class="list-item-title">${title}</h3>
            <div class="list-item-meta">
              <span class="list-item-year">${year || 'Unknown Year'}</span>
              <span class="list-item-type">${item.media_type || 'movie'}</span>
              <span class="list-item-rating">⭐ ${rating.toFixed(1)}</span>
            </div>
          </div>
          <p class="list-item-description">${overview}</p>
          <div class="list-item-actions">
            <button class="btn btn--sm" data-action="move" data-id="${item.id}" data-list="${getNextList(listType)}">
              Move
            </button>
            <button class="btn btn--sm btn--secondary" data-action="remove" data-id="${item.id}">
              Remove
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
    }
  });
};

function getNextList(currentList) {
  const lists = ['watching', 'wishlist', 'watched'];
  const currentIndex = lists.indexOf(currentList);
  return lists[(currentIndex + 1) % lists.length];
}

// ---- Discover ----
window.loadDiscoverContent = function loadDiscoverContent() {
  const section = document.getElementById('discoverSection');
  if (!section) return;
  
  // Call renderDiscover to actually load recommendations
  if (typeof renderDiscover === 'function') {
    renderDiscover();
  } else {
    section.innerHTML = `<div class="empty-state"><h3>Discover</h3><p>Recommendations coming soon.</p></div>`;
  }
};

window.loadSettingsContent = function loadSettingsContent() {
  // Settings content is now in HTML, just add event handlers for new data tools
  FlickletDebug.info('⚙️ Loading settings content - adding data tools handlers');
  
  // New robust export/import handlers
  const btnExport = document.getElementById('btnExport');
  const fileImport = document.getElementById('fileImport');
  
  FlickletDebug.info('🔍 Debug: btnExport element found:', btnExport);
  FlickletDebug.info('🔍 Debug: fileImport element found:', fileImport);
  
  FlickletDebug.info('🔍 Debug: window.guard function exists:', typeof window.guard);
  FlickletDebug.info('🔍 Debug: btnExport exists check:', !!btnExport);
  
  window.guard(!!btnExport, () => {
    FlickletDebug.info('✅ Setting up export/import handlers');

    async function collectExport() {
      // Get data from the actual localStorage keys the app uses
      const flickletData = JSON.parse(localStorage.getItem('flicklet-data') || '{}');
      const legacyData = JSON.parse(localStorage.getItem('tvMovieTrackerData') || '{}');
      
      const data = {
        meta: { app: 'Flicklet', version: window.FlickletApp?.version || 'n/a', exportedAt: new Date().toISOString() },
        // Use the most recent data available
        appData: flickletData.tv || flickletData.movies ? flickletData : legacyData,
        // Also include the legacy format for compatibility
        legacyData: legacyData
      };
      return data;
    }

    function downloadJSON(obj, filename) {
      const blob = new Blob([JSON.stringify(obj, null, 2)], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
      a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
    }

    btnExport.addEventListener('click', async () => {
      FlickletDebug.info('🚀 Export button clicked!');
      try {
        const data = await collectExport();
        FlickletDebug.info('📊 Export data collected:', data);
        downloadJSON(data, `flicklet-export-${new Date().toISOString().slice(0,10)}.json`);
        FlickletDebug.info('💾 File download initiated');
        window.showToast?.('Export created.');
      } catch (error) {
        FlickletDebug.error('❌ Export failed:', error);
        window.showToast?.('Export failed: ' + error.message);
      }
    });

    fileImport.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
  if (!file) return;
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        
        // Import the main app data
        if (json.appData) {
          localStorage.setItem('flicklet-data', JSON.stringify(json.appData));
        }
        
        // Import legacy data for compatibility
        if (json.legacyData) {
          localStorage.setItem('tvMovieTrackerData', JSON.stringify(json.legacyData));
        }
        
        // Legacy format support (for old exports)
        if (json.lists)  localStorage.setItem('flicklet_lists', JSON.stringify(json.lists));
        if (json.notes)  localStorage.setItem('flicklet_notes', JSON.stringify(json.notes));
        if (json.prefs)  localStorage.setItem('flicklet_prefs', JSON.stringify(json.prefs));
        
        window.showToast?.('Import complete. Reloading…');
        setTimeout(()=>location.reload(), 500);
    } catch (err) {
        FlickletDebug.error(err);
        window.showToast?.('Import failed: invalid file.');
      }
    });
  });

  // Pro preview toggle
  window.guard(!!document.getElementById('btnProTry'), () => {
    document.getElementById('btnProTry').addEventListener('click', () => {
      window.FLAGS.proEnabled = !window.FLAGS.proEnabled;
      document.body.classList.toggle('is-pro', window.FLAGS.proEnabled);
      showNotification?.(window.FLAGS.proEnabled ? 'Pro preview ON' : 'Pro preview OFF', 'success');
      
      // Update Pro state UI
      window.updateProState?.();
      
      // Refresh providers, extras, playlists, and trivia when Pro state changes
      FlickletDebug.info('🔄 Pro toggle (btnProTry): Refreshing providers, extras, playlists, and trivia...', { pro: window.FLAGS.proEnabled });
      if (window.__FlickletRefreshProviders) {
        window.__FlickletRefreshProviders();
        FlickletDebug.info('✅ Providers refreshed');
      }
      if (window.__FlickletRefreshExtras) {
        window.__FlickletRefreshExtras();
        FlickletDebug.info('✅ Extras refreshed');
      }
      if (window.__FlickletRefreshPlaylists) {
        window.__FlickletRefreshPlaylists();
        console.log('✅ Playlists refreshed');
      }
      if (window.__FlickletRefreshTrivia) {
        window.__FlickletRefreshTrivia();
        console.log('✅ Trivia refreshed');
      }
      if (window.__FlickletRefreshSeriesOrganizer) {
        window.__FlickletRefreshSeriesOrganizer();
        console.log('✅ Series Organizer refreshed');
      }
      
      // Re-check advanced notifications visibility when Pro state changes
      const advancedCard = document.getElementById('notifAdvancedCard');
      if (advancedCard) {
        if (window.FLAGS.proEnabled || window.FLAGS.notifAdvancedEnabled) {
          advancedCard.style.display = 'block';
          console.log('🔍 Debug: Advanced notifications card shown due to Pro state change');
        } else {
          advancedCard.style.display = 'none';
          console.log('🔍 Debug: Advanced notifications card hidden due to Pro state change');
        }
      }
    });
  });

  // Stats card functionality
  window.guard(!!window.FLAGS.statsEnabled && !!document.getElementById('statsContent'), () => {
    const EL = document.getElementById('statsContent');

    function getCounts() {
      // Get data from actual localStorage keys the app uses
      const flickletData = JSON.parse(localStorage.getItem('flicklet-data') || '{}');
      const legacyData = JSON.parse(localStorage.getItem('tvMovieTrackerData') || '{}');
      
      // Use the most recent data available
      const appData = flickletData.tv || flickletData.movies ? flickletData : legacyData;
      
      const counts = {
        watching: (appData.tv?.watching?.length || 0) + (appData.movies?.watching?.length || 0),
        wishlist: (appData.tv?.wishlist?.length || 0) + (appData.movies?.wishlist?.length || 0),
        watched: (appData.tv?.watched?.length || 0) + (appData.movies?.watched?.length || 0),
        notes: 0 // Notes feature not implemented yet
      };
      counts.total = counts.watching + counts.wishlist + counts.watched;
      return counts;
    }

    function render() {
      const c = getCounts();
      
      // Get detailed breakdown for TV and Movies
      const flickletData = JSON.parse(localStorage.getItem('flicklet-data') || '{}');
      const legacyData = JSON.parse(localStorage.getItem('tvMovieTrackerData') || '{}');
      const appData = flickletData.tv || flickletData.movies ? flickletData : legacyData;
      
      const tvWatching = appData.tv?.watching || [];
      const tvWishlist = appData.tv?.wishlist || [];
      const tvWatched = appData.tv?.watched || [];
      const movieWatching = appData.movies?.watching || [];
      const movieWishlist = appData.movies?.wishlist || [];
      const movieWatched = appData.movies?.watched || [];
      
      const totalShows = tvWatching.length + tvWishlist.length + tvWatched.length;
      const totalMovies = movieWatching.length + movieWishlist.length + movieWatched.length;
      
      EL.innerHTML = `
        <div class="stats-grid">
          <div class="stat">
            <div class="stat-number">${c.watching}</div>
            <div class="stat-label">Currently Watching</div>
          </div>
          <div class="stat">
            <div class="stat-number">${c.wishlist}</div>
            <div class="stat-label">Want to Watch</div>
          </div>
          <div class="stat">
            <div class="stat-number">${c.watched}</div>
            <div class="stat-label">Already Watched</div>
          </div>
          <div class="stat">
            <div class="stat-number">${c.total}</div>
            <div class="stat-label">Total Items</div>
          </div>
        </div>
        <div class="card-surface" style="margin-top: 15px;">
          <h5 class="heading-subtle">📺 TV Shows Breakdown</h5>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 0.85rem; max-width: 75%;">
            <div><strong>${tvWatching.length}</strong> Watching</div>
            <div><strong>${tvWishlist.length}</strong> Want to Watch</div>
            <div><strong>${tvWatched.length}</strong> Watched</div>
          </div>
          <h5 class="heading-subtle" style="margin: 10px 0;">🎬 Movies Breakdown</h5>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 0.85rem; max-width: 75%;">
            <div><strong>${movieWatching.length}</strong> Watching</div>
            <div><strong>${movieWishlist.length}</strong> Want to Watch</div>
            <div><strong>${movieWatched.length}</strong> Watched</div>
          </div>
        </div>
      `;
    }

    window.addEventListener('storage', render);
    render();
  });

  // Notifications engine
  window.guard(!!window.FLAGS.notifEngineEnabled, () => {
    const masterToggle = document.getElementById('notifMasterToggle');
    
    // Load master toggle state
    if (masterToggle) {
      masterToggle.checked = localStorage.getItem('flicklet_notif_master') !== 'false';
      
      masterToggle.addEventListener('change', (e) => {
        localStorage.setItem('flicklet_notif_master', e.target.checked);
        showNotification?.(e.target.checked ? 'Notifications enabled' : 'Notifications disabled', 'success');
      });
    }

    function checkForUpcomingEpisodes() {
      // Skip if master toggle is off
      if (localStorage.getItem('flicklet_notif_master') === 'false') return;
      
      // Skip if we already checked recently (within 6 hours)
      const lastCheck = localStorage.getItem('flicklet_last_notif');
      const now = new Date();
      if (lastCheck) {
        const lastCheckDate = new Date(lastCheck);
        const hoursSinceLastCheck = (now - lastCheckDate) / (1000 * 60 * 60);
        if (hoursSinceLastCheck < 6) return;
      }
      
      // Get watching items
      const flickletData = JSON.parse(localStorage.getItem('flicklet-data') || '{}');
      const legacyData = JSON.parse(localStorage.getItem('tvMovieTrackerData') || '{}');
      const appData = flickletData.tv || flickletData.movies ? flickletData : legacyData;
      
      const watchingItems = [
        ...(appData.tv?.watching || []),
        ...(appData.movies?.watching || [])
      ];
      
      // Check for episodes within 24 hours
      const upcomingEpisodes = watchingItems.filter(item => {
        if (!item.nextEpisodeAirDate) return false;
        
        const episodeDate = new Date(item.nextEpisodeAirDate);
        const hoursUntilEpisode = (episodeDate - now) / (1000 * 60 * 60);
        
        return hoursUntilEpisode > 0 && hoursUntilEpisode <= 24;
      });
      
      // Show notification if episodes found
      if (upcomingEpisodes.length > 0) {
        const episodeText = upcomingEpisodes.length === 1 ? 'episode' : 'episodes';
        showNotification?.(`🎬 ${upcomingEpisodes.length} new ${episodeText} coming soon!`, 'success');
      }
      
      // Update last check time
      localStorage.setItem('flicklet_last_notif', now.toISOString());
    }

    // Run check on load
    checkForUpcomingEpisodes();
    
    // Run check every 6 hours
    setInterval(checkForUpcomingEpisodes, 6 * 60 * 60 * 1000);
  });

  // Accessibility - Add aria-labels to dynamic card action buttons
  function addCardAccessibility() {
    document.querySelectorAll('.card .actions button').forEach(btn => {
      if (btn.textContent.includes('Remove') && !btn.getAttribute('aria-label')) {
        btn.setAttribute('aria-label', 'Remove this item from your list');
      }
      if (btn.textContent.includes('Move to') && !btn.getAttribute('aria-label')) {
        const targetList = btn.textContent.replace('Move to ', '');
        btn.setAttribute('aria-label', `Move this item to ${targetList} list`);
      }
    });
  }

  // Call accessibility function after a short delay to ensure cards are rendered
  setTimeout(addCardAccessibility, 100);

  // Pro state management
  function updateProState() {
    const isPro = window.FLAGS.proEnabled;
    const proBadge = document.getElementById('proBadge');
    
    // Show/hide PRO badge
    if (proBadge) {
      proBadge.style.display = isPro ? 'inline-block' : 'none';
    }
    
    // Update Pro features
    document.querySelectorAll('[data-pro="true"]').forEach(el => {
      if (isPro) {
        el.classList.add('pro-enabled');
        el.classList.remove('locked');
        el.removeAttribute('aria-disabled');
      } else {
        el.classList.remove('pro-enabled');
        el.classList.add('locked');
        el.setAttribute('aria-disabled', 'true');
      }
    });
  }

  // Call on load and when Pro state changes
  updateProState();
  window.updateProState = updateProState;
  
  // Toggle Pro preview function for the top button
  window.toggleProPreview = function() {
    window.FLAGS.proEnabled = !window.FLAGS.proEnabled;
    document.body.classList.toggle('is-pro', window.FLAGS.proEnabled);
    showNotification?.(window.FLAGS.proEnabled ? 'Pro preview ON' : 'Pro preview OFF', 'success');
    
    // Update Pro state UI
    window.updateProState?.();
    
    // Update the Pro features list to show locked/unlocked states
    window.renderProFeaturesList?.();
    
    // Refresh providers, extras, playlists, and trivia when Pro state changes
    console.log('🔄 Pro toggle (toggleProPreview): Refreshing providers, extras, playlists, and trivia...', { pro: window.FLAGS.proEnabled });
    if (window.__FlickletRefreshProviders) {
      window.__FlickletRefreshProviders();
      console.log('✅ Providers refreshed');
    }
    if (window.__FlickletRefreshExtras) {
      window.__FlickletRefreshExtras();
      console.log('✅ Extras refreshed');
    }
    if (window.__FlickletRefreshPlaylists) {
      window.__FlickletRefreshPlaylists();
      console.log('✅ Playlists refreshed');
    }
    if (window.__FlickletRefreshTrivia) {
      window.__FlickletRefreshTrivia();
      console.log('✅ Trivia refreshed');
    }
    if (window.__FlickletRefreshSeriesOrganizer) {
      window.__FlickletRefreshSeriesOrganizer();
      console.log('✅ Series Organizer refreshed');
    }
  }
    
    // Re-check advanced notifications visibility when Pro state changes
    const advancedCard = document.getElementById('notifAdvancedCard');
    if (advancedCard) {
      if (window.FLAGS.proEnabled || window.FLAGS.notifAdvancedEnabled) {
        advancedCard.style.display = 'block';
        console.log('🔍 Debug: Advanced notifications card shown due to Pro state change');
      } else {
        advancedCard.style.display = 'none';
        console.log('🔍 Debug: Advanced notifications card hidden due to Pro state change');
      }
    }
  };
  
  // Open share modal function
  window.openShareModal = function() {
    const modal = document.getElementById('shareSelectionModal');
    if (modal) {
      modal.style.display = 'flex';
      // Load the share modal content
      if (typeof window.populateShareModal === 'function') {
        window.populateShareModal();
      } else {
        showNotification?.('Share feature loading...', 'info');
      }
    } else {
      showNotification?.('Share feature coming soon!', 'info');
    }
  };


  // Advanced notifications (PRO)
  console.log('🔍 Debug: Checking advanced notifications conditions. FLAGS.notifAdvancedEnabled:', window.FLAGS.notifAdvancedEnabled, 'FLAGS.proEnabled:', window.FLAGS.proEnabled);
  window.guard(!!(window.FLAGS.notifAdvancedEnabled || window.FLAGS.proEnabled), () => {
    console.log('🔍 Debug: Advanced notifications guard condition met');
    const advancedCard = document.getElementById('notifAdvancedCard');
    const leadHoursInput = document.getElementById('leadHoursInput');
    const notifScopeSelect = document.getElementById('notifScopeSelect');
    
    console.log('🔍 Debug: Advanced card element found:', advancedCard);
    if (advancedCard) {
      advancedCard.style.display = 'block';
      console.log('🔍 Debug: Advanced notifications card display set to block');
      
      // Load saved preferences
      leadHoursInput.value = localStorage.getItem('flicklet_notif_lead') || '24';
      notifScopeSelect.value = localStorage.getItem('flicklet_notif_scope') || 'watching';
      
      // Save preferences on change
      leadHoursInput.addEventListener('change', (e) => {
        localStorage.setItem('flicklet_notif_lead', e.target.value);
      });
      
      notifScopeSelect.addEventListener('change', (e) => {
        localStorage.setItem('flicklet_notif_scope', e.target.value);
      });
      
      // Visual feedback for Pro state
      function updateProState() {
        const isPro = window.FLAGS.proEnabled;
        if (isPro) {
          advancedCard.classList.remove('disabled');
        } else {
          advancedCard.classList.add('disabled');
        }
      }
      
      updateProState();
      // Update when Pro state changes
      document.addEventListener('click', (e) => {
        if (e.target.id === 'btnProTry') {
          setTimeout(updateProState, 100);
        }
      });
    }
  });

// ---- Data Import / Export ----
// Old flaky handlers replaced by robust implementation above

// ---- Item Management ----
// addToListFromCache function removed - using the real implementation from inline-script-02.js

window.moveItem = function moveItem(id, dest) {
  const mediaType = findItemMediaType(id);
  if (!mediaType) return;

  const sourceList = findItemList(id, mediaType);
  if (!sourceList) return;

  const srcArr = appData[mediaType][sourceList];
  const idx = srcArr.findIndex(i => i.id === id);
  if (idx === -1) return;

  const [item] = srcArr.splice(idx, 1);
  appData[mediaType][dest].push(item);
  saveAppData();
  if (window.FlickletApp) window.FlickletApp.updateUI();
  rerenderIfVisible(sourceList);
  rerenderIfVisible(dest);
  showNotification(`Moved to ${dest}.`, 'success');
};

window.removeItemFromCurrentList = function removeItemFromCurrentList(id) {
  const mediaType = findItemMediaType(id);
  if (!mediaType) return;

  const sourceList = findItemList(id, mediaType);
  if (!sourceList) return;

  const srcArr = appData[mediaType][sourceList];
  const idx = srcArr.findIndex(i => i.id === id);
  if (idx === -1) return;

  srcArr.splice(idx, 1);
  saveAppData();
  if (window.FlickletApp) window.FlickletApp.updateUI();
  rerenderIfVisible(sourceList);
  showNotification('Item removed.', 'success');
};

function findItemMediaType(id) {
  if (appData.tv?.watching?.some(i => i.id === id) || 
      appData.tv?.wishlist?.some(i => i.id === id) || 
      appData.tv?.watched?.some(i => i.id === id)) {
    return 'tv';
  }
  if (appData.movies?.watching?.some(i => i.id === id) || 
      appData.movies?.wishlist?.some(i => i.id === id) || 
      appData.movies?.watched?.some(i => i.id === id)) {
    return 'movies';
  }
  return null;
}

function findItemList(id, mediaType) {
  const lists = ['watching', 'wishlist', 'watched'];
  for (const list of lists) {
    if (appData[mediaType]?.[list]?.some(i => i.id === id)) {
      return list;
    }
  }
  return null;
}

// ---- Theme Management ----
// toggleDarkMode is now centralized in utils.js

// ---- Language Management ----
window.changeLanguage = function changeLanguage(lang) {
  if (!appData.settings) appData.settings = {};
  appData.settings.lang = lang;
  saveAppData();
  
  // Apply translations
  if (typeof applyTranslations === 'function') {
    applyTranslations();
  }
  
  showNotification(`Language changed to ${lang}.`, 'success');
};

// ---- FlickWord Game ----
window.startDailyCountdown = function startDailyCountdown() {
  const countdownElement = document.getElementById('flickwordCountdown');
  if (!countdownElement) return;
  
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const timeLeft = tomorrow - now;
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
  countdownElement.textContent = `${hours}h ${minutes}m`;
  
  // Update every minute
  setTimeout(startDailyCountdown, 60000);
};

window.updateFlickWordStats = function updateFlickWordStats() {
  const todayScore = document.getElementById('flickwordTodayScore');
  const bestStreak = document.getElementById('flickwordBestStreak');
  const gamesPlayed = document.getElementById('flickwordGamesPlayed');
  
  if (todayScore) todayScore.textContent = appData.flickword?.todayScore || 0;
  if (bestStreak) bestStreak.textContent = appData.flickword?.bestStreak || '-';
  if (gamesPlayed) gamesPlayed.textContent = appData.flickword?.gamesPlayed || 0;
};

window.startFlickWordGame = function startFlickWordGame() {
  showNotification('FlickWord game starting soon! 🎮', 'success');
};

// ---- Stats Card Renderer ----
window.renderStatsCard = function renderStatsCard() {
  if (!window.FLAGS?.statsEnabled) return;
  
  const statsContent = document.getElementById('statsContent');
  if (!statsContent) return;
  
  try {
    const appData = JSON.parse(localStorage.getItem('flicklet-data') || '{}');
    const tvWatching = appData.tv?.watching || [];
    const tvWishlist = appData.tv?.wishlist || [];
    const tvWatched = appData.tv?.watched || [];
    const movieWatching = appData.movies?.watching || [];
    const movieWishlist = appData.movies?.wishlist || [];
    const movieWatched = appData.movies?.watched || [];
    
    const totalShows = tvWatching.length + tvWishlist.length + tvWatched.length;
    const totalMovies = movieWatching.length + movieWishlist.length + movieWatched.length;
    const totalItems = totalShows + totalMovies;
    
    statsContent.innerHTML = `
      <div class="stats-grid">
        <div class="stat">
          <div class="stat-number">${tvWatching.length + movieWatching.length}</div>
          <div class="stat-label">Currently Watching</div>
        </div>
        <div class="stat">
          <div class="stat-number">${tvWishlist.length + movieWishlist.length}</div>
          <div class="stat-label">Want to Watch</div>
        </div>
        <div class="stat">
          <div class="stat-number">${tvWatched.length + movieWatched.length}</div>
          <div class="stat-label">Already Watched</div>
        </div>
        <div class="stat">
          <div class="stat-number">${totalItems}</div>
          <div class="stat-label">Total Items</div>
        </div>
      </div>
      <div class="card-surface" style="margin-top: 15px;">
        <h5 class="heading-subtle">📺 TV Shows Breakdown</h5>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 0.85rem; max-width: 75%;">
          <div><strong>${tvWatching.length}</strong> Watching</div>
          <div><strong>${tvWishlist.length}</strong> Want to Watch</div>
          <div><strong>${tvWatched.length}</strong> Watched</div>
        </div>
        <h5 class="heading-subtle" style="margin: 10px 0;">🎬 Movies Breakdown</h5>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 0.85rem; max-width: 75%;">
          <div><strong>${movieWatching.length}</strong> Watching</div>
          <div><strong>${movieWishlist.length}</strong> Want to Watch</div>
          <div><strong>${movieWatched.length}</strong> Watched</div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error rendering stats card:', error);
    statsContent.innerHTML = '<div class="error">Failed to load stats</div>';
  }
};

// ---- Pro Features List Renderer ----
window.renderProFeaturesList = function renderProFeaturesList() {
  const proFeaturesList = document.getElementById('proFeaturesList');
  if (!proFeaturesList) return;
  
  const isProEnabled = window.FLAGS?.proEnabled || false;
  
  proFeaturesList.innerHTML = `
    <div class="pro-features">
      <div class="pro-feature ${isProEnabled ? 'unlocked' : 'locked'}">
        <div class="pro-feature-icon">🔔</div>
        <div class="pro-feature-content">
          <div class="pro-feature-title">Smart Notifications</div>
          ${isProEnabled ? '<div class="pro-feature-desc">Get notified exactly when you want - set custom lead times for new episodes, choose which lists to monitor, and never miss your favorite shows again.</div>' : ''}
        </div>
        <div class="pro-feature-status">${isProEnabled ? '✅' : '🔒'}</div>
      </div>
      
      <div class="pro-feature ${isProEnabled ? 'unlocked' : 'locked'}">
        <div class="pro-feature-icon">📊</div>
        <div class="pro-feature-content">
          <div class="pro-feature-title">Your Viewing Journey</div>
          ${isProEnabled ? '<div class="pro-feature-desc">Discover your watching habits with beautiful charts showing your favorite genres, binge patterns, and viewing trends over time.</div>' : ''}
        </div>
        <div class="pro-feature-status">${isProEnabled ? '✅' : '🔒'}</div>
      </div>
      
      <div class="pro-feature ${isProEnabled ? 'unlocked' : 'locked'}">
        <div class="pro-feature-icon">🎨</div>
        <div class="pro-feature-content">
          <div class="pro-feature-title">Advanced Customization</div>
          ${isProEnabled ? '<div class="pro-feature-desc">Unlock premium color schemes, custom accent colors, and advanced layout options to create your perfect viewing experience.</div>' : ''}
        </div>
        <div class="pro-feature-status">${isProEnabled ? '✅' : '🔒'}</div>
      </div>
      
      <div class="pro-feature ${isProEnabled ? 'unlocked' : 'locked'}">
        <div class="pro-feature-icon">👥</div>
        <div class="pro-feature-content">
          <div class="pro-feature-title">Social Features</div>
          ${isProEnabled ? '<div class="pro-feature-desc">Connect with friends, compare your taste, share recommendations, and discover what your social circle is watching. See who has similar viewing habits!</div>' : ''}
        </div>
        <div class="pro-feature-status">${isProEnabled ? '✅' : '🔒'}</div>
      </div>
      
      <div class="pro-feature ${isProEnabled ? 'unlocked' : 'locked'}">
        <div class="pro-feature-icon">⚡</div>
        <div class="pro-feature-content">
          <div class="pro-feature-title">VIP Support</div>
          ${isProEnabled ? '<div class="pro-feature-desc">Get help when you need it with priority support. Our team responds faster to Pro users and provides personalized assistance for any questions or issues.</div>' : ''}
        </div>
        <div class="pro-feature-status">${isProEnabled ? '✅' : '🔒'}</div>
      </div>
    </div>
  `;
};

// ---- Upcoming Episodes (Tonight On) ----
window.loadUpcomingEpisodes = function loadUpcomingEpisodes() {
  if (!window.FLAGS?.upcomingEpisodesEnabled) {
    // Force hide the section if it exists
    const upcomingEpisodes = document.getElementById('upcomingEpisodes');
    if (upcomingEpisodes) {
      upcomingEpisodes.style.display = 'none';
    }
    return;
  }
  
  const upcomingEpisodes = document.getElementById('upcomingEpisodes');
  const upcomingEpisodesList = document.getElementById('upcomingEpisodesList');
  
  if (!upcomingEpisodes || !upcomingEpisodesList) return;
  
  console.log('🌙 Loading upcoming episodes content');
  
  try {
    const appData = JSON.parse(localStorage.getItem('flicklet-data') || '{}');
    // Get watching shows from both tv and movies categories
    const tvWatching = appData.tv?.watching || [];
    const movieWatching = appData.movies?.watching || [];
    const watching = [...tvWatching, ...movieWatching];
    
    console.log('🔍 Front spotlight data check:', {
      tvWatching: tvWatching.length,
      movieWatching: movieWatching.length,
      totalWatching: watching.length,
      sampleShow: watching[0]
    });
    
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const upcomingEpisodes = [];
    
    // Test episode removed - now using real data
    
    watching.forEach(show => {
      // Skip shows with invalid data
      if (!show || (!show.name && !show.original_name)) {
        console.log('⚠️ Skipping invalid show:', show);
    return;
  }
  
      const showName = show.name || show.original_name || 'Unknown Show';
      // Check multiple possible fields for next air date
      const nextAirDate = show.nextEpisodeAirDate || 
                         show.next_air_date || 
                         show.next_episode_to_air?.air_date ||
                         show.next_episode_to_air?.first_air_date;
      console.log('🔍 Checking show:', showName, 'nextAirDate:', nextAirDate, 'next_episode_to_air:', show.next_episode_to_air);
      
      if (!nextAirDate) return;
      
      const airDate = new Date(nextAirDate);
      console.log('🔍 Air date parsed:', airDate, 'is valid:', !isNaN(airDate.getTime()));
      
      if (airDate >= now && airDate <= nextWeek) {
        console.log('✅ Found upcoming episode:', showName);
        upcomingEpisodes.push({
          showName: showName,
          airDate: airDate,
          episodeInfo: show.nextEpisodeName || 'New Episode'
        });
      }
    });
    
    upcomingEpisodes.sort((a, b) => a.airDate - b.airDate);
    
    if (upcomingEpisodes.length === 0) {
      upcomingEpisodesList.innerHTML = '<div class="no-episodes">No upcoming episodes this week.</div>';
    } else {
      const top8 = upcomingEpisodes.slice(0, 8);
      upcomingEpisodesList.innerHTML = top8.map(episode => `
        <div class="upcoming-episode-item">
          <div class="show-info">
            <div class="show-name">${episode.showName}</div>
            <div class="episode-info">${episode.episodeInfo}</div>
          </div>
          <div class="air-date">
            ${episode.airDate.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
        </div>
      `).join('');
    }
    
    upcomingEpisodes.style.display = 'block';
  } catch (error) {
    console.error('Error loading upcoming episodes:', error);
    upcomingEpisodes.style.display = 'none';
  }
};
