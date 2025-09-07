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
    const s = [];
    if (localStorage.getItem('curated:trending')) s.push({ key:'trending', title:'Trending', subtitle:'What everyone is watching' });
    if (localStorage.getItem('curated:staff'))    s.push({ key:'staff',    title:'Staff Picks', subtitle:'Curated by us' });
    if (localStorage.getItem('curated:new'))      s.push({ key:'new',      title:'New This Week', subtitle:'Fresh releases' });
    return s.slice(0, getRowsLimit());
  }

  // ---- Config your rows here (now dynamic) ----
  const ROWS = [
    {
      key: 'trending',
      title: 'Trending',
      subtitle: 'What everyone is watching',
      source: () => loadSource('trending')  // replace with real data function
    },
    {
      key: 'staff',
      title: 'Staff Picks',
      subtitle: 'Curated by us',
      source: () => loadSource('staff')
    },
    {
      key: 'new',
      title: 'New This Week',
      subtitle: 'Fresh releases',
      source: () => loadSource('new')
    }
  ];

  // ---- Replace this with your real data plumbing ----
  async function loadSource(kind){
    // Example 1: from a global cache
    if (window.FlickletCache && window.FlickletCache[kind]) {
      return window.FlickletCache[kind];
    }
    // Example 2: from localStorage
    try {
      const raw = localStorage.getItem(`curated:${kind}`);
      if (raw) return JSON.parse(raw);
    } catch(_) {}

    // Example 3: fallback mock (safe empty)
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
    const rawPoster = raw.poster ?? raw.posterPath ?? raw.poster_path ?? raw.backdrop_path ?? '';
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
    const cards = items.map(renderCuratedCard).join('') || emptyState();
    return `
      <section class="curated-section" data-key="${row.key}">
        <div class="section-header">
          <div class="section-title">${escapeHTML(row.title)}</div>
          ${row.subtitle ? `<div class="section-subtitle">${escapeHTML(row.subtitle)}</div>` : ''}
        </div>
        <div class="curated-row" role="listbox" aria-label="${escapeAttr(row.title)}">
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

    // Wire into your existing add APIs
    if (action === 'add' && window.addToListFromCache) {
      window.addToListFromCache(Number(id), 'watching');
      window.showNotification?.(`Added "${title}" to Watching`, 'success');
    } else if (action === 'wish' && window.addToListFromCache) {
      window.addToListFromCache(Number(id), 'wishlist');
      window.showNotification?.(`Added "${title}" to Wishlist`, 'success');
    } else if (action === 'not-interested') {
      // Handled by list-actions.js - do nothing here to avoid duplicates
      return;
    } else {
      console.warn('Curated action not wired:', action, id);
    }
  }

  function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
  function escapeAttr(s){ return escapeHTML(s); }

  // In your render entry point:
  function renderCuratedHomepage(){
    const sections = availableCuratedSections();
    const limit = getRowsLimit();
    console.log('🎬 Rendering TV/Movie lists:', sections.length, 'of', limit, 'requested');
    console.log('🎬 Sections being shown:', sections.map(s => s.title).join(', '));
    
    return Promise.all(sections.map(async row => {
      const items = await loadSource(row.key);
      return sectionHTML(row, items || []);
    })).then(sectionHTMLs => {
      mount.innerHTML = sectionHTMLs.join('');
      mount.addEventListener('click', onClick);
      
      // Add visual indicator
      const indicator = document.getElementById('curatedSectionsIndicator');
      console.log('🎬 Indicator element found:', !!indicator);
      if (indicator) {
        const text = `Showing ${sections.length} of ${limit} TV/Movie lists`;
        indicator.textContent = text;
        console.log('🎬 Indicator updated:', text);
      } else {
        console.warn('🎬 Indicator element not found!');
      }
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
