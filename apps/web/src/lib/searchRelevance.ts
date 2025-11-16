/**
 * Process: Search Relevance Enhancement
 * Purpose: Predictive search relevance scoring for autocomplete suggestions
 * Data Source: MediaItem candidates from TMDB API
 * Update Path: Adjust weights in scoreCandidate function
 * Dependencies: Library, providerCatalog
 */

import type { MediaItem } from '../components/cards/card.types';
import { Library } from './storage';

// Stopwords to ignore for token scoring
const STOPWORDS = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);

// LRU cache for normalizeTitle (max 500 entries)
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key)!;
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
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
    this.cache.set(key, value);
  }
}

const normalizeCache = new LRUCache<string, string>(500);
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

/**
 * Normalize title: lowercase, trim, strip diacritics & punctuation, collapse whitespace
 */
export function normalizeTitle(str: string): string {
  const cached = normalizeCache.get(str);
  if (cached) return cached;

  const normalized = str
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .trim()
    .replace(/[''"]/g, "'") // Normalize quotes
    .replace(/["""]/g, '"')
    .replace(/[^\w\s'-]/g, '') // Remove punctuation except hyphens/apostrophes
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();

  normalizeCache.set(str, normalized);
  return normalized;
}

/**
 * Tokenize query, filtering out stopwords
 */
export function tokenize(query: string): string[] {
  const normalized = normalizeTitle(query);
  return normalized
    .split(/\s+/)
    .filter(token => token.length > 0 && !STOPWORDS.has(token));
}

/**
 * Check if item is in user's library lists
 */
function getListPenalty(item: MediaItem): number {
  const allItems = Library.getAll();
  const key = `${item.mediaType}:${item.id}`;
  const entry = allItems.find(e => `${e.mediaType}:${e.id}` === key);
  
  if (!entry) return 0;
  
  if (entry.list === 'watched') return -2.0;
  if (entry.list === 'watching') return -0.5;
  return 0;
}

/**
 * Check if item is available on user-enabled providers
 */
function getProviderBoost(item: MediaItem, enabledProvidersLower: Set<string>): number {
  if (enabledProvidersLower.size === 0) return 0;
  if (!item.networks || item.networks.length === 0) return 0;
  
  // Check if any of the item's networks match enabled providers
  const hasMatch = item.networks.some(network => {
    const networkLower = network.toLowerCase();
    return Array.from(enabledProvidersLower).some(provider => 
      networkLower.includes(provider)
    );
  });
  
  return hasMatch ? 1.0 : 0;
}

/**
 * Calculate Jaccard similarity between query tokens and title tokens
 */
function jaccardSimilarity(queryTokens: string[], titleTokens: string[]): number {
  if (queryTokens.length === 0 || titleTokens.length === 0) return 0;
  
  const querySet = new Set(queryTokens);
  const titleSet = new Set(titleTokens);
  
  let intersection = 0;
  for (const token of querySet) {
    if (titleSet.has(token)) intersection++;
  }
  
  const union = querySet.size + titleSet.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Score a candidate item for autocomplete relevance
 */
export function scoreCandidate(
  query: string,
  candidate: MediaItem,
  enabledProviders: string[] = []
): number {
  const normalizedQuery = normalizeTitle(query);
  const normalizedTitle = normalizeTitle(candidate.title || '');
  const queryTokens = tokenize(query);
  // Cache tokenize result for performance
  const titleTokens = tokenize(candidate.title || '');
  // Pre-compute enabled providers set for performance
  const enabledProvidersLower = new Set(enabledProviders.map(p => p.toLowerCase()));
  
  let score = 0;
  
  // Check if query is a single word (like "bat") vs multi-word (like "bat man")
  const isSingleWordQuery = queryTokens.length === 1 && normalizedQuery.length <= 10;
  
  // w_exact: exact normalized title match
  // Ensure exact match >= 6.0, never let substring > exact
  if (normalizedTitle === normalizedQuery) {
    score += 6.0; // Always at least 6.0 for exact matches
  }
  
  // w_prefix: title startsWith first token (+3.0)
  if (queryTokens.length > 0) {
    const firstToken = queryTokens[0];
    if (normalizedTitle.startsWith(firstToken) || titleTokens.some(t => t.startsWith(firstToken))) {
      score += 3.0;
    }
  }
  
  // w_substring: title contains query as substring
  // This handles cases like "bat" matching "batman" or "super" matching "superman"
  // Ensure substring <= 5.9 so exact matches always win
  if (normalizedTitle.includes(normalizedQuery) && normalizedTitle !== normalizedQuery) {
    // Extra boost if the substring match is at the start of a word (e.g., "bat" in "batman")
    const startsWord = normalizedTitle.startsWith(normalizedQuery) || 
                       normalizedTitle.includes(` ${normalizedQuery}`) ||
                       titleTokens.some(t => t.startsWith(normalizedQuery));
    
    // For single-word queries, boost word-starting substring matches but keep below exact (6.0)
    if (isSingleWordQuery && startsWord) {
      score += 5.9; // High but still below exact match (6.0)
    } else if (startsWord) {
      score += 4.0;
    } else {
      score += 2.5;
    }
  }
  
  // w_token_intersection: Jaccard of query tokens vs title tokens (+2.0 * J)
  const jaccard = jaccardSimilarity(queryTokens, titleTokens);
  score += 2.0 * jaccard;
  
  // w_partial_token: any title token contains query token as substring (+1.5)
  // Handles cases where query token is embedded in a longer title token
  if (queryTokens.length > 0) {
    const firstToken = queryTokens[0];
    if (titleTokens.some(t => t.includes(firstToken) && t !== firstToken)) {
      score += 1.5;
    }
  }
  
  // w_popularity: min-max of vote_count or popularity (+0..+1.5)
  const voteCount = (candidate as any).vote_count || 0;
  const popularity = (candidate as any).popularity || 0;
  // Normalize to 0-1 range (assuming max vote_count ~50000, max popularity ~2000)
  const voteNorm = Math.min(voteCount / 50000, 1);
  const popNorm = Math.min(popularity / 2000, 1);
  const popularityScore = Math.max(voteNorm, popNorm) * 1.5;
  score += popularityScore;
  
  // w_recency: year decay exp(-(nowYear - year)/12) * 1.0
  if (candidate.year) {
    const nowYear = new Date().getFullYear();
    const year = parseInt(candidate.year);
    if (!isNaN(year)) {
      const age = nowYear - year;
      const recencyScore = Math.exp(-age / 12) * 1.0;
      score += recencyScore;
    }
  }
  
  // w_providerBoost: +1.0 if available on any user-enabled provider
  score += getProviderBoost(candidate, enabledProvidersLower);
  
  // w_listPenalty: -2.0 if in "Watched", -0.5 if in "Watching"
  score += getListPenalty(candidate);
  
  return score;
}

/**
 * Rank candidates by score with tie-breaking
 */
export function rankCandidates(
  query: string,
  candidates: MediaItem[],
  enabledProviders: string[] = [],
  maxResults: number = 10
): MediaItem[] {
  // Score all candidates
  const scored = candidates.map(candidate => ({
    item: candidate,
    score: scoreCandidate(query, candidate, enabledProviders)
  }));
  
  // Sort by score (descending), then tie-break
  scored.sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (Math.abs(scoreDiff) > 0.001) return scoreDiff;
    
    // Tie-breakers: (a) higher popularity, (b) newer year, (c) lexicographic title asc
    const aPop = (a.item as any).popularity || (a.item as any).vote_count || 0;
    const bPop = (b.item as any).popularity || (b.item as any).vote_count || 0;
    if (Math.abs(aPop - bPop) > 0.001) return bPop - aPop;
    
    const aYear = a.item.year ? parseInt(a.item.year) : 0;
    const bYear = b.item.year ? parseInt(b.item.year) : 0;
    if (aYear !== bYear) return bYear - aYear;
    
    return collator.compare(a.item.title || '', b.item.title || '');
  });
  
  // Deduplicate by (id, mediaType) - keep highest score
  const seen = new Map<string, typeof scored[0]>();
  for (const entry of scored) {
    const key = `${entry.item.mediaType}:${entry.item.id}`;
    const existing = seen.get(key);
    if (!existing || entry.score > existing.score) {
      seen.set(key, entry);
    }
  }
  
  const deduped = Array.from(seen.values());
  
  // Ensure at least one exact/prefix/substring match in top-3 if present
  const exactOrPrefix = deduped.filter((entry, idx) => {
    if (idx >= 3) return false;
    const normalizedQuery = normalizeTitle(query);
    const normalizedTitle = normalizeTitle(entry.item.title || '');
    const queryTokens = tokenize(query);
    const firstToken = queryTokens.length > 0 ? queryTokens[0] : '';
    
    // Check for exact match, prefix match, or word-starting substring match
    return normalizedTitle === normalizedQuery || 
           (firstToken && normalizedTitle.startsWith(firstToken)) ||
           (normalizedTitle.includes(normalizedQuery) && 
            (normalizedTitle.startsWith(normalizedQuery) || 
             normalizedTitle.includes(` ${normalizedQuery}`) ||
             tokenize(entry.item.title || '').some(t => t.startsWith(normalizedQuery))));
  });
  
  // If exact/prefix/substring exists but not in top-3, promote highest one
  if (exactOrPrefix.length > 0 && deduped.indexOf(exactOrPrefix[0]) >= 3) {
    const toPromote = exactOrPrefix[0];
    const index = deduped.indexOf(toPromote);
    deduped.splice(index, 1);
    deduped.splice(2, 0, toPromote); // Insert at position 2 (0-indexed, so 3rd position)
  }
  
  return deduped.slice(0, maxResults).map(entry => entry.item);
}


