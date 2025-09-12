/* ========== curated-rows.js ==========
   Renders multiple curated rows from config.
   Expects items with { id, title, posterPath }. Map your data if needed.
*/
(function(){
  const mount = document.getElementById('curatedSections');
  if (!mount) return;

  // ---- Dynamic section limiting ----
  function getRowsLimit(){
    const n = Number(localStorage.getItem('flicklet:curated:rows'));
    return (Number.isFinite(n) && n > 0) ? n : 3;
  }
  
  function availableCuratedSections(){
    console.log('🔍 availableCuratedSections called');
    const s = [];
    
    const trending = localStorage.getItem('curated:trending');
    const staff = localStorage.getItem('curated:staff');
    const newData = localStorage.getItem('curated:new');
    
    console.log('🔍 localStorage check:', { trending: trending ? `${trending.length} chars` : 'null', staff: staff ? `${staff.length} chars` : 'null', newData: newData ? `${newData.length} chars` : 'null' });
    
    if (trending) s.push({ key:'trending', title:typeof t === 'function' ? t('trending_title') : 'Trending', subtitle:typeof t === 'function' ? t('trending_subtitle') : 'What everyone is watching' });
    if (staff)    s.push({ key:'staff',    title:typeof t === 'function' ? t('staff_picks_title') : 'Staff Picks', subtitle:typeof t === 'function' ? t('staff_picks_subtitle') : 'Curated by us' });
    if (newData)  s.push({ key:'new',      title:typeof t === 'function' ? t('new_this_week_title') : 'New This Week', subtitle:typeof t === 'function' ? t('new_this_week_subtitle') : 'Fresh releases' });
    
    const result = s.slice(0, getRowsLimit());
    console.log('🔍 availableCuratedSections result:', result);
    return result;
  }

  // ---- Config your rows here (now dynamic) ----
  const ROWS = [
    {
      key: 'trending',
      title: () => (typeof t === 'function' ? t('trending_title') : 'Trending'),
      subtitle: () => (typeof t === 'function' ? t('trending_subtitle') : 'What everyone is watching'),
      source: () => loadSource('trending')  // replace with real data function
    },
    {
      key: 'staff',
      title: () => (typeof t === 'function' ? t('staff_picks_title') : 'Staff Picks'),
      subtitle: () => (typeof t === 'function' ? t('staff_picks_subtitle') : 'Curated by us'),
      source: () => loadSource('staff')
    },
    {
      key: 'new',
      title: () => (typeof t === 'function' ? t('new_this_week_title') : 'New This Week'),
      subtitle: () => (typeof t === 'function' ? t('new_this_week_subtitle') : 'Fresh releases'),
      source: () => loadSource('new')
    }
  ];

  // ---- Replace this with your real data plumbing ----
  async function loadSource(kind){
    console.log(`🔍 loadSource called for: ${kind}`);
    
    // Example 1: from a global cache
    if (window.FlickletCache && window.FlickletCache[kind]) {
      console.log(`🔍 Found in FlickletCache: ${kind}`, window.FlickletCache[kind]);
      return window.FlickletCache[kind];
    }
    
    // Example 2: from localStorage
    try {
      const raw = localStorage.getItem(`curated:${kind}`);
      console.log(`🔍 localStorage raw data for ${kind}:`, raw ? `${raw.length} chars` : 'null');
      if (raw) {
        const parsed = JSON.parse(raw);
        console.log(`🔍 Parsed data for ${kind}:`, parsed.length, 'items');
        return parsed;
      }
    } catch(e) {
      console.error(`🔍 Error parsing localStorage data for ${kind}:`, e);
    }

    // Example 3: fallback mock (safe empty)
    console.log(`🔍 No data found for ${kind}, returning empty array`);
    return [];
  }

  // === TMDB helpers (top of file)
  const TMDB_IMG = (p, size='w342') => {
    if (!p) return '';
    const s = String(p);
    return s.startsWith('http') ? s : `https://image.tmdb.org/t/p/${size}${s.startsWith('/')?'':'/'}${s}`;
  };

  function mapCuratedItem(raw){
    const id    = raw.id;
    const title = raw.title ?? raw.name ?? 'Untitled';
    const rawPoster = raw.posterPath ?? raw.poster_path ?? raw.backdrop_path ?? '';
    const poster = TMDB_IMG(rawPoster, 'w342');
    const rating = raw.userRating ?? (Number.isFinite(raw.vote_average) ? (raw.vote_average/2).toFixed(1) : null);
    const votes  = raw.vote_count ?? '';
    return { id, title, poster, rating, votes };
  }

  // Replace your existing card HTML builder with this
  function renderCuratedCard(item){
    const m = mapCuratedItem(item);
    const stars = m.rating ? `${'★'.repeat(Math.floor(m.rating))}${(m.rating%1>=0.5)?'☆':''}` : '';
    const votes = m.votes ? ` <span class="votes">(${m.votes})</span>` : '';
    return `
      <article class="curated-card" data-id="${m.id}" data-title="${m.title}" ${m.rating?`data-rating="${m.rating}"`:''}>
        <div class="poster">
          ${m.poster ? `<img src="${m.poster}" alt="${m.title} poster" loading="lazy">` : `<div class="poster placeholder" aria-hidden="true"></div>`}
        </div>
        <h4 class="title">${m.title}</h4>
        <div class="card-meta">${m.rating?`<span class="stars" aria-label="Rating ${m.rating}/5">${stars}</span>`:''}${votes}</div>
        <div class="actions">
          <button class="btn" data-action="wish">Wish</button>
          <button class="btn" data-action="add">Add</button>
          <button class="btn btn-ghost" data-action="not-interested">Not interested</button>
        </div>
      </article>`;
  }

  function sectionHTML(row, items){
    console.log(`🔍 sectionHTML called for ${row.key} with ${items.length} items`);
    const cards = items.map(renderCuratedCard).join('') || emptyState();
    console.log(`🔍 Generated ${cards.length} chars of HTML for ${row.key}`);
    return `
      <section class="curated-section" data-key="${row.key}">
        <div class="section-header">
          <div class="section-title">${escapeHTML(typeof row.title === 'function' ? row.title() : row.title)}</div>
          ${row.subtitle ? `<div class="section-subtitle">${escapeHTML(typeof row.subtitle === 'function' ? row.subtitle() : row.subtitle)}</div>` : ''}
        </div>
        <div class="curated-row" role="listbox" aria-label="${escapeAttr(typeof row.title === 'function' ? row.title() : row.title)}">
          ${cards}
        </div>
      </section>`;
  }

  function emptyState(){
    return `<div style="padding:12px; opacity:.7;">No items yet.</div>`;
  }

  function onClick(e){
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const action = btn.dataset.action;
    const card = btn.closest('.curated-card');
    if (!action || !card) return;
    const id = card.getAttribute('data-id');
    const title = card.querySelector('.title')?.textContent?.trim() ?? 'Untitled';

    // Get the item data from the curated data
    const item = getCuratedItemById(Number(id));
    if (!item) {
      console.warn('Curated item not found:', id);
      return;
    }

    // Wire into your existing add APIs
    if (action === 'add' && window.addToList) {
      window.addToList(item, 'watching');
      window.showNotification?.(`Added "${title}" to Watching`, 'success');
    } else if (action === 'wish' && window.addToList) {
      window.addToList(item, 'wishlist');
      window.showNotification?.(`Added "${title}" to Wishlist`, 'success');
    } else if (action === 'not-interested') {
      // Handled by list-actions.js - do nothing here to avoid duplicates
      return;
    } else {
      console.warn('Curated action not wired:', action, id);
    }
  }

  function getCuratedItemById(id) {
    // Search through all curated data to find the item
    const keys = ['curated:trending', 'curated:staff', 'curated:new'];
    for (const key of keys) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        const item = data.find(i => i.id === id);
        if (item) return item;
      } catch (e) {
        console.error('Error parsing curated data:', key, e);
      }
    }
    return null;
  }

  function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
  function escapeAttr(s){ return escapeHTML(s); }

  // In your render entry point:
  function renderCuratedHomepage(){
    console.log('🔍 renderCuratedHomepage called');
    const sections = availableCuratedSections();
    const limit = getRowsLimit();
    console.log('🎬 Rendering TV/Movie lists:', sections.length, 'of', limit, 'requested');
    console.log('🎬 Sections being shown:', sections.map(s => typeof s.title === 'function' ? s.title() : s.title).join(', '));
    
    return Promise.all(sections.map(async row => {
      console.log(`🔍 Processing section: ${row.key}`);
      const items = await loadSource(row.key);
      console.log(`🔍 Loaded ${items.length} items for ${row.key}`);
      return sectionHTML(row, items || []);
    })).then(sectionHTMLs => {
      console.log('🔍 All sections processed, updating DOM');
      console.log('🔍 Total HTML length:', sectionHTMLs.join('').length);
      mount.innerHTML = sectionHTMLs.join('');
      mount.addEventListener('click', onClick);
      
      // Visual indicator removed - only shows on setting change now
    });
  }
  
  // Expose globally for language refresh
  window.renderCuratedHomepage = renderCuratedHomepage;

  // Event listener for live re-render
  document.addEventListener('curated:rerender', () => {
    try { 
      console.log('🔄 Curated rerender triggered');
      console.log('🔄 Current rows limit:', getRowsLimit());
      console.log('🔄 Available sections:', availableCuratedSections());
      renderCuratedHomepage(); 
    } catch(e){ 
      console.warn('curated rerender failed', e); 
    }
  });

  // kick off
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderCuratedHomepage, { once: true });
  } else {
    renderCuratedHomepage();
  }
})();
