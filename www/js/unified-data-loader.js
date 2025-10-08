/**
 * Unified Data Loader - v28.82
 * Single data loading path using WatchlistsAdapterV2
 * No retry logic - if it fails, log it and move on
 */

(function() {
  'use strict';
  
  const NS = '[unified-loader]';
  const log = (...a) => console.log(NS, ...a);
  const warn = (...a) => console.warn(NS, ...a);
  const err = (...a) => console.error(NS, ...a);

  /**
   * Unified data loading - single source of truth
   * If WatchlistsAdapterV2 fails, log it and return empty data
   */
  window.UnifiedDataLoader = {
    _initialized: false,
    _adapter: null,

    /**
     * Initialize the unified data loader
     */
    async init() {
      if (this._initialized) {
        return;
      }

      log('Initializing UnifiedDataLoader...');

      // Wait for WatchlistsAdapterV2 to be available
      if (!window.WatchlistsAdapterV2) {
        err('WatchlistsAdapterV2 not available - data loading will fail');
        return false;
      }

      this._adapter = window.WatchlistsAdapterV2;
      await this._adapter.init();
      this._initialized = true;

      log('UnifiedDataLoader initialized');
      return true;
    },

    /**
     * Load currently watching items - single path, no retry
     */
    async getCurrentlyWatchingItems() {
      if (!this._initialized) {
        await this.init();
      }

      if (!this._adapter) {
        err('Adapter not available - returning empty array');
        return [];
      }

      try {
        const uid = window.firebaseAuth?.currentUser?.uid || null;
        const adapterData = await this._adapter.load(uid);
        
        if (!adapterData || !adapterData.watchingIds || adapterData.watchingIds.length === 0) {
          log('No currently watching items found');
          return [];
        }

        // Get full item data for each watching ID
        const watchingItems = [];
        for (const id of adapterData.watchingIds) {
          try {
            const itemData = this._adapter.getItemData(id);
            if (itemData) {
              watchingItems.push({
                ...itemData,
                media_type: itemData.media_type || 'movie'
              });
            }
          } catch (error) {
            warn('Failed to get item data for ID:', id, error);
            // Skip items with errors - no fallback
          }
        }
        
        log('Loaded', watchingItems.length, 'currently watching items');
        return watchingItems;
      } catch (error) {
        err('Failed to load currently watching items:', error);
        return [];
      }
    },

    /**
     * Load wishlist items - single path, no retry
     */
    async getWishlistItems() {
      if (!this._initialized) {
        await this.init();
      }

      if (!this._adapter) {
        err('Adapter not available - returning empty array');
        return [];
      }

      try {
        const uid = window.firebaseAuth?.currentUser?.uid || null;
        const adapterData = await this._adapter.load(uid);
        
        if (!adapterData || !adapterData.wishlistIds || adapterData.wishlistIds.length === 0) {
          log('No wishlist items found');
          return [];
        }

        // Get full item data for each wishlist ID
        const wishlistItems = [];
        for (const id of adapterData.wishlistIds) {
          try {
            const itemData = this._adapter.getItemData(id);
            if (itemData) {
              wishlistItems.push({
                ...itemData,
                media_type: itemData.media_type || 'movie'
              });
            }
          } catch (error) {
            warn('Failed to get item data for ID:', id, error);
            // Skip items with errors - no fallback
          }
        }
        
        log('Loaded', wishlistItems.length, 'wishlist items');
        return wishlistItems;
      } catch (error) {
        err('Failed to load wishlist items:', error);
        return [];
      }
    },

    /**
     * Load watched items - single path, no retry
     */
    async getWatchedItems() {
      if (!this._initialized) {
        await this.init();
      }

      if (!this._adapter) {
        err('Adapter not available - returning empty array');
        return [];
      }

      try {
        const uid = window.firebaseAuth?.currentUser?.uid || null;
        const adapterData = await this._adapter.load(uid);
        
        if (!adapterData || !adapterData.watchedIds || adapterData.watchedIds.length === 0) {
          log('No watched items found');
          return [];
        }

        // Get full item data for each watched ID
        const watchedItems = [];
        for (const id of adapterData.watchedIds) {
          try {
            const itemData = this._adapter.getItemData(id);
            if (itemData) {
              watchedItems.push({
                ...itemData,
                media_type: itemData.media_type || 'movie'
              });
            }
          } catch (error) {
            warn('Failed to get item data for ID:', id, error);
            // Skip items with errors - no fallback
          }
        }
        
        log('Loaded', watchedItems.length, 'watched items');
        return watchedItems;
      } catch (error) {
        err('Failed to load watched items:', error);
        return [];
      }
    },

    /**
     * Load all watchlist data - single path, no retry
     */
    async getAllWatchlistData() {
      if (!this._initialized) {
        await this.init();
      }

      if (!this._adapter) {
        err('Adapter not available - returning empty data');
        return {
          watching: [],
          wishlist: [],
          watched: []
        };
      }

      try {
        const [watching, wishlist, watched] = await Promise.all([
          this.getCurrentlyWatchingItems(),
          this.getWishlistItems(),
          this.getWatchedItems()
        ]);

        return {
          watching,
          wishlist,
          watched
        };
      } catch (error) {
        err('Failed to load all watchlist data:', error);
        return {
          watching: [],
          wishlist: [],
          watched: []
        };
      }
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.UnifiedDataLoader.init();
    });
  } else {
    window.UnifiedDataLoader.init();
  }

  log('UnifiedDataLoader loaded');
})();

