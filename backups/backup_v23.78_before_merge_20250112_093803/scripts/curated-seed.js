/* ========== curated-seed.js ==========
   Seeds curated rows from existing app data, else writes small sample sets.
   Non-destructive: only seeds when curated:* keys are missing.
*/
(function(){
  // If any curated key exists, do nothing (assume you already populated them)
  const KEYS = ['curated:trending','curated:staff','curated:new'];
  const needsSeed = KEYS.some(k => !localStorage.getItem(k));
  if (!needsSeed) return;

  // Try to extract items from existing app caches
  const candidates = extractFromExistingData();

  // Map to normalized items (id,title,posterPath), then build three buckets
  const normalized = candidates.map(mapItem).filter(Boolean);

  const trending = normalized.slice(0, 12);               // top slice
  const staff    = pickEvery(normalized, 5).slice(0, 8);  // spaced picks
  const fresh    = byRecent(normalized).slice(0, 10);     // "new" by date

  // If we have basically nothing, drop in a tiny sample so rows render
  if (trending.length + staff.length + fresh.length < 3) {
    const sample = sampleItems();
    localStorage.setItem('curated:trending', JSON.stringify(sample.slice(0,6)));
    localStorage.setItem('curated:staff', JSON.stringify(sample.slice(6,10)));
    localStorage.setItem('curated:new', JSON.stringify(sample.slice(10,14)));
    return;
  }

  // Write only when non-empty; leave missing ones for later population
  if (trending.length) localStorage.setItem('curated:trending', JSON.stringify(trending));
  if (staff.length)    localStorage.setItem('curated:staff', JSON.stringify(staff));
  if (fresh.length)    localStorage.setItem('curated:new', JSON.stringify(fresh));

  // ------- helpers -------
  function extractFromExistingData(){
    // 1) Unified key candidates your app has used
    const keys = ['tvMovieTrackerData','flicklet-data'];
    const pool = [];

    for (const k of keys){
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const data = JSON.parse(raw);

        // Common shapes seen in apps like this — adapt if yours differs
        // Watching
        if (Array.isArray(data.watching)) pool.push(...data.watching);
        if (Array.isArray(data.currentlyWatching)) pool.push(...data.currentlyWatching);

        // Wishlist
        if (Array.isArray(data.wishlist)) pool.push(...data.wishlist);
        if (Array.isArray(data.wantToWatch)) pool.push(...data.wantToWatch);

        // History / watched
        if (Array.isArray(data.watched)) pool.push(...data.watched);
        if (Array.isArray(data.history)) pool.push(...data.history);

        // Generic items array
        if (Array.isArray(data.items)) pool.push(...data.items);

        // Objects keyed by id
        if (data.itemsById && typeof data.itemsById === 'object') {
          pool.push(...Object.values(data.itemsById));
        }

      } catch(_){}
    }

    // De-dup by id-ish
    const seen = new Set();
    const unique = [];
    for (const item of pool){
      const id = item?.id ?? item?.tmdbId ?? item?.imdbId ?? item?.slug ?? JSON.stringify(item).slice(0,50);
      if (seen.has(id)) continue;
      seen.add(id);
      unique.push(item);
    }
    return unique;
  }

  function mapItem(item){
    if (!item) return null;
    const id = item.id ?? item.tmdbId ?? item.imdbId ?? ('x_'+Math.random().toString(36).slice(2));
    const title = item.title ?? item.name ?? item.original_title ?? item.original_name ?? 'Untitled';
    const poster_path = item.poster_path ?? item.posterPath ?? item.poster_url ?? item.image ?? item.backdrop_path ?? '';
    // store as posterPath to keep our curated rows generic
    return { id, title, posterPath: poster_path, date: parseDate(item.release_date || item.first_air_date || item.addedAt || item.date) };
  }

  function pickEvery(arr, step){
    const out = [];
    for (let i=0;i<arr.length;i+=step) out.push(arr[i]);
    return out;
  }

  function byRecent(arr){
    return [...arr].sort((a,b) => (b.date||0) - (a.date||0));
  }

  function parseDate(v){
    if (!v) return 0;
    const t = Date.parse(v);
    return isNaN(t) ? 0 : t;
  }

  function sampleItems(){
    // Super small, no external URLs — posters left blank intentionally
    return [
      { id: 9001, title: 'The Last Sentinel', posterPath: '' },
      { id: 9002, title: 'Neon Harbor', posterPath: '' },
      { id: 9003, title: 'Echoes of Tomorrow', posterPath: '' },
      { id: 9004, title: 'Midnight Runway', posterPath: '' },
      { id: 9005, title: 'Orbit City', posterPath: '' },
      { id: 9006, title: 'Paper Suns', posterPath: '' },
      { id: 9007, title: 'Signal Lost', posterPath: '' },
      { id: 9008, title: 'Autumn\'s Gate', posterPath: '' },
      { id: 9009, title: 'Silver Valley', posterPath: '' },
      { id: 9010, title: 'Static / Noise', posterPath: '' },
      { id: 9011, title: 'Harbor Lights', posterPath: '' },
      { id: 9012, title: 'Blue Meridian', posterPath: '' },
      { id: 9013, title: 'City of Glass', posterPath: '' },
      { id: 9014, title: 'Northern Line', posterPath: '' },
    ];
  }
})();
