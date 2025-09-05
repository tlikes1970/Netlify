/* ========== curated-rows.js ==========
   Renders multiple curated rows from config.
   Expects items with { id, title, posterPath }. Map your data if needed.
*/
(function(){
  const mount = document.getElementById('curatedSections');
  if (!mount) return;

  // ---- Config your rows here ----
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

  // Add TMDB image helper
  const TMDB_BASE = 'https://image.tmdb.org/t/p/';

  /** Build a TMDB image URL safely. 
   * Accepts: full URL (returns as-is), relative path like "/abc.jpg" (prefixes), falsy (returns "").
   * size: w154, w185, w342, w500, original, etc.
   */
  function tmdbImage(pathOrUrl, size = 'w342') {
    if (!pathOrUrl) return '';
    const s = String(pathOrUrl);
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    if (s.startsWith('/')) return `${TMDB_BASE}${size}${s}`;
    // some libs store without leading slash; handle that too
    return `${TMDB_BASE}${size}/${s}`;
  }

  function mapItem(item){
    if (!item) return null;

    // normalize ID + title
    const id = item.id ?? item.tmdbId ?? item.imdbId ?? ('x_'+Math.random().toString(36).slice(2));
    const title = item.title ?? item.name ?? item.original_title ?? item.original_name ?? 'Untitled';

    // find poster candidate
    const rawPoster =
      item.posterPath ?? item.poster_path ?? item.poster_url ?? item.poster ?? item.image ?? item.backdrop_path ?? '';

    // build a full URL if it's TMDB-style
    const poster = tmdbImage(rawPoster, 'w342'); // choose size to taste


    return { id, title, poster };
  }

  function cardHTML(n){
    const poster = n.poster ? 
      `<img class="poster" loading="lazy" alt="${escapeHTML(n.title)} poster" src="${escapeAttr(n.poster)}">`
      : `<div class="poster" aria-hidden="true"></div>`;
    return `
      <article class="curated-card" data-id="${escapeAttr(n.id)}">
        ${poster}
        <div class="meta">
          <div class="title">${escapeHTML(n.title)}</div>
          <div class="actions">
            <button class="btn" data-action="watching">▶️ Add</button>
            <button class="btn" data-action="wishlist">＋ Wish</button>
          </div>
        </div>
      </article>`;
  }

  function sectionHTML(row, items){
    const cards = items.map(mapItem).map(cardHTML).join('') || emptyState();
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
    if (action === 'watching' && window.addToListFromCache) {
      window.addToListFromCache(Number(id), 'watching');
      window.Notify?.success?.(`Added "${title}" to Watching`);
    } else if (action === 'wishlist' && window.addToListFromCache) {
      window.addToListFromCache(Number(id), 'wishlist');
      window.Notify?.success?.(`Added "${title}" to Wishlist`);
    } else {
      console.warn('Curated action not wired:', action, id);
    }
  }

  function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
  function escapeAttr(s){ return escapeHTML(s); }

  async function render(){
    const sections = await Promise.all(ROWS.map(async row => {
      const items = await row.source();
      return sectionHTML(row, items || []);
    }));
    mount.innerHTML = sections.join('');
    mount.addEventListener('click', onClick);
  }

  // kick off
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render, { once: true });
  } else {
    render();
  }
})();
