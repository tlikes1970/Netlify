// list-actions.js — not-interested and live count updates
(function(){
  if (window.__listActions__) return; window.__listActions__ = true;

  // STEP 3.2b — Module guard: attach this once only
  if (window.__listActionsBound) return;
  window.__listActionsBound = true;

  // Short-window deduper: ignore duplicate add for same key within 600ms
  const recentAdds = new Map(); // key = `${id}|${list}` → timestamp
  function isDuplicateAdd(id, list) {
    const key = `${id}|${list}`;
    const now = Date.now();
    const last = recentAdds.get(key) || 0;
    recentAdds.set(key, now);
    // Clear old entries opportunistically
    if (recentAdds.size > 200) {
      for (const [k, ts] of recentAdds) if (now - ts > 2000) recentAdds.delete(k);
    }
    return (now - last) < 600;
  }

  // Delegated click for add-to-list buttons/links
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-action="add-to-list"]');
    if (!btn) return;

    ev.preventDefault();
    ev.stopPropagation();

    const id = btn.getAttribute('data-id') || btn.dataset.id;
    const list = btn.getAttribute('data-list') || btn.dataset.list; // watching|wishlist|watched

    if (!id || !list) {
      console.warn('add-to-list missing id or list', { id, list });
      return;
    }

    // Re-entrancy guard per-element (prevents double fire from multiple listeners)
    if (btn.dataset.busy === '1') return;
    btn.dataset.busy = '1';
    setTimeout(() => { btn.dataset.busy = '0'; }, 650);

    // Short-window duplicate call guard
    if (isDuplicateAdd(String(id), String(list))) {
      // Silently ignore; if you prefer, log at debug level
      return;
    }

    try {
      if (typeof window.addToListFromCache === 'function') {
        window.addToListFromCache(id, list);
      } else if (typeof window.addToList === 'function') {
        window.addToList(id, list);
      } else {
        console.warn('No add function available');
      }
    } catch (e) {
      console.error('add-to-list failed', e);
    }
  }, { capture: true }); // capture helps beat other handlers

  // STEP 3.2 — canonical list containers used across the app
  const SECTIONS = ['#watchingList', '#wishlistList', '#watchedList'];

  function updateCount(sectionSel){
    const root = document.querySelector(sectionSel);
    if (!root) return;
    const items = root.querySelectorAll('.curated-card,.list-card,.list-row,.card,.show-card');
    
    // Update specific tab badges
    if (sectionSel === '#watchingList') {
      const badge = document.getElementById('watchingBadge');
      if (badge) badge.textContent = String(items.length);
    } else if (sectionSel === '#wishlistList') {
      const badge = document.getElementById('wishlistBadge');
      if (badge) badge.textContent = String(items.length);
    } else if (sectionSel === '#watchedList') {
      const badge = document.getElementById('watchedBadge');
      if (badge) badge.textContent = String(items.length);
    }
    
    // Also try to find generic badges
    const badge = root.previousElementSibling?.querySelector?.('.count, .badge, .pill, .tab-badge');
    if (badge) badge.textContent = String(items.length);
    
    // Update all tab badges to ensure consistency
    if (typeof window.updateTabCounts === 'function') {
      console.log('🔢 Updating all tab counts after list change');
      window.updateTabCounts();
    }
  }

  document.addEventListener('click', async (e) => {
    // NEW: ignore clicks inside any app modal
    if (e.target.closest('[data-modal]')) return;
    
    const btn = e.target.closest('[data-action="not-interested"], .btn-not-interested');
    if (!btn) return;
    const card = btn.closest('.curated-card,.list-card,.list-row,.card');
    if (!card) return;

    // Delegate to global card actions system
    if (window.CardActions && window.CardActions.notInterested) {
      const id = card.dataset.id || card.getAttribute('data-id');
      const mediaType = card.dataset.mediaType || card.getAttribute('data-media-type') || 'tv';
      const sourceList = card.dataset.sourceList || card.getAttribute('data-source-list') || 'list';
      
      // Use global system
      window.CardActions.notInterested(id, mediaType, sourceList);
      
      // Update counts
      SECTIONS.forEach(updateCount);
    } else {
      console.warn('🔧 Global card actions system not available, falling back to legacy handler');
      // Fallback to legacy behavior if global system not available
      btn.disabled = true; 
      const prev = btn.textContent; 
      btn.textContent = 'Removing…';
      
      try {
        const id = card.dataset.id || card.getAttribute('data-id');
        const title = card.querySelector('h3, .title, .card-title')?.textContent || 'Unknown item';
        const mediaType = card.dataset.mediaType || 'tv';
        
        if (window.flicklet?.removeFromList) await window.flicklet.removeFromList(id);
        if (document.contains(card)) {
          card.remove();
        }
        window.showNotification?.(`"${title}" marked as not interested`, 'info');
        SECTIONS.forEach(updateCount);
      } catch (err) {
        console.error('[remove] failed', err);
        btn.disabled = false; 
        btn.textContent = prev;
        window.showNotification?.('Could not remove item', 'error');
      }
    }
  });
  
  // Expose updateCount if it's scoped
  if (typeof window.updateCount !== 'function' && typeof updateCount === 'function') {
    window.updateCount = updateCount;
  }
  
})();
