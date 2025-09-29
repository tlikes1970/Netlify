/**
 * Data API Shim - v28.80
 * Temporary stubs for MediaCard system integration
 */

export function currentUserIsPro() {
  return !!window.appSettings?.user?.isPro;
}

export function proActionsForContext(ctx) {
  const defaults = {
    watching: [
      { id: 'move-to-wishlist', label: 'Want to Watch', icon: '📥', primary: true },
      { id: 'move-to-not', label: 'Not Interested', icon: '🚫', primary: true },
      { id: 'details', label: 'Details', icon: '🔎', primary: false }
    ],
    wishlist: [
      { id: 'move-to-watching', label: 'Move to Watching', icon: '▶️', primary: true },
      { id: 'move-to-not', label: 'Not Interested', icon: '🚫', primary: true },
      { id: 'details', label: 'Details', icon: '🔎', primary: false }
    ],
    watched: [
      { id: 'undo-to-wishlist', label: 'Back to Want', icon: '↩️', primary: true },
      { id: 'move-to-not', label: 'Not Interested', icon: '🚫', primary: true },
      { id: 'details', label: 'Details', icon: '🔎', primary: false }
    ],
    discover: [
      { id: 'add-to-wishlist', label: 'Add to Want', icon: '➕', primary: true },
      { id: 'move-to-not', label: 'Not Interested', icon: '🚫', primary: true },
      { id: 'details', label: 'Details', icon: '🔎', primary: false }
    ],
    home: [
      { id: 'details', label: 'Details', icon: '🔎', primary: true }
    ]
  };
  return defaults[ctx] || defaults.home;
}

export async function saveUserRating(id, rating) {
  if (!id) throw new Error('missing id');
  // TODO: Hook into backend here
  console.log(`[data-api] Saving rating for ${id}: ${rating}`);
  return Promise.resolve(true);
}
