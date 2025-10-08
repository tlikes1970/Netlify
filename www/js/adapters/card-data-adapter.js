// Card Data Adapter - Centralized data transformation
(function() {
  'use strict';
  
  const TMDB_IMG = 'https://image.tmdb.org/t/p/w200';
  const PLACEHOLDER_SVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDEyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMGYxMTE3Ii8+CjxwYXRoIGQ9Ik01NiA2MEw2NCA2OEw3MiA2MEw4MCA2OEw4OCA2MEw5NiA2OEwxMDQgNjBMMTEyIDY4VjEwMEw5NiAxMTJMODAgMTAwTDY0IDExMkw0OCAxMDBWNjhaIiBmaWxsPSIjMjQyYTMzIi8+Cjx0ZXh0IHg9IjYwIiB5PSIxNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2E5YjNjMSI+Tm8gUG9zdGVyPC90ZXh0Pgo8L3N2Zz4K';

  function resolvePosterUrl(poster_path) {
    if (!poster_path || poster_path.trim() === '') return PLACEHOLDER_SVG;
    if (poster_path.startsWith('http') || poster_path.startsWith('data:') || poster_path.startsWith('blob:')) return poster_path;
    if (poster_path.startsWith('/')) return `${TMDB_IMG}${poster_path}`;
    return PLACEHOLDER_SVG;
  }

  function toCardProps(raw) {
    // Accept TMDB search result, detail, or our stored item
    const id = String(raw.id ?? raw.tmdbId ?? raw.external_id ?? '');
    // Determine media type - use item's media_type if available, otherwise determine from TMDB data
    let mediaType = raw.media_type || raw.mediaType || raw.type;
    if (!mediaType) {
      // Check if it's a TV show by looking for TV-specific fields
      if (raw.first_air_date && raw.number_of_episodes) {
        mediaType = 'tv';
      } else if (raw.release_date && !raw.first_air_date) {
        mediaType = 'movie';
      } else {
        // Fallback: assume movie if uncertain
        mediaType = 'movie';
      }
    }
    const title = raw.title || raw.name || raw.original_title || raw.original_name || 'Unknown';
    const poster = resolvePosterUrl(raw.poster || raw.posterUrl || raw.poster_path || raw.posterPath || null);
    const releaseDate = raw.release_date || raw.first_air_date || '';
    const overview = raw.overview || '';
    
    // Normalize additional fields to remove "Unknown" values
    // Extract genres - prefer first genre, but handle multiple
    let genre = raw.genre || '';
    if (!genre && raw.genres && Array.isArray(raw.genres)) {
      genre = raw.genres.slice(0, 2).map(g => g.name).join(', ');
    }
    const seasonEpisode = raw.seasonEpisode || raw.sxxExx || '';
    const nextAirDate = raw.next_episode_air_date || raw.nextAirDate || raw.next_air_date || '';
    const runtime = raw.runtime || raw.episode_run_time || '';
    const whereToWatch = raw.whereToWatch || raw.provider || '';
    const curatorBlurb = raw.curatorBlurb || raw.description || '';
    const userRating = raw.userRating || raw.rating || 0;
    const progress = raw.progress || '';
    const badges = raw.badges || [];
    const tmdbId = raw.tmdbId || raw.id;

    return { 
      id, 
      mediaType, 
      title, 
      poster, 
      releaseDate, 
      overview,
      genre,
      seasonEpisode,
      nextAirDate,
      runtime,
      whereToWatch,
      curatorBlurb,
      userRating,
      progress,
      badges,
      tmdbId,
      __raw: raw 
    };
  }

  // Expose globally
  window.toCardProps = toCardProps;
  window.resolvePosterUrl = resolvePosterUrl;
  
  console.log('✅ Card data adapter loaded');
})();

