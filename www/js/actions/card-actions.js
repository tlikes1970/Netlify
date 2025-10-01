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
        
        if (action === 'wishlist') await addToList(id, 'wishlist', options);
        else if (action === 'watched') await addToList(id, 'watched', options);
        else if (action === 'watching') await addToList(id, 'watching', options);
        else if (action === 'remove-watching') await removeFromList(id, 'watching', options);
        else if (action === 'remove-wishlist') await removeFromList(id, 'wishlist', options);
        else if (action === 'remove-watched') await removeFromList(id, 'watched', options);
        else console.warn('[card-actions] Unknown action', action);
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

