/**
 * UI Integration System - v28.82
 * Connects DataOperations events to UI updates and notifications
 */

(function() {
  'use strict';
  
  const NS = '[ui-integration]';
  const log = (...a) => console.log(NS, ...a);
  const warn = (...a) => console.warn(NS, ...a);
  const err = (...a) => console.error(NS, ...a);

  /**
   * UI Integration System
   */
  window.UIIntegration = {
    _initialized: false,
    _notificationSystem: null,

    /**
     * Initialize UI integration
     */
    async init() {
      if (this._initialized) {
        return;
      }

      log('Initializing UI integration...');

      // Wait for required systems
      await this._waitForSystems();

      // Setup event listeners
      this._setupEventListeners();

      // Setup notification system
      this._setupNotifications();

      this._initialized = true;
      log('UI integration initialized');
    },

    /**
     * Wait for required systems to be available
     */
    async _waitForSystems() {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max
      
      while ((!window.DataOperations || !window.NotificationSystem) && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!window.DataOperations) {
        throw new Error('DataOperations not available');
      }
      
      if (!window.NotificationSystem) {
        warn('NotificationSystem not available, using fallback');
      }
    },

    /**
     * Setup event listeners for data operations
     */
    _setupEventListeners() {
      log('Setting up event listeners...');

      // Listen for item added events
      document.addEventListener('item:added', (event) => {
        this._handleItemAdded(event.detail);
      });

      // Listen for item moved events
      document.addEventListener('item:moved', (event) => {
        this._handleItemMoved(event.detail);
      });

      // Listen for item removed events
      document.addEventListener('item:removed', (event) => {
        this._handleItemRemoved(event.detail);
      });

      // Listen for error events
      document.addEventListener('item:add:error', (event) => {
        this._handleError('add', event.detail);
      });

      document.addEventListener('item:move:error', (event) => {
        this._handleError('move', event.detail);
      });

      document.addEventListener('item:remove:error', (event) => {
        this._handleError('remove', event.detail);
      });

      log('Event listeners setup complete');
    },

    /**
     * Setup notification system
     */
    _setupNotifications() {
      this._notificationSystem = window.NotificationSystem;
      log('Notification system connected');
    },

    /**
     * Handle item added event
     */
    _handleItemAdded(detail) {
      log('Item added:', detail);
      
      // Show success notification
      this._showNotification(`Added to ${detail.listName}`, 'success');
      
      // Update UI
      this._updateUI();
      
      // Remove from search results if applicable
      this._removeFromSearchResults(detail.itemId);
    },

    /**
     * Handle item moved event
     */
    _handleItemMoved(detail) {
      log('Item moved:', detail);
      
      // Show success notification
      this._showNotification(`Moved to ${detail.toList}`, 'success');
      
      // Update UI
      this._updateUI();
    },

    /**
     * Handle item removed event
     */
    _handleItemRemoved(detail) {
      log('Item removed:', detail);
      
      // Show success notification
      this._showNotification('Item removed', 'success');
      
      // Update UI
      this._updateUI();
    },

    /**
     * Handle error events
     */
    _handleError(operation, detail) {
      log('Operation error:', operation, detail);
      
      // Show error notification
      const message = this._getErrorMessage(operation, detail.error);
      this._showNotification(message, 'error');
    },

    /**
     * Get error message for operation
     */
    _getErrorMessage(operation, error) {
      const messages = {
        add: `Failed to add item: ${error}`,
        move: `Failed to move item: ${error}`,
        remove: `Failed to remove item: ${error}`
      };
      return messages[operation] || `Operation failed: ${error}`;
    },

    /**
     * Show notification
     */
    _showNotification(message, type, duration = 5000) {
      if (this._notificationSystem) {
        this._notificationSystem.show(message, type, duration);
      } else {
        // Fallback to console
        log(`[${type.toUpperCase()}] ${message}`);
      }
    },

    /**
     * Update UI after data changes
     */
    _updateUI() {
      try {
        log('Updating UI after data changes...');
        
        // Update tab counts
        if (typeof window.updateTabCounts === 'function') {
          window.updateTabCounts();
        }
        
        // Update main UI
        if (window.FlickletApp && typeof window.FlickletApp.updateUI === 'function') {
          window.FlickletApp.updateUI();
        }
        
        // Emit cards changed event for other systems
        document.dispatchEvent(new CustomEvent('cards:changed', {
          detail: { source: 'ui-integration' }
        }));
        
        log('UI update complete');
      } catch (error) {
        err('UI update failed:', error.message);
      }
    },

    /**
     * Remove item from search results
     */
    _removeFromSearchResults(itemId) {
      try {
        const searchRoot = document.getElementById('searchResultsList') ||
                          document.getElementById('searchResultsGrid') ||
                          document.getElementById('searchResults');
        
        if (searchRoot) {
          const card = searchRoot.querySelector(`[data-id="${itemId}"]`);
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
        warn('Failed to remove from search results:', error.message);
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.UIIntegration.init();
    });
  } else {
    window.UIIntegration.init();
  }

  log('UI integration system loaded');
})();
