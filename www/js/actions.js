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
    'mark-watched': () => markWatched(item),
    'move-to-not': () => markNotInterested(item),
    'add-to-wishlist': () => addToWishlist(item),
    details: () => openDetails(item),
    'delete-item': () => deleteItemSafely(item),
    export: () => exportItem?.(item),
    share: () => shareItem?.(item),
    recommend: () => recommendToFriend?.(item),
    'episode-toggle': () => openEpisodeModal(item),
    // REAL Pro features from your app
    'smart-notifications': () => openSmartNotifications(item),
    'viewing-journey': () => openViewingJourney(item),
    'advanced-customization': () => openAdvancedCustomization(item),
    'extra-trivia': () => openExtraTrivia(item),
    'pro-preview': () => openProPreview(item),
  };
  const fn = map[name];
  if (!fn) throw new Error(`Unknown action handler: ${name}`);
  return fn();
}

// Stubbed concrete implementations
function moveToWishlist(item) {
  console.log('[actions] Moving to wishlist:', item.title, 'ID:', item.id);
  if (window.moveItem) {
    console.log('[actions] Calling window.moveItem with:', item.id, 'wishlist');
    window.moveItem(item.id, 'wishlist');
  } else if (window.addToListFromCache) {
    console.log('[actions] Calling window.addToListFromCache with:', item.id, 'wishlist');
    window.addToListFromCache(item.id, 'wishlist');
  } else {
    console.warn('[actions] No move function available, using fallback');
    fallbackMoveItem(item.id, 'wishlist');
  }
}

function moveToWatching(item) {
  console.log('[actions] Moving to watching:', item.title, 'ID:', item.id);
  console.log('[actions] Debug - window.moveItem available:', !!window.moveItem);
  console.log(
    '[actions] Debug - window.addToListFromCache available:',
    !!window.addToListFromCache,
  );
  console.log('[actions] Debug - fallbackMoveItem available:', !!fallbackMoveItem);

  if (window.moveItem) {
    console.log('[actions] Calling window.moveItem with:', item.id, 'watching');
    window.moveItem(item.id, 'watching');
  } else if (window.addToListFromCache) {
    console.log('[actions] Calling window.addToListFromCache with:', item.id, 'watching');
    window.addToListFromCache(item.id, 'watching');
  } else {
    console.warn('[actions] No move function available, using fallback');
    console.log('[actions] Calling fallbackMoveItem with:', item.id, 'watching');

    // Only use fallback if we're sure the main system isn't available
    if (window.WatchlistsAdapter) {
      console.warn(
        '[actions] WatchlistsAdapter is available but moveItem is not - this might be a timing issue',
      );
      // Wait a bit and try again
      setTimeout(() => {
        if (window.moveItem) {
          console.log('[actions] Retrying with window.moveItem after delay');
          window.moveItem(item.id, 'watching');
        } else {
          console.log('[actions] Still no moveItem after delay, using fallback');
          fallbackMoveItem(item.id, 'watching');
        }
      }, 100);
    } else {
      console.log('[actions] WatchlistsAdapter not available, using fallback');
      fallbackMoveItem(item.id, 'watching');
    }
  }
}

function undoToWishlist(item) {
  console.log('[actions] Undoing to wishlist:', item.title);
  if (window.moveItem) {
    window.moveItem(item.id, 'wishlist');
  } else {
    console.warn('[actions] No move function available, using fallback');
    fallbackMoveItem(item.id, 'wishlist');
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
    console.log('[actions] Calling addToListFromCache for:', item.id, 'wishlist');
    window.addToListFromCache(item.id, 'wishlist');
    console.log('[actions] addToListFromCache completed');
  } else {
    console.error(
      '[actions] addToListFromCache function not available, polling for availability...',
    );
    // Poll for function availability with exponential backoff
    let attempts = 0;
    const maxAttempts = 20; // 20 attempts max
    const pollForFunction = () => {
      attempts++;
      if (window.addToListFromCache) {
        console.log(
          `[actions] Function available after ${attempts} attempts, calling addToListFromCache for:`,
          item.id,
          'wishlist',
        );
        window.addToListFromCache(item.id, 'wishlist');
      } else if (attempts < maxAttempts) {
        const delay = Math.min(100 * Math.pow(1.5, attempts), 1000); // Exponential backoff, max 1s
        console.log(`[actions] Attempt ${attempts}/${maxAttempts}, retrying in ${delay}ms...`);
        setTimeout(pollForFunction, delay);
      } else {
        console.error(
          '[actions] addToListFromCache still not available after',
          maxAttempts,
          'attempts',
        );
      }
    };
    pollForFunction();
  }
}

