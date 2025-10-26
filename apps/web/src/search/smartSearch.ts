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

function dedupeWithScore(items: Array<{ item: MediaItem; score: number }>) {
  const seen = new Map<string, { item: MediaItem; score: number }>();
  for (const entry of items) {
    const key = `${entry.item.mediaType}:${entry.item.id}`;
    const existing = seen.get(key);
    if (!existing || entry.score > existing.score) {
      seen.set(key, entry);
    }
  }
  return Array.from(seen.values());
}

export async function smartSearch(
  queryRaw: string,
  page = 1,
  searchType: SearchType = 'all',
  opts?: { signal?: AbortSignal; language?: string; region?: string }
): Promise<SearchResultWithPagination> {
  const language = opts?.language ?? 'en-US';
  const region   = opts?.region ?? 'US';
  const query    = normalizeQuery(queryRaw);

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
      releaseYear: item.year ? parseInt(item.year) : null,
      mediaType: item.mediaType,
      originalLanguage: undefined
    }, { preferType: searchType === 'movies-tv' ? 'all' : searchType });
    
    // Apply franchise head boost if applicable
    const meta = {
      tier: scored.titleSig.tier,
      voteCount: undefined as number | undefined,
      voteAverage: item.voteAverage,
      releaseYear: item.year ? parseInt(item.year) : null,
      popularity: item.voteAverage ? item.voteAverage * 10 : undefined,
      title: item.title
    };
    
    // Franchise head heuristic
    const single = query.split(/\s+/).length === 1;
    const isHead = (meta.voteCount ?? 0) > 50000 || (meta.popularity ?? 0) > 200;
    if (single && isHead && meta.tier === 'word') {
      meta.tier = 'starts';
      scored.titleSig.tier = 'starts';
    }
    
    return { 
      item, 
      score: scored.score, 
      titleSig: scored.titleSig,
      meta 
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
  
  // Find all anchor candidates
  // Filter: require leading tier OR exact tier with article (like "The Matrix")
  const anchorCandidates = allWithMeta.filter(
    x => x.titleSig.score >= 0.92 
      || (x.titleSig.tier === 'leading' && x.titleSig.score >= 0.95)
      || (x.titleSig.tier === 'exact' && (x.item.title?.toLowerCase().startsWith('the ') || x.item.title?.toLowerCase().startsWith('a ')))
  );
  
  // Prioritize anchor selection:
  // 1. Leading tier with article (like "The Matrix")
  // 2. Then exact tier with article
  // 3. Then other leading/exact matches
  const leadingWithArticle = anchorCandidates.filter(x => 
    x.titleSig.tier === 'leading' && (x.item.title?.toLowerCase().startsWith('the ') || x.item.title?.toLowerCase().startsWith('a '))
  );
  const exactWithArticle = anchorCandidates.filter(x => 
    x.titleSig.tier === 'exact' && (x.item.title?.toLowerCase().startsWith('the ') || x.item.title?.toLowerCase().startsWith('a '))
  );
  const leadingMatches = anchorCandidates.filter(x => x.titleSig.tier === 'leading');
  const exactMatches = anchorCandidates.filter(x => x.titleSig.tier === 'exact');
  
  const anchorEntry = leadingWithArticle.length > 0
    ? // Prefer "The Matrix" (1999) over "Matrix" (1973)
      leadingWithArticle.sort((a, b) => {
        const yearDiff = (parseInt(a.item.year || '9999') || 9999) - (parseInt(b.item.year || '9999') || 9999);
        return yearDiff !== 0 ? yearDiff : b.score - a.score;
      })[0]
    : exactWithArticle.length > 0
    ? exactWithArticle.sort((a, b) => b.score - a.score)[0]
    : leadingMatches.length > 0
    ? leadingMatches.sort((a, b) => {
        const yearDiff = (parseInt(a.item.year || '9999') || 9999) - (parseInt(b.item.year || '9999') || 9999);
        return yearDiff !== 0 ? yearDiff : b.score - a.score;
      })[0]
    : exactMatches.length > 0
    ? exactMatches.sort((a, b) => b.score - a.score)[0]
    : null;
  
  const anchor = anchorEntry?.item || null;
  
  console.log('Anchor candidates found:', anchorCandidates.length);
  console.log('Anchor selected:', anchor?.title, `(${anchor?.year})`, 'with tier:', anchorEntry?.titleSig.tier, 'score:', anchorEntry?.score);

  // Fetch similar/recommendations if we have a high-confidence anchor
  let extras: MediaItem[] = [];
  if (anchor && anchor.mediaType !== 'person') {
    try {
      const [simJson, recJson] = await Promise.all([
        fetchTMDB(`${anchor.mediaType}/${anchor.id}/similar`, { page: 1, language }, opts?.signal).catch(() => ({ results: [] })),
        fetchTMDB(`${anchor.mediaType}/${anchor.id}/recommendations`, { page: 1, language }, opts?.signal).catch(() => ({ results: [] }))
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
          releaseYear: item.year ? parseInt(item.year) : null,
          mediaType: item.mediaType,
          originalLanguage: undefined
        }, { preferType: searchType === 'movies-tv' ? 'all' : searchType });
        
        const meta = {
          tier: scored.titleSig.tier,
          voteCount: undefined as number | undefined,
          voteAverage: item.voteAverage,
          releaseYear: item.year ? parseInt(item.year) : null,
          popularity: item.voteAverage ? item.voteAverage * 10 : undefined,
          title: item.title
        };
        
        return { 
          item, 
          score: scored.score, 
          titleSig: scored.titleSig,
          meta 
        };
      });
      
      allWithMeta.push(...extrasWithMeta);
    } catch {
      // Extras are optional
    }
  }

  // Dedupe keeping highest-scored duplicate
  const deduped = dedupeWithScore(allWithMeta.map(({ item, score }) => ({ item, score })));
  
  // Sort by score with tie-breaking
  const withMeta = deduped.map(({ item, score }) => {
    const original = allWithMeta.find(x => x.item === item);
    return { 
      item, 
      score, 
      meta: original?.meta || { 
        tier: 'overlap', 
        voteAverage: item.voteAverage, 
        releaseYear: item.year ? parseInt(item.year) : null,
        title: item.title
      } 
    };
  });
  
  const ranked = withMeta.sort((a, b) => {
    const scoreDiff = b.score - a.score;
    // More lenient threshold for franchise tie-breaking
    // This allows the tie-breaker to prefer popular sequels over originals
    if (Math.abs(scoreDiff) < 0.05) { // essentially equal
      return tieBreak(a.meta, b.meta, query);
    }
    return scoreDiff;
  });

  console.log('📊 Final ranked top 5:', ranked.slice(0, 5).map((x, i) => ({
    rank: i + 1,
    title: x.item.title,
    tier: x.meta.tier,
    score: x.score
  })));

  // Force anchor to index 0 if it exists
  if (anchor) {
    const anchorIndex = ranked.findIndex(x => x.item === anchor);
    console.log('🎯 Anchor at index:', anchorIndex, 'forcing to 0');
    if (anchorIndex > 0) {
      const anchorItem = ranked[anchorIndex];
      ranked.splice(anchorIndex, 1);
      ranked.unshift(anchorItem);
    }
  }

  const finalRanked = ranked.map(x => x.item);
  
  console.log('✅ Final results after anchor force:', finalRanked.slice(0, 5).map((x, i) => ({
    rank: i + 1,
    title: x.title
  })));

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
