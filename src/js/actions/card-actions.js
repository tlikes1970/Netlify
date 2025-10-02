export const CARD_ACTION_EVENT = 'card:action';

export function emitCardAction(action, payload) {
  document.dispatchEvent(new CustomEvent(CARD_ACTION_EVENT, { detail: { action, ...payload }}));
}

// Central handler wiring (imported once in app bootstrap)
export function installCardActionHandlers({ addToList, removeFromList, markWatched }) {
  document.addEventListener(CARD_ACTION_EVENT, async (e) => {
    const { action, id, mediaType, source } = e.detail || {};
    try {
      if (action === 'wishlist') await addToList(id, 'wishlist', { mediaType, source });
      else if (action === 'watched') await addToList(id, 'watched', { mediaType, source });
      else if (action === 'remove-watching') await removeFromList(id, 'watching', { mediaType, source });
      else console.warn('[card-actions] Unknown action', action);
    } catch (err) {
      console.error('[card-actions] Failed', action, id, err);
      window?.notify?.('Failed to update list', 'error');
    }
  });
}


