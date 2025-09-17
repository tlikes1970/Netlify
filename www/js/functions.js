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
  console.log('🔍 Full appData structure:', {
    appData: window.appData,
    tv: window.appData?.tv,
    movies: window.appData?.movies,
    settings: window.appData?.settings
  });
  
  if (allItems.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No items in ${listType} list.</p></div>`;
    return;
  }

  // Clear container first
  container.innerHTML = '';
  
  // Set up poster card grid layout
  container.className = 'poster-cards-grid';
  
  // Use new createPosterCard system
  console.log('🔍 Checking createPosterCard availability:', {
    createPosterCard: typeof window.createPosterCard,
    windowKeys: Object.keys(window).filter(k => k.includes('Poster') || k.includes('Card'))
  });
  
  if (window.createPosterCard) {
    console.log('✅ Using createPosterCard for', allItems.length, 'items');
    console.log('🔍 Items data:', allItems);
    allItems.forEach((item, index) => {
      console.log(`🔍 Processing item ${index}:`, item);
      const card = window.createPosterCard(item, listType);
      if (card) {
        console.log('✅ Card created successfully for item:', item.title || item.name);
        container.appendChild(card);
      } else {
        console.log('❌ Failed to create card for item:', item.title || item.name);
      }
    });
  } else {
    console.log('❌ createPosterCard not available, using fallback');
    // Fallback to existing system
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
  }
};

function getNextList(currentList) {
  const lists = ['watching', 'wishlist', 'watched'];
  const currentIndex = lists.indexOf(currentList);
  return lists[(currentIndex + 1) % lists.length];
}

// ---- Discover ----
window.loadDiscoverContent = function loadDiscoverContent() {
  const container = document.getElementById('discoverList');
  if (!container) return;
  
  // Set up poster card grid layout
  container.className = 'poster-cards-grid';
  
  // Show loading state
  container.innerHTML = `
    <div class="poster-cards-loading">
      <div class="poster-cards-loading__spinner">⏳</div>
      <div class="poster-cards-loading__text">Loading recommendations...</div>
    </div>
  `;
  
  // Load recommendations
  loadDiscoverRecommendations();
};

/**
 * Load discover recommendations from TMDB
 */
async function loadDiscoverRecommendations() {
  try {
    const container = document.getElementById('discoverList');
    if (!container) return;
    
    // Get not interested items to filter out
    const notInterested = getNotInterestedItems();
    
    // Load popular movies and TV shows
    const [moviesResponse, tvResponse] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${window.TMDB_API_KEY}&page=1`),
      fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${window.TMDB_API_KEY}&page=1`)
    ]);
    
    if (!moviesResponse.ok || !tvResponse.ok) {
      throw new Error('Failed to fetch recommendations');
    }
    
    const moviesData = await moviesResponse.json();
    const tvData = await tvResponse.json();
    
    // Combine and filter results
    const allItems = [
      ...moviesData.results.map(item => ({ ...item, media_type: 'movie' })),
      ...tvData.results.map(item => ({ ...item, media_type: 'tv' }))
    ];
    
    // Filter out not interested items
    const filteredItems = allItems.filter(item => 
      !notInterested.some(notItem => 
        notItem.id === item.id && notItem.media_type === item.media_type
      )
    );
    
    // Shuffle and take first 20
    const shuffled = filteredItems.sort(() => Math.random() - 0.5);
    const recommendations = shuffled.slice(0, 20);
    
    // Render recommendations
    if (recommendations.length === 0) {
      container.innerHTML = `
        <div class="poster-cards-empty">
          <div class="poster-cards-empty__icon">✨</div>
          <div class="poster-cards-empty__title">No Recommendations</div>
          <div class="poster-cards-empty__description">Try adjusting your preferences or check back later.</div>
        </div>
      `;
      return;
    }
    
    // Clear loading state
    container.innerHTML = '';
    
    // Create poster cards
    recommendations.forEach(item => {
      const card = createDiscoverCard(item);
      if (card) {
        container.appendChild(card);
      }
    });
    
  } catch (error) {
    console.error('Failed to load discover recommendations:', error);
    const container = document.getElementById('discoverList');
    if (container) {
      container.innerHTML = `
        <div class="poster-cards-error">
          <div class="poster-cards-error__icon">❌</div>
          <div class="poster-cards-error__title">Failed to Load</div>
          <div class="poster-cards-error__description">Unable to load recommendations. Please try again later.</div>
          <button class="btn btn--primary poster-cards-error__retry" onclick="loadDiscoverContent()">
            Try Again
          </button>
        </div>
      `;
    }
  }
}

/**
 * Create discover card with not interested button
 * @param {Object} item - Item data
 * @returns {HTMLElement} Card element
 */
function createDiscoverCard(item) {
  if (!window.createPosterCard) return null;
  
  const card = window.createPosterCard(item, 'discover');
  if (!card) return null;
  
  // Add not interested button
  const actions = card.querySelector('.poster-card__actions');
  if (actions) {
    const notInterestedBtn = document.createElement('button');
    notInterestedBtn.className = 'btn btn--sm btn--danger poster-card__not-interested';
    notInterestedBtn.innerHTML = 'Not Interested';
    notInterestedBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToNotInterested(item);
      card.remove();
      showToast('info', 'Added to Not Interested', `${item.title || item.name} won't appear in recommendations`);
    });
    
    actions.insertBefore(notInterestedBtn, actions.firstChild);
  }
  
  return card;
}

