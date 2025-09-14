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

  console.log('🌱 TMDB Seeder: Starting...', { API_KEY: API_KEY ? `${API_KEY.slice(0,4)}...` : 'none' });
  
  // Force clear all curated data for fresh start
  console.log('🌱 TMDB Seeder: Clearing all curated data for fresh start');
  localStorage.removeItem('curated:trending');
  localStorage.removeItem('curated:staff');
  localStorage.removeItem('curated:new');
  localStorage.removeItem('flicklet:seed:v1');

  // If curated keys exist and not stale, bail early
  if (!needsSeed()) {
    console.log('🌱 TMDB Seeder: Keys exist and fresh, skipping');
    return;
  }

  // No key? Don't crash; just skip quietly.
  if (!API_KEY || API_KEY === 'YOUR_TMDB_API_KEY_HERE') { 
    console.log('🔑 TMDB API key not found - skipping TMDB seeding');
    console.log('   Check: window.__TMDB_API_KEY__, window.TMDB_CONFIG.apiKey, or window.TMDB_API_KEY');
    touchStamp(); 
    return; 
  }
  
  console.log('🌱 TMDB Seeder: Proceeding with seeding...');

  // Kick off (non-blocking). We intentionally ignore the returned promise.
  seed().catch(() => { /* ignore */ });
  
  // Expose globally for language refresh
  window.seedCuratedData = async function(lang) {
    const langCode = lang === 'es' ? 'es-ES' : 'en-US';
    console.log('🌱 Re-seeding curated data for language:', langCode);
    return seed(langCode);
  };

  // ---------- helpers ----------
  function needsSeed(){
    const stamp = safeJSON(localStorage.getItem(STAMP_KEY)) || {};
    const fresh = typeof stamp.ts === 'number' && (Date.now() - stamp.ts) < TTL_MS;

    const trending = localStorage.getItem('curated:trending');
    const staff = localStorage.getItem('curated:staff');
    const newData = localStorage.getItem('curated:new');
    
    const missingAny = !trending || !staff || !newData;
    
    console.log('🌱 Seeder needsSeed check:', {
      trending: trending ? `${trending.length} chars` : 'missing',
      staff: staff ? `${staff.length} chars` : 'missing', 
      newData: newData ? `${newData.length} chars` : 'missing',
      fresh,
      missingAny,
      shouldSeed: missingAny || !fresh
    });

    return missingAny || !fresh;
  }

  function touchStamp(){
    try { localStorage.setItem(STAMP_KEY, JSON.stringify({ ts: Date.now() })); } catch(_){}
  }

  async function seed(lang = 'en-US'){
    console.log('🌱 Seeder: Starting seed process...', { language: lang });
    
    try {
      // Fetch trending TV and Movies (week). You can switch to /day if you prefer.
      console.log('🌱 Seeder: Fetching from TMDB...');
      const [tv, mv] = await Promise.all([
        fetchJSON(`https://api.themoviedb.org/3/trending/tv/week?api_key=${API_KEY}&language=${lang}`),
        fetchJSON(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}&language=${lang}`)
      ]);

      console.log('🌱 Seeder: TMDB response:', { tv: tv?.results?.length || 0, mv: mv?.results?.length || 0 });

      const tvItems = Array.isArray(tv?.results) ? tv.results : [];
      const mvItems = Array.isArray(mv?.results) ? mv.results : [];
      const pool = [...tvItems, ...mvItems];
      
      console.log('🌱 Seeder: Total items collected:', pool.length);

    // Store the complete TMDB data structure for curated rows
    const normalized = pool.map(n => ({
      ...n, // Keep all original TMDB data
      title: n.title || n.name || 'Untitled',
      posterPath: n.poster_path || n.backdrop_path || '',
      date: parseDate(n.release_date || n.first_air_date)
    })).filter(x => x && x.id);

    // Buckets
    const trending = normalized.slice(0, 18);             // top slice
    const staff    = pickSpread(normalized, 6, 18, 8);    // 8 spaced picks from next slice
    const fresh    = [...normalized].sort((a,b)=> (b.date||0)-(a.date||0)).slice(0, 12);

    // Write if we have data (always overwrite if we have fresh data)
    if (trending.length) {
      localStorage.setItem('curated:trending', JSON.stringify(trending));
      console.log('🌱 Seeder: Saved trending data:', trending.length, 'items');
    }
    if (staff.length) {
      localStorage.setItem('curated:staff', JSON.stringify(staff));
      console.log('🌱 Seeder: Saved staff data:', staff.length, 'items');
    }
    if (fresh.length) {
      localStorage.setItem('curated:new', JSON.stringify(fresh));
      console.log('🌱 Seeder: Saved new data:', fresh.length, 'items');
    }
    
    console.log('🌱 Seeder: Seed process completed successfully');
    touchStamp();
    
    } catch (error) {
      console.error('🌱 Seeder: Error during seed process:', error);
      touchStamp(); // Still touch stamp to prevent retry loops
    }
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
