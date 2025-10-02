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
          // First remove from current list (removeItemFromCurrentList only takes id)
          if (typeof window.removeItemFromCurrentList === 'function') {
            await window.removeItemFromCurrentList(id);
          }
          // Then add to target list
          await addToList(id, targetList, options);
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

