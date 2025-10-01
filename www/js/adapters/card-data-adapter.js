// Card Data Adapter - Centralized data transformation
(function() {
  'use strict';
  
  const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';
  const PLACEHOLDER_SVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDEyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMGYxMTE3Ii8+CjxwYXRoIGQ9Ik01NiA2MEw2NCA2OEw3MiA2MEw4MCA2OEw4OCA2MEw5NiA2OEwxMDQgNjBMMTEyIDY4VjEwMEw5NiAxMTJMODAgMTAwTDY0IDExMkw0OCAxMDBWNjhaIiBmaWxsPSIjMjQyYTMzIi8+Cjx0ZXh0IHg9IjYwIiB5PSIxNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2E5YjNjMSI+Tm8gUG9zdGVyPC90ZXh0Pgo8L3N2Zz4K';

  function resolvePosterUrl(poster_path) {
    if (!poster_path) return PLACEHOLDER_SVG;
    if (poster_path.startsWith('http') || poster_path.startsWith('data:') || poster_path.startsWith('blob:')) return poster_path;
    if (poster_path.startsWith('/')) return `${TMDB_IMG}${poster_path}`;
    return PLACEHOLDER_SVG;
  }

  function toCardProps(raw) {
    // Accept TMDB search result, detail, or our stored item
    const id = String(raw.id ?? raw.tmdbId ?? raw.external_id ?? '');
    const mediaType = raw.media_type || raw.type || (raw.first_air_date ? 'tv' : 'movie') || 'movie';
    const title = raw.title || raw.name || raw.original_title || raw.original_name || 'Unknown';
    const poster = resolvePosterUrl(raw.poster || raw.posterUrl || raw.poster_path || null);
    const releaseDate = raw.release_date || raw.first_air_date || '';
    const overview = raw.overview || '';

    return { id, mediaType, title, poster, releaseDate, overview, __raw: raw };
  }

  // Expose globally
  window.toCardProps = toCardProps;
  window.resolvePosterUrl = resolvePosterUrl;
  
  console.log('✅ Card data adapter loaded');
})();

