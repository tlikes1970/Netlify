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
    watched: (d) => (d.tv?.watched || []).concat(d.movies?.watched || []),
    nextUp: (d) =>
      (d.tv?.watching || []).filter((it) => {
        const s = it.next_episode_air_date || it.nextAirDate || it.next_air_date;
        const t = Date.parse(s || '');
        if (!Number.isFinite(t)) return false;
        const now = Date.now(),
          wk = 7 * 864e5;
        return t >= now - 864e5 && t <= now + wk;
      }),
    discover: (d) => d.discover || [], // optional feed you already populate
    curated: (d) => d.curated || [], // optional curated content
    inTheaters: (d) => d.inTheaters || [], // optional feed populated elsewhere
  };

  async function renderRail(container, items, limit, sectionHint = 'watching') {
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
    for (const it of list) {
      try {
        const el = await createPreviewCard(it, sectionHint);
        if (el) container.appendChild(el);
      } catch (e) {
        console.warn('[home-wire] render error', e);
      }
    }
  }

  /**
   * Create a unified card for home screen carousels
   * @param {Object} item - Item data
   * @param {string} sectionHint - Section type (watching, wishlist, etc.)
   * @returns {HTMLElement} Unified card element
   */
  async function createPreviewCard(item, sectionHint = 'watching') {
    // Use MediaCard system if available
    if (typeof window.renderMediaCard === 'function') {
      try {
        // Transform item data for MediaCard
        const mediaCardData = {
          id: item.id || item.tmdb_id || item.tmdbId,
          title: item.title || item.name || 'Unknown Title',
          year: item.release_date
            ? new Date(item.release_date).getFullYear()
            : item.first_air_date
              ? new Date(item.first_air_date).getFullYear()
              : item.year || '',
          type: item.media_type === 'tv' || item.first_air_date ? 'TV Show' : 'Movie',
          posterUrl: item.posterUrl || item.poster_src || (item.poster_path && window.getPosterUrl ? window.getPosterUrl(item.poster_path, 'w342') : item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null),
          tmdbUrl: item.tmdbUrl || (item.id ? `https://www.themoviedb.org/${item.media_type || 'movie'}/${item.id}` : '#'),
          genres: item.genres?.map(g => g.name) || [],
          description: item.overview || '',
          rating: item.vote_average || 0,
          userRating: 0
        };

        // Create MediaCard with appropriate context
        const card = await window.renderMediaCard(mediaCardData, sectionHint);
        
        // Add preview-specific styling
        card.classList.add('preview-card');
        
        return card;
      } catch (error) {
        console.error('❌ MediaCard creation failed:', error);
        // Fall through to old Card component
      }
    }

    // Fallback to old Card component if MediaCard not available
    if (window.Card && window.createCardData) {
      const cardData = window.createCardData(item, 'tmdb', 'home');
      return window.Card({
        variant: 'unified',
        ...cardData,
      });
    }

    // Fallback to simple card if Card component not available
    const card = document.createElement('div');
    card.className = 'unified-card';
    card.dataset.id = item.id || item.tmdb_id || item.tmdbId;

    // Extract data
    const title = item.title || item.name || 'Unknown Title';
    const year = item.release_date
      ? new Date(item.release_date).getFullYear()
      : item.first_air_date
        ? new Date(item.first_air_date).getFullYear()
        : item.year || '';
    const mediaType = item.media_type || item.mediaType || (item.first_air_date ? 'tv' : 'movie');

    // Handle poster URL using TMDB utilities if available
    const posterUrl =
      item.posterUrl ||
      item.poster_src ||
      (item.poster_path && window.getPosterUrl
        ? window.getPosterUrl(item.poster_path, 'w342')
        : item.poster_path
          ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
          : null);

    // Build unified card HTML
    card.innerHTML = `
      <div class="unified-card-poster" role="button" tabindex="0" aria-label="${title}">
        <div class="unified-card-poster-container">
          ${
            posterUrl
              ? `<img src="${posterUrl}" alt="${title} poster" loading="lazy" class="unified-card-poster-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
              : ''
          }
          <div class="unified-card-poster-placeholder" style="display: ${posterUrl ? 'none' : 'flex'};">
            <div class="unified-card-poster-skeleton"></div>
            <div class="unified-card-poster-brand">🎬</div>
          </div>
        </div>
        <div class="unified-card-actions">
          <button class="unified-card-action-btn" 
                  data-action="mark-watched" 
                  data-id="${item.id || item.tmdb_id}" 
                  aria-label="Mark as Watched"
                  title="Mark as Watched">
            <span class="unified-card-action-icon">✅</span>
            <span class="unified-card-action-label">Mark Watched</span>
          </button>
          <button class="unified-card-action-btn" 
                  data-action="want-to-watch" 
                  data-id="${item.id || item.tmdb_id}" 
                  aria-label="Add to Want to Watch"
                  title="Add to Want to Watch">
            <span class="unified-card-action-icon">📖</span>
            <span class="unified-card-action-label">Want to Watch</span>
          </button>
          <button class="unified-card-action-btn" 
                  data-action="remove" 
                  data-id="${item.id || item.tmdb_id}" 
                  aria-label="Remove from List"
                  title="Remove from List">
            <span class="unified-card-action-icon">🗑️</span>
            <span class="unified-card-action-label">Remove</span>
          </button>
        </div>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">${title}</h3>
        <div class="unified-card-subtitle">${year ? `(${year}) • ${mediaType === 'tv' ? 'TV Show' : 'Movie'}` : mediaType === 'tv' ? 'TV Show' : 'Movie'}</div>
      </div>
    `;

    // Add click handler for poster
    const poster = card.querySelector('.unified-card-poster');
    if (poster && window.openTMDBLink) {
      poster.addEventListener('click', (e) => {
        // Don't trigger if clicking on action buttons
        if (!e.target.closest('.unified-card-action-btn')) {
          window.openTMDBLink(item.id || item.tmdb_id, mediaType);
        }
      });
    }

    // Add action button handlers
    const actionButtons = card.querySelectorAll('.unified-card-action-btn');
    actionButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = button.dataset.action;
        const itemId = button.dataset.id;

        switch (action) {
          case 'mark-watched':
            if (window.moveItem) {
              window.moveItem(Number(itemId), 'watched');
            }
            break;
          case 'want-to-watch':
            if (window.moveItem) {
              window.moveItem(Number(itemId), 'wishlist');
            }
            break;
          case 'remove':
            if (window.removeItemFromCurrentList) {
              window.removeItemFromCurrentList(Number(itemId));
            }
            break;
        }
      });
    });

    return card;
  }

  async function run(config) {
    const data = window.appData || { tv: {}, movies: {} };
    for (const r of config.rails) {
      const container = document.querySelector(r.containerSelector);
      if (!container) {
        console.warn(`[home-wire] missing container ${r.containerSelector} for "${r.title}"`);
        continue;
      }
      const pick = pickers[r.picker] || (() => []);
      const items = pick(data);
      await renderRail(container, items, r.limit, r.picker === 'wishlist' ? 'wishlist' : 'watching');
    }
    console.info('[home-wire] rendered:', config.rails.map((r) => r.key).join(', '));
  }

  const config = await loadConfig();
  // Render whenever data becomes ready
  window.addEventListener('app:data:ready', () => run(config));
  // Optional: expose manual trigger
  window.renderHomeRails = () => run(config);
})().catch((e) => console.error('[home-wire] failed to init', e));