// ---- Not Interested Database ----

/**
 * Get all not interested items
 * @returns {Array} Array of not interested items
 */
function getNotInterestedItems() {
  try {
    const stored = localStorage.getItem('flicklet-not-interested');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get not interested items:', error);
    return [];
  }
}

/**
 * Add item to not interested list
 * @param {Object} item - Item to add
 */
function addToNotInterested(item) {
  try {
    const notInterested = getNotInterestedItems();
    const exists = notInterested.some(notItem => 
      notItem.id === item.id && notItem.media_type === item.media_type
    );
    
    if (!exists) {
      notInterested.push({
        id: item.id,
        title: item.title || item.name,
        media_type: item.media_type,
        added_date: new Date().toISOString()
      });
      
      localStorage.setItem('flicklet-not-interested', JSON.stringify(notInterested));
    }
  } catch (error) {
    console.error('Failed to add to not interested:', error);
  }
}

/**
 * Remove item from not interested list
 * @param {string|number} itemId - Item ID
 * @param {string} mediaType - Media type
 */
function removeFromNotInterested(itemId, mediaType) {
  try {
    const notInterested = getNotInterestedItems();
    const filtered = notInterested.filter(notItem => 
      !(notItem.id === itemId && notItem.media_type === mediaType)
    );
    
    localStorage.setItem('flicklet-not-interested', JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove from not interested:', error);
  }
}

/**
 * Clear all not interested items
 */
function clearNotInterested() {
  try {
    localStorage.removeItem('flicklet-not-interested');
  } catch (error) {
    console.error('Failed to clear not interested:', error);
  }
}

// ---- Modal Functions for Poster Cards ----
window.openItemDetails = function openItemDetails(id) {
  console.log('Open details for item:', id);
  // TODO: Implement item details modal
};

window.openNotesModal = function openNotesModal(item) {
  console.log('Open notes modal for:', item.title);
  // TODO: Implement notes modal
};

window.openEpisodeGuideModal = function openEpisodeGuideModal(item) {
  console.log('Open episode guide for:', item.title);
  // TODO: Implement episode guide modal
};

window.confirmRemoveItem = function confirmRemoveItem(item, section) {
  console.log('Confirm remove item:', item.title, 'from', section);
  // TODO: Implement remove confirmation modal
};

window.openProTeaserModal = function openProTeaserModal() {
  console.log('Open PRO teaser modal');
  // TODO: Implement PRO teaser modal
};

// ---- Toast Notifications ----
window.showToast = function showToast(type, title, message) {
  // Create toast container if it doesn't exist
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };
  
  toast.innerHTML = `
    <div class="toast__icon">${icons[type] || 'ℹ️'}</div>
    <div class="toast__content">
      <div class="toast__title">${title}</div>
      <div class="toast__message">${message}</div>
    </div>
    <button class="toast__close" aria-label="Close notification">×</button>
  `;
  
  // Add close functionality
  const closeBtn = toast.querySelector('.toast__close');
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });
  
  // Add to container
  container.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.classList.add('visible');
  }, 10);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.remove('visible');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }
  }, 5000);
};

