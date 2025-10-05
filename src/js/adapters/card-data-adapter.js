const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';
const PLACEHOLDER_SVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIg...'; // keep your existing base64

export function resolvePosterUrl(poster_path) {
  if (!poster_path) return PLACEHOLDER_SVG;
  if (poster_path.startsWith('http') || poster_path.startsWith('data:') || poster_path.startsWith('blob:')) return poster_path;
  if (poster_path.startsWith('/')) return `${TMDB_IMG}${poster_path}`;
  return PLACEHOLDER_SVG;
}

export function toCardProps(raw) {
  // Accept TMDB search result, detail, or our stored item
  const id = String(raw.id ?? raw.tmdbId ?? raw.external_id ?? '');
  const mediaType = raw.media_type || raw.type || (raw.first_air_date ? 'tv' : 'movie') || 'movie';
  const title = raw.title || raw.name || raw.original_title || raw.original_name || 'Unknown';
  const poster = resolvePosterUrl(raw.poster || raw.posterUrl || raw.poster_path || null);
  const releaseDate = raw.release_date || raw.first_air_date || '';
  const overview = raw.overview || '';

  return { id, mediaType, title, poster, releaseDate, overview, __raw: raw };
}





