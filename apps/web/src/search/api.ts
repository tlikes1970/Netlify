import type { MediaItem, MediaType } from '../components/cards/card.types';

const IMG = {
  poster: 'https://image.tmdb.org/t/p/w342', // adjust if you prefer a different size
};

export type SearchResult = MediaItem;

export async function searchMulti(query: string, page = 1, genre?: string | null, searchType: 'all' | 'movies-tv' | 'people' = 'all'): Promise<SearchResult[]> {
  const url = `/.netlify/functions/tmdb-proxy?path=search/multi&query=${encodeURIComponent(query)}&page=${page}&media_type=multi&language=en-US`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`search failed: ${res.status}`);
  const json = await res.json();

  const results = Array.isArray(json.results) ? json.results : [];

  // Filter based on search type
  let filteredResults = results;
  if (searchType === 'movies-tv') {
    filteredResults = results.filter((r: any) => r && (r.media_type === 'movie' || r.media_type === 'tv'));
  } else if (searchType === 'people') {
    filteredResults = results.filter((r: any) => r && r.media_type === 'person');
  }
  // For 'all', we keep all results

  const mapped = filteredResults
    .map(mapTMDBToMediaItem)
    .filter(Boolean) as SearchResult[];

  // Optional genre filter (client-side); swap to server param later if needed
  if (genre && genre !== 'All genres') {
    // naive check based on TMDB genre_ids; you can enrich if you have a map
    return mapped.filter((m: any) => Array.isArray(m.genre_ids) && m.genre_ids.includes(Number(genre)));
  }

  return mapped;
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