// ---- Modal Functions ----

/**
 * Open notes modal for an item
 * @param {Object} item - Item data
 */
window.openNotesModal = function openNotesModal(item) {
  // Create modal backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.dataset.modal = 'notes';
  
  // Create modal content
  const modal = document.createElement('div');
  modal.className = 'modal modal--notes';
  
  // Get existing notes
  const existingNotes = getItemNotes(item.id) || '';
  
  modal.innerHTML = `
    <div class="modal__header">
      <h3 class="modal__title">Notes for ${item.title || item.name}</h3>
      <button class="modal__close" aria-label="Close modal">×</button>
    </div>
    <div class="modal__body">
      <textarea class="modal__textarea" placeholder="Add your notes about this show or movie..." rows="8">${existingNotes}</textarea>
    </div>
    <div class="modal__footer">
      <button class="btn btn--secondary modal__cancel">Cancel</button>
      <button class="btn btn--primary modal__save">Save Notes</button>
    </div>
  `;
  
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  
  // Add event listeners
  const closeBtn = modal.querySelector('.modal__close');
  const cancelBtn = modal.querySelector('.modal__cancel');
  const saveBtn = modal.querySelector('.modal__save');
  const textarea = modal.querySelector('.modal__textarea');
  
  const closeModal = () => {
    backdrop.remove();
  };
  
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });
  
  saveBtn.addEventListener('click', () => {
    const notes = textarea.value.trim();
    saveItemNotes(item.id, notes);
    showToast('success', 'Notes Saved', `Notes saved for ${item.title || item.name}`);
    closeModal();
  });
  
  // Focus textarea
  setTimeout(() => textarea.focus(), 100);
};

/**
 * Open episode guide modal for a TV show
 * @param {Object} item - Item data
 */
window.openEpisodeGuideModal = function openEpisodeGuideModal(item) {
  // Create modal backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.dataset.modal = 'episodes';
  
  // Create modal content
  const modal = document.createElement('div');
  modal.className = 'modal modal--episodes';
  
  modal.innerHTML = `
    <div class="modal__header">
      <h3 class="modal__title">Episode Guide - ${item.title || item.name}</h3>
      <button class="modal__close" aria-label="Close modal">×</button>
    </div>
    <div class="modal__body">
      <div class="episode-guide">
        <div class="episode-guide__seasons">
          <label for="seasonSelect">Season:</label>
          <select id="seasonSelect" class="episode-guide__select">
            <option value="1">Season 1</option>
            <option value="2">Season 2</option>
            <option value="3">Season 3</option>
          </select>
        </div>
        <div class="episode-guide__episodes">
          <div class="episode-guide__episode">
            <div class="episode-guide__episode-number">S1E1</div>
            <div class="episode-guide__episode-title">Pilot</div>
            <div class="episode-guide__episode-date">Jan 15, 2023</div>
            <button class="btn btn--sm episode-guide__watch-btn">Mark Watched</button>
          </div>
          <div class="episode-guide__episode">
            <div class="episode-guide__episode-number">S1E2</div>
            <div class="episode-guide__episode-title">The Second Episode</div>
            <div class="episode-guide__episode-date">Jan 22, 2023</div>
            <button class="btn btn--sm episode-guide__watch-btn">Mark Watched</button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal__footer">
      <button class="btn btn--secondary modal__close">Close</button>
    </div>
  `;
  
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  
  // Add event listeners
  const closeBtn = modal.querySelector('.modal__close');
  const backdropClose = modal.querySelector('.modal__close');
  
  const closeModal = () => {
    backdrop.remove();
  };
  
  closeBtn.addEventListener('click', closeModal);
  backdropClose.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });
};

