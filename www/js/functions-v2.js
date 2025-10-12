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
        
        // FIXED: Dispatch custom event to trigger HomeClean refresh
        window.dispatchEvent(new CustomEvent('app:data:ready', {
          detail: { status: list, source: 'addToListFromCacheV2' }
        }));
        
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
        
        // FIXED: Dispatch custom event to trigger HomeClean refresh
        window.dispatchEvent(new CustomEvent('app:data:ready', {
          detail: { status: dest, source: 'moveItemV2' }
        }));
        
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
      
      // Find source list
      const sourceList = await findItemSourceList(id, dataOps);
      if (!sourceList) {
        throw new Error('Item not found in any list');
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
   * Find which list contains the item
   */
  async function findItemSourceList(id, dataOps) {
    try {
      const lists = ['watching', 'wishlist', 'watched'];
      
      for (const list of lists) {
        const exists = await dataOps.hasItem(id, list);
        if (exists) {
          return list;
        }
      }
      
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
  function updateUIAfterDataChange() {
    try {
      // Update tab counts
      if (typeof window.updateTabCounts === 'function') {
        window.updateTabCounts();
      }
      
      // Update main UI
      if (window.FlickletApp && typeof window.FlickletApp.updateUI === 'function') {
        window.FlickletApp.updateUI();
      }
      
      // Wait for adapter hydration before rendering home components
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
      
      // Emit cards changed event
      document.dispatchEvent(new CustomEvent('cards:changed', {
        detail: { source: 'functions-v2' }
      }));
      
      log('UI updated after data change');
    } catch (error) {
      warn('updateUIAfterDataChange failed:', error.message);
    }
  }

  // Replace old functions with new ones
  window.addToListFromCache = window.addToListFromCacheV2;
  window.moveItem = window.moveItemV2;
  window.removeItemFromCurrentList = window.removeItemFromCurrentListV2;

  log('Enhanced functions v2 loaded');
})();
