import type { MediaItem, MediaType } from '../components/cards/card.types';

const IMG = {
  poster: 'https://image.tmdb.org/t/p/w342', // adjust if you prefer a different size
};

export type SearchResult = MediaItem;

export async function searchMulti(
  query: string,
  page = 1,
  genre?: string | null,
  searchType: 'all' | 'movies-tv' | 'people' = 'all',
  opts?: { signal?: AbortSignal; language?: string; region?: string }
): Promise<SearchResult[]> {
  const language = opts?.language ?? 'en-US';
  const region   = opts?.region ?? 'US';
  const q = normalizeQuery(query);

  // optional year hint
  const year = /\b(19|20)\d{2}\b/.exec(q)?.[0];
  const qs = new URLSearchParams({
    path: searchType === 'people' ? 'search/person' : 'search/multi',
    query: q,
    page: String(page),
    include_adult: 'false',
    language,
    region,
    ...(year ? { year, first_air_date_year: year } : {})
  });

  const res = await fetch(`/.netlify/functions/tmdb-proxy?${qs.toString()}`, { signal: opts?.signal });
  if (!res.ok) throw new Error(`search failed: ${res.status}`);

  const json = await res.json();
  const results = Array.isArray(json.results) ? json.results : [];

  let filtered = results;
  if (searchType === 'movies-tv') filtered = results.filter((r: any) => r?.media_type === 'movie' || r?.media_type === 'tv');
  if (searchType === 'people')    filtered = results.filter((r: any) => r?.media_type === 'person' || r?.known_for);

  const mapped = filtered.map(mapTMDBToMediaItem).filter(Boolean) as SearchResult[];

  if (genre && genre !== 'All genres') {
    return mapped.filter((m: any) => Array.isArray(m.genre_ids) && m.genre_ids.includes(Number(genre)));
  }
  return mapped;
}

function normalizeQuery(q: string): string {
  return q
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[''']/g, "'").replace(/["""]/g, '"')       // smart quotes
    .replace(/[–—]/g, '-')                             // dashes
    .replace(/\s+/g, ' ')
    .trim();
}

function mapTMDBToMediaItem(r: any): MediaItem {
  const mediaType: MediaType = r.media_type;
  
  // Handle person results differently
  if (mediaType === 'person') {
    return {
      id: r.id,
      mediaType: 'person' as any, // We'll need to extend MediaType to include 'person'
      title: r.name,
      year: undefined,
      posterUrl: r.profile_path ? `https://image.tmdb.org/t/p/w342${r.profile_path}` : undefined,
      voteAverage: r.popularity, // Use popularity for people
      // @ts-ignore
      known_for: r.known_for || [],
      // @ts-ignore
      synopsis: r.known_for?.map((item: any) => item.title || item.name).join(', ') || '',
    } as MediaItem;
  }
  
  // Handle movie/tv results
  const title = mediaType === 'movie' ? r.title : r.name;
  const date = mediaType === 'movie' ? r.release_date : r.first_air_date;
  const year = date ? String(date).slice(0, 4) : undefined;
  const posterUrl = r.poster_path ? `${IMG.poster}${r.poster_path}` : undefined;
  return {
    id: r.id,
    mediaType,
    title,
    year,
    posterUrl,
    voteAverage: typeof r.vote_average === 'number' ? r.vote_average : undefined,
    // Keep raw genre_ids for optional client filter; safe to ignore in CardV2
    // @ts-ignore
    genre_ids: r.genre_ids,
    // Add synopsis from TMDB
    // @ts-ignore
    synopsis: r.overview || '',
  } as MediaItem;
}
