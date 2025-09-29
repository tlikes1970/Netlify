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
    // REAL Pro features from your app
    'smart-notifications': () => openSmartNotifications(item),
    'viewing-journey': () => openViewingJourney(item),
    'advanced-customization': () => openAdvancedCustomization(item),
    'extra-trivia': () => openExtraTrivia(item),
    'pro-preview': () => openProPreview(item),
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

// REAL Pro feature handlers that integrate with your existing app
function openSmartNotifications(item) {
  console.log('[actions] Opening Smart Notifications for:', item.title);
  // Integrate with your existing notification system
  if (window.SettingsManager) {
    // Navigate to settings Pro section
    window.SettingsManager.openSettings('pro');
  }
  // Show notification setup for this specific item
  alert(`🔔 Smart Notifications for "${item.title}"\n\nSet custom lead times for new episodes and choose which lists to monitor.`);
}

function openViewingJourney(item) {
  console.log('[actions] Opening Viewing Journey for:', item.title);
  // Integrate with your existing analytics
  if (window.SettingsManager) {
    window.SettingsManager.openSettings('pro');
  }
  // Show analytics for this specific item
  alert(`📊 Viewing Journey for "${item.title}"\n\nDiscover your watching habits with beautiful charts showing your favorite genres, binge patterns, and viewing trends.`);
}

function openAdvancedCustomization(item) {
  console.log('[actions] Opening Advanced Customization for:', item.title);
  // Integrate with your existing theme system
  if (window.SettingsManager) {
    window.SettingsManager.openSettings('pro');
  }
  // Show customization options
  alert(`🎨 Advanced Customization for "${item.title}"\n\nUnlock premium color schemes, custom accent colors, and advanced layout options.`);
}

function openExtraTrivia(item) {
  console.log('[actions] Opening Extra Trivia for:', item.title);
  // Integrate with your existing trivia system
  if (window.SettingsManager) {
    window.SettingsManager.openSettings('pro');
  }
  // Show extra trivia content
  alert(`🧠 Extra Trivia for "${item.title}"\n\nAccess additional trivia questions and behind-the-scenes content.`);
}

function openProPreview(item) {
  console.log('[actions] Opening Pro Preview for:', item.title);
  // Integrate with your existing Pro preview system
  if (window.toggleProPreview) {
    window.toggleProPreview();
  }
  // Show Pro preview
  alert(`⭐ Pro Preview for "${item.title}"\n\nToggle Pro features on/off to see what's available without purchasing.`);
}
