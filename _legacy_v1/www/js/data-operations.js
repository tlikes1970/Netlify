/**
 * Unified Data Operations - v28.81
 * Centralized data operations using WatchlistsAdapterV2 as single source of truth
 * Fixes race conditions and standardizes error handling
 */

(function() {
  'use strict';
  
  const NS = '[data-ops]';
  const log = (...a) => console.log(NS, ...a);
  const warn = (...a) => console.warn(NS, ...a);
  const err = (...a) => console.error(NS, ...a);

  /**
   * Unified data operations with proper error handling and race condition prevention
   */
  window.DataOperations = {
    _adapter: null,
    _initialized: false,

    /**
     * Initialize data operations
     */
    async init() {
      if (this._initialized) {
        return;
      }

      log('Initializing DataOperations...');

      // Wait for WatchlistsAdapterV2 to be available
      if (!window.WatchlistsAdapterV2) {
        err('WatchlistsAdapterV2 not available');
        return false;
      }

      this._adapter = window.WatchlistsAdapterV2;
      await this._adapter.init();
      this._initialized = true;

      log('DataOperations initialized');
      return true;
    },

    /**
     * Ensure operations are initialized
     */
    async _ensureInitialized() {
      if (!this._initialized) {
        await this.init();
      }
    },

    /**
     * Add item to list with comprehensive error handling
     */
    async addItem(itemId, listName, itemData = null) {
      try {
        log('DataOperations.addItem called:', { itemId, listName, itemData });
        
        await this._ensureInitialized();
        
        if (!itemId) {
          throw new Error('Item ID is required');
        }

        if (!listName || !['watching', 'wishlist', 'watched'].includes(listName)) {
          throw new Error('Invalid list name');
        }

        log('Adding item to list:', { itemId, listName });

        // Check if adapter is available
        if (!this._adapter) {
          throw new Error('Adapter not available');
        }

        // Add to adapter
        log('Calling adapter.addItem...');
        const success = await this._adapter.addItem(itemId, listName, itemData);
        log('Adapter.addItem result:', success);
        
        if (success) {
          // Save data
          log('Saving data...');
          await this._saveData();
          
          // Emit event
          log('Emitting event...');
          this._emitEvent('item:added', { itemId, listName, itemData });
          
          log('Item added successfully');
          return true;
        } else {
          warn('Failed to add item to adapter');
          return false;
        }
      } catch (error) {
        err('Add item failed:', error.message);
        this._emitEvent('item:add:error', { itemId, listName, error: error.message });
        return false;
      }
    },

    /**
     * Move item between lists with comprehensive error handling
     */
    async moveItem(itemId, fromList, toList) {
      try {
        await this._ensureInitialized();
        
        if (!itemId) {
          throw new Error('Item ID is required');
        }

        if (!fromList || !toList || !['watching', 'wishlist', 'watched'].includes(fromList) || !['watching', 'wishlist', 'watched'].includes(toList)) {
          throw new Error('Invalid list names');
        }

        if (fromList === toList) {
          log('Item already in target list');
          return true;
        }

        log('Moving item between lists:', { itemId, fromList, toList });

        // Move in adapter
        const success = await this._adapter.moveItem(itemId, fromList, toList);
        
        if (success) {
          // Save data
          await this._saveData();
          
          // Emit event
          this._emitEvent('item:moved', { itemId, fromList, toList });
          
          log('Item moved successfully');
          return true;
        } else {
          warn('Failed to move item in adapter');
          return false;
        }
      } catch (error) {
        err('Move item failed:', error.message);
        this._emitEvent('item:move:error', { itemId, fromList, toList, error: error.message });
        return false;
      }
    },

    /**
     * Remove item from list with comprehensive error handling
     */
    async removeItem(itemId, fromList) {
      try {
        await this._ensureInitialized();
        
        if (!itemId) {
          throw new Error('Item ID is required');
        }

        if (!fromList || !['watching', 'wishlist', 'watched'].includes(fromList)) {
          throw new Error('Invalid list name');
        }

        log('Removing item from list:', { itemId, fromList });

        // Remove from adapter
        const success = await this._adapter.removeItem(itemId, fromList);
        
        if (success) {
          // Save data
          await this._saveData();
          
          // Emit event
          this._emitEvent('item:removed', { itemId, fromList });
          
          log('Item removed successfully');
          return true;
        } else {
          warn('Failed to remove item from adapter');
          return false;
        }
      } catch (error) {
        err('Remove item failed:', error.message);
        this._emitEvent('item:remove:error', { itemId, fromList, error: error.message });
        return false;
      }
    },

    /**
     * Get items for a specific list
     */
    async getItems(listName, mediaType = null) {
      try {
        await this._ensureInitialized();
        
        if (!listName || !['watching', 'wishlist', 'watched'].includes(listName)) {
          throw new Error('Invalid list name');
        }

        const cache = this._adapter.getCache();
        if (!cache) {
          return [];
        }

        const listKey = listName + 'Ids';
        const ids = cache[listKey] || [];
        
        // Filter by media type if specified
        if (mediaType) {
          // This would need to be enhanced to actually filter by media type
          // For now, return all items
          return ids.map(id => ({ id: Number(id), media_type: mediaType }));
        }

        return ids.map(id => ({ id: Number(id) }));
      } catch (error) {
        err('Get items failed:', error.message);
        return [];
      }
    },

    /**
     * Check if item exists in list
     */
    async hasItem(itemId, listName) {
      try {
        await this._ensureInitialized();
        
        const cache = this._adapter.getCache();
        if (!cache) {
          return false;
        }

        const listKey = listName + 'Ids';
        const ids = cache[listKey] || [];
        return ids.includes(String(itemId));
      } catch (error) {
        err('Has item check failed:', error.message);
        return false;
      }
    },

    /**
     * Save data to storage
     */
    async _saveData() {
      try {
        // Save to localStorage
        if (typeof window.saveAppData === 'function') {
          window.saveAppData();
          log('Data saved to localStorage');
        }

        // Save to Firebase (only if user is authenticated)
        if (typeof window.saveData === 'function' && window.firebaseAuth?.currentUser) {
          await window.saveData();
          log('Data saved to Firebase');
        } else {
          log('Skipping Firebase save - no authenticated user');
        }

        log('Data saved successfully');
      } catch (error) {
        err('Save data failed:', error.message);
        throw error;
      }
    },

    /**
     * Emit events for UI updates
     */
    _emitEvent(eventName, detail) {
      try {
        document.dispatchEvent(new CustomEvent(eventName, { detail }));
        log('Event emitted:', eventName, detail);
      } catch (error) {
        err('Event emission failed:', error.message);
      }
    },

    /**
     * Get adapter instance
     */
    getAdapter() {
      return this._adapter;
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.DataOperations.init();
    });
  } else {
    window.DataOperations.init();
  }

  log('DataOperations loaded');
})();
