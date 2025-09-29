/**
 * Central Action Dispatcher - v28.80
 * Maps handler names from settings to real functions
 */

// Central dispatcher. Map handler names from settings to real functions.
export function dispatchAction(name, item) {
  const map = {
    'move-to-wishlist': () => moveToWishlist(item),
    'move-to-watching': () => moveToWatching(item),
    'undo-to-wishlist': () => undoToWishlist(item),
    'move-to-not': () => markNotInterested(item),
    'add-to-wishlist': () => addToWishlist(item),
    'details': () => openDetails(item),
    // Pro examples (wired only if user is Pro)
    'export': () => exportItem(item),
    'share': () => shareItem(item),
    'recommend': () => recommendToFriend(item),
    // Episode toggle lives on cards.js as a dedicated button, keep behavior:
    'episode-toggle': () => openEpisodeModal(item),
  };
  const fn = map[name];
  if (!fn) throw new Error(`Unknown action handler: ${name}`);
  return fn();
}

// Stubbed concrete implementations
function moveToWishlist(item) {
  console.log('[actions] Moving to wishlist:', item.title);
  if (window.moveItem) {
    window.moveItem(item.id, 'wishlist');
  } else if (window.addToListFromCache) {
    window.addToListFromCache(item.id, 'wishlist');
  }
}

function moveToWatching(item) {
  console.log('[actions] Moving to watching:', item.title);
  if (window.moveItem) {
    window.moveItem(item.id, 'watching');
  } else if (window.addToListFromCache) {
    window.addToListFromCache(item.id, 'watching');
  }
}

function undoToWishlist(item) {
  console.log('[actions] Undoing to wishlist:', item.title);
  if (window.moveItem) {
    window.moveItem(item.id, 'wishlist');
  }
}

function markNotInterested(item) {
  console.log('[actions] Marking not interested:', item.title);
  if (window.removeItemFromCurrentList) {
    window.removeItemFromCurrentList(item.id);
  }
}

function addToWishlist(item) {
  console.log('[actions] Adding to wishlist:', item.title);
  if (window.addToListFromCache) {
    window.addToListFromCache(item.id, 'wishlist');
  }
}

function openDetails(item) {
  console.log('[actions] Opening details:', item.title);
  if (window.openTMDBLink) {
    window.openTMDBLink(item.id, item.mediaType);
  }
}

function exportItem(item) {
  console.log('[actions] Exporting item:', item.title);
  // TODO: Implement export functionality
  alert(`Exporting ${item.title}...`);
}

function shareItem(item) {
  console.log('[actions] Sharing item:', item.title);
  // TODO: Implement share functionality
  alert(`Sharing ${item.title}...`);
}

function recommendToFriend(item) {
  console.log('[actions] Recommending item:', item.title);
  // TODO: Implement recommendation functionality
  alert(`Recommending ${item.title} to a friend...`);
}

function openEpisodeModal(item) {
  console.log('[actions] Opening episode modal:', item.title);
  if (window.openEpisodeTrackingModal) {
    window.openEpisodeTrackingModal(item.id);
  }
}
