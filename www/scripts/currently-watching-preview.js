/**
 * Currently Watching Preview Row
 * Displays a horizontal scrollable preview of items currently being watched
 * Feature flag: homeRowCurrentlyWatching
 */

(function() {
  'use strict';

  console.log('🎬 Currently Watching Preview script loaded');
  
  // Defensive guard for Card v2
  const USE_CARD_V2 = !!(window.FLAGS && window.FLAGS.cards_v2 && window.Card);

  // Feature flag check
  if (!window.FLAGS?.homeRowCurrentlyWatching) {
    console.log('🚫 Currently Watching Preview disabled by feature flag');
    return;
  }

  let isInitialized = false;

  /**
   * Initialize the Currently Watching Preview row
   */
  function initCurrentlyWatchingPreview() {
    if (isInitialized) {
      console.log('⚠️ Currently Watching Preview already initialized');
      return;
    }

    console.log('🎬 Initializing Currently Watching Preview...');

    const previewSection = document.getElementById('currentlyWatchingPreview');
    if (!previewSection) {
      console.error('❌ Currently Watching Preview section not found');
      return;
    }

    // Set up event listeners
    setupEventListeners();

    // Initial render
    renderCurrentlyWatchingPreview();

    // Listen for data changes
    document.addEventListener('appDataUpdated', renderCurrentlyWatchingPreview);
    document.addEventListener('curated:rerender', renderCurrentlyWatchingPreview);
    
    // Listen for UI updates (when updateUI is called)
    const originalUpdateUI = window.updateUI;
    if (originalUpdateUI) {
      window.updateUI = function(...args) {
        const result = originalUpdateUI.apply(this, args);
        // Trigger our preview update after a short delay
        setTimeout(renderCurrentlyWatchingPreview, 100);
        return result;
      };
    }

    isInitialized = true;
    console.log('✅ Currently Watching Preview initialized');
  }

  /**
   * Set up event listeners for the preview row
   */
  function setupEventListeners() {
    // Listen for clicks on preview cards
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.preview-card');
      if (!card) return;

      const actionBtn = e.target.closest('.preview-action-btn');
      if (actionBtn) {
        e.preventDefault();
        e.stopPropagation();
        handlePreviewAction(card, actionBtn);
        return;
      }

      // Card click - open detail view or switch to watching tab
      const itemId = card.dataset.itemId;
      if (itemId) {
        console.log('🎬 Preview card clicked, switching to watching tab');
        if (window.FlickletApp && typeof window.FlickletApp.switchToTab === 'function') {
          window.FlickletApp.switchToTab('watching');
        } else if (typeof window.switchToTab === 'function') {
          window.switchToTab('watching');
        }
      }
    });
  }

  /**
   * Handle actions on preview cards (move, remove)
   * Supports both old signature (card, actionBtn) and new signature (action, item)
   */
  function handlePreviewAction(cardOrAction, actionBtnOrItem) {
    let action, itemId;
    
    // Check if this is the new signature (action, item)
    if (typeof cardOrAction === 'string' && actionBtnOrItem && actionBtnOrItem.id) {
      action = cardOrAction;
      itemId = actionBtnOrItem.id;
    } else {
      // Old signature (card, actionBtn)
      const card = cardOrAction;
      const actionBtn = actionBtnOrItem;
      itemId = card.dataset.itemId;
      action = actionBtn.dataset.action;
    }

    if (!itemId || !action) {
      console.error('❌ Missing item ID or action');
      return;
    }

    console.log('🎬 Preview action:', action, 'for item:', itemId);

    switch (action) {
      case 'move-watched':
        if (typeof window.moveItem === 'function') {
          window.moveItem(Number(itemId), 'watched');
        }
        break;
      case 'move-wishlist':
        if (typeof window.moveItem === 'function') {
          window.moveItem(Number(itemId), 'wishlist');
        }
        break;
      case 'remove':
        if (typeof window.removeItemFromCurrentList === 'function') {
          window.removeItemFromCurrentList(Number(itemId));
        }
        break;
      default:
        console.warn('⚠️ Unknown preview action:', action);
    }
  }

  /**
   * Render the Currently Watching Preview row
   */
  function renderCurrentlyWatchingPreview() {
    const previewSection = document.getElementById('currentlyWatchingPreview');
    const scrollContainer = document.getElementById('currentlyWatchingScroll');
    
    if (!previewSection || !scrollContainer) {
      console.error('❌ Preview elements not found');
      return;
    }

    // Ensure the card wrapper has the class for CSS targeting
    scrollContainer.classList.add('row-inner');

    // Get currently watching items
    const watchingItems = getCurrentlyWatchingItems();
    
    if (!watchingItems || watchingItems.length === 0) {
      console.log('📭 No items currently watching, hiding preview row');
      previewSection.style.display = 'none';
      return;
    }

    console.log('🎬 Rendering', watchingItems.length, 'currently watching items');
    previewSection.style.display = 'block';

    // Clear existing content
    scrollContainer.innerHTML = '';

    // Render items based on configurable limit
    const maxItems = getCurrentlyWatchingLimit();
    const itemsToShow = watchingItems.slice(0, maxItems);
    
    itemsToShow.forEach(item => {
      const card = createPreviewCard(item);
      scrollContainer.appendChild(card);
    });
  }

  /**
   * Get the maximum number of currently watching items to display
   * Can be configured via localStorage setting
   */
  function getCurrentlyWatchingLimit() {
    // Check for user setting first
    const userLimit = localStorage.getItem('flicklet:currentlyWatching:limit');
    if (userLimit && !isNaN(userLimit) && userLimit > 0) {
      return Math.min(parseInt(userLimit), 20); // Cap at 20 for performance
    }
    
    // Default to 12 items (increased from original 5)
    return 12;
  }

  /**
   * Get currently watching items from app data
   */
  function getCurrentlyWatchingItems() {
    console.log('🔍 Debug: Checking appData...', {
      appData: !!window.appData,
      appDataKeys: window.appData ? Object.keys(window.appData) : 'N/A',
      tv: window.appData?.tv,
      movies: window.appData?.movies,
      tvWatching: window.appData?.tv?.watching,
      moviesWatching: window.appData?.movies?.watching
    });

    if (!window.appData) {
      console.warn('⚠️ appData not available');
      return [];
    }

    const watchingItems = [];
    
    // Get TV shows
    if (window.appData.tv?.watching) {
      console.log('📺 Found TV watching items:', window.appData.tv.watching.length);
      watchingItems.push(...window.appData.tv.watching.map(item => ({
        ...item,
        mediaType: 'tv'
      })));
    } else {
      console.log('📺 No TV watching items found');
    }

    // Get movies
    if (window.appData.movies?.watching) {
      console.log('🎬 Found movie watching items:', window.appData.movies.watching.length);
      watchingItems.push(...window.appData.movies.watching.map(item => ({
        ...item,
        mediaType: 'movie'
      })));
    } else {
      console.log('🎬 No movie watching items found');
    }

    console.log('🎬 Total watching items found:', watchingItems.length);
    
    // If no items found, try alternative data access patterns
    if (watchingItems.length === 0) {
      console.log('🔍 Trying alternative data access patterns...');
      
      // Try accessing through global functions
      if (typeof window.getWatchingItems === 'function') {
        console.log('🔍 Trying window.getWatchingItems()');
        const altItems = window.getWatchingItems();
        if (altItems && altItems.length > 0) {
          console.log('✅ Found items via getWatchingItems():', altItems.length);
          return altItems;
        }
      }
      
      // Try accessing through app instance
      if (window.FlickletApp && typeof window.FlickletApp.getWatchingItems === 'function') {
        console.log('🔍 Trying FlickletApp.getWatchingItems()');
        const altItems = window.FlickletApp.getWatchingItems();
        if (altItems && altItems.length > 0) {
          console.log('✅ Found items via FlickletApp.getWatchingItems():', altItems.length);
          return altItems;
        }
      }
      
      // Try accessing through DOM elements (fallback)
      const watchingList = document.getElementById('watchingList');
      if (watchingList) {
        console.log('🔍 Trying to extract from watchingList DOM');
        const cards = watchingList.querySelectorAll('.show-card, .list-card');
        console.log('🔍 Found', cards.length, 'cards in watchingList DOM');
        
        if (cards.length > 0) {
          const domItems = Array.from(cards).map(card => {
            const itemId = card.dataset.id || card.getAttribute('data-id');
            const title = card.querySelector('.card-title, .show-title')?.textContent || 'Unknown';
            const posterImg = card.querySelector('img');
            const poster = posterImg?.src;
            
            console.log('🔍 DOM Card data:', {
              id: itemId,
              title: title,
              posterImg: posterImg,
              posterSrc: poster,
              posterPath: poster ? poster.split('/').pop() : null
            });
            
            return {
              id: itemId,
              title: title,
              poster_path: poster ? poster.split('/').pop() : null,
              poster_src: poster, // Keep full URL for debugging
              mediaType: 'tv' // Default assumption
            };
          }).filter(item => item.id);
          
          if (domItems.length > 0) {
            console.log('✅ Found items via DOM extraction:', domItems.length);
            return domItems;
          }
        }
      }
      
      // Try waiting a bit more and checking again
      console.log('🔍 No items found, will retry in 2 seconds...');
      setTimeout(() => {
        console.log('🔄 Retrying Currently Watching Preview after delay...');
        renderCurrentlyWatchingPreview();
      }, 2000);
    }
    
    return watchingItems;
  }

  /**
   * Create a preview card element
   */
  function createPreviewCard(item) {
    // Use new Card component if enabled
    if (USE_CARD_V2) {
      const title = item.title || item.name || 'Unknown Title';
      
      // Try to use full URL first, then construct from poster_path
      let posterUrl = item.poster_src || item.poster;
      if (!posterUrl && item.poster_path) {
        posterUrl = `https://image.tmdb.org/t/p/w200${item.poster_path}`;
      }
      
      // Extract year from various possible sources
      const year = item.release_date ? new Date(item.release_date).getFullYear() : 
                   item.first_air_date ? new Date(item.first_air_date).getFullYear() : 
                   item.year || '';
      
      const subtitle = year ? `${year} • ${item.mediaType === 'tv' ? 'TV Series' : 'Movie'}` : 
                       (item.mediaType === 'tv' ? 'TV Series' : 'Movie');
      
      return window.Card({
        variant: 'compact',
        id: item.id,
        posterUrl: posterUrl,
        title: title,
        subtitle: subtitle,
        rating: item.vote_average || 0,
        badges: [{ label: 'Watching', kind: 'status' }],
        primaryAction: {
          label: window.i18n?.continue || 'Continue',
          onClick: () => {
            // Handle continue watching
            console.log('Continue watching:', title);
          }
        },
        overflowActions: [
          {
            label: 'Move to Watched',
            onClick: () => handlePreviewAction('move-watched', item),
            icon: '✅'
          },
          {
            label: 'Move to Wishlist', 
            onClick: () => handlePreviewAction('move-wishlist', item),
            icon: '📖'
          },
          {
            label: 'Remove',
            onClick: () => handlePreviewAction('remove', item),
            icon: '🗑️'
          }
        ],
        onOpenDetails: () => {
          // Handle opening details
          console.log('Open details for:', title);
        }
      });
    }
    
    // Fallback to legacy card
    const card = document.createElement('div');
    card.className = 'preview-card';
    card.dataset.itemId = item.id;
    card.dataset.mediaType = item.mediaType;

    const title = item.title || item.name || 'Unknown Title';
    
    // Try to use full URL first, then construct from poster_path
    let posterUrl = item.poster_src || item.poster;
    if (!posterUrl && item.poster_path) {
      posterUrl = `https://image.tmdb.org/t/p/w200${item.poster_path}`;
    }
    
    console.log('🖼️ Poster URL for', title, ':', posterUrl);
    
    // Extract year from various possible sources
    const year = item.release_date ? new Date(item.release_date).getFullYear() : 
                 item.first_air_date ? new Date(item.first_air_date).getFullYear() : 
                 item.year || '';

    card.innerHTML = `
      <div class="preview-card-actions">
        <button class="preview-action-btn" data-action="move-watched" title="Move to Watched">✅</button>
        <button class="preview-action-btn" data-action="move-wishlist" title="Move to Wishlist">📖</button>
        <button class="preview-action-btn" data-action="remove" title="Remove">🗑️</button>
      </div>
      <div class="preview-card-poster">
        ${posterUrl ? 
          `<img src="${posterUrl}" alt="${title}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` :
          ''
        }
        <div class="preview-card-poster-placeholder" style="display: ${posterUrl ? 'none' : 'flex'}; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 2rem;">🎬</div>
        <div class="preview-card-status">Watching</div>
      </div>
      <div class="preview-card-content">
        <h4 class="preview-card-title">${title}</h4>
        ${year ? `<p class="preview-card-year">${year}</p>` : ''}
      </div>
    `;

    return card;
  }

  // Expose render function globally for settings
  window.renderCurrentlyWatchingPreview = renderCurrentlyWatchingPreview;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCurrentlyWatchingPreview);
  } else {
    initCurrentlyWatchingPreview();
  }

  // Also initialize after delays to ensure other scripts are loaded
  setTimeout(initCurrentlyWatchingPreview, 1000);
  setTimeout(initCurrentlyWatchingPreview, 3000); // Retry after 3 seconds
  setTimeout(initCurrentlyWatchingPreview, 5000); // Final retry after 5 seconds
  setTimeout(initCurrentlyWatchingPreview, 10000); // Final retry after 10 seconds

  // Listen for Firebase data loaded events
  document.addEventListener('firebaseDataLoaded', initCurrentlyWatchingPreview);
  document.addEventListener('userDataLoaded', initCurrentlyWatchingPreview);
  
  // Listen for tab switches to watching tab (indicates data is loaded)
  document.addEventListener('tabSwitched', (event) => {
    if (event.detail && event.detail.tab === 'watching') {
      console.log('🔄 Watching tab activated, retrying Currently Watching Preview...');
      setTimeout(initCurrentlyWatchingPreview, 500);
    }
  });

  // Expose debug function globally for testing
  window.debugCurrentlyWatchingPreview = function() {
    console.log('🔍 Manual debug trigger');
    console.log('appData:', window.appData);
    console.log('appData.tv:', window.appData?.tv);
    console.log('appData.movies:', window.appData?.movies);
    console.log('watching items:', getCurrentlyWatchingItems());
    renderCurrentlyWatchingPreview();
  };
  
  // Expose function to check if user has any watching items
  window.checkWatchingData = function() {
    console.log('🔍 Checking all possible data sources...');
    console.log('1. appData.tv.watching:', window.appData?.tv?.watching);
    console.log('2. appData.movies.watching:', window.appData?.movies?.watching);
    console.log('3. Watching tab DOM:', document.getElementById('watchingList')?.innerHTML);
    console.log('4. All appData keys:', Object.keys(window.appData || {}));
  };

})();
