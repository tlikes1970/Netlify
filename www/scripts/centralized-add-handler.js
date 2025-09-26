/**
 * Process: Centralized Add Handler
 * Purpose: Single source of truth for all add operations with unified deduplication
 * Data Source: Delegated click events on data-action="add" buttons
 * Update Path: Calls addToListFromCache with proper deduplication
 * Dependencies: addToListFromCache function, notification system
 */

(function () {
  'use strict';

  // Singleton guard to prevent multiple initializations
  if (window.__CENTRALIZED_ADD_HANDLER__) {
    console.warn('⚠️ Centralized add handler already initialized, skipping');
    return;
  }
  window.__CENTRALIZED_ADD_HANDLER__ = true;

  console.log('✅ Initializing centralized add handler');

  // Unified deduplication system
  const recentAdds = new Map(); // key: `${id}:${list}` -> timestamp
  const ADD_WINDOW_MS = 500; // 500ms deduplication window

  /**
   * Check if an add operation is a duplicate within the time window
   * @param {string|number} id - Item ID
   * @param {string} list - List name (watching, wishlist, watched)
   * @returns {boolean} True if this is a duplicate
   */
  function isDuplicateAdd(id, list) {
    const key = `${id}:${list}`;
    const now = Date.now();
    const last = recentAdds.get(key) || 0;

    // Clean up old entries opportunistically
    if (recentAdds.size > 200) {
      for (const [k, ts] of recentAdds) {
        if (now - ts > 2000) {
          recentAdds.delete(k);
        }
      }
    }

    const isDup = now - last < ADD_WINDOW_MS;
    if (isDup) {
      console.debug('⏭️ Add operation suppressed (duplicate within 500ms)', { id, list, key });
    }

    recentAdds.set(key, now);
    return isDup;
  }

  /**
   * Centralized add handler for all add operations
   * @param {Event} ev - Click event
   */
  function handleAddClick(ev) {
    // Find the closest element with data-action="add"
    const btn = ev.target.closest('[data-action="add"]');
    if (!btn) return;

    // Prevent event bubbling
    ev.preventDefault();
    ev.stopPropagation();

    // Get required attributes
    const id = btn.getAttribute('data-id') || btn.dataset.id;
    const list = btn.getAttribute('data-list') || btn.dataset.list;

    if (!id || !list) {
      console.warn('❌ Add button missing required attributes', { id, list, element: btn });
      return;
    }

    // Re-entrancy guard per button
    if (btn.dataset.busy === '1') {
      console.debug('⏸️ Add button busy, ignoring click');
      return;
    }

    // Set busy flag
    btn.dataset.busy = '1';

    // Clear busy flag after operation
    const clearBusy = () => {
      setTimeout(() => {
        btn.dataset.busy = '0';
      }, 650);
    };

    try {
      // Check for duplicates
      if (isDuplicateAdd(String(id), String(list))) {
        clearBusy();
        return;
      }

      console.log('➕ Centralized add handler processing', { id, list, source: 'delegation' });

      // Call the actual add function
      if (typeof window.addToListFromCache === 'function') {
        window.addToListFromCache(Number(id), list);
      } else {
        console.error('❌ addToListFromCache function not available');
        if (typeof window.showNotification === 'function') {
          window.showNotification('Add function not available', 'error');
        }
      }
    } catch (error) {
      console.error('❌ Add operation failed', error);
      if (typeof window.showNotification === 'function') {
        window.showNotification('Failed to add item', 'error');
      }
    } finally {
      clearBusy();
    }
  }

  // Attach the centralized handler with capture to ensure it runs first
  document.addEventListener('click', handleAddClick, { capture: true });

  console.log('✅ Centralized add handler attached');

  // Expose utility functions for debugging
  window.debugAddHandler = {
    recentAdds: () => recentAdds,
    clearRecentAdds: () => recentAdds.clear(),
    isDuplicateAdd: (id, list) => isDuplicateAdd(id, list),
  };
})();