/**
 * Confirm remove item
 * @param {Object} item - Item data
 * @param {string} section - Section type
 */
window.confirmRemoveItem = function confirmRemoveItem(item, section) {
  // Create modal backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.dataset.modal = 'remove';
  
  // Create modal content
  const modal = document.createElement('div');
  modal.className = 'modal modal--remove';
  
  modal.innerHTML = `
    <div class="modal__header">
      <h3 class="modal__title">Remove Item</h3>
      <button class="modal__close" aria-label="Close modal">×</button>
    </div>
    <div class="modal__body">
      <p>Are you sure you want to remove <strong>${item.title || item.name}</strong> from your ${section} list?</p>
      <p class="modal__warning">This action cannot be undone.</p>
    </div>
    <div class="modal__footer">
      <button class="btn btn--secondary modal__cancel">Cancel</button>
      <button class="btn btn--danger modal__confirm">Remove</button>
    </div>
  `;
  
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  
  // Add event listeners
  const closeBtn = modal.querySelector('.modal__close');
  const cancelBtn = modal.querySelector('.modal__cancel');
  const confirmBtn = modal.querySelector('.modal__confirm');
  
  const closeModal = () => {
    backdrop.remove();
  };
  
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });
  
  confirmBtn.addEventListener('click', () => {
    // Remove item from store
    removeItemFromStore(item, section);
    
    // Update UI
    const container = document.getElementById(`${section}List`);
    if (container) {
      const card = container.querySelector(`[data-id="${item.id}"]`);
      if (card) {
        card.remove();
      }
    }
    
    // Update tab counts
    if (window.updateTabCounts) {
      window.updateTabCounts();
    }
    
    showToast('success', 'Item Removed', `${item.title || item.name} removed from ${section}`);
    closeModal();
  });
};

/**
 * Open PRO teaser modal
 */
window.openProTeaserModal = function openProTeaserModal() {
  // Create modal backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.dataset.modal = 'pro';
  
  // Create modal content
  const modal = document.createElement('div');
  modal.className = 'modal modal--pro';
  
  modal.innerHTML = `
    <div class="modal__header">
      <h3 class="modal__title">⭐ Flicklet PRO</h3>
      <button class="modal__close" aria-label="Close modal">×</button>
    </div>
    <div class="modal__body">
      <div class="pro-teaser">
        <div class="pro-teaser__icon">⭐</div>
        <h4 class="pro-teaser__title">Unlock Premium Features</h4>
        <ul class="pro-teaser__features">
          <li>📝 Unlimited notes for all shows & movies</li>
          <li>📺 Detailed episode guides with air dates</li>
          <li>📊 Advanced statistics and insights</li>
          <li>🎨 Custom themes and layouts</li>
          <li>☁️ Cloud sync across all devices</li>
        </ul>
        <div class="pro-teaser__price">
          <span class="pro-teaser__amount">$4.99</span>
          <span class="pro-teaser__period">/month</span>
        </div>
      </div>
    </div>
    <div class="modal__footer">
      <button class="btn btn--secondary modal__close">Maybe Later</button>
      <button class="btn btn--primary modal__upgrade">Upgrade to PRO</button>
    </div>
  `;
  
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  
  // Add event listeners
  const closeBtn = modal.querySelector('.modal__close');
  const upgradeBtn = modal.querySelector('.modal__upgrade');
  
  const closeModal = () => {
    backdrop.remove();
  };
  
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });
  
  upgradeBtn.addEventListener('click', () => {
    showToast('info', 'Coming Soon', 'PRO upgrade will be available soon!');
    closeModal();
  });
};

