/**
 * Data API Shim - v28.80
 * Temporary stubs for MediaCard system integration
 */

export function currentUserIsPro() {
  return !!window.appSettings?.user?.isPro;
}

export function getActionsForContext(ctx) {
  const cfg = Array.isArray(window.appSettings?.ui?.actions?.[ctx])
    ? window.appSettings.ui.actions[ctx] : [];

  // Baseline required actions per context (all free, primary by default)
  const baseMap = {
    watching: [
      { id:'move-to-wishlist', label:'Want to Watch', icon:'📥', primary:true,  pro:false },
      { id:'mark-watched',     label:'Watched',       icon:'✅', primary:true,  pro:false },
      { id:'move-to-not',      label:'Not Interested',icon:'🚫', primary:true,  pro:false },
      { id:'delete-item',      label:'Delete',        icon:'🗑️', primary:false, pro:false },
    ],
    wishlist: [
      { id:'move-to-watching', label:'Currently Watching', icon:'▶️', primary:true,  pro:false },
      { id:'mark-watched',     label:'Watched',            icon:'✅', primary:true,  pro:false },
      { id:'move-to-not',      label:'Not Interested',     icon:'🚫', primary:true,  pro:false },
      { id:'delete-item',      label:'Delete',             icon:'🗑️', primary:false, pro:false },
    ],
    watched: [
      { id:'move-to-watching', label:'Currently Watching', icon:'▶️', primary:true,  pro:false },
      { id:'move-to-wishlist', label:'Want to Watch',      icon:'📥', primary:true,  pro:false },
      { id:'move-to-not',      label:'Not Interested',     icon:'🚫', primary:true,  pro:false },
      { id:'delete-item',      label:'Delete',             icon:'🗑️', primary:false, pro:false },
    ],
    discover: [
      { id:'delete-item',      label:'Delete',             icon:'🗑️', primary:false, pro:false },
    ],
  };

  const baseline = baseMap[ctx] || [];
  // Merge with settings, keeping first occurrence (baseline priority), normalize fields
  const merged = [...baseline, ...cfg]
    .filter(a => a && a.id && typeof a.label === 'string')
    .reduce((acc,a) => {
      if (!acc.find(x => x.id === a.id)) acc.push({
        id:a.id, label:a.label, icon:a.icon||'', primary:!!a.primary, pro:!!a.pro, handler:a.handler||a.id
      });
      return acc;
    }, []);
  return merged;
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
