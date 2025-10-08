/**
 * Enhanced Functions - v28.81
 * Fixed data operations with proper error handling and race condition prevention
 * Uses DataOperations as single source of truth
 */

(function() {
  'use strict';
  
  const NS = '[functions-v2]';
  const log = (...a) => console.log(NS, ...a);
  const warn = (...a) => console.warn(NS, ...a);
  const err = (...a) => console.error(NS, ...a);

  // Wait for DataOperations to be available
  const waitForDataOperations = async () => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max
    
    while (!window.DataOperations && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!window.DataOperations) {
      throw new Error('DataOperations not available after timeout');
    }
    
    return window.DataOperations;
  };

  /**
   * Enhanced addToListFromCache with proper error handling
   */
  window.addToListFromCacheV2 = async function addToListFromCacheV2(id, list, options = {}) {
    try {
      log('addToListFromCacheV2 called:', { id, list, options });
      
      // Validate inputs
      if (!id) {
        throw new Error('Item ID is required');
      }
      
      if (!list || !['watching', 'wishlist', 'watched'].includes(list)) {
        throw new Error('Invalid list name');
      }

      // Wait for DataOperations
      const dataOps = await waitForDataOperations();
      
      // Check if item already exists
      const exists = await dataOps.hasItem(id, list);
      if (exists) {
        log('Item already exists in list:', list);
        if (typeof window.showNotification === 'function') {
          window.showNotification(`Already in ${list}`, 'info');
        } else if (window.NotificationSystem) {
          window.NotificationSystem.show(`Already in ${list}`, 'info');
        }
        
        // Update UI even if item already exists
        updateUIAfterDataChange();
        
        return true;
      }

      // Extract item data from options first, then from search results
      let itemData = options.itemData || null;
      
      if (!itemData) {
        const searchRoot =
          document.getElementById('searchResultsList') ||
          document.getElementById('searchResultsGrid') ||
          document.getElementById('searchResults') ||
          document;
        
        if (searchRoot) {
          const card = searchRoot.querySelector(`[data-id="${id}"]`);
          if (card && card.dataset.itemData) {
            try {
              itemData = JSON.parse(card.dataset.itemData);
              log('Found item data from search results:', itemData);
            } catch (e) {
              warn('Failed to parse item data from search results:', e);
            }
          }
        }
      } else {
        log('Using item data from options:', itemData);
      }
      
      // If no item data from search, try to get it from other sources
      if (!itemData) {
        itemData = await getItemData(id);
        if (!itemData) {
          throw new Error('Could not retrieve item data');
        }
      }

      // Add item using DataOperations with full item data
      const success = await dataOps.addItem(id, list, itemData);
      
      if (success) {
        log('Item added successfully to', list);
        
        // Show success notification
        if (typeof window.showNotification === 'function') {
          window.showNotification(`Added to ${list}`, 'success');
        } else if (window.NotificationSystem) {
          window.NotificationSystem.show(`Added to ${list}`, 'success');
        }
        
        // Remove from search results
        removeFromSearchResults(id);
        
        // Update UI
        updateUIAfterDataChange();
        
        return true;
      } else {
        throw new Error('Failed to add item to list');
      }
    } catch (error) {
      err('addToListFromCacheV2 failed:', error.message);
      
        // Show error notification
        if (typeof window.showNotification === 'function') {
          window.showNotification('Failed to add item', 'error');
        } else if (window.NotificationSystem) {
          window.NotificationSystem.show('Failed to add item', 'error');
        }
      
      return false;
    }
  };

  /**
   * Enhanced moveItem with proper error handling
   */
  window.moveItemV2 = async function moveItemV2(id, dest) {
    try {
      log('moveItemV2 called:', { id, dest });
      
      // Validate inputs
      if (!id) {
        throw new Error('Item ID is required');
      }
      
      if (!dest || !['watching', 'wishlist', 'watched'].includes(dest)) {
        throw new Error('Invalid destination list');
      }

      // Wait for DataOperations
      const dataOps = await waitForDataOperations();
      
      // Find source list
      const sourceList = await findItemSourceList(id, dataOps);
      if (!sourceList) {
        throw new Error('Item not found in any list');
      }
      
      if (sourceList === dest) {
        log('Item already in target list');
        return true;
      }

      // Move item using DataOperations
      const success = await dataOps.moveItem(id, sourceList, dest);
      
      if (success) {
        log('Item moved successfully from', sourceList, 'to', dest);
        
        // Show success notification
        if (typeof window.showNotification === 'function') {
          window.showNotification(`Moved to ${dest}`, 'success');
        } else if (window.NotificationSystem) {
          window.NotificationSystem.show(`Moved to ${dest}`, 'success');
        }
        
        // Update UI
        updateUIAfterDataChange();
        
        return true;
      } else {
        throw new Error('Failed to move item');
      }
    } catch (error) {
      err('moveItemV2 failed:', error.message);
      
      // Show error notification
      if (typeof window.showNotification === 'function') {
        window.showNotification('Failed to move item', 'error');
      } else if (window.NotificationSystem) {
        window.NotificationSystem.show('Failed to move item', 'error');
      }
      
      return false;
    }
  };

  /**
   * Enhanced removeItemFromCurrentList with proper error handling
   */
  window.removeItemFromCurrentListV2 = async function removeItemFromCurrentListV2(id) {
    try {
      log('removeItemFromCurrentListV2 called:', { id });
      
      // Validate inputs
      if (!id) {
        throw new Error('Item ID is required');
      }

      // Wait for DataOperations
      const dataOps = await waitForDataOperations();
      
      // Debug: Check cache state
      const cache = dataOps._adapter?.getCache();
      if (cache) {
        log('Cache state:', {
          watchingIds: cache.watchingIds?.length || 0,
          wishlistIds: cache.wishlistIds?.length || 0,
          watchedIds: cache.watchedIds?.length || 0
        });
        log('Looking for ID:', String(id));
        log('Watching IDs:', cache.watchingIds);
        log('Wishlist IDs:', cache.wishlistIds);
        log('Watched IDs:', cache.watchedIds);
      }
      
      // Find source list
      const sourceList = await findItemSourceList(id, dataOps);
      if (!sourceList) {
        err('Item not found in any list');
        return false;
      }

      // Remove item using DataOperations
      const success = await dataOps.removeItem(id, sourceList);
      
      if (success) {
        log('Item removed successfully from', sourceList);
        
        // Show success notification
        if (typeof window.showNotification === 'function') {
          window.showNotification('Item removed', 'success');
        } else if (window.NotificationSystem) {
          window.NotificationSystem.show('Item removed', 'success');
        }
        
        // Update UI
        updateUIAfterDataChange();
        
        return true;
      } else {
        throw new Error('Failed to remove item');
      }
    } catch (error) {
      err('removeItemFromCurrentListV2 failed:', error.message);
      
      // Show error notification
      if (typeof window.showNotification === 'function') {
        window.showNotification('Failed to remove item', 'error');
      } else if (window.NotificationSystem) {
        window.NotificationSystem.show('Failed to remove item', 'error');
      }
      
      return false;
    }
  };

  /**
   * Get item data from various sources
   */
  async function getItemData(id) {
    try {
      // Try to find in search results first
      const searchRoot = document.getElementById('searchResultsList') ||
                        document.getElementById('searchResultsGrid') ||
                        document.getElementById('searchResults') ||
                        document;
      
      if (searchRoot) {
        const card = searchRoot.querySelector(`[data-id="${id}"]`);
        if (card) {
          // Try to get stored item data
          if (card.dataset.itemData) {
            try {
              const itemData = JSON.parse(card.dataset.itemData);
              log('Found stored item data:', itemData);
              return itemData;
            } catch (e) {
              warn('Failed to parse stored item data:', e);
            }
          }
          
          // Extract from card elements
          const title = card.querySelector('.unified-card-title')?.textContent || 'Unknown';
          const mediaType = card.dataset.mediaType || 'movie';
          
          return {
            id: Number(id),
            title: title,
            name: title,
            media_type: mediaType
          };
        }
      }
      
      // Try to fetch from TMDB
      if (window.resolveTMDBItem) {
        try {
          const tmdbData = await window.resolveTMDBItem(id);
          if (tmdbData && tmdbData.id) {
            return {
              id: Number(id),
              title: tmdbData.title || tmdbData.name || `Item ${id}`,
              name: tmdbData.name || tmdbData.title || `Item ${id}`,
              media_type: tmdbData.media_type,
              poster_path: tmdbData.poster_path,
              release_date: tmdbData.release_date || tmdbData.first_air_date,
              vote_average: tmdbData.vote_average,
              overview: tmdbData.overview
            };
          }
        } catch (error) {
          warn('Failed to fetch from TMDB:', error.message);
        }
      }
      
      // Fallback to basic structure
      return {
        id: Number(id),
        title: `Item ${id}`,
        name: `Item ${id}`,
        media_type: 'movie'
      };
    } catch (error) {
      err('getItemData failed:', error.message);
      return null;
    }
  }

  /**
   * Find which list contains the item with retry logic and better error handling
   */
  async function findItemSourceList(id, dataOps, retryCount = 0) {
    try {
      const idStr = String(id);
      log(`[findItemSourceList] Looking for ID ${idStr}, attempt ${retryCount + 1}`);
      
      // Method 1: Check cache directly first for better performance
      const cache = dataOps._adapter?.getCache();
      if (cache) {
        log(`[findItemSourceList] Cache state:`, {
          watchingIds: cache.watchingIds?.length || 0,
          wishlistIds: cache.wishlistIds?.length || 0,
          watchedIds: cache.watchedIds?.length || 0
        });
        
        if (cache.watchingIds?.includes(idStr)) {
          log(`[findItemSourceList] Found in watching list`);
          return 'watching';
        }
        if (cache.wishlistIds?.includes(idStr)) {
          log(`[findItemSourceList] Found in wishlist`);
          return 'wishlist';
        }
        if (cache.watchedIds?.includes(idStr)) {
          log(`[findItemSourceList] Found in watched list`);
          return 'watched';
        }
      }
      
      // Method 2: Fallback to hasItem method
      const lists = ['watching', 'wishlist', 'watched'];
      for (const list of lists) {
        const exists = await dataOps.hasItem(id, list);
        if (exists) {
          log(`[findItemSourceList] Found in ${list} via hasItem method`);
          return list;
        }
      }
      
      // Method 3: Check appData directly as last resort
      const appData = window.appData || {};
      const tv = appData.tv || {};
      const movies = appData.movies || {};
      
      const allLists = [
        ...(Array.isArray(tv.watching) ? tv.watching : []),
        ...(Array.isArray(tv.wishlist) ? tv.wishlist : []),
        ...(Array.isArray(tv.watched) ? tv.watched : []),
        ...(Array.isArray(movies.watching) ? movies.watching : []),
        ...(Array.isArray(movies.wishlist) ? movies.wishlist : []),
        ...(Array.isArray(movies.watched) ? movies.watched : []),
      ];
      
      const item = allLists.find((item) => 
        String(item.id || item.tmdb_id || item.tmdbId) === idStr
      );
      
      if (item) {
        // Determine which list it's in
        if (tv.watching?.some(i => String(i.id || i.tmdb_id || i.tmdbId) === idStr)) {
          log(`[findItemSourceList] Found in appData tv.watching`);
          return 'watching';
        }
        if (tv.wishlist?.some(i => String(i.id || i.tmdb_id || i.tmdbId) === idStr)) {
          log(`[findItemSourceList] Found in appData tv.wishlist`);
          return 'wishlist';
        }
        if (tv.watched?.some(i => String(i.id || i.tmdb_id || i.tmdbId) === idStr)) {
          log(`[findItemSourceList] Found in appData tv.watched`);
          return 'watched';
        }
        if (movies.watching?.some(i => String(i.id || i.tmdb_id || i.tmdbId) === idStr)) {
          log(`[findItemSourceList] Found in appData movies.watching`);
          return 'watching';
        }
        if (movies.wishlist?.some(i => String(i.id || i.tmdb_id || i.tmdbId) === idStr)) {
          log(`[findItemSourceList] Found in appData movies.wishlist`);
          return 'wishlist';
        }
        if (movies.watched?.some(i => String(i.id || i.tmdb_id || i.tmdbId) === idStr)) {
          log(`[findItemSourceList] Found in appData movies.watched`);
          return 'watched';
        }
      }
      
      // Method 4: Retry with delay if this is the first attempt
      if (retryCount === 0) {
        log(`[findItemSourceList] Item not found, retrying after 100ms delay...`);
        await new Promise(resolve => setTimeout(resolve, 100));
        return await findItemSourceList(id, dataOps, 1);
      }
      
      log(`[findItemSourceList] Item ${idStr} not found in any list after ${retryCount + 1} attempts`);
      return null;
    } catch (error) {
      err('findItemSourceList failed:', error.message);
      return null;
    }
  }

  /**
   * Remove item from search results
   */
  function removeFromSearchResults(id) {
    try {
      const searchRoot = document.getElementById('searchResultsList') ||
                        document.getElementById('searchResultsGrid') ||
                        document.getElementById('searchResults');
      
      if (searchRoot) {
        const card = searchRoot.querySelector(`[data-id="${id}"]`);
        if (card) {
          card.remove();
          log('Removed item from search results');
          
          // Update results count
          const resultsCount = document.getElementById('resultsCount');
          if (resultsCount) {
            const remaining = searchRoot.querySelectorAll('[data-id]').length;
            resultsCount.textContent = String(remaining);
          }
        }
      }
    } catch (error) {
      warn('removeFromSearchResults failed:', error.message);
    }
  }

  /**
   * Update UI after data changes
   */
  async function updateUIAfterDataChange() {
    try {
      log('[updateUIAfterDataChange] Starting UI update...');
      
      // Step 1: Ensure cache is synchronized before any UI updates
      if (window.WatchlistsAdapterV2 && window.DataOperations) {
        log('[updateUIAfterDataChange] Synchronizing cache...');
        await window.WatchlistsAdapterV2.load(window.firebaseAuth?.currentUser?.uid || null);
        
        // Force cache refresh if needed
        const cache = window.WatchlistsAdapterV2.getCache();
        if (!cache || (!cache.watchingIds && !cache.wishlistIds && !cache.watchedIds)) {
          log('[updateUIAfterDataChange] Cache appears empty, forcing reload...');
          window.WatchlistsAdapterV2.invalidate();
          await window.WatchlistsAdapterV2.load(window.firebaseAuth?.currentUser?.uid || null);
        }
      }
      
      // Step 2: Update tab counts with delay to ensure cache is ready
      if (typeof window.updateTabCounts === 'function') {
        setTimeout(() => {
          window.updateTabCounts();
        }, 50);
      }
      
      // Step 3: Update main UI with delay
      if (window.FlickletApp && typeof window.FlickletApp.updateUI === 'function') {
        setTimeout(() => {
          window.FlickletApp.updateUI();
        }, 100);
      }
      
      // Step 4: Wait for adapter hydration before rendering home components
      const uid = window.firebaseAuth?.currentUser?.uid || null;
      if (window.WatchlistsAdapterV2 && uid) {
        // Listen for hydration event before rendering home components
        const handleHydration = () => {
          // Refresh home page rails
          if (typeof window.renderHomeRails === 'function') {
            window.renderHomeRails();
          }
          
          // Refresh currently watching preview
          if (typeof window.renderCurrentlyWatchingPreview === 'function') {
            window.renderCurrentlyWatchingPreview();
          }
          
          // Remove the event listener
          document.removeEventListener('watchlists:hydrated', handleHydration);
        };
        
        // Check if already hydrated
        if (window.WatchlistsAdapterV2._cache && window.WatchlistsAdapterV2._lastUid === uid) {
          // Already hydrated, render immediately
          if (typeof window.renderHomeRails === 'function') {
            window.renderHomeRails();
          }
          if (typeof window.renderCurrentlyWatchingPreview === 'function') {
            window.renderCurrentlyWatchingPreview();
          }
        } else {
          // Wait for hydration
          document.addEventListener('watchlists:hydrated', handleHydration);
        }
      } else {
        // Fallback: render immediately if no adapter
        if (typeof window.renderHomeRails === 'function') {
          window.renderHomeRails();
        }
        if (typeof window.renderCurrentlyWatchingPreview === 'function') {
          window.renderCurrentlyWatchingPreview();
        }
      }
      
      // Step 5: Emit cards changed event with delay
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('cards:changed', {
          detail: { source: 'functions-v2' }
        }));
        
        // Force tab counts update
        if (typeof window.updateTabCounts === 'function') {
          window.updateTabCounts();
        }
      }, 150);
      
      log('[updateUIAfterDataChange] UI update completed');
    } catch (error) {
      warn('updateUIAfterDataChange failed:', error.message);
    }
  }

  // Replace old functions with new ones
  window.addToListFromCache = window.addToListFromCacheV2;
  window.moveItem = window.moveItemV2;
  window.removeItemFromCurrentList = window.removeItemFromCurrentListV2;

  /**
   * Debug function to test cache state
   */
  window.debugCacheState = async function debugCacheState() {
    try {
      log('=== CACHE DEBUG STATE ===');
      
      // Check DataOperations
      if (window.DataOperations) {
        const dataOps = window.DataOperations;
        log('DataOperations initialized:', dataOps._initialized);
        log('DataOperations adapter:', dataOps._adapter ? 'available' : 'null');
        
        if (dataOps._adapter) {
          const cache = dataOps._adapter.getCache();
          log('Cache from DataOperations:', cache);
        }
      } else {
        log('DataOperations not available');
      }
      
      // Check WatchlistsAdapterV2
      if (window.WatchlistsAdapterV2) {
        const adapter = window.WatchlistsAdapterV2;
        log('WatchlistsAdapterV2 cache:', adapter.getCache());
        log('WatchlistsAdapterV2 lastUid:', adapter._lastUid);
      } else {
        log('WatchlistsAdapterV2 not available');
      }
      
      // Check appData
      if (window.appData) {
        log('appData structure:', {
          hasWatchlists: !!window.appData.watchlists,
          hasMovies: !!window.appData.movies,
          hasTv: !!window.appData.tv,
          moviesWatching: window.appData.movies?.watching?.length || 0,
          moviesWishlist: window.appData.movies?.wishlist?.length || 0,
          moviesWatched: window.appData.movies?.watched?.length || 0,
          tvWatching: window.appData.tv?.watching?.length || 0,
          tvWishlist: window.appData.tv?.wishlist?.length || 0,
          tvWatched: window.appData.tv?.watched?.length || 0
        });
      } else {
        log('appData not available');
      }
      
      log('=== END CACHE DEBUG ===');
    } catch (error) {
      err('Debug cache state failed:', error.message);
    }
  };

  /**
   * Test function to add and remove an item
   */
  window.testAddRemoveItem = async function testAddRemoveItem(testId = '999999') {
    try {
      log('=== TEST ADD/REMOVE ITEM ===');
      log('Testing with ID:', testId);
      
      // Check initial state
      await window.debugCacheState();
      
      // Add item
      log('Adding item...');
      const addResult = await window.addToListFromCacheV2(testId, 'watching', {
        id: Number(testId),
        title: 'Test Item',
        name: 'Test Item',
        media_type: 'movie'
      });
      log('Add result:', addResult);
      
      // Check state after add
      await window.debugCacheState();
      
      // Try to remove item
      log('Removing item...');
      const removeResult = await window.removeItemFromCurrentListV2(testId);
      log('Remove result:', removeResult);
      
      // Check final state
      await window.debugCacheState();
      
      log('=== END TEST ===');
    } catch (error) {
      err('Test add/remove item failed:', error.message);
    }
  };

  /**
   * Test function to check if item exists in cache
   */
  window.testItemExists = async function testItemExists(testId = '999999') {
    try {
      log('=== TEST ITEM EXISTS ===');
      log('Testing with ID:', testId);
      
      if (window.DataOperations) {
        const dataOps = window.DataOperations;
        await dataOps._ensureInitialized();
        
        const lists = ['watching', 'wishlist', 'watched'];
        for (const list of lists) {
          const exists = await dataOps.hasItem(testId, list);
          log(`Item ${testId} exists in ${list}:`, exists);
        }
      } else {
        log('DataOperations not available');
      }
      
      log('=== END TEST ===');
    } catch (error) {
      err('Test item exists failed:', error.message);
    }
  };

  /**
   * Test real-world card action flow (simulates what card-actions.js does)
   */
  window.testCardActionFlow = async function testCardActionFlow(testId = '888888') {
    try {
      log('=== TEST CARD ACTION FLOW ===');
      log('Testing with ID:', testId);
      
      // Step 1: Add item to watching list (without TMDB lookup)
      log('Step 1: Adding item to watching...');
      const addResult = await window.addToListFromCacheV2(testId, 'watching', {
        id: Number(testId),
        title: 'Test Card Action Item',
        name: 'Test Card Action Item',
        media_type: 'movie'
      });
      log('Add result:', addResult);
      
      if (!addResult) {
        log('Failed to add item, stopping test');
        return;
      }
      
      // Step 2: Simulate card action (move from watching to wishlist)
      log('Step 2: Simulating card action (watching -> wishlist)...');
      
      // This simulates what card-actions.js does:
      // 1. Call removeItemFromCurrentList (the old function)
      // 2. Call addToList for the target list
      
      log('Calling old removeItemFromCurrentList...');
      if (typeof window.removeItemFromCurrentList === 'function') {
        await window.removeItemFromCurrentList(testId);
        log('Old removeItemFromCurrentList completed');
      } else {
        log('Old removeItemFromCurrentList not available');
      }
      
      // Step 3: Add to wishlist
      log('Step 3: Adding to wishlist...');
      const addToWishlistResult = await window.addToListFromCacheV2(testId, 'wishlist', {
        id: Number(testId),
        title: 'Test Card Action Item',
        name: 'Test Card Action Item',
        media_type: 'movie'
      });
      log('Add to wishlist result:', addToWishlistResult);
      
      // Step 4: Verify final state
      log('Step 4: Verifying final state...');
      await window.debugCacheState();
      
      log('=== END CARD ACTION FLOW TEST ===');
    } catch (error) {
      err('Test card action flow failed:', error.message);
    }
  };

  /**
   * Test with existing items (no TMDB lookup needed)
   */
  window.testWithExistingItems = async function testWithExistingItems() {
    try {
      log('=== TEST WITH EXISTING ITEMS ===');
      
      // Get current cache state
      await window.debugCacheState();
      
      // Find an existing item to test with
      if (window.DataOperations) {
        const dataOps = window.DataOperations;
        await dataOps._ensureInitialized();
        const cache = dataOps._adapter?.getCache();
        
        if (cache && cache.watchingIds && cache.watchingIds.length > 0) {
          const testId = cache.watchingIds[0];
          log('Testing with existing item ID:', testId);
          
          // Try to remove it
          log('Attempting to remove item...');
          const removeResult = await window.removeItemFromCurrentList(testId);
          log('Remove result:', removeResult);
          
          // Add it back
          log('Adding item back...');
          const addResult = await window.addToListFromCacheV2(testId, 'watching', {
            id: Number(testId),
            title: 'Test Item',
            name: 'Test Item',
            media_type: 'movie'
          });
          log('Add back result:', addResult);
          
        } else {
          log('No existing items found to test with');
        }
      }
      
      log('=== END TEST WITH EXISTING ITEMS ===');
    } catch (error) {
      err('Test with existing items failed:', error.message);
    }
  };

  log('Enhanced functions v2 loaded');
})();
