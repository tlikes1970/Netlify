/* ========== tmdb-seed.js ==========
   First-time (and periodic) seeding of curated rows from TMDB Trending.
   - Seeds localStorage keys: curated:trending, curated:staff, curated:new
   - Only runs if keys are missing or stale by TTL.
   - Requires TMDB v3 API key set as window.__TMDB_API_KEY__ (from meta or server).
*/
(function(){
  const API_KEY = (typeof window !== 'undefined' && window.__TMDB_API_KEY__) || 
                  (window.TMDB_CONFIG && window.TMDB_CONFIG.apiKey) || 
                  (window.TMDB_API_KEY) || '';
  const TTL_MS = 24 * 60 * 60 * 1000; // 24h
  const STAMP_KEY = 'flicklet:seed:v1';  // stores {"ts": <ms>}

  // If curated keys exist and not stale, bail early
  if (!needsSeed()) return;

  // No key? Don't crash; just skip quietly.
  if (!API_KEY || API_KEY === 'YOUR_TMDB_API_KEY_HERE') { 
    console.log('🔑 TMDB API key not found - skipping TMDB seeding');
    console.log('   Check: window.__TMDB_API_KEY__, window.TMDB_CONFIG.apiKey, or window.TMDB_API_KEY');
    touchStamp(); 
    return; 
  }

  // Kick off (non-blocking). We intentionally ignore the returned promise.
  seed().catch(() => { /* ignore */ });

  // ---------- helpers ----------
  function needsSeed(){
    const stamp = safeJSON(localStorage.getItem(STAMP_KEY)) || {};
    const fresh = typeof stamp.ts === 'number' && (Date.now() - stamp.ts) < TTL_MS;

    const missingAny =
      !localStorage.getItem('curated:trending') ||
      !localStorage.getItem('curated:staff') ||
      !localStorage.getItem('curated:new');

    return missingAny || !fresh;
  }

  function touchStamp(){
    try { localStorage.setItem(STAMP_KEY, JSON.stringify({ ts: Date.now() })); } catch(_){}
  }

  async function seed(){
    // Fetch trending TV and Movies (week). You can switch to /day if you prefer.
    const [tv, mv] = await Promise.all([
      fetchJSON(`https://api.themoviedb.org/3/trending/tv/week?api_key=${API_KEY}&language=en-US`),
      fetchJSON(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}&language=en-US`)
    ]);

    const tvItems = Array.isArray(tv?.results) ? tv.results : [];
    const mvItems = Array.isArray(mv?.results) ? mv.results : [];
    const pool = [...tvItems, ...mvItems];

    // Normalize into {id, title, posterPath, backdrop_path, date}
    const normalized = pool.map(n => ({
      id: n.id,
      title: n.title || n.name || 'Untitled',
      posterPath: n.poster_path || n.backdrop_path || '',
      backdrop_path: n.backdrop_path || '',
      date: parseDate(n.release_date || n.first_air_date)
    })).filter(x => x && x.id);

    // Buckets
    const trending = normalized.slice(0, 18);             // top slice
    const staff    = pickSpread(normalized, 6, 18, 8);    // 8 spaced picks from next slice
    const fresh    = [...normalized].sort((a,b)=> (b.date||0)-(a.date||0)).slice(0, 12);

    // Write if we have data (non-destructive if user already has)
    if (trending.length && !localStorage.getItem('curated:trending')) {
      localStorage.setItem('curated:trending', JSON.stringify(trending));
    }
    if (staff.length && !localStorage.getItem('curated:staff')) {
      localStorage.setItem('curated:staff', JSON.stringify(staff));
    }
    if (fresh.length && !localStorage.getItem('curated:new')) {
      localStorage.setItem('curated:new', JSON.stringify(fresh));
    }
    touchStamp();
  }

  function pickSpread(arr, startIdx, maxIdx, count){
    const slice = arr.slice(startIdx, maxIdx);
    if (!slice.length) return [];
    const step = Math.max(1, Math.floor(slice.length / count));
    const out = [];
    for (let i = 0; i < slice.length && out.length < count; i += step) out.push(slice[i]);
    return out;
  }

  function parseDate(s){
    const t = Date.parse(s || '');
    return isNaN(t) ? 0 : t;
  }

  async function fetchJSON(url){
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function safeJSON(raw){
    try { return JSON.parse(raw); } catch(_){ return null; }
  }
})();
