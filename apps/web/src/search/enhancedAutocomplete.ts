/**
 * Process: Enhanced Autocomplete with Relevance Scoring
 * Purpose: Fetch and rank autocomplete suggestions using predictive relevance scoring
 * Data Source: TMDB API responses
 * Update Path: Adjust scoring weights in rankCandidates
 * Dependencies: searchRelevance, Library
 */

import type { MediaItem } from '../components/cards/card.types';
import { rankCandidates } from '../lib/searchRelevance';

async function fetchTMDB(path: string, params: Record<string, any>, signal?: AbortSignal) {
  const qs = new URLSearchParams({ path, ...params });
  const url = `/api/tmdb-proxy?${qs.toString()}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

/**
 * Fetch autocomplete suggestions with enhanced relevance scoring
 * Returns up to 100 candidates, then ranks and returns top 10
 */
export async function fetchEnhancedAutocomplete(
  query: string,
  signal?: AbortSignal,
  enabledProviders: string[] = []
): Promise<MediaItem[]> {
  if (!query.trim() || query.length < 2) {
    return [];
  }

  try {
    // Fetch from TMDB multi search (limit to 100 for performance)
    const json = await fetchTMDB('search/multi', {
      query: query.trim(),
      page: 1,
      include_adult: false,
      language: 'en-US',
      region: 'US',
    }, signal);

    const results = Array.isArray(json.results) ? json.results.slice(0, 100) : [];
    
    // Map to MediaItem format
    const candidates = results
      .map((r: any) => {
        // Convert TMDB result to MediaItem format for scoring
        const mediaType = r.media_type || (r.first_air_date ? 'tv' : r.release_date ? 'movie' : 'person');
        
        if (mediaType === 'person') {
          // Skip people for now in autocomplete
          return null;
        }
        
        const title = mediaType === 'movie' ? r.title : r.name;
        const date = mediaType === 'movie' ? r.release_date : r.first_air_date;
        const year = date ? String(date).slice(0, 4) : undefined;
        
        const item: MediaItem = {
          id: String(r.id),
          title: title || 'Untitled',
          mediaType: mediaType as 'movie' | 'tv',
          year,
          posterUrl: r.poster_path ? `https://image.tmdb.org/t/p/w185${r.poster_path}` : undefined,
          synopsis: r.overview,
          voteAverage: r.vote_average,
        };
        
        // Add raw TMDB data for scoring
        (item as any).vote_count = r.vote_count;
        (item as any).popularity = r.popularity;
        
        return item;
      })
      .filter(Boolean) as MediaItem[];

    // Rank candidates using relevance scoring
    const ranked = rankCandidates(query, candidates, enabledProviders, 10);
    
    return ranked;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.warn('Enhanced autocomplete fetch failed:', error);
    return [];
  }
}