/**
 * Get item notes from localStorage
 * @param {string|number} itemId - Item ID
 * @returns {string} Notes text
 */
function getItemNotes(itemId) {
  try {
    const notes = localStorage.getItem(`flicklet-notes-${itemId}`);
    return notes || '';
  } catch (error) {
    console.error('Failed to get item notes:', error);
    return '';
  }
}

/**
 * Save item notes to localStorage
 * @param {string|number} itemId - Item ID
 * @param {string} notes - Notes text
 */
function saveItemNotes(itemId, notes) {
  try {
    if (notes.trim()) {
      localStorage.setItem(`flicklet-notes-${itemId}`, notes);
    } else {
      localStorage.removeItem(`flicklet-notes-${itemId}`);
    }
  } catch (error) {
    console.error('Failed to save item notes:', error);
  }
}

/**
 * Remove item from store
 * @param {Object} item - Item data
 * @param {string} section - Section type
 */
function removeItemFromStore(item, section) {
  if (!window.appData) return;
  
  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const mediaKey = mediaType === 'tv' ? 'tv' : 'movies';
  
  if (window.appData[mediaKey] && window.appData[mediaKey][section]) {
    const list = window.appData[mediaKey][section];
    const index = list.findIndex(i => i.id === item.id);
    if (index !== -1) {
      list.splice(index, 1);
      
      // Save to localStorage
      if (window.saveAppData) {
        window.saveAppData();
      } else {
        localStorage.setItem('flicklet-data', JSON.stringify(window.appData));
      }
    }
  }
}

/**
 * Setup Not Interested management handlers
 */
function setupNotInterestedHandlers() {
  const viewBtn = document.getElementById('viewNotInterestedBtn');
  const clearBtn = document.getElementById('clearNotInterestedBtn');
  const closeBtn = document.getElementById('closeNotInterestedBtn');
  const listContainer = document.getElementById('notInterestedList');
  const itemsContainer = document.getElementById('notInterestedItems');
  
  if (viewBtn) {
    viewBtn.addEventListener('click', () => {
      loadNotInterestedList();
      listContainer.style.display = 'block';
    });
  }
  
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all "Not Interested" items? This action cannot be undone.')) {
        clearNotInterested();
        showToast('success', 'Cleared', 'All "Not Interested" items have been removed');
        if (listContainer) {
          listContainer.style.display = 'none';
        }
      }
    });
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (listContainer) {
        listContainer.style.display = 'none';
      }
    });
  }
}

/**
 * Load and display Not Interested list
 */
function loadNotInterestedList() {
  const itemsContainer = document.getElementById('notInterestedItems');
  if (!itemsContainer) return;
  
  const notInterested = getNotInterestedItems();
  
  if (notInterested.length === 0) {
    itemsContainer.innerHTML = `
      <div class="not-interested-empty">
        <p>No items marked as "Not Interested"</p>
      </div>
    `;
    return;
  }
  
  const itemsHTML = notInterested.map(item => `
    <div class="not-interested-item">
      <div class="not-interested-item__info">
        <div class="not-interested-item__title">${item.title}</div>
        <div class="not-interested-item__type">${item.media_type === 'tv' ? 'TV Show' : 'Movie'}</div>
        <div class="not-interested-item__date">Added: ${new Date(item.added_date).toLocaleDateString()}</div>
      </div>
      <button class="btn btn--sm btn--secondary not-interested-item__remove" 
              data-id="${item.id}" 
              data-media-type="${item.media_type}">
        Remove
      </button>
    </div>
  `).join('');
  
  itemsContainer.innerHTML = itemsHTML;
  
  // Add remove handlers
  const removeButtons = itemsContainer.querySelectorAll('.not-interested-item__remove');
  removeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const itemId = button.dataset.id;
      const mediaType = button.dataset.mediaType;
      
      removeFromNotInterested(itemId, mediaType);
      showToast('success', 'Removed', 'Item removed from "Not Interested" list');
      
      // Reload the list
      loadNotInterestedList();
    });
  });
}

