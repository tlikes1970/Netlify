/* ========== curated-lists.js ==========
   Curated Lists Row - What to Watch
   Renders N curated lists with exactly 3 tiles each
   Uses existing curated data providers
*/

(function(){
  'use strict';

  // Check if feature is enabled
  if (!window.FLAGS?.homeRowCurated) {
    console.log('🎬 Curated Lists disabled by feature flag');
    return;
  }

  const section = document.getElementById('curated-row');
  if (!section) {
    console.warn('🎬 Curated Lists row not found');
    return;
  }

  console.log('🎬 Initializing Curated Lists row...');
  console.log('🎬 Feature flag status:', window.FLAGS?.homeRowCurated);

  // Initialize on DOM ready with delay to allow seeder to complete
  function initializeWithDelay() {
    setTimeout(() => {
      console.log('🎬 Delayed initialization of Curated Lists...');
      renderCuratedRow();
    }, 2000); // Wait 2 seconds for seeder to complete
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWithDelay);
  } else {
    initializeWithDelay();
  }

  /**
   * Process: Home Lists Count Retrieval
   * Purpose: Gets the user setting for number of curated lists to show (1-3)
   * Data Source: localStorage 'flicklet:curated:rows' setting
   * Update Path: Modify the localStorage key if the setting system changes
   * Dependencies: localStorage, number validation
   */
  async function getHomeListsCountStrict() {
    // Use existing settings getter for: Settings → Layout → "Home Page TV/Movie Lists"
    try {
      const n = Number(localStorage.getItem('flicklet:curated:rows'));
      if ([1,2,3].includes(n)) return n;
      return 3; // safe default if the control exists but has unexpected value
    } catch (e) {
      console.error('[Curated] Error getting homeListsCount:', e);
      return 0; // abort render cleanly
    }
  }

  // Map the fixed list order to existing providers
  const CURATED_ORDER = [
    { kind: 'trending',   title: 'Trending',     fetch: async () => loadSource('trending') },
    { kind: 'staff',      title: 'Staff Picks',  fetch: async () => loadSource('staff') },
    { kind: 'new',        title: 'New This Week',fetch: async () => loadSource('new') }
  ];

  /**
   * Process: Source Data Loading
   * Purpose: Loads curated data from localStorage using existing system
   * Data Source: localStorage 'curated:trending', 'curated:staff', 'curated:new'
   * Update Path: Modify localStorage keys if the curated data system changes
   * Dependencies: localStorage, JSON parsing
   */
  async function loadSource(kind) {
    console.log(`🎬 loadSource called for: ${kind}`);
    
    try {
      const raw = localStorage.getItem(`curated:${kind}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        console.log(`🎬 Parsed data for ${kind}:`, parsed.length, 'items');
        return parsed;
      }
    } catch(e) {
      console.error(`🎬 Error parsing localStorage data for ${kind}:`, e);
    }

    console.log(`🎬 No data found for ${kind}, returning empty array`);
    return [];
  }

  /**
   * Process: Poster Source Generation
   * Purpose: Generates poster image URLs using existing TMDB helper
   * Data Source: Item poster data, TMDB image helper
   * Update Path: Modify if poster URL generation logic changes
   * Dependencies: TMDB_IMG helper function
   */
  function getPosterSrc(item) {
    // Use existing TMDB helper
    const TMDB_IMG = (p, size='w342') => {
      if (!p) return '';
      const s = String(p);
      return s.startsWith('http') ? s : `https://image.tmdb.org/t/p/${size}${s.startsWith('/')?'':'/'}${s}`;
    };
    
    const rawPoster = item.posterPath ?? item.poster_path ?? item.backdrop_path ?? '';
    return TMDB_IMG(rawPoster, 'w342');
  }

  /**
   * Process: Meta Label Generation
   * Purpose: Creates display text for tile metadata
   * Data Source: Item title/name data
   * Update Path: Modify if meta display format changes
   * Dependencies: Item data structure
   */
  function getCuratedMetaLabel(item) {
    return item.title ?? item.name ?? '';
  }

  /**
   * Process: Show Detail Opening
   * Purpose: Opens detail view for clicked item using existing system
   * Data Source: Item data, existing openShowDetail function
   * Update Path: Modify if detail opening mechanism changes
   * Dependencies: openShowDetail function
   */
  function openShowDetail(item) {
    if (typeof window.openShowDetail === 'function') {
      window.openShowDetail(item);
    } else {
      console.warn('🎬 openShowDetail function not available');
    }
  }

  /**
   * Process: Tile Creation
   * Purpose: Creates individual poster tiles for curated lists
   * Data Source: Item data, poster source, meta label
   * Update Path: Modify HTML structure or styling classes in this function
   * Dependencies: getPosterSrc, getCuratedMetaLabel, openShowDetail
   */
  function makeTile(item) {
    const div = document.createElement('div');
    div.className = 'tile';
    div.innerHTML = `
      <div class="media"><img alt=""></div>
      <div class="meta"></div>
    `;
    const img = div.querySelector('img');
    const meta = div.querySelector('.meta');

    // Use existing poster helper
    const src = getPosterSrc(item);
    img.src = src;
    img.alt = item.title ?? item.name ?? 'Poster';

    // Meta (keep minimal)
    meta.textContent = getCuratedMetaLabel(item);

    div.addEventListener('click', () => {
      console.log('🎬 Tile clicked:', item.title ?? item.name);
      openShowDetail(item);
    });
    return div;
  }

  /**
   * Process: Curated Lists Row Rendering
   * Purpose: Renders N curated lists with exactly 3 tiles each
   * Data Source: User setting, curated data providers, CURATED_ORDER
   * Update Path: Modify list order or tile count in this function
   * Dependencies: getHomeListsCountStrict, CURATED_ORDER, makeTile
   */
  async function renderCuratedRow() {
    if (!window.FLAGS?.homeRowCurated) return;

    const section = document.getElementById('curated-row');
    if (!section) return;
    const stacks = section.querySelector('.curated-stacks');
    if (!stacks) return;

    const count = await getHomeListsCountStrict();
    console.log('🎬 Lists count from setting:', count);
    if (!count) { 
      console.log('🎬 No lists to show, removing section');
      section.remove(); 
      return; 
    }

    console.log(`🎬 Rendering ${count} curated lists`);

    stacks.innerHTML = '';

    // Take first N kinds from fixed order
    const picks = CURATED_ORDER.slice(0, count);

    let renderedLists = 0;

    for (const cfg of picks) {
      // Ensure the fetcher exists
      if (typeof cfg.fetch !== 'function') {
        console.error(`[Curated] Missing provider for ${cfg.kind}. Skipping.`);
        continue;
      }

      let items = [];
      try {
        const res = await cfg.fetch();
        // Accept arrays
        items = Array.isArray(res) ? res : [];
      } catch (e) {
        console.error(`[Curated] Error fetching ${cfg.kind}:`, e);
        continue;
      }

      // Keep exactly 3 tiles
      items = items.filter(Boolean).slice(0, 3);
      if (!items.length) {
        console.log(`🎬 No items for ${cfg.kind}, skipping`);
        continue;
      }

      console.log(`🎬 Rendering ${cfg.kind} with ${items.length} items`);

      // Build list block
      const block = document.createElement('div');
      block.className = 'curated-list';
      block.dataset.kind = cfg.kind;
      block.innerHTML = `
        <div class="curated-list-header">
          <h3 class="curated-list-title">${cfg.title}</h3>
        </div>
        <div class="curated-list-scroll row-inner"></div>
      `;
      const row = block.querySelector('.curated-list-scroll');

      items.forEach(it => row.appendChild(makeTile(it)));

      stacks.appendChild(block);
      renderedLists++;
    }

    // If nothing to show, remove section
    if (!renderedLists) {
      console.log('🎬 No lists rendered, removing section');
      section.remove();
    } else {
      console.log(`✅ Curated Lists row rendered with ${renderedLists} list(s)`);
    }
  }

  // Expose render function globally for manual triggering
  window.renderCuratedRow = renderCuratedRow;

})();
