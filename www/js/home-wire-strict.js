// Home Wire Strict - Deterministic home page rendering
// Reads JSON config, validates DOM, renders using ONLY configured selectors

(async function () {
  // Helper: safe fetch of local JSON
  async function loadConfig() {
    const res = await fetch('/config/home-wiring.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`home-wiring.json ${res.status}`);
    return res.json();
  }

  // Data pickers (no guesses; just named strategies tied to your store)
  const pickers = {
    watching: (d) => (d.tv?.watching || []).concat(d.movies?.watching || []),
    wishlist: (d) => (d.tv?.wishlist || []).concat(d.movies?.wishlist || []),
    watched:  (d) => (d.tv?.watched  || []).concat(d.movies?.watched  || []),
    nextUp:   (d) => (d.tv?.watching || []).filter(it => {
                 const s = it.next_episode_air_date || it.nextAirDate || it.next_air_date;
                 const t = Date.parse(s || '');
                 if (!Number.isFinite(t)) return false;
                 const now = Date.now(), wk = 7*864e5;
                 return t >= (now - 864e5) && t <= (now + wk);
               }),
    discover: (d) => (d.discover || []), // optional feed you already populate
    curated:  (d) => (d.curated || []), // optional curated content
    inTheaters:(d)=> (d.inTheaters || []) // optional feed populated elsewhere
  };

  function renderRail(container, items, limit, sectionHint='watching') {
    container.innerHTML = '';
    const list = (limit ? items.slice(0, limit) : items).filter(Boolean);
    if (!list.length) {
      const empty = document.createElement('div');
      empty.className = 'rail-empty';
      empty.textContent = 'Nothing here yet.';
      container.appendChild(empty);
      return;
    }
    
    // Use preview cards for home screen instead of detailed Card component
    list.forEach(it => {
      try {
        const el = createPreviewCard(it, sectionHint);
        if (el) container.appendChild(el);
      } catch (e) {
        console.warn('[home-wire] render error', e);
      }
    });
  }

  /**
   * Create a compact preview card for home screen carousels
   * @param {Object} item - Item data
   * @param {string} sectionHint - Section type (watching, wishlist, etc.)
   * @returns {HTMLElement} Preview card element
   */
  function createPreviewCard(item, sectionHint = 'watching') {
    const card = document.createElement('div');
    card.className = 'preview-card';
    card.dataset.id = item.id || item.tmdb_id || item.tmdbId;
    
    // Extract data
    const title = item.title || item.name || 'Unknown Title';
    const year = item.release_date ? new Date(item.release_date).getFullYear() : 
                 item.first_air_date ? new Date(item.first_air_date).getFullYear() : 
                 item.year || '';
    const mediaType = item.media_type || item.mediaType || (item.first_air_date ? 'TV' : 'Movie');
    
    // Handle poster URL
    const posterUrl = item.posterUrl || item.poster_src || 
                     (item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null);
    
    // Build preview card HTML
    card.innerHTML = `
      <div class="preview-card-poster" role="button" tabindex="0" aria-label="${title}">
        ${posterUrl ? 
          `<img src="${posterUrl}" alt="${title} poster" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` :
          ''
        }
        <div class="preview-card-poster-placeholder" style="display: ${posterUrl ? 'none' : 'flex'};">
          🎬
        </div>
        <div class="preview-card-status">${sectionHint.charAt(0).toUpperCase() + sectionHint.slice(1)}</div>
        <div class="preview-card-actions">
          <button class="preview-action-btn" title="Move to Watched" onclick="window.moveItem && window.moveItem(${item.id || item.tmdb_id}, 'watched')">✅</button>
          <button class="preview-action-btn" title="Move to Wishlist" onclick="window.moveItem && window.moveItem(${item.id || item.tmdb_id}, 'wishlist')">📖</button>
          <button class="preview-action-btn" title="Remove" onclick="window.removeItemFromCurrentList && window.removeItemFromCurrentList(${item.id || item.tmdb_id})">🗑️</button>
        </div>
      </div>
      <div class="preview-card-content">
        <h3 class="preview-card-title">${title.toUpperCase()}</h3>
        <div class="preview-card-year">${year ? `(${year})` : ''} ${mediaType}</div>
      </div>
    `;
    
    // Add click handler for poster
    const poster = card.querySelector('.preview-card-poster');
    if (poster && window.openTMDBLink) {
      poster.addEventListener('click', () => {
        window.openTMDBLink(item.id || item.tmdb_id, item.mediaType || 'movie');
      });
    }
    
    return card;
  }

  function run(config) {
    const data = window.appData || { tv:{}, movies:{} };
    config.rails.forEach((r) => {
      const container = document.querySelector(r.containerSelector);
      if (!container) {
        console.warn(`[home-wire] missing container ${r.containerSelector} for "${r.title}"`);
        return;
      }
      const pick = pickers[r.picker] || (() => []);
      const items = pick(data);
      renderRail(container, items, r.limit, r.picker === 'wishlist' ? 'wishlist' : 'watching');
    });
    console.info('[home-wire] rendered:', config.rails.map(r => r.key).join(', '));
  }

  const config = await loadConfig();
  // Render whenever data becomes ready
  window.addEventListener('app:data:ready', () => run(config));
  // Optional: expose manual trigger
  window.renderHomeRails = () => run(config);
})().catch(e => console.error('[home-wire] failed to init', e));
