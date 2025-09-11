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
  }

  document.addEventListener('click', async (e) => {
    // NEW: ignore clicks inside any app modal
    if (e.target.closest('[data-modal]')) return;
    
    const btn = e.target.closest('[data-action="not-interested"], .btn-not-interested');
    if (!btn) return;
    const card = btn.closest('.curated-card,.list-card,.list-row,.card');
    if (!card) return;

    // Prevent multiple clicks
    if (btn.disabled) {
      console.log('🔍 Button already disabled, ignoring click');
      return;
    }
    
    btn.disabled = true; const prev = btn.textContent; btn.textContent = 'Removing…';
    try {
      const id = card.dataset.id || card.getAttribute('data-id');
      const title = card.querySelector('h3, .title, .card-title')?.textContent || 'Unknown item';
      const mediaType = card.dataset.mediaType || 'tv';
      
      // Add to not interested list in appData
      console.log('🔍 Debug: window.appData exists:', !!window.appData);
      if (window.appData) {
        // Initialize notInterested array if it doesn't exist
        if (!window.appData.notInterested) {
          window.appData.notInterested = [];
          console.log('🔍 Debug: Initialized notInterested array');
        }
        
        // Check if already in not interested list
        const existingIndex = window.appData.notInterested.findIndex(item => item.id === Number(id));
        console.log('🔍 Debug: existingIndex:', existingIndex, 'for id:', id);
        if (existingIndex === -1) {
          const itemInfo = {
            id: Number(id),
            title: title,
            mediaType: mediaType,
            addedAt: new Date().toISOString()
          };
          window.appData.notInterested.push(itemInfo);
          console.log('✅ Added to not interested list:', itemInfo);
          console.log('🔍 Debug: Total items in notInterested:', window.appData.notInterested.length);
          
          // Refresh the not interested modal if it's open
          const modal = document.getElementById('notInterestedModal');
          if (modal && modal.style.display !== 'none') {
            console.log('🔍 Debug: Modal is open, refreshing...');
            if (window.populateNotInterestedList) {
              window.populateNotInterestedList();
            }
          }
        } else {
          console.log('🔍 Debug: Item already in not interested list');
        }
      } else {
        console.warn('❌ window.appData not available!');
      }
      
      if (window.flicklet?.removeFromList) await window.flicklet.removeFromList(id);
      if (document.contains(card)) {
        card.remove();
      }
      window.showNotification?.(`"${title}" marked as not interested`, 'info');
    } catch (err){
      console.error('[remove] failed', err);
      btn.disabled = false; btn.textContent = prev;
      window.showNotification?.('Could not remove item', 'error');
      return;
    }
    SECTIONS.forEach(updateCount);
  });
  
  // Expose updateCount if it's scoped
  if (typeof window.updateCount !== 'function' && typeof updateCount === 'function') {
    window.updateCount = updateCount;
  }
  
})();
