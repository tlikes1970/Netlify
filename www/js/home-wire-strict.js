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
    curated: (d) => {
      // Load curated data from localStorage keys
      const curatedData = [];
      try {
        const trending = JSON.parse(localStorage.getItem('curated:trending') || '[]');
        const staff = JSON.parse(localStorage.getItem('curated:staff') || '[]');
        const fresh = JSON.parse(localStorage.getItem('curated:new') || '[]');
        curatedData.push(...trending, ...staff, ...fresh);
      } catch (e) {
        console.warn('[home-wire] Error loading curated data:', e);
      }
      return curatedData;
    },
    inTheaters: (d) => d.inTheaters || [], // optional feed populated elsewhere
  };

  async function renderRail(container, items, limit, sectionHint = 'watching') {
    container.innerHTML = '';
    const list = (limit ? items.slice(0, limit) : items).filter(Boolean);
    
    // Don't filter out items without posters - let createPreviewCard handle placeholders
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
    // Try to fetch poster data if missing
    if (!item.posterUrl && !item.poster_src && !item.poster_path && item.id && window.tmdbGet) {
      try {
        console.log('[home-wire] Attempting to fetch poster data for item:', item.title || item.name, 'ID:', item.id);
        const mediaType = item.media_type === 'tv' ? 'tv' : 'movie';
        const tmdbData = await window.tmdbGet(`${mediaType}/${item.id}`, {});
        
        if (tmdbData && tmdbData.poster_path) {
          item.poster_path = tmdbData.poster_path;
          console.log('[home-wire] Successfully fetched poster data:', tmdbData.poster_path);
        }
      } catch (error) {
        console.warn('[home-wire] Failed to fetch poster data from TMDB:', error);
      }
    }

    // Use Cards V2 system with proper context routing per design specs
    try {
      let card;
      const container = document.createElement('div');
      
      if (sectionHint === 'watching' && window.renderCardV2) {
        // Design spec: Home Currently Watching - vertical layout with 2x2 buttons
        const props = {
          id: item.id,
          mediaType: item.media_type || 'tv',
          title: item.title || item.name || 'Unknown',
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : (item.posterUrl || ''),
          releaseDate: item.release_date || item.first_air_date || '',
          genre: item.genre || (item.genres && item.genres[0]?.name) || '',
          seasonEpisode: item.seasonEpisode || item.sxxExx || ''
        };
        card = window.renderCardV2(container, props, { listType: 'watching', context: 'home' });
      } else if (sectionHint === 'nextUp' && window.renderCardV2) {
        // Design spec: Home Next Up - vertical layout with NO buttons, single "Up next: <date>" line
        const props = {
          id: item.id,
          mediaType: item.media_type || 'tv',
          title: item.title || item.name || 'Unknown',
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : (item.posterUrl || ''),
          releaseDate: item.release_date || item.first_air_date || '',
          genre: item.genre || (item.genres && item.genres[0]?.name) || '',
          seasonEpisode: item.seasonEpisode || item.sxxExx || '',
          nextAirDate: item.next_episode_air_date || item.nextAirDate || item.next_air_date || 'TBA'
        };
        card = window.renderCardV2(container, props, { listType: 'next-up', context: 'home' });
      } else if (sectionHint === 'curated' && window.renderCardV2) {
        // Design spec: Home Curated - vertical layout with single button and TMDB link
        const props = {
          id: item.id,
          mediaType: item.media_type || 'movie',
          title: item.title || item.name || 'Unknown',
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : (item.posterPath || item.posterUrl || ''),
          releaseDate: item.release_date || item.first_air_date || '',
          genre: item.genre || (item.genres && item.genres[0]?.name) || '',
          tmdbId: item.tmdbId || item.id,
          whereToWatch: item.whereToWatch || item.provider || '',
          curatorBlurb: item.curatorBlurb || item.description || ''
        };
        card = window.renderCardV2(container, props, { listType: 'curated', context: 'home' });
      } else if (window.renderCardV2) {
        // Fallback to generic V2 renderer
        const props = {
          id: item.id,
          mediaType: item.media_type || 'tv',
          title: item.title || item.name || 'Unknown',
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : (item.posterUrl || ''),
          releaseDate: item.release_date || item.first_air_date || '',
          genre: item.genre || (item.genres && item.genres[0]?.name) || '',
          seasonEpisode: item.seasonEpisode || item.sxxExx || ''
        };
        card = window.renderCardV2(container, props, { listType: sectionHint, context: 'home' });
      }
      
      if (card) {
        // Add preview-specific styling
        card.classList.add('preview-card');
        return card;
      }
    } catch (error) {
      console.error('❌ Cards V2 creation failed:', error);
      // Fall through to old Card component
    }

    // Fallback to old Card component if Cards V2 not available
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
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');

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
    let data = { tv: {}, movies: {} };
    
    // Use WatchlistsAdapterV2 as the data source for consistency with list tabs
    if (window.WatchlistsAdapterV2 && typeof window.WatchlistsAdapterV2.load === 'function') {
      try {
        const uid = window.firebaseAuth?.currentUser?.uid || null;
        const adapterData = await window.WatchlistsAdapterV2.load(uid);
        
        // Transform adapter data to the format expected by pickers
        if (adapterData) {
          // Get full item data for each list
          const getItemsWithData = async (ids) => {
            if (!ids || !Array.isArray(ids)) return [];
            
            const items = [];
            for (const id of ids) {
              try {
                const itemData = window.WatchlistsAdapterV2.getItemData(id);
                if (itemData) {
                  items.push(itemData);
                }
                // Skip items without data - no fallback objects
              } catch (error) {
                console.warn('[home-wire] Failed to get item data for ID:', id, error);
                // Skip items with errors - no fallback objects
              }
            }
            return items;
          };
          
          // Get items for each list with full data
          const watchingItems = await getItemsWithData(adapterData.watchingIds);
          const wishlistItems = await getItemsWithData(adapterData.wishlistIds);
          const watchedItems = await getItemsWithData(adapterData.watchedIds);
          
          // Separate TV and movie items
          data = {
            tv: {
              watching: watchingItems.filter(item => item.media_type === 'tv'),
              wishlist: wishlistItems.filter(item => item.media_type === 'tv'),
              watched: watchedItems.filter(item => item.media_type === 'tv')
            },
            movies: {
              watching: watchingItems.filter(item => item.media_type === 'movie'),
              wishlist: wishlistItems.filter(item => item.media_type === 'movie'),
              watched: watchedItems.filter(item => item.media_type === 'movie')
            }
          };
        }
      } catch (error) {
        console.warn('[home-wire] Failed to load from adapter:', error);
        // Do not fall back to appData - keep empty data structure
        data = { tv: {}, movies: {} };
      }
    } else {
      // No adapter available - use appData as fallback
      data = window.appData || { tv: {}, movies: {} };
    }
    
    for (const r of config.rails) {
      const container = document.querySelector(r.containerSelector);
      if (!container) {
        console.warn(`[home-wire] missing container ${r.containerSelector} for "${r.title}"`);
        continue;
      }
      const pick = pickers[r.picker] || (() => []);
      const items = pick(data);
      // Use the picker name as sectionHint to get correct card variant
      await renderRail(container, items, r.limit, r.picker);
    }
    console.info('[home-wire] rendered:', config.rails.map((r) => r.key).join(', '));
  }

  const config = await loadConfig();
  // Render whenever data becomes ready
  window.addEventListener('app:data:ready', () => run(config));
  // Optional: expose manual trigger
  window.renderHomeRails = () => run(config);
})().catch((e) => console.error('[home-wire] failed to init', e));