/**
 * Setup drag-reorder functionality for lists
 */
function setupDragReorder() {
  // Add drag-reorder to all list containers
  const listContainers = ['watchingList', 'wishlistList', 'watchedList'];
  
  listContainers.forEach(containerId => {
    const container = document.getElementById(containerId);
    if (container) {
      makeSortable(container);
    }
  });
}

/**
 * Make a container sortable with drag-reorder
 * @param {HTMLElement} container - Container element
 */
function makeSortable(container) {
  let draggedElement = null;
  let draggedIndex = -1;
  
  // Add drag handles to all cards
  const addDragHandles = () => {
    const cards = container.querySelectorAll('.poster-card');
    cards.forEach(card => {
      if (!card.querySelector('.poster-card__drag-handle')) {
        const dragHandle = document.createElement('div');
        dragHandle.className = 'poster-card__drag-handle';
        dragHandle.innerHTML = '⋮⋮';
        dragHandle.setAttribute('draggable', 'true');
        dragHandle.setAttribute('aria-label', 'Drag to reorder');
        
        // Add to actions area
        const actions = card.querySelector('.poster-card__actions');
        if (actions) {
          actions.insertBefore(dragHandle, actions.firstChild);
        }
      }
    });
  };
  
  // Add drag handle styles
  const addDragStyles = () => {
    if (!document.getElementById('drag-reorder-styles')) {
      const style = document.createElement('style');
      style.id = 'drag-reorder-styles';
      style.textContent = `
        .poster-card__drag-handle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: var(--color-surface-2, #f5f5f5);
          border: 1px solid var(--color-border, #e0e0e0);
          border-radius: 4px;
          cursor: grab;
          font-size: 12px;
          color: var(--color-text-muted, #999999);
          transition: all 0.2s ease;
          margin-right: 8px;
        }
        
        .poster-card__drag-handle:hover {
          background: var(--color-primary-light, #fce4ec);
          border-color: var(--color-primary, #e91e63);
          color: var(--color-primary, #e91e63);
        }
        
        .poster-card__drag-handle:active {
          cursor: grabbing;
        }
        
        .poster-card--dragging {
          opacity: 0.5;
          transform: rotate(5deg);
          z-index: 1000;
        }
        
        .poster-card--drag-over {
          border-color: var(--color-primary, #e91e63);
          background: var(--color-primary-light, #fce4ec);
        }
        
        .poster-cards-grid--reordering {
          cursor: grabbing;
        }
        
        .poster-cards-grid--reordering .poster-card {
          transition: transform 0.2s ease;
        }
        
        @media (max-width: 768px) {
          .poster-card__drag-handle {
            width: 20px;
            height: 20px;
            font-size: 10px;
          }
        }
      `;
      document.head.appendChild(style);
    }
  };
  
  // Initialize
  addDragStyles();
  addDragHandles();
  
  // Set up drag events
  container.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('poster-card__drag-handle')) {
      draggedElement = e.target.closest('.poster-card');
      draggedIndex = Array.from(container.children).indexOf(draggedElement);
      
      draggedElement.classList.add('poster-card--dragging');
      container.classList.add('poster-cards-grid--reordering');
      
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', draggedElement.outerHTML);
    }
  });
  
  container.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('poster-card__drag-handle')) {
      draggedElement.classList.remove('poster-card--dragging');
      container.classList.remove('poster-cards-grid--reordering');
      
      // Remove drag-over classes
      const cards = container.querySelectorAll('.poster-card');
      cards.forEach(card => card.classList.remove('poster-card--drag-over'));
      
      draggedElement = null;
      draggedIndex = -1;
    }
  });
  
  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const afterElement = getDragAfterElement(container, e.clientY);
    const card = e.target.closest('.poster-card');
    
    if (card && card !== draggedElement) {
      card.classList.add('poster-card--drag-over');
    }
  });
  
  container.addEventListener('dragleave', (e) => {
    const card = e.target.closest('.poster-card');
    if (card) {
      card.classList.remove('poster-card--drag-over');
    }
  });
  
  container.addEventListener('drop', (e) => {
    e.preventDefault();
    
    const afterElement = getDragAfterElement(container, e.clientY);
    const card = e.target.closest('.poster-card');
    
    if (card && card !== draggedElement) {
      if (afterElement == null) {
        container.appendChild(draggedElement);
      } else {
        container.insertBefore(draggedElement, afterElement);
      }
      
      // Update the underlying data
      updateListOrder(container, draggedElement);
    }
    
    // Clean up
    const cards = container.querySelectorAll('.poster-card');
    cards.forEach(card => card.classList.remove('poster-card--drag-over'));
  });
  
  // Re-add drag handles when new cards are added
  const observer = new MutationObserver(() => {
    addDragHandles();
  });
  
  observer.observe(container, { childList: true, subtree: true });
}

