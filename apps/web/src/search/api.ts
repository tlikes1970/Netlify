import type { MediaItem } from '../components/cards/card.types';
import { get } from '../lib/tmdb';


export type SearchResult = MediaItem;

// Function to fetch network/production company information from TMDB detailed endpoints
export async function fetchNetworkInfo(id: number, mediaType: 'movie' | 'tv'): Promise<{ networks?: string[]; productionCompanies?: string[] }> {
  const maxRetries = 2;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const endpoint = mediaType === 'movie' ? `/movie/${id}` : `/tv/${id}`;
      const data = await get(endpoint);
      
      if (mediaType === 'tv') {
        // For TV shows, get networks
        const networks = data.networks?.map((network: any) => network.name).filter(Boolean) || [];
        if (networks.length > 0) {
          return { networks };
        }
      } else {
        // For movies, get production companies
        const productionCompanies = data.production_companies?.map((company: any) => company.name).filter(Boolean) || [];
        if (productionCompanies.length > 0) {
          return { productionCompanies };
        }
      }
      
      // If we got data but no networks/companies, that's still a successful response
      return {};
      
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt} failed to fetch network info for ${mediaType}:${id}:`, error);
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }
  
  // If all retries failed, log the final error but don't throw
  console.error(`All ${maxRetries} attempts failed to fetch network info for ${mediaType}:${id}:`, lastError);
  return {};
}

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

  const res = await fetch(`/api/tmdb-proxy?${qs.toString()}`, { signal: opts?.signal });
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

export function mapTMDBToMediaItem(r: any): MediaItem {
  const mediaType = r.media_type ?? (r.first_air_date ? 'tv' : r.release_date ? 'movie' : r.known_for ? 'person' : 'movie');

  if (mediaType === 'person') {
    const name = typeof r.name === 'string' ? r.name : '';
    return {
      id: r.id,
      mediaType: 'person' as any,
      title: name,
      year: undefined,
      posterUrl: r.profile_path ? `https://image.tmdb.org/t/p/w342${r.profile_path}` : undefined,
      voteAverage: r.popularity,
      known_for: r.known_for || [],
      synopsis: r.known_for?.map((it: any) => it.title || it.name).join(', ') || '',
    } as MediaItem;
  }

  const rawTitle = mediaType === 'movie' ? r.title : r.name;
  const safeTitle = (() => {
    if (typeof rawTitle === 'string' && rawTitle.trim() && rawTitle !== String(r.id)) {
      return rawTitle.trim();
    }
    return 'Untitled';
  })();
  
  const date  = mediaType === 'movie' ? r.release_date : r.first_air_date;
  const year  = date ? String(date).slice(0, 4) : undefined;
  const posterUrl = r.poster_path ? `https://image.tmdb.org/t/p/w342${r.poster_path}` : undefined;

  return {
    id: r.id,
    mediaType,
    title: safeTitle,
    year,
    posterUrl,
    voteAverage: typeof r.vote_average === 'number' ? r.vote_average : undefined,
    genre_ids: r.genre_ids,
    synopsis: r.overview || '',
    showStatus: mediaType === 'tv' ? r.status : undefined,
    lastAirDate: mediaType === 'tv' ? r.last_air_date : undefined,
  } as MediaItem;
}
