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
import { computeSearchScore, tieBreak, tokensLower } from './rank';
import { normalizeQuery } from '../lib/string';

type SearchType = 'all' | 'movies-tv' | 'people';

// LRU cache for TMDB search/tv and search/movie calls (5 min TTL)
class LRUCache<K, V> {
  private cache = new Map<K, { value: V; expires: number }>();
  private maxSize: number;
  private ttl: number; // TTL in milliseconds

  constructor(maxSize: number, ttlMs: number) {
    this.maxSize = maxSize;
    this.ttl = ttlMs;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, { value, expires: Date.now() + this.ttl });
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

const tmdbCache = new LRUCache<string, any>(100, 5 * 60 * 1000); // 5 min TTL
let cacheHits = 0;
let cacheMisses = 0;

export function getCacheStats() {
  return {
    hits: cacheHits,
    misses: cacheMisses,
    hitRate: cacheHits + cacheMisses > 0 ? cacheHits / (cacheHits + cacheMisses) : 0,
    ...tmdbCache.getStats()
  };
}

function qs(params: Record<string, any>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  }
  return p.toString();
}

// Circuit breaker for TMDB with timeout and retry
async function fetchTMDBWithCircuitBreaker(
  path: string, 
  params: Record<string, any>, 
  signal?: AbortSignal,
  maxRetries = 2
): Promise<any> {
  const url = `/api/tmdb-proxy?${qs({ path, ...params })}`;
  const timeoutMs = 4000; // 4 second timeout
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), timeoutMs);
      });
      
      // Race fetch against timeout
      const fetchPromise = fetch(url, { signal });
      const res = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`${path} failed: ${res.status} ${errorText || res.statusText}`);
      }
      
      const json = await res.json();
      // Check if TMDB returned an error in the response
      if (json.status_code && json.status_message) {
        throw new Error(`TMDB API error: ${json.status_message}`);
      }
      
      return json;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const isAbortError = error instanceof Error && error.name === 'AbortError';
      
      if (isAbortError || isLastAttempt) {
        // On final failure, log and return empty results gracefully
        console.warn('[TMDB] breaker open', { query: params.query, path, err: error });
        if (isLastAttempt) {
          // Return empty results instead of throwing
          return { results: [], total_pages: 1 };
        }
        throw error;
      }
      
      // Exponential backoff: 500ms → 1s
      const backoffMs = 500 * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
  
  return { results: [], total_pages: 1 };
}

async function fetchTMDB(path: string, params: Record<string, any>, signal?: AbortSignal): Promise<any> {
  // Only cache search/tv and search/movie for page 1
  const shouldCache = (path === 'search/tv' || path === 'search/movie') && params.page === 1;
  
  if (shouldCache) {
    const cacheKey = `${path}:${normalizeQuery(params.query)}:${params.language}:${params.region}`;
    const cached = tmdbCache.get(cacheKey);
    
    if (cached) {
      cacheHits++;
      return cached;
    }
    
    cacheMisses++;
    const result = await fetchTMDBWithCircuitBreaker(path, params, signal);
    tmdbCache.set(cacheKey, result);
    return result;
  }
  
  // Don't cache search/multi (fresh pagination) or other endpoints
  return fetchTMDBWithCircuitBreaker(path, params, signal);
}

function dedupeWithAllMeta<T extends { item: MediaItem; score: number }>(items: T[]): T[] {
  const seen = new Map<string, T>();
  for (const entry of items) {
    const key = `${entry.item.mediaType}:${entry.item.id}`;
    const existing = seen.get(key);
    if (!existing || entry.score > existing.score) {
      seen.set(key, entry);
    }
  }
  return Array.from(seen.values());
}