/**
 * Get the element after which to insert the dragged element
 * @param {HTMLElement} container - Container element
 * @param {number} y - Y coordinate
 * @returns {HTMLElement|null} Element after which to insert
 */
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.poster-card:not(.poster-card--dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**
 * Update the underlying data order after drag-reorder
 * @param {HTMLElement} container - Container element
 * @param {HTMLElement} draggedElement - Dragged element
 */
function updateListOrder(container, draggedElement) {
  if (!window.appData) return;
  
  const containerId = container.id;
  const section = containerId.replace('List', '');
  const mediaType = section === 'watching' || section === 'wishlist' || section === 'watched' ? 
    (containerId.includes('tv') ? 'tv' : 'movies') : 'tv';
  
  const mediaKey = mediaType === 'tv' ? 'tv' : 'movies';
  
  if (!window.appData[mediaKey] || !window.appData[mediaKey][section]) return;
  
  // Get new order from DOM
  const cards = container.querySelectorAll('.poster-card');
  const newOrder = Array.from(cards).map(card => {
    const itemId = card.dataset.id || card.querySelector('[data-id]')?.dataset.id;
    return window.appData[mediaKey][section].find(item => item.id == itemId);
  }).filter(Boolean);
  
  // Update the data
  window.appData[mediaKey][section] = newOrder;
  
  // Save to localStorage
  if (window.saveAppData) {
    window.saveAppData();
  } else {
    localStorage.setItem('flicklet-data', JSON.stringify(window.appData));
  }
  
  showToast('success', 'Reordered', 'List order updated');
}

window.loadSettingsContent = function loadSettingsContent() {
  // Settings content is now in HTML, just add event handlers for new data tools
  FlickletDebug.info('⚙️ Loading settings content - adding data tools handlers');
  
  // Add Not Interested management handlers
  setupNotInterestedHandlers();
  
  // Add drag-reorder functionality
  setupDragReorder();
  
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
// addToListFromCache function - simplified implementation
window.addToListFromCache = function addToListFromCache(id, list) {
  console.log('📝 addToListFromCache called with:', { id, list });
  
  // For now, just log that this was called
  // The actual implementation would need to find the item in search cache
  // and add it to the appropriate list
  console.warn('⚠️ addToListFromCache not fully implemented - item not added');
  
  if (typeof window.showNotification === 'function') {
    window.showNotification('Add function not fully implemented', 'warning');
  }
};

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
// OLD changeLanguage function removed - now using LanguageManager
// The new changeLanguage is defined in language-manager.js

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
