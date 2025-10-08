// Card Actions - Centralized action handling
(function() {
  'use strict';
  
  const CARD_ACTION_EVENT = 'card:action';

  function emitCardAction(action, payload) {
    document.dispatchEvent(new CustomEvent(CARD_ACTION_EVENT, { detail: { action, ...payload }}));
  }

  // Central handler wiring (imported once in app bootstrap)
  function installCardActionHandlers({ addToList, removeFromList, markWatched }) {
    document.addEventListener(CARD_ACTION_EVENT, async (e) => {
      const { action, id, mediaType, source, itemData } = e.detail || {};
      try {
        const options = { mediaType, source };
        if (itemData) {
          options.itemData = itemData;
        }
        
        // Helper function to move item between lists
        async function moveItemToList(targetList) {
          try {
            console.log(`[card-actions] moveItemToList called: id=${id}, targetList=${targetList}, source=${source}`);
            
            // Check if this is a search result (not in any list yet)
            const isSearchResult = source === 'card-v2' && !await isItemInAnyList(id);
            console.log(`[card-actions] isSearchResult: ${isSearchResult}`);
            
            if (isSearchResult) {
              // For search results, just add directly without removing
              console.log('[card-actions] Adding search result directly to', targetList);
              const addResult = await addToList(id, targetList, options);
              console.log('[card-actions] addResult:', addResult);
              if (!addResult) {
                throw new Error(`Failed to add search result to ${targetList}`);
              }
            } else {
              // For existing items, remove from current list first
              if (typeof window.removeItemFromCurrentList === 'function') {
                console.log('[card-actions] Removing from current list first...');
                const removeResult = await window.removeItemFromCurrentList(id);
                console.log('[card-actions] removeResult:', removeResult);
                if (!removeResult) {
                  console.warn('[card-actions] Failed to remove item from current list, continuing with add...');
                }
              }
              // Then add to target list
              console.log('[card-actions] Adding to target list...');
              const addResult = await addToList(id, targetList, options);
              console.log('[card-actions] addResult:', addResult);
              if (!addResult) {
                throw new Error(`Failed to add item to ${targetList}`);
              }
            }
            console.log('[card-actions] moveItemToList completed successfully');
          } catch (error) {
            console.error('[card-actions] moveItemToList failed:', error);
            throw error;
          }
        }
        
        // Helper function to check if item is in any list
        async function isItemInAnyList(itemId) {
          try {
            if (window.DataOperations) {
              const dataOps = window.DataOperations;
              const lists = ['watching', 'wishlist', 'watched'];
              for (const list of lists) {
                const exists = await dataOps.hasItem(itemId, list);
                if (exists) {
                  console.log(`[card-actions] Item ${itemId} found in ${list}`);
                  return true;
                }
              }
            }
            console.log(`[card-actions] Item ${itemId} not found in any list`);
            return false;
          } catch (error) {
            console.warn('[card-actions] Error checking if item exists:', error);
            return false;
          }
        }
        
        if (action === 'wishlist') await moveItemToList('wishlist');
        else if (action === 'watched') await moveItemToList('watched');
        else if (action === 'watching') await moveItemToList('watching');
        else if (action === 'remove-watching') {
          // removeItemFromCurrentList only takes id parameter
          if (typeof window.removeItemFromCurrentList === 'function') {
            await window.removeItemFromCurrentList(id);
          }
        }
        else if (action === 'remove-wishlist') {
          if (typeof window.removeItemFromCurrentList === 'function') {
            await window.removeItemFromCurrentList(id);
          }
        }
        else if (action === 'remove-watched') {
          if (typeof window.removeItemFromCurrentList === 'function') {
            await window.removeItemFromCurrentList(id);
          }
        }
        else if (action === 'delete') {
          // Remove from current list (removeItemFromCurrentList only takes id)
          if (typeof window.removeItemFromCurrentList === 'function') {
            await window.removeItemFromCurrentList(id);
          }
        }
        else if (action === 'not-interested') {
          // Remove from current list (removeItemFromCurrentList only takes id)
          if (typeof window.removeItemFromCurrentList === 'function') {
            await window.removeItemFromCurrentList(id);
          }
        }
        else console.warn('[card-actions] Unknown action', action);
        
        // Trigger UI refresh after any action
        if (typeof window.updateUI === 'function') {
          window.updateUI();
        }
        if (typeof window.FlickletApp?.updateUI === 'function') {
          window.FlickletApp.updateUI();
        }
        
        // Trigger specific list refresh for tab context
        if (typeof window.loadListContent === 'function') {
          // Refresh all tab lists
          ['watching', 'wishlist', 'watched'].forEach(listType => {
            setTimeout(() => {
              window.loadListContent(listType);
            }, 100);
          });
        }
        
      } catch (err) {
        console.error('[card-actions] Failed', action, id, err);
        window?.notify?.('Failed to update list', 'error');
      }
    });
  }

  // Expose globally
  window.emitCardAction = emitCardAction;
  window.installCardActionHandlers = installCardActionHandlers;
  window.CARD_ACTION_EVENT = CARD_ACTION_EVENT;
  
  console.log('✅ Card actions loaded');
})();