// Calculate Herfindahl diversity index (0 = no diversity, 1 = perfect diversity)
function calculateDiversity(items: MediaItem[]): number {
  if (items.length === 0) return 0;
  
  const typeCounts = new Map<string, number>();
  for (const item of items) {
    const type = item.mediaType;
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
  }
  
  let sumSquares = 0;
  for (const count of typeCounts.values()) {
    const proportion = count / items.length;
    sumSquares += proportion * proportion;
  }
  
  // Herfindahl index: 1 - sum(proportions^2)
  // Higher = more diverse
  return 1 - sumSquares;
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

  // Get multi search results for the requested page (uncached for fresh pagination)
  const multiJson = await fetchTMDB('search/multi', {
    query, page, include_adult: false, language, region
  }, opts?.signal);
  
  let allItems = (multiJson.results ?? [])
    .map(mapTMDBToMediaItem)
    .filter(Boolean) as MediaItem[];

  // Drop person results from the candidate set (people search already returned above)
  allItems = allItems.filter(item => item.mediaType !== 'person');

  // Also search TV and Movie endpoints for better coverage (cached for page 1)
  if (page === 1) {
    try {
      const [tvJson, movieJson] = await Promise.all([
        fetchTMDB('search/tv', { query, page: 1, include_adult: false, language, region }, opts?.signal).catch(() => ({ results: [] })),
        fetchTMDB('search/movie', { query, page: 1, include_adult: false, language, region }, opts?.signal).catch(() => ({ results: [] }))
      ]);
      
      const tvItems = ((tvJson.results ?? []) as any[]).map(mapTMDBToMediaItem).filter(Boolean) as MediaItem[];
      const movieItems = ((movieJson.results ?? []) as any[]).map(mapTMDBToMediaItem).filter(Boolean) as MediaItem[];
      
      allItems = [...allItems, ...tvItems, ...movieItems];
    } catch (err) {
      // Fallback to multi-only if TV/Movie endpoints fail
      console.warn('TV/Movie search endpoints failed, using multi-only:', err);
    }
  }

  // Score items
  const allWithMeta = allItems.map(item => {
    const scored = computeSearchScore(query, {
      title: item.title || '',
      originalTitle: undefined,
      aliases: [],
      overview: item.synopsis,
      popularity: item.voteAverage ? item.voteAverage * 10 : undefined, // rough estimate
      voteAverage: item.voteAverage,
      voteCount: item.voteCount, // Now properly typed
      releaseYear: item.year ? parseInt(item.year) : undefined,
      releaseDate: item.releaseDate || undefined, // Use releaseDate for precise recency calculation
      mediaType: item.mediaType,
      originalLanguage: undefined,
      collectionName: undefined // Will be populated later if available
    }, { 
      preferType: searchType === 'movies-tv' ? 'all' : searchType,
      debugSearch: debugMode 
    });
    
    const meta = {
      tier: scored.titleSig.tier,
      voteCount: item.voteCount,
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

  // Debug logging
  if (debugMode) {
    console.log('🔍 Debug: Searching for anchor...');
    console.log('Query:', query);
    console.log('Total items found:', allWithMeta.length);
    
    console.log('All candidates with scores:');
    allWithMeta.forEach((x, i) => {
      if (x.titleSig.score >= 0.80 || x.titleSig.tier !== 'overlap') {
        console.log(`  ${i}. "${x.item.title}" (${x.item.year || '?'}) - tier: ${x.titleSig.tier}, titleSig: ${x.titleSig.score.toFixed(3)}, total: ${x.score.toFixed(3)}`);
      }
    });
  }

  // Demotion step: reduce score for duplicate single-word exact matches
  // Check if query is single-word (reused later for sorting logic)
  const isSingleWord = tokensLower(query).length === 1;
  if (isSingleWord) {
    const qNorm = tokensLower(query).join(' ');
    
    const exactSameTitle = allWithMeta.filter(entry => {
      const title = entry.item.title || '';
      const titleNorm = tokensLower(title).join(' ');
      return entry.titleSig.tier === 'exact' && titleNorm === qNorm;
    });
    
    if (exactSameTitle.length > 1) {
      // Pick the canonical exact as the one with highest score
      const canonical = exactSameTitle.reduce((best, entry) =>
        entry.score > best.score ? entry : best,
        exactSameTitle[0]
      );
      
      for (const entry of exactSameTitle) {
        if (entry === canonical) continue;
        // Apply a strong penalty so these drop below top leading matches
        entry.score -= 40;
        // Mark them as demoted for debugging
        (entry.meta as any).demotedDuplicateExact = true;
      }
      
      if (debugMode) {
        console.log(`📉 Demoted ${exactSameTitle.length - 1} duplicate exact matches for "${query}" (kept canonical: "${canonical.item.title}")`);
      }
    }
  }

  // Dedupe keeping highest-scored duplicate - preserve all metadata
  const deduped = dedupeWithAllMeta(allWithMeta);
  
  // Calculate diversity of top 10 results
  const top10Items = deduped.slice(0, 10).map(x => x.item);
  const diversity = calculateDiversity(top10Items);
  
  // Fetch similar/recommendations only if diversity is low (< 0.7)
  let extras: MediaItem[] = [];
  if (diversity < 0.7 && deduped.length > 0) {
    const exactCandidates = deduped.filter(x => x.titleSig.tier === 'exact' && x.score > 0);
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
          
          // Score extras but don't merge into main list - they'll be appended as "More like this" shelf
          // (For now, we'll still add them but could be separated in UI layer)
          const extrasWithMeta = extras.map(item => {
          const scored = computeSearchScore(query, {
            title: item.title || '',
            originalTitle: undefined,
            aliases: [],
            overview: item.synopsis,
            popularity: item.voteAverage ? item.voteAverage * 10 : undefined,
            voteAverage: item.voteAverage,
            voteCount: item.voteCount,
            releaseYear: item.year ? parseInt(item.year) : undefined,
            releaseDate: item.releaseDate || undefined, // Use releaseDate for precise recency calculation
            mediaType: item.mediaType,
            originalLanguage: undefined,
            collectionName: undefined
          }, {
              preferType: searchType === 'movies-tv' ? 'all' : searchType,
              debugSearch: debugMode
            });
            
            const meta = {
              tier: scored.titleSig.tier,
              voteCount: item.voteCount,
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
          
          deduped.push(...extrasWithMeta);
          // Re-dedupe after adding extras to avoid duplicate titles
          const dedupedWithExtras = dedupeWithAllMeta(deduped);
          // Replace deduped with the re-deduped version for the rest of the function
          deduped.length = 0;
          deduped.push(...dedupedWithExtras);
        } catch {
          // Extras are optional
        }
      }
    }
  }
  
  // Sort by score with tie-breaking - canonical pinning built into comparator
  // isSingleWord already declared above for demotion step
  
  // Find highest-scoring exact match for pinning
  const exactCandidates = deduped.filter(x => x.titleSig.tier === 'exact' && x.score > 0);
  const highestExactScore = exactCandidates.length > 0 
    ? Math.max(...exactCandidates.map(x => x.score))
    : -Infinity;
  
  const ranked = deduped.sort((a, b) => {
    // Canonical pinning: boost exact-tier items to rank 1
    const aIsExact = a.titleSig.tier === 'exact' && a.score === highestExactScore;
    const bIsExact = b.titleSig.tier === 'exact' && b.score === highestExactScore;
    
    if (aIsExact && !bIsExact) return -1; // a ranks higher
    if (!aIsExact && bIsExact) return 1;  // b ranks higher
    
    const scoreDiff = b.score - a.score;
    
    // Special handling for single-word queries: promote very popular leading matches
    if (isSingleWord) {
      const aIsLeading = a.titleSig.tier === 'leading';
      const bIsExact = b.titleSig.tier === 'exact';
      const aIsExact = a.titleSig.tier === 'exact';
      const bIsLeading = b.titleSig.tier === 'leading';
      
      // If one is leading and very popular, and the other is exact but less popular
      if (aIsLeading && bIsExact) {
        const aVoteCount = a.meta.voteCount ?? 0;
        const bVoteCount = b.meta.voteCount ?? 0;
        // If leading match has significantly more votes (10x+), promote it above exact match
        if (aVoteCount > bVoteCount * 10 && aVoteCount > 10000) {
          return -1; // a (leading) ranks higher
        }
      }
      if (aIsExact && bIsLeading) {
        const aVoteCount = a.meta.voteCount ?? 0;
        const bVoteCount = b.meta.voteCount ?? 0;
        // If leading match has significantly more votes (10x+), promote it above exact match
        if (bVoteCount > aVoteCount * 10 && bVoteCount > 10000) {
          return 1; // b (leading) ranks higher
        }
      }
    }
    
    // For exact matches, use tighter threshold to ensure proper tie-breaking
    const bothExact = a.titleSig.tier === 'exact' && b.titleSig.tier === 'exact';
    const threshold = bothExact ? 0.15 : 0.05;
    if (Math.abs(scoreDiff) < threshold) {
      return tieBreak(a.meta, b.meta, query);
    }
    return scoreDiff;
  });

  // Log canonical pinning if it occurred
  if (exactCandidates.length > 0 && ranked[0].titleSig.tier === 'exact') {
    const pinned = ranked[0];
    console.log(`📌 PINNED: "${pinned.item.title}" (${pinned.item.year}) to rank 1`);
  }

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
    
    if (typeof console.table === 'function') {
      console.table(tableData);
    } else {
      console.log(tableData);
    }
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

export async function debugSmartSearch(query: string) {
  const result = await smartSearch(query, 1, 'movies-tv', { debugSearch: true });
  
  // Re-compute scores for each item to get debug info
  const rows = result.items.slice(0, 20).map((item, index) => {
      const scored = computeSearchScore(query, {
        title: item.title || '',
        originalTitle: undefined,
        aliases: [],
        overview: item.synopsis,
        popularity: item.voteAverage ? item.voteAverage * 10 : undefined,
        voteAverage: item.voteAverage,
        voteCount: item.voteCount,
        releaseYear: item.year ? parseInt(item.year) : undefined,
        releaseDate: item.releaseDate || undefined,
        mediaType: item.mediaType,
        originalLanguage: undefined,
        collectionName: undefined
      }, {
        preferType: 'all',
        debugSearch: true
      });
      
      // Calculate age for display
      let age: number | string = '?';
      if (item.releaseDate) {
        const ageDays = (Date.now() - new Date(item.releaseDate).getTime()) / 864e5;
        age = (ageDays / 365.25).toFixed(1);
      } else if (item.year) {
        const now = new Date().getFullYear();
        age = (now - parseInt(item.year)).toFixed(1);
      }
      
      const debug = scored.debug || {};
      
      return {
        rank: index + 1,
        title: item.title || 'Untitled',
        year: item.year || '?',
        mediaType: item.mediaType,
        tier: scored.titleSig.tier,
        score: scored.score.toFixed(2),
        voteAverage: item.voteAverage?.toFixed(1) || '?',
        voteCount: item.voteCount || 0,
        releaseDate: item.releaseDate || item.year || '?',
        age: age,
        recencyBonus: debug.recencyBonus?.toFixed(2) || '?',
        popBonus: debug.popBonus?.toFixed(2) || '?',
        bm25: debug.bm25?.toFixed(2) || '?',
        titleExact: debug.titleExact || 0,
        titleLeading: debug.titleLeading || 0,
        titlePrefix: debug.titlePrefix || 0,
        titleWord: debug.titleWord || 0,
        titleContains: debug.titleContains || 0,
        yearMatch: debug.yearMatch || 0,
        voteSig: typeof debug.voteSig === 'number' ? debug.voteSig.toFixed(3) : '?'
      };
  });
  
  console.table(rows);
  return rows;
}

// Expose debug helper in dev
if (typeof window !== 'undefined') {
  (window as any).__debugSmartSearch = debugSmartSearch;
}
