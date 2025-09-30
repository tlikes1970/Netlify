/**
 * WatchlistsAdapter v2 - v28.81
 * Single source of truth for all watchlist data operations
 * Standardizes on Firebase data structure (watchlists.*)
 */

(function() {
  'use strict';
  
  const NS = '[WL-v2]';
  const log = (...a) => console.log(NS, ...a);
  const warn = (...a) => console.warn(NS, ...a);
  const err = (...a) => console.error(NS, ...a);

  /**
   * Enhanced WatchlistsAdapter - Single Source of Truth
   * Handles all data operations with proper error handling and race condition prevention
   */
  window.WatchlistsAdapterV2 = {
    _cache: null,
    _lastUid: null,
    _loading: false,
    _loadPromise: null,
    _operationQueue: [],
    _isProcessingQueue: false,

    /**
     * Initialize the adapter with proper data migration
     */
    async init() {
      log('Initializing WatchlistsAdapter v2...');
      
      // Migrate existing data to Firebase structure
      if (window.DataMigration && window.appData) {
        const migration = window.DataMigration.performMigration(window.appData);
        if (migration.success) {
          window.appData = migration.data;
          log('Data migration completed successfully');
        } else {
          err('Data migration failed:', migration.errors);
        }
      }
      
      // Load data for current user
      const uid = window.firebaseAuth?.currentUser?.uid;
      if (uid) {
        await this.load(uid);
      } else {
        // If no user, load from local data
        log('No user authenticated, loading from local data');
        await this.load(null);
      }
      
      log('WatchlistsAdapter v2 initialized');
    },

    /**
     * Load watchlist data with proper error handling and race condition prevention
     */
    async load(uid) {
      try {
        // Return cached data if same user and cache exists
        if (this._cache && this._lastUid === uid) {
          log('Using cached data for uid:', uid);
          return this._cache;
        }

        // Prevent concurrent loads
        if (this._loading && this._loadPromise) {
          log('Load already in progress, waiting...');
          return await this._loadPromise;
        }

        this._loading = true;
        this._loadPromise = this._performLoad(uid);
        const result = await this._loadPromise;
        
        this._loading = false;
        this._loadPromise = null;
        return result;
      } catch (error) {
        this._loading = false;
        this._loadPromise = null;
        err('Load failed:', error.message);
        return this._getEmptyCache();
      }
    },

    /**
     * Perform the actual data loading
     */
    async _performLoad(uid) {
      log('Loading watchlists for uid:', uid);
      
      // Try Firebase first
      if (window.firebaseDb && uid) {
        try {
          const userDoc = await window.firebaseDb.collection('users').doc(uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            
            // Check for Firebase structure first
            if (userData.watchlists && this._hasDataInWatchlists(userData.watchlists)) {
              log('Using Firebase watchlists structure');
              const result = this._normalizeWatchlists(userData.watchlists);
              this._cache = result;
              this._lastUid = uid;
              
              // Emit hydration event
              document.dispatchEvent(new CustomEvent('watchlists:hydrated', {
                detail: { uid, cache: result }
              }));
              
              return result;
            }
            
            // Fallback to old structure
            if (userData.movies || userData.tv) {
              log('Using Firebase old structure, migrating...');
              const oldStructure = {
                movies: userData.movies || {},
                tv: userData.tv || {}
              };
              const result = this._normalizeWatchlists(oldStructure);
              this._cache = result;
              this._lastUid = uid;
              
              // Emit hydration event
              document.dispatchEvent(new CustomEvent('watchlists:hydrated', {
                detail: { uid, cache: result }
              }));
              
              return result;
            }
          }
        } catch (firebaseError) {
          warn('Firebase load failed, falling back to local data:', firebaseError.message);
        }
      }

      // Fallback to local data
      log('Using local appData fallback');
      const appData = window.appData || {};
      
      // Use Firebase structure if available, otherwise use old structure
      const watchlists = appData.watchlists || {
        movies: appData.movies || {},
        tv: appData.tv || {}
      };
      
      const result = this._normalizeWatchlists(watchlists);
      this._cache = result;
      this._lastUid = uid;
      
      log('Local data loaded:', {
        watching: result.watchingIds.length,
        wishlist: result.wishlistIds.length,
        watched: result.watchedIds.length
      });
      
      // Emit hydration event
      document.dispatchEvent(new CustomEvent('watchlists:hydrated', {
        detail: { uid, cache: result }
      }));
      
      return result;
    },

    /**
     * Check if watchlists structure has data
     */
    _hasDataInWatchlists(watchlists) {
      if (!watchlists || typeof watchlists !== 'object') return false;
      
      const hasMoviesData = watchlists.movies &&
        ((watchlists.movies.watching && watchlists.movies.watching.length > 0) ||
         (watchlists.movies.wishlist && watchlists.movies.wishlist.length > 0) ||
         (watchlists.movies.watched && watchlists.movies.watched.length > 0));
         
      const hasTvData = watchlists.tv &&
        ((watchlists.tv.watching && watchlists.tv.watching.length > 0) ||
         (watchlists.tv.wishlist && watchlists.tv.wishlist.length > 0) ||
         (watchlists.tv.watched && watchlists.tv.watched.length > 0));
         
      return hasMoviesData || hasTvData;
    },

    /**
     * Normalize watchlists data to consistent format
     */
    _normalizeWatchlists(watchlists) {
      if (!watchlists || typeof watchlists !== 'object') {
        return this._getEmptyCache();
      }

      const normalizeList = (list, listName) => {
        if (Array.isArray(list)) {
          return list
            .map(item => {
              if (typeof item === 'object' && item !== null) {
                return String(item.id || item.tmdb_id || item.tmdbId);
              }
              return String(item);
            })
            .filter(Boolean);
        }
        return [];
      };

      const watchingIds = [
        ...normalizeList(watchlists.movies?.watching || [], 'movies.watching'),
        ...normalizeList(watchlists.tv?.watching || [], 'tv.watching')
      ];
      
      const wishlistIds = [
        ...normalizeList(watchlists.movies?.wishlist || [], 'movies.wishlist'),
        ...normalizeList(watchlists.tv?.wishlist || [], 'tv.wishlist')
      ];
      
      const watchedIds = [
        ...normalizeList(watchlists.movies?.watched || [], 'movies.watched'),
        ...normalizeList(watchlists.tv?.watched || [], 'tv.watched')
      ];

      return {
        watchingIds: [...new Set(watchingIds.map(String))],
        wishlistIds: [...new Set(wishlistIds.map(String))],
        watchedIds: [...new Set(watchedIds.map(String))]
      };
    },

    /**
     * Get empty cache structure
     */
    _getEmptyCache() {
      return {
        watchingIds: [],
        wishlistIds: [],
        watchedIds: []
      };
    },

    /**
     * Add item to list with proper error handling
     */
    async addItem(itemId, listName, itemData = null) {
      return this._queueOperation(() => this._addItemSync(itemId, listName, itemData));
    },

    /**
     * Synchronous add item (internal)
     */
    _addItemSync(itemId, listName, itemData = null) {
      try {
        if (!this._cache) {
          err('No cache available for addItem');
          return false;
        }

        const id = String(itemId);
        const listKey = listName + 'Ids';
        
        if (!this._cache[listKey]) {
          this._cache[listKey] = [];
        }

        const listSet = new Set(this._cache[listKey]);
        if (listSet.has(id)) {
          log('Item already exists in', listName);
          return false;
        }

        listSet.add(id);
        this._cache[listKey] = Array.from(listSet);
        
        // Store full item data if provided
        if (itemData) {
          this._storeItemData(id, itemData);
        }
        
        log('Added item:', id, 'to', listName, 'new count:', this._cache[listKey].length);
        
        // Update appData for backward compatibility
        this._updateAppData();
        
        return true;
      } catch (error) {
        err('Add item failed:', error.message);
        return false;
      }
    },

    /**
     * Move item between lists with proper error handling
     */
    async moveItem(itemId, fromList, toList) {
      return this._queueOperation(() => this._moveItemSync(itemId, fromList, toList));
    },

    /**
     * Synchronous move item (internal)
     */
    _moveItemSync(itemId, fromList, toList) {
      try {
        if (!this._cache) {
          err('No cache available for moveItem');
          return false;
        }

        const id = String(itemId);
        const fromKey = fromList + 'Ids';
        const toKey = toList + 'Ids';
        let moved = false;

        // Remove from source list
        if (this._cache[fromKey]) {
          const fromSet = new Set(this._cache[fromKey]);
          if (fromSet.has(id)) {
            fromSet.delete(id);
            this._cache[fromKey] = Array.from(fromSet);
            log('Removed item:', id, 'from', fromList);
            moved = true;
          }
        }

        // Add to destination list
        if (this._cache[toKey]) {
          const toSet = new Set(this._cache[toKey]);
          if (!toSet.has(id)) {
            toSet.add(id);
            this._cache[toKey] = Array.from(toSet);
            log('Added item:', id, 'to', toList);
          }
        }

        if (moved) {
          // Update appData for backward compatibility
          this._updateAppData();
        }

        return moved;
      } catch (error) {
        err('Move item failed:', error.message);
        return false;
      }
    },

    /**
     * Remove item from list with proper error handling
     */
    async removeItem(itemId, fromList) {
      return this._queueOperation(() => this._removeItemSync(itemId, fromList));
    },

    /**
     * Synchronous remove item (internal)
     */
    _removeItemSync(itemId, fromList) {
      try {
        if (!this._cache) {
          err('No cache available for removeItem');
          return false;
        }

        const id = String(itemId);
        const listKey = fromList + 'Ids';
        
        if (!this._cache[listKey]) {
          return false;
        }

        const listSet = new Set(this._cache[listKey]);
        if (listSet.has(id)) {
          listSet.delete(id);
          this._cache[listKey] = Array.from(listSet);
          log('Removed item:', id, 'from', fromList, 'new count:', this._cache[listKey].length);
          
          // Update appData for backward compatibility
          this._updateAppData();
          
          return true;
        }

        return false;
      } catch (error) {
        err('Remove item failed:', error.message);
        return false;
      }
    },

    /**
     * Queue operations to prevent race conditions
     */
    async _queueOperation(operation) {
      return new Promise((resolve) => {
        this._operationQueue.push({ operation, resolve });
        this._processQueue();
      });
    },

    /**
     * Process operation queue
     */
    async _processQueue() {
      if (this._isProcessingQueue || this._operationQueue.length === 0) {
        return;
      }

      this._isProcessingQueue = true;

      while (this._operationQueue.length > 0) {
        const { operation, resolve } = this._operationQueue.shift();
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          err('Operation failed:', error.message);
          resolve(false);
        }
      }

      this._isProcessingQueue = false;
    },

    /**
     * Update appData for backward compatibility
     */
    _updateAppData() {
      if (!window.appData) {
        window.appData = { watchlists: { movies: {}, tv: {} } };
      }

      // Ensure watchlists structure exists
      if (!window.appData.watchlists) {
        window.appData.watchlists = { movies: {}, tv: {} };
      }

      // Update watchlists structure
      window.appData.watchlists.movies = {
        watching: this._getItemsForList('watching', 'movie'),
        wishlist: this._getItemsForList('wishlist', 'movie'),
        watched: this._getItemsForList('watched', 'movie')
      };

      window.appData.watchlists.tv = {
        watching: this._getItemsForList('watching', 'tv'),
        wishlist: this._getItemsForList('wishlist', 'tv'),
        watched: this._getItemsForList('watched', 'tv')
      };

      // Update old structure for backward compatibility
      window.appData.movies = window.appData.watchlists.movies;
      window.appData.tv = window.appData.watchlists.tv;
    },

    /**
     * Get items for specific list and media type
     */
    _getItemsForList(listName, mediaType) {
      const listKey = listName + 'Ids';
      const ids = this._cache[listKey] || [];
      
      // Return full item data using getItemData to ensure we get complete data
      return ids.map(id => {
        const itemData = this.getItemData(id);
        if (itemData) {
          return itemData;
        }
        // Fallback to simple object only if getItemData fails
        return { id: Number(id), media_type: mediaType };
      });
    },

    /**
     * Get full item data by ID from various sources
     */
    getItemData(id) {
      try {
        const idStr = String(id);
        
        // First, try to find in stored item data cache
        if (this._cache && this._cache.itemData && this._cache.itemData[id]) {
          const item = this._cache.itemData[id];
          log(`Found item data for ID ${id} in cache:`, item.title || item.name || 'Unknown');
          return item;
        }
        
        // Second, try to find in appData (where full data is stored)
        const appData = window.appData || {};
        const tv = appData.tv || {};
        const movies = appData.movies || {};
        
        // Debug: Log what we're searching through
        log(`Searching for ID ${id} in appData:`, {
          tvWatching: tv.watching?.length || 0,
          tvWishlist: tv.wishlist?.length || 0,
          tvWatched: tv.watched?.length || 0,
          moviesWatching: movies.watching?.length || 0,
          moviesWishlist: movies.wishlist?.length || 0,
          moviesWatched: movies.watched?.length || 0
        });
        
        // Search through all lists to find the item
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
          log(`Found item data for ID ${id} in appData:`, item.title || item.name || 'Unknown');
          return {
            ...item,
            id: item.id || item.tmdb_id || item.tmdbId || id,
            media_type: item.media_type || (item.first_air_date ? 'tv' : 'movie')
          };
        }
        
        log(`Item not found for ID ${id}`);
        return null;
      } catch (error) {
        err('getItemData failed:', error.message);
        return null;
      }
    },

    /**
     * Store full item data for later retrieval
     */
    _storeItemData(id, itemData) {
      try {
        // Ensure itemData cache exists
        if (!this._cache.itemData) {
          this._cache.itemData = {};
        }
        
        // Store the full item data
        this._cache.itemData[id] = {
          ...itemData,
          id: Number(id),
          media_type: itemData.media_type || (itemData.first_air_date ? 'tv' : 'movie')
        };
        
        log('Stored item data for ID', id, ':', itemData.title || itemData.name || 'Unknown');
      } catch (error) {
        err('Failed to store item data:', error.message);
      }
    },

    /**
     * Invalidate cache
     */
    invalidate() {
      log('Invalidating cache');
      this._cache = null;
      this._lastUid = null;
    },

    /**
     * Get current cache
     */
    getCache() {
      return this._cache;
    }
  };

  log('WatchlistsAdapter v2 loaded');
})();