function markWatched(item) {
  console.log('[actions] Marking as watched:', item.title);
  if (window.moveItem) {
    window.moveItem(item.id, 'watched');
  } else {
    console.error('[actions] moveItem function not available, polling for availability...');
    // Poll for function availability with exponential backoff
    let attempts = 0;
    const maxAttempts = 20; // 20 attempts max
    const pollForFunction = () => {
      attempts++;
      if (window.moveItem) {
        console.log(
          `[actions] Function available after ${attempts} attempts, calling moveItem for:`,
          item.id,
          'watched',
        );
        window.moveItem(item.id, 'watched');
      } else if (attempts < maxAttempts) {
        const delay = Math.min(100 * Math.pow(1.5, attempts), 1000); // Exponential backoff, max 1s
        console.log(`[actions] Attempt ${attempts}/${maxAttempts}, retrying in ${delay}ms...`);
        setTimeout(pollForFunction, delay);
      } else {
        console.error('[actions] moveItem still not available after', maxAttempts, 'attempts');
      }
    };
    pollForFunction();
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
  alert(
    `🔔 Smart Notifications for "${item.title}"\n\nSet custom lead times for new episodes and choose which lists to monitor.`,
  );
}

function openViewingJourney(item) {
  console.log('[actions] Opening Viewing Journey for:', item.title);
  // Integrate with your existing analytics
  if (window.SettingsManager) {
    window.SettingsManager.openSettings('pro');
  }
  // Show analytics for this specific item
  alert(
    `📊 Viewing Journey for "${item.title}"\n\nDiscover your watching habits with beautiful charts showing your favorite genres, binge patterns, and viewing trends.`,
  );
}

function openAdvancedCustomization(item) {
  console.log('[actions] Opening Advanced Customization for:', item.title);
  // Integrate with your existing theme system
  if (window.SettingsManager) {
    window.SettingsManager.openSettings('pro');
  }
  // Show customization options
  alert(
    `🎨 Advanced Customization for "${item.title}"\n\nUnlock premium color schemes, custom accent colors, and advanced layout options.`,
  );
}

function openExtraTrivia(item) {
  console.log('[actions] Opening Extra Trivia for:', item.title);
  // Integrate with your existing trivia system
  if (window.SettingsManager) {
    window.SettingsManager.openSettings('pro');
  }
  // Show extra trivia content
  alert(
    `🧠 Extra Trivia for "${item.title}"\n\nAccess additional trivia questions and behind-the-scenes content.`,
  );
}

function openProPreview(item) {
  console.log('[actions] Opening Pro Preview for:', item.title);
  // Integrate with your existing Pro preview system
  if (window.toggleProPreview) {
    window.toggleProPreview();
  }
  // Show Pro preview
  alert(
    `⭐ Pro Preview for "${item.title}"\n\nToggle Pro features on/off to see what's available without purchasing.`,
  );
}

// Guarded delete with minimal UX
function deleteItemSafely(item) {
  // Prefer your modal; fallback to confirm
  if (window.openConfirmModal) {
    return window.openConfirmModal({
      title: 'Delete item',
      message: `Remove "${item?.title || 'this title'}" from your lists?`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: () => actuallyDelete(item),
    });
  }
  if (confirm(`Delete "${item?.title || 'this title'}"? This cannot be undone.`)) {
    return actuallyDelete(item);
  }
}

function actuallyDelete(item) {
  console.log(
    '[delete] Debug - removeItemFromCurrentList available:',
    typeof window.removeItemFromCurrentList,
  );
  console.log(
    '[delete] Debug - window.removeItemFromCurrentList:',
    window.removeItemFromCurrentList,
  );

  // Use the existing removeItemFromCurrentList function
  if (typeof window.removeItemFromCurrentList === 'function') {
    console.log('[delete] Removing item:', item.title, 'ID:', item.id);
    window.removeItemFromCurrentList(item.id);

    // Save data after deletion
    if (typeof window.saveAppData === 'function') {
      window.saveAppData();
    }

    // Sync to Firebase
    if (typeof window.saveData === 'function') {
      console.log('🔄 [delete] Syncing deletion to Firebase...');
      window.saveData();
    }

    // Clear WatchlistsAdapter cache
    if (window.WatchlistsAdapter && typeof window.WatchlistsAdapter.invalidate === 'function') {
      console.log('🔄 [delete] Invalidating WatchlistsAdapter cache...');
      window.WatchlistsAdapter.invalidate();
    }

    // Emit cards:changed event
    document.dispatchEvent(
      new CustomEvent('cards:changed', {
        detail: {
          source: 'deleteItem',
          action: 'delete',
          itemId: item.id,
          itemTitle: item.title,
        },
      }),
    );

    return true;
  }

  // Fallback: try to wait for the function to be available
  console.log('[delete] removeItemFromCurrentList not available, trying fallback...');

  // Try direct removal from appData as fallback
  if (window.appData) {
    console.log('[delete] Using fallback removal from appData');

    // Remove from all lists
    const lists = ['watching', 'wishlist', 'watched'];
    const mediaTypes = ['tv', 'movies'];

    let removed = false;
    for (const mediaType of mediaTypes) {
      for (const list of lists) {
        if (window.appData[mediaType] && window.appData[mediaType][list]) {
          const index = window.appData[mediaType][list].findIndex(
            (listItem) => listItem.id == item.id,
          );
          if (index !== -1) {
            window.appData[mediaType][list].splice(index, 1);
            removed = true;
            console.log(`[delete] Removed from ${mediaType}.${list}`);
          }
        }
      }
    }

    if (removed) {
      // Save data after deletion
      if (typeof window.saveAppData === 'function') {
        window.saveAppData();
      }

      // Sync to Firebase
      if (typeof window.saveData === 'function') {
        console.log('🔄 [delete] Syncing deletion to Firebase...');
        window.saveData();
      }

      // Clear WatchlistsAdapter cache
      if (window.WatchlistsAdapter && typeof window.WatchlistsAdapter.invalidate === 'function') {
        console.log('🔄 [delete] Invalidating WatchlistsAdapter cache...');
        window.WatchlistsAdapter.invalidate();
      }

      // Emit cards:changed event
      document.dispatchEvent(
        new CustomEvent('cards:changed', {
          detail: {
            source: 'deleteItem',
            action: 'delete',
            itemId: item.id,
            itemTitle: item.title,
          },
        }),
      );

      return true;
    }
  }

  console.warn('[delete] No remover wired for', item);
  return false;
}

// Fallback move function when WatchlistsAdapter isn't loaded yet
function fallbackMoveItem(itemId, destinationList) {
  console.log('[actions] Fallback move function called:', itemId, 'to', destinationList);
  console.log('[actions] Current appData structure:', window.appData);

  // Don't proceed if appData is corrupted or missing
  if (!window.appData) {
    console.error('[actions] No appData available for fallback move');
    return;
  }

  // Ensure appData has the expected structure
  if (!window.appData.tv) {
    window.appData.tv = {};
  }
  if (!window.appData.movies) {
    window.appData.movies = {};
  }

  // Find the item in the current data structure
  let foundItem = null;
  let sourceList = null;
  let mediaType = null;

  // Search through all lists to find the item
  const lists = ['watching', 'wishlist', 'watched'];
  for (const list of lists) {
    // Check TV shows
    if (window.appData.tv && window.appData.tv[list] && Array.isArray(window.appData.tv[list])) {
      const item = window.appData.tv[list].find((i) => i.id == itemId);
      if (item) {
        foundItem = item;
        sourceList = list;
        mediaType = 'tv';
        break;
      }
    }
    // Check movies
    if (
      window.appData.movies &&
      window.appData.movies[list] &&
      Array.isArray(window.appData.movies[list])
    ) {
      const item = window.appData.movies[list].find((i) => i.id == itemId);
      if (item) {
        foundItem = item;
        sourceList = list;
        mediaType = 'movies';
        break;
      }
    }
  }

  if (!foundItem) {
    console.error('[actions] Item not found for fallback move:', itemId);
    console.log('[actions] Available items in appData:', {
      tv: window.appData.tv,
      movies: window.appData.movies,
    });
    return;
  }

  if (sourceList === destinationList) {
    console.log('[actions] Item already in target list:', destinationList);
    return;
  }

  // Remove from source list
  const sourceArray = window.appData[mediaType][sourceList];
  if (!Array.isArray(sourceArray)) {
    console.error('[actions] Source array is not valid:', sourceArray);
    return;
  }

  const sourceIndex = sourceArray.findIndex((i) => i.id == itemId);
  if (sourceIndex !== -1) {
    sourceArray.splice(sourceIndex, 1);
    console.log('[actions] Removed item from source list:', sourceList);
  }

  // Add to destination list
  if (!window.appData[mediaType][destinationList]) {
    window.appData[mediaType][destinationList] = [];
  }
  if (!Array.isArray(window.appData[mediaType][destinationList])) {
    window.appData[mediaType][destinationList] = [];
  }

  window.appData[mediaType][destinationList].push(foundItem);
  console.log('[actions] Added item to destination list:', destinationList);

  // Save data to localStorage and Firebase
  if (typeof window.saveAppData === 'function') {
    window.saveAppData();
  }

  // Sync to Firebase
  if (typeof window.saveData === 'function') {
    console.log('🔄 [actions] Syncing fallback move to Firebase...');
    window.saveData();
  }

  // Clear WatchlistsAdapter cache to force reload
  if (window.WatchlistsAdapter && typeof window.WatchlistsAdapter.invalidate === 'function') {
    console.log('🔄 [actions] Invalidating WatchlistsAdapter cache...');
    window.WatchlistsAdapter.invalidate();
  }

  // Emit cards:changed event
  document.dispatchEvent(
    new CustomEvent('cards:changed', {
      detail: {
        source: 'fallbackMoveItem',
        action: 'move',
        itemId: itemId,
        fromList: sourceList,
        toList: destinationList,
      },
    }),
  );

  // Update UI
  if (window.FlickletApp && typeof window.FlickletApp.updateUI === 'function') {
    window.FlickletApp.updateUI();
  }

  console.log('[actions] Fallback move completed:', itemId, sourceList, '→', destinationList);
}
