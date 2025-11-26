import type { MediaItem } from '../components/cards/card.types';
import { get } from '../lib/tmdb';
import { normalizeQuery } from '../lib/string';
import { computeSearchScore } from './rank';


export type SearchResult = MediaItem;

export type SearchResultWithPagination = {
  items: SearchResult[];
  page: number;
  totalPages: number;
};

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

/**
 * Fetch full metadata from TMDB for a media item
 * This ensures all metadata fields are populated when adding from search
 */
export async function fetchFullMediaMetadata(item: MediaItem): Promise<Partial<MediaItem>> {
  try {
    const id = typeof item.id === 'string' ? parseInt(item.id) : item.id;
    if (!id || !item.mediaType || item.mediaType === 'person') {
      return {};
    }

    const endpoint = item.mediaType === 'movie' ? `/movie/${id}` : `/tv/${id}`;
    const data = await get(endpoint);

    // Extract common fields
    const title = item.mediaType === 'movie' ? data.title : data.name;
    const date = item.mediaType === 'movie' ? data.release_date : data.first_air_date;
    const year = date ? String(date).slice(0, 4) : undefined;
    const posterUrl = data.poster_path ? `https://image.tmdb.org/t/p/w342${data.poster_path}` : undefined;

    const metadata: Partial<MediaItem> = {
      title: title || item.title,
      year: year || item.year,
      releaseDate: date || item.releaseDate,
      posterUrl: posterUrl || item.posterUrl,
      voteAverage: typeof data.vote_average === 'number' ? data.vote_average : item.voteAverage,
      voteCount: typeof data.vote_count === 'number' ? data.vote_count : item.voteCount,
      synopsis: data.overview || item.synopsis || '',
      runtimeMins: data.runtime || item.runtimeMins,
    };

    // TV-specific fields
    if (item.mediaType === 'tv') {
      metadata.showStatus = data.status as 'Ended' | 'Returning Series' | 'In Production' | 'Canceled' | 'Planned' | undefined;
      metadata.lastAirDate = data.last_air_date || item.lastAirDate;
      
      // Get networks
      const networks = data.networks?.map((network: any) => network.name).filter(Boolean) || [];
      if (networks.length > 0) {
        metadata.networks = networks;
      }
    } else {
      // Movie-specific fields
      const productionCompanies = data.production_companies?.map((company: any) => company.name).filter(Boolean) || [];
      if (productionCompanies.length > 0) {
        metadata.productionCompanies = productionCompanies;
      }
    }

    console.log(`✅ Fetched full metadata for ${item.mediaType}:${id}`, {
      title: metadata.title,
      year: metadata.year,
      hasSynopsis: !!metadata.synopsis,
      hasPoster: !!metadata.posterUrl,
    });

    return metadata;
  } catch (error) {
    console.warn(`⚠️ Failed to fetch full metadata for ${item.mediaType}:${item.id}:`, error);
    // Return empty object on error - will use existing item data
    return {};
  }
}

export async function searchMulti(
  query: string,
  page = 1,
  genre?: number | null,
  searchType: 'all' | 'movies-tv' | 'people' = 'all',
  opts?: { signal?: AbortSignal; language?: string; region?: string }
): Promise<SearchResultWithPagination> {
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
  const totalPages = json.total_pages ?? 1;

  let filtered = results;
  if (searchType === 'movies-tv') {
    // Filter multi-search results to only movies and TV shows
    filtered = results.filter((r: any) => r?.media_type === 'movie' || r?.media_type === 'tv');
  }
  // Note: No filtering needed for 'people' - search/person endpoint already returns only people
  // (and those results don't have media_type field, so filtering would return empty)

  const mapped = filtered.map(mapTMDBToMediaItem).filter(Boolean) as SearchResult[];

  const finalResults = genre
    ? mapped.filter((m: any) => Array.isArray(m.genre_ids) && m.genre_ids.includes(genre))
    : mapped;

  return {
    items: finalResults,
    page,
    totalPages
  };
}

// normalizeQuery is now imported from '../lib/string'

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
  const releaseDate = date || undefined; // Store full ISO date string for precise recency calculation
  const posterUrl = r.poster_path ? `https://image.tmdb.org/t/p/w342${r.poster_path}` : undefined;

  const item: MediaItem = {
    id: r.id,
    mediaType,
    title: safeTitle,
    year,
    releaseDate, // Add releaseDate for precise recency calculation
    posterUrl,
    voteAverage: typeof r.vote_average === 'number' ? r.vote_average : undefined,
    voteCount: typeof r.vote_count === 'number' ? r.vote_count : undefined,
    synopsis: r.overview || '',
    showStatus: mediaType === 'tv' ? r.status : undefined,
    lastAirDate: mediaType === 'tv' ? r.last_air_date : undefined,
  };
  
  // Store genre_ids separately (not part of MediaItem type but used for filtering)
  (item as any).genre_ids = r.genre_ids;
  
  return item;
}

export async function discoverByGenre(
  genre: number,
  page = 1,
  opts?: { signal?: AbortSignal; language?: string; region?: string }
): Promise<SearchResultWithPagination> {
  const language = opts?.language ?? 'en-US';
  const region = opts?.region ?? 'US';

  const qsBase = (params: Record<string, any>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
    }
    return p.toString();
  };

  const fetchTMDB = async (path: string, params: Record<string, any>) => {
    const res = await fetch(`/api/tmdb-proxy?${qsBase({ path, ...params })}`, {
      signal: opts?.signal,
    });
    if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
    return res.json();
  };

  // Fetch movies and TV for the given genre using discover endpoints
  const [movieJson, tvJson] = await Promise.all([
    fetchTMDB('discover/movie', {
      with_genres: genre,
      page,
      include_adult: false,
      sort_by: 'popularity.desc',
      language,
      region,
    }),
    fetchTMDB('discover/tv', {
      with_genres: genre,
      page,
      include_adult: false,
      sort_by: 'popularity.desc',
      language,
      region,
    }),
  ]);

  const raw: any[] = [
    ...(Array.isArray(movieJson.results) ? movieJson.results.map((r: any) => ({ ...r, media_type: 'movie' })) : []),
    ...(Array.isArray(tvJson.results) ? tvJson.results.map((r: any) => ({ ...r, media_type: 'tv' })) : []),
  ];

  const mapped = raw
    .map(mapTMDBToMediaItem)
    .filter(Boolean) as SearchResult[];

  // For genre-only search we have no user text query, so pass empty string into computeSearchScore
  // and let popularity/recency/votes drive ranking.
  const ranked = mapped
    .map(item => {
      const scored = computeSearchScore('', {
        title: item.title || '',
        overview: item.synopsis,
        popularity: item.voteAverage ? item.voteAverage * 10 : undefined,
        voteAverage: item.voteAverage,
        voteCount: item.voteCount,
        releaseYear: item.year ? parseInt(item.year) : undefined,
        releaseDate: item.releaseDate || undefined,
        mediaType: item.mediaType as 'movie' | 'tv',
        originalLanguage: undefined,
        collectionName: undefined,
      });
      return { item, score: scored.score };
    })
    .sort((a, b) => b.score - a.score)
    .map(x => x.item);

  const totalPages = Math.max(
    movieJson.total_pages ?? 1,
    tvJson.total_pages ?? 1
  );

  return {
    items: ranked,
    page,
    totalPages,
  };
}
