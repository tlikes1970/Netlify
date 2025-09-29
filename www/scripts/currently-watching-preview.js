/**
 * Currently Watching Preview Row
 * Displays a horizontal scrollable preview of items currently being watched
 * Feature flag: homeRowCurrentlyWatching
 */

(function () {
  'use strict';

  console.log('🎬 Currently Watching Preview script loaded');

  // Import TMDB image utilities
  let getPosterUrl, isValidPosterUrl;
  if (typeof window.getPosterUrl === 'function') {
    getPosterUrl = window.getPosterUrl;
    isValidPosterUrl = window.isValidPosterUrl;
  } else {
    // Fallback implementation if utility not loaded
    getPosterUrl = function (itemOrPath, size = 'w200') {
      const path =
        typeof itemOrPath === 'string'
          ? itemOrPath
          : itemOrPath?.poster_src || itemOrPath?.poster_path || '';
      if (!path) return '/assets/img/poster-placeholder.png';
      if (/^https?:\/\//i.test(path)) return path;
      return `https://image.tmdb.org/t/p/${size}/${path.replace(/^\/+/, '')}`;
    };
    isValidPosterUrl = function (url) {
      return url && (url.startsWith('http') || url.startsWith('/assets'));
    };
  }

  // Card component availability check
  const USE_CARD = !!window.Card;

  // Feature flag check
  console.log('🎬 Checking feature flag:', {
    FLAGS: window.FLAGS,
    homeRowCurrentlyWatching: window.FLAGS?.homeRowCurrentlyWatching,
  });
  if (!window.FLAGS?.homeRowCurrentlyWatching) {
    console.log('🚫 Currently Watching Preview disabled by feature flag');
    return;
  }

  // Ensure the section is visible by default
  const previewSection = document.getElementById('currentlyWatchingPreview');
  if (previewSection) {
    previewSection.style.display = 'block';
    console.log('🎬 Currently Watching Preview section made visible');
  }

  let isInitialized = false;
  let retryCount = 0;
  const MAX_RETRIES = 5;

  /**
   * Initialize the Currently Watching Preview row
   */
  function initCurrentlyWatchingPreview() {
    console.log('🎬 initCurrentlyWatchingPreview called, isInitialized:', isInitialized);
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
      window.updateUI = function (...args) {
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
   * Internal render function without guards (for internal calls)
   */
  async function renderCurrentlyWatchingPreviewInternal() {
    console.log('🎬 renderCurrentlyWatchingPreviewInternal called');

    const previewSection = document.getElementById('currentlyWatchingPreview');
    const scrollContainer = document.getElementById('currentlyWatchingScroll');

    if (!previewSection || !scrollContainer) {
      console.error('❌ Preview elements not found', {
        previewSection: !!previewSection,
        scrollContainer: !!scrollContainer,
      });
      return;
    }

    // Ensure the card wrapper has the class for CSS targeting
    scrollContainer.classList.add('row-inner');

    // Get currently watching items
    const watchingItems = getCurrentlyWatchingItems();
    console.log('🎬 Retrieved watching items:', watchingItems);

    if (!watchingItems || watchingItems.length === 0) {
      // Only show test data if no Firebase data is present and we haven't exceeded retry limit
      const hasFirebaseData =
        window.appData &&
        ((window.appData.tv?.watching && window.appData.tv.watching.length > 0) ||
          (window.appData.movies?.watching && window.appData.movies.watching.length > 0));
      const isSignedIn = window.FlickletApp?.currentUser || window.currentUser;
      const shouldShowTestData = !hasFirebaseData && !isSignedIn && retryCount < MAX_RETRIES;

      if (shouldShowTestData) {
        console.log('📭 No items currently watching, showing test data for layout verification');

        // Show test data to verify layout is working
        const testItems = [
          { id: 'test1', title: 'Test Show 1', mediaType: 'tv', poster_path: null },
          { id: 'test2', title: 'Test Show 2', mediaType: 'tv', poster_path: null },
          { id: 'test3', title: 'Test Show 3', mediaType: 'tv', poster_path: null },
        ];

        console.log('🎬 Rendering test data for layout verification');
        previewSection.style.display = 'block';
        scrollContainer.innerHTML = '';

        for (const item of testItems) {
          try {
            const card = await createPreviewCard(item);
            scrollContainer.appendChild(card);
          } catch (error) {
            console.error('❌ Failed to create preview card for test item:', error);
          }
        }

        // Set up a retry for real data (only once to prevent infinite loops)
        if (!window._currentlyWatchingRetryScheduled && retryCount < MAX_RETRIES) {
          window._currentlyWatchingRetryScheduled = true;
          setTimeout(async () => {
            const retryItems = getCurrentlyWatchingItems();
            if (retryItems && retryItems.length > 0) {
              console.log('🎬 Found real items on retry, replacing test data...');
            // Clear container before rendering real data
            scrollContainer.innerHTML = '';
            // Call the render function directly instead of recursively
            await renderCurrentlyWatchingPreviewInternal();
            }
            window._currentlyWatchingRetryScheduled = false; // Reset for future use
          }, 3000);
        }
      } else {
        // Hide section if no data and no test mode
        console.log('📭 No items currently watching, hiding section');
        previewSection.style.display = 'none';
        scrollContainer.innerHTML = '';
      }
      return;
    }

    // Show the section
    previewSection.style.display = 'block';
    scrollContainer.innerHTML = '';

    // Limit items to prevent performance issues
    const limit = getCurrentlyWatchingLimit();
    const limitedItems = watchingItems.slice(0, limit);

    console.log(
      `🎬 Rendering ${limitedItems.length} watching items (limited from ${watchingItems.length})`,
    );

    // Render each item
    for (const item of limitedItems) {
      try {
        const card = await createPreviewCard(item);
        scrollContainer.appendChild(card);
      } catch (error) {
        console.error('❌ Failed to create preview card for item:', error);
      }
    }

    // Add scroll indicators if there are more items than can be displayed
    if (watchingItems.length > limit) {
      console.log(
        `🎬 Added scroll indicators for ${watchingItems.length - limit} additional items`,
      );
    }

    // Post-render validation: check that all poster URLs are properly formatted
    validatePosterUrls();

    // Dispatch event to notify that cards have been rendered
    window.dispatchEvent(
      new CustomEvent('cards:rendered', {
        detail: {
          count: limitedItems.length,
          section: 'currently-watching',
        },
      }),
    );
  }

  /**
   * Render the Currently Watching Preview row
   */
  function renderCurrentlyWatchingPreview() {
    console.log('🎬 renderCurrentlyWatchingPreview called');

    // Prevent duplicate renders
    if (window.render_currently_watching_preview) {
      console.log('🎬 Skipping duplicate currently watching preview render');
      return;
    }
    window.render_currently_watching_preview = true;

    const previewSection = document.getElementById('currentlyWatchingPreview');
    const scrollContainer = document.getElementById('currentlyWatchingScroll');

    if (!previewSection || !scrollContainer) {
      console.error('❌ Preview elements not found', {
        previewSection: !!previewSection,
        scrollContainer: !!scrollContainer,
      });
      window.render_currently_watching_preview = false;
      return;
    }

    // Ensure the card wrapper has the class for CSS targeting
    scrollContainer.classList.add('row-inner');

    try {
      // Call the internal render function
      await renderCurrentlyWatchingPreviewInternal();
    } finally {
      // Always reset the render guard
      window.render_currently_watching_preview = false;
    }
  }

  /**
   * Validate that all poster URLs in the currently watching preview are properly formatted
   */
  function validatePosterUrls() {
    const previewImages = document.querySelectorAll('#currentlyWatchingPreview img');
    const invalidUrls = [];

    previewImages.forEach((img, index) => {
      const src = img.src;
      const itemId = img.closest('.preview-card')?.dataset?.itemId || `item-${index}`;

      if (!isValidPosterUrl(src)) {
        invalidUrls.push({ itemId, src });
        console.error(`❌ Invalid poster URL for item ${itemId}:`, src);
      } else {
        console.log(`✅ Valid poster URL for item ${itemId}:`, src);
      }
    });

    if (invalidUrls.length > 0) {
      console.error('❌ Found invalid poster URLs:', invalidUrls);
    } else {
      console.log('✅ All poster URLs are properly formatted');
    }

    return invalidUrls.length === 0;
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
    if (!window.appData) {
      return [];
    }

    const allWatchingItems = [];

    // Get TV shows
    if (window.appData.tv?.watching) {
      allWatchingItems.push(
        ...window.appData.tv.watching.map((item) => ({
          ...item,
          mediaType: 'tv',
        })),
      );
    }

    // Get movies
    if (window.appData.movies?.watching) {
      allWatchingItems.push(
        ...window.appData.movies.watching.map((item) => ({
          ...item,
          mediaType: 'movie',
        })),
      );
    }

    // Deduplicate items by ID
    const watchingItems = [];
    const seenIds = new Set();
    allWatchingItems.forEach((item) => {
      const id = item.id || item.tmdb_id || item.tmdbId;
      if (id && !seenIds.has(id)) {
        seenIds.add(id);
        watchingItems.push(item);
      }
    });

    console.log(`🎬 Found ${watchingItems.length} unique watching items`);

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
          const domItems = Array.from(cards)
            .map((card) => {
              const itemId = card.dataset.id || card.getAttribute('data-id');
              const title =
                card.querySelector('.card-title, .show-title')?.textContent || 'Unknown';
              const posterImg = card.querySelector('img');
              const poster = posterImg?.src;

              console.log('🔍 DOM Card data:', {
                id: itemId,
                title: title,
                posterImg: posterImg,
                posterSrc: poster,
                posterPath: poster ? poster.split('/').pop() : null,
              });

              return {
                id: itemId,
                title: title,
                poster_path: poster ? poster.split('/').pop() : null,
                poster_src: poster, // Keep full URL for debugging
                mediaType: 'tv', // Default assumption
              };
            })
            .filter((item) => item.id);

          if (domItems.length > 0) {
            console.log('✅ Found items via DOM extraction:', domItems.length);

            // Note: DOM extraction is only used as fallback for display purposes
            // The actual data should come from appData which is loaded from Firebase

            return domItems;
          }
        }
      }

      // Try waiting a bit more and checking again (with retry limit)
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(
          `🔍 No items found, will retry in 2 seconds... (attempt ${retryCount}/${MAX_RETRIES})`,
        );
        setTimeout(() => {
          console.log('🔄 Retrying Currently Watching Preview after delay...');
          renderCurrentlyWatchingPreview();
        }, 2000);
      } else {
        console.log('❌ Max retries reached, stopping retry loop');
      }
    }

    return watchingItems;
  }

  /**
   * Create a preview card element using MediaCard system
   */
  async function createPreviewCard(item) {
    console.log('🎬 createPreviewCard called with item:', item);

    // Use MediaCard system if available
    if (typeof window.renderMediaCard === 'function') {
      try {
        // Transform item data for MediaCard
        const mediaCardData = {
          id: item.id || item.tmdb_id || item.tmdbId,
          title: item.title || item.name || 'Unknown Title',
          year: item.release_date
            ? new Date(item.release_date).getFullYear()
            : item.first_air_date
              ? new Date(item.first_air_date).getFullYear()
              : item.year || '',
          type: item.media_type === 'tv' || item.first_air_date ? 'TV Show' : 'Movie',
          posterUrl: getPosterUrl(item, 'w200'),
          tmdbUrl: item.tmdbUrl || (item.id ? `https://www.themoviedb.org/${item.media_type || 'movie'}/${item.id}` : '#'),
          genres: item.genres?.map(g => g.name) || [],
          description: item.overview || '',
          rating: item.vote_average || 0,
          userRating: 0
        };

        // Create MediaCard with 'watching' context for proper action buttons
        const card = await window.renderMediaCard(mediaCardData, 'watching');
        
        // Add preview-specific styling
        card.classList.add('preview-card');
        
        return card;
      } catch (error) {
        console.error('❌ MediaCard creation failed:', error);
        throw error;
      }
    }

    // Fallback to old Card component if MediaCard not available
    if (USE_CARD) {
      const title = item.title || item.name || 'Unknown Title';
      const posterUrl = getPosterUrl(item, 'w200');
      const year = item.release_date
        ? new Date(item.release_date).getFullYear()
        : item.first_air_date
          ? new Date(item.first_air_date).getFullYear()
          : item.year || '';

      const subtitle = year
        ? `${year} • ${item.mediaType === 'tv' ? 'TV Series' : 'Movie'}`
        : item.mediaType === 'tv'
          ? 'TV Series'
          : 'Movie';

      return window.Card({
        variant: 'poster',
        id: item.id,
        posterUrl: posterUrl,
        title: title,
        subtitle: subtitle,
        rating: item.vote_average || 0,
        badges: [{ label: 'Watching', kind: 'status' }],
        primaryAction: {
          label: window.i18n?.continue || 'Continue',
          onClick: () => {
            console.log('Continue watching:', title);
          },
        },
        overflowActions: [
          {
            label: 'Move to Watched',
            onClick: () => handlePreviewAction('move-watched', item),
            icon: '✅',
          },
          {
            label: 'Move to Wishlist',
            onClick: () => handlePreviewAction('move-wishlist', item),
            icon: '📖',
          },
          {
            label: 'Remove',
            onClick: () => handlePreviewAction('remove', item),
            icon: '🗑️',
          },
        ],
        onOpenDetails: () => {
          console.log('🔗 Currently watching Card openDetails called:', item);
          const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
          const id = item.id || item.tmdb_id || item.tmdbId;

          if (id && typeof window.openTMDBLink === 'function') {
            console.log('🔗 Calling openTMDBLink from currently watching Card:', { id, mediaType });
            window.openTMDBLink(id, mediaType);
          } else {
            console.warn('⚠️ openTMDBLink function not available or no ID found');
          }
        },
      });
    }

    // If neither system is available, throw an error
    console.error('❌ Neither MediaCard nor Card component available');
    throw new Error('Card component is required but not loaded');
  }

  // Expose render function globally for settings
  window.renderCurrentlyWatchingPreview = renderCurrentlyWatchingPreview;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCurrentlyWatchingPreview);
  } else {
    initCurrentlyWatchingPreview();
  }

  // Also initialize after a single delay to ensure other scripts are loaded
  setTimeout(initCurrentlyWatchingPreview, 1000);

  // Listen for Firebase data loaded events
  document.addEventListener('firebaseDataLoaded', () => {
    console.log('🎬 Firebase data loaded event received');
    console.log('🎬 Checking appData after firebaseDataLoaded:', {
      tvWatching: window.appData?.tv?.watching?.length || 0,
      moviesWatching: window.appData?.movies?.watching?.length || 0,
    });
    initCurrentlyWatchingPreview();
  });
  document.addEventListener('userDataLoaded', () => {
    console.log('🎬 User data loaded event received');
    console.log('🎬 Checking appData after userDataLoaded:', {
      tvWatching: window.appData?.tv?.watching?.length || 0,
      moviesWatching: window.appData?.movies?.watching?.length || 0,
    });
    initCurrentlyWatchingPreview();
  });

  // Listen for sign-out events to clear preview immediately
  document.addEventListener('userSignedOut', () => {
    console.log('🎬 User signed out, clearing Currently Watching Preview');
    const previewSection = document.getElementById('currentlyWatchingPreview');
    const scrollContainer = document.getElementById('currentlyWatchingScroll');
    if (previewSection) {
      previewSection.style.display = 'none';
    }
    if (scrollContainer) {
      scrollContainer.innerHTML = '';
    }
    retryCount = 0; // Reset retry count
  });

  // Listen for tab switches to watching tab (indicates data is loaded)
  document.addEventListener('tabSwitched', (event) => {
    if (event.detail && event.detail.tab === 'watching') {
      console.log('🔄 Watching tab activated, retrying Currently Watching Preview...');
      setTimeout(initCurrentlyWatchingPreview, 500);
    }
  });

  // Expose debug function globally for testing
  window.debugCurrentlyWatchingPreview = function () {
    console.log('🔍 Manual debug trigger');
    console.log('appData:', window.appData);
    console.log('appData.tv:', window.appData?.tv);
    console.log('appData.movies:', window.appData?.movies);
    console.log('watching items:', getCurrentlyWatchingItems());
    renderCurrentlyWatchingPreview();
  };

  // Expose function to check if user has any watching items
  window.checkWatchingData = function () {
    console.log('🔍 Checking all possible data sources...');
    console.log('1. appData.tv.watching:', window.appData?.tv?.watching);
    console.log('2. appData.movies.watching:', window.appData?.movies?.watching);
    console.log('3. Watching tab DOM:', document.getElementById('watchingList')?.innerHTML);
    console.log('4. All appData keys:', Object.keys(window.appData || {}));
  };

  // Expose function to manually trigger Currently Watching Preview
  window.triggerCurrentlyWatchingPreview = function () {
    console.log('🎬 Manually triggering Currently Watching Preview...');
    retryCount = 0; // Reset retry count
    renderCurrentlyWatchingPreview();
  };

  // Expose function to check data loading status
  window.checkDataLoadingStatus = function () {
    console.log('🔍 Data Loading Status Check:');
    console.log('1. appData exists:', !!window.appData);
    console.log('2. appData.tv exists:', !!window.appData?.tv);
    console.log('3. appData.tv.watching exists:', !!window.appData?.tv?.watching);
    console.log('4. appData.tv.watching length:', window.appData?.tv?.watching?.length || 0);
    console.log('5. appData.tv.watching content:', window.appData?.tv?.watching);
    console.log(
      '6. appData.movies.watching length:',
      window.appData?.movies?.watching?.length || 0,
    );
    console.log('7. appData.movies.watching content:', window.appData?.movies?.watching);

    // Check if there are any items in the main watching list DOM
    const watchingList = document.getElementById('watchingList');
    if (watchingList) {
      const cards = watchingList.querySelectorAll('.show-card, .list-card');
      console.log('8. DOM watchingList cards count:', cards.length);
      if (cards.length > 0) {
        console.log('9. First card data:', {
          id: cards[0].dataset.id,
          title: cards[0].querySelector('.show-title, .card-title')?.textContent,
          poster: cards[0].querySelector('img')?.src,
        });
      }
    }

    // Check the actual data that getCurrentlyWatchingItems() would return
    console.log('10. getCurrentlyWatchingItems() result:', getCurrentlyWatchingItems());
  };
})();
