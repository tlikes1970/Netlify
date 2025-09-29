/**
 * Data API Shim - v28.80
 * Temporary stubs for MediaCard system integration
 */

export function currentUserIsPro() {
  return !!window.appSettings?.user?.isPro;
}

export function getActionsForContext(ctx) {
  const cfg = window.appSettings?.ui?.actions?.[ctx];
  if (!Array.isArray(cfg)) {
    console.warn(`[settings] Missing actions for context: ${ctx}, using fallback`);
    // Fallback to basic actions if settings not available
    const fallbacks = {
      watching: [
        { id: 'move-to-wishlist', label: 'Want to Watch', icon: '📥', primary: true, pro: false, handler: 'move-to-wishlist' },
        { id: 'move-to-not', label: 'Not Interested', icon: '🚫', primary: true, pro: false, handler: 'move-to-not' },
        { id: 'details', label: 'Details', icon: '🔎', primary: false, pro: false, handler: 'details' }
      ],
      wishlist: [
        { id: 'move-to-watching', label: 'Move to Watching', icon: '▶️', primary: true, pro: false, handler: 'move-to-watching' },
        { id: 'move-to-not', label: 'Not Interested', icon: '🚫', primary: true, pro: false, handler: 'move-to-not' },
        { id: 'details', label: 'Details', icon: '🔎', primary: false, pro: false, handler: 'details' }
      ],
      watched: [
        { id: 'undo-to-wishlist', label: 'Back to Want', icon: '↩️', primary: true, pro: false, handler: 'undo-to-wishlist' },
        { id: 'move-to-not', label: 'Not Interested', icon: '🚫', primary: true, pro: false, handler: 'move-to-not' },
        { id: 'details', label: 'Details', icon: '🔎', primary: false, pro: false, handler: 'details' }
      ],
      discover: [
        { id: 'add-to-wishlist', label: 'Add to Want', icon: '➕', primary: true, pro: false, handler: 'add-to-wishlist' },
        { id: 'move-to-not', label: 'Not Interested', icon: '🚫', primary: true, pro: false, handler: 'move-to-not' },
        { id: 'details', label: 'Details', icon: '🔎', primary: false, pro: false, handler: 'details' }
      ],
      home: [
        { id: 'details', label: 'Details', icon: '🔎', primary: true, pro: false, handler: 'details' }
      ]
    };
    return fallbacks[ctx] || fallbacks.home;
  }
  // Minimal validation
  return cfg.filter(a => a && a.id && typeof a.label === 'string').map(a => ({
    id: a.id, 
    label: a.label, 
    icon: a.icon || '', 
    primary: !!a.primary, 
    pro: !!a.pro, 
    handler: a.handler || a.id
  }));
}

export async function saveUserRating(id, rating) {
  if (!id) throw new Error('missing id');
  // TODO: Hook into backend here
  console.log(`[data-api] Saving rating for ${id}: ${rating}`);
  return Promise.resolve(true);
}

// Upsell dispatcher: open your existing Pro modal
export function openProUpsell(contextItem) {
  // Broadcast a global event; modal code listens and opens
  window.dispatchEvent(new CustomEvent('app:upsell:open', { 
    detail: { source: 'card-action', item: contextItem }
  }));
}
