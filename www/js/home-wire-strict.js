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
    const factory = (window.createPosterCard || window.createMediaCard);
    list.forEach(it => {
      try {
        const el = factory(it, sectionHint);
        if (el) container.appendChild(el);
      } catch (e) {
        console.warn('[home-wire] render error', e);
      }
    });
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
