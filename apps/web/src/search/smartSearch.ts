/**
 * Smart search orchestrator
 * Purpose: Searches TMDB and ranks results using BM25-like scoring
 * Data Source: TMDB API responses
 * Update Path: Adjust anchors in smartSearch function
 * Dependencies: Uses computeSearchScore from rank.ts, mapTMDBToMediaItem from api.ts
 */

import type { MediaItem } from '../components/cards/card.types';
import type { SearchResult, SearchResultWithPagination } from './api';
import { mapTMDBToMediaItem } from './api';
import { computeSearchScore, tieBreak } from './rank';

type SearchType = 'all' | 'movies-tv' | 'people';

function qs(params: Record<string, any>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  }
  return p.toString();
}

async function fetchTMDB(path: string, params: Record<string, any>, signal?: AbortSignal) {
  const url = `/api/tmdb-proxy?${qs({ path, ...params })}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

function normalizeQuery(q: string): string {
  return q
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[''']/g, "'").replace(/["""]/g, '"')
    .trim();
}

function dedupeWithAllMeta<T extends { item: MediaItem; score: number }>(items: T[]): T[] {
  const seen = new Map<string, T>();
  for (const entry of items) {
    const key = `${entry.item.mediaType}:${entry.item.id}`;
    const existing = seen.get(key);
    if (!existing || (entry as any).score > (existing as any).score) {
      seen.set(key, entry);
    }
  }
  return Array.from(seen.values());
}

export async function smartSearch(
  queryRaw: string,
  page = 1,
  searchType: SearchType = 'all',
  opts?: { signal?: AbortSignal; language?: string; region?: string; debugSearch?: boolean }
): Promise<SearchResultWithPagination> {
  const language = opts?.language ?? 'en-US';
  const region   = opts?.region ?? 'US';
  const query    = normalizeQuery(queryRaw);
  
  // Check for debug flag in URL
  const urlParams = new URLSearchParams(window.location.search);
  const debugMode = opts?.debugSearch || urlParams.get('debugSearch') === '1';

  // People-only: simple flow
  if (searchType === 'people') {
    const json = await fetchTMDB('search/person', { query, page, include_adult: false, language, region }, opts?.signal);
    const items = (json.results ?? []).map(mapTMDBToMediaItem).filter(Boolean) as SearchResult[];
    return {
      items,
      page,
      totalPages: json.total_pages ?? 1
    };
  }

  // Get multi search results for the requested page
  const multiJson = await fetchTMDB('search/multi', {
    query, page, include_adult: false, language, region
  }, opts?.signal);
  
  let allItems = (multiJson.results ?? [])
    .map(mapTMDBToMediaItem)
    .filter(Boolean) as MediaItem[];

  // Also search TV and Movie endpoints for better coverage
  if (page === 1) {
    try {
      const [tvJson, movieJson] = await Promise.all([
        fetchTMDB('search/tv', { query, page: 1, include_adult: false, language, region }, opts?.signal).catch(() => ({ results: [] })),
        fetchTMDB('search/movie', { query, page: 1, include_adult: false, language, region }, opts?.signal).catch(() => ({ results: [] }))
      ]);
      
      const tvItems = ((tvJson.results ?? []) as any[]).map(mapTMDBToMediaItem).filter(Boolean) as MediaItem[];
      const movieItems = ((movieJson.results ?? []) as any[]).map(mapTMDBToMediaItem).filter(Boolean) as MediaItem[];
      
      allItems = [...allItems, ...tvItems, ...movieItems];
    } catch {
      // Fallback to multi-only
    }
  }

  // Score items to find anchor
  const allWithMeta = allItems.map(item => {
    const scored = computeSearchScore(query, {
      title: item.title || '',
      originalTitle: undefined,
      aliases: [],
      overview: item.synopsis,
      popularity: item.voteAverage ? item.voteAverage * 10 : undefined, // rough estimate
      voteAverage: item.voteAverage,
      voteCount: undefined,
      releaseYear: item.year ? parseInt(item.year) : undefined,
      mediaType: item.mediaType,
      originalLanguage: undefined,
      collectionName: undefined // Will be populated later if available
    }, { 
      preferType: searchType === 'movies-tv' ? 'all' : searchType,
      debugSearch: debugMode 
    });
    
    const meta = {
      tier: scored.titleSig.tier,
      voteCount: undefined as number | undefined,
      voteAverage: item.voteAverage,
      releaseYear: item.year ? parseInt(item.year) : undefined,
      popularity: item.voteAverage ? item.voteAverage * 10 : undefined,
      title: item.title
    };
    
    return { 
      item, 
      score: scored.score, 
      titleSig: scored.titleSig,
      meta,
      debug: scored.debug
    };
  });

  // Find anchor - use RAW titleSig.score, not the weighted total score
  console.log('🔍 Debug: Searching for anchor...');
  console.log('Query:', query);
  console.log('Total items found:', allWithMeta.length);
  
  // Show all candidates with their tier and score
  console.log('All candidates with scores:');
  allWithMeta.forEach((x, i) => {
    if (x.titleSig.score >= 0.80 || x.titleSig.tier !== 'overlap') {
      console.log(`  ${i}. "${x.item.title}" (${x.item.year || '?'}) - tier: ${x.titleSig.tier}, titleSig: ${x.titleSig.score.toFixed(3)}, total: ${x.score.toFixed(3)}`);
    }
  });
  
  // Find canonical candidates for potential pinning
  const exactCandidates = allWithMeta.filter(x => x.titleSig.tier === 'exact' && x.score > 0);
  
  if (debugMode && exactCandidates.length > 0) {
    console.log(`Found ${exactCandidates.length} exact matches for pinning consideration`);
    exactCandidates.slice(0, 5).forEach(x => {
      console.log(`  - "${x.item.title}" (${x.item.year}) - score: ${x.score.toFixed(2)}`);
    });
  }
  
  // Disable anchor chaos - let canonical pinning handle promotion
  // (_anchor was removed - no longer needed)
  
  // Fetch similar/recommendations if we have exact matches
  let extras: MediaItem[] = [];
  if (exactCandidates.length > 0) {
    const bestMatch = exactCandidates.sort((a, b) => b.score - a.score)[0];
    if (bestMatch.item.mediaType !== 'person') {
      try {
        const [simJson, recJson] = await Promise.all([
          fetchTMDB(`${bestMatch.item.mediaType}/${bestMatch.item.id}/similar`, { page: 1, language }, opts?.signal).catch(() => ({ results: [] })),
          fetchTMDB(`${bestMatch.item.mediaType}/${bestMatch.item.id}/recommendations`, { page: 1, language }, opts?.signal).catch(() => ({ results: [] }))
        ]);
        
        const sim = ((simJson.results ?? []) as any[]).map(mapTMDBToMediaItem).filter(Boolean) as MediaItem[];
        const rec = ((recJson.results ?? []) as any[]).map(mapTMDBToMediaItem).filter(Boolean) as MediaItem[];
        extras = [...sim, ...rec];
        
        // Score extras and add to allWithMeta
        const extrasWithMeta = extras.map(item => {
          const scored = computeSearchScore(query, {
            title: item.title || '',
            originalTitle: undefined,
            aliases: [],
            overview: item.synopsis,
            popularity: item.voteAverage ? item.voteAverage * 10 : undefined,
            voteAverage: item.voteAverage,
            voteCount: undefined,
            releaseYear: item.year ? parseInt(item.year) : undefined,
            mediaType: item.mediaType,
            originalLanguage: undefined,
            collectionName: undefined
          }, { 
            preferType: searchType === 'movies-tv' ? 'all' : searchType,
            debugSearch: debugMode
          });
          
          const meta = {
            tier: scored.titleSig.tier,
            voteCount: undefined as number | undefined,
            voteAverage: item.voteAverage,
            releaseYear: item.year ? parseInt(item.year) : undefined,
            popularity: item.voteAverage ? item.voteAverage * 10 : undefined,
            title: item.title
          };
          
          return { 
            item, 
            score: scored.score, 
            titleSig: scored.titleSig,
            meta,
            debug: scored.debug
          };
        });
        
        allWithMeta.push(...extrasWithMeta);
      } catch {
        // Extras are optional
      }
    }
  }

  // Dedupe keeping highest-scored duplicate - preserve all metadata
  const deduped = dedupeWithAllMeta(allWithMeta);
  
  // Sort by score with tie-breaking - metadata already preserved
  const withMeta = deduped;
  
  const ranked = withMeta.sort((a, b) => {
    const scoreDiff = b.score - a.score;
    // More lenient threshold for franchise tie-breaking
    // This allows the tie-breaker to prefer popular sequels over originals
    if (Math.abs(scoreDiff) < 0.05) { // essentially equal
      return tieBreak(a.meta, b.meta, query);
    }
    return scoreDiff;
  });

  // Debug logging for top 20 results in table format
  if (debugMode) {
    console.log('\n📊 SEARCH RANKING DEBUG - Top 20 Results');
    console.log('Query:', queryRaw);
    console.log('═'.repeat(120));
    
    const tableData = ranked.slice(0, 20).map((x, i) => {
      const debugInfo = (x as any).debug || {};
      return {
        rank: i + 1,
        title: `"${x.item.title.substring(0, 40)}"`,
        year: x.item.year || '?',
        score: x.score.toFixed(1),
        tier: x.meta.tier,
        ...(Object.keys(debugInfo).length > 0 ? {
          exact: debugInfo.titleExact || 0,
          prefix: debugInfo.titlePrefix || 0,
          contains: debugInfo.titleContains || 0,
          pop: (debugInfo.popBonus || 0).toFixed(1),
          recency: (debugInfo.recencyBonus || 0).toFixed(1)
        } : {})
      };
    });
    
    console.table(tableData);
    console.log('');
    
    // Show pinning status if applicable
    const exacts = ranked.filter(x => x.titleSig.tier === 'exact');
    if (exacts.length > 0) {
      console.log(`✅ Canonical pinning active: ${exacts.length} exact match(es) found`);
    }
  }

  console.log('📊 Final ranked top 5:', ranked.slice(0, 5).map((x, i) => ({
    rank: i + 1,
    title: x.item.title,
    tier: x.meta.tier,
    score: x.score
  })));

  // Canonical pinning: promote the highest-scoring exact match to rank 1
  const exactInRanked = ranked.filter(x => x.titleSig.tier === 'exact');
  if (exactInRanked.length > 0) {
    const highestExact = exactInRanked.reduce((best, current) => current.score > best.score ? current : best);
    const exactIndex = ranked.indexOf(highestExact);
    
    if (exactIndex > 0) {
      console.log(`📌 PINNED: "${highestExact.item.title}" (${highestExact.item.year}) to rank 1 (was rank ${exactIndex + 1})`);
      ranked.splice(exactIndex, 1);
      ranked.unshift(highestExact);
    } else {
      console.log(`✅ "${highestExact.item.title}" already at rank 1`);
    }
  } else {
    // Log when no exact match found (might indicate search query doesn't match any titles exactly)
    console.log(`⚠️ No exact title match found for query: "${query}"`);
  }

  const finalRanked = ranked.map(x => x.item);
  

  // Apply type filter
  const filtered = searchType === 'movies-tv'
    ? finalRanked.filter(r => r.mediaType === 'tv' || r.mediaType === 'movie')
    : finalRanked;

  return {
    items: filtered,
    page,
    totalPages: multiJson.total_pages ?? 1
  };
}
