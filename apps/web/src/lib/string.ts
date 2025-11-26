/**
 * Centralized string normalization and tokenization utilities
 * Purpose: Single source of truth for text processing across search and ranking
 * Update Path: Modify functions here to update all search/ranking behavior
 */

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

/**
 * Normalize query: strip diacritics, normalize quotes, trim
 */
export function normalizeQuery(q: string): string {
  return q
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[''']/g, "'")
    .replace(/["""]/g, '"')
    .replace(/[–—]/g, '-') // dashes
    .replace(/\s+/g, ' ')
    .trim();
}

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
 * Tokenize string into lowercase tokens
 */
function tokens(s: string): string[] {
  return s.split(/[^a-z0-9]+/i).filter(Boolean);
}

/**
 * Tokenize string into lowercase tokens (exported for use in search ranking)
 */
export function tokensLower(s: string): string[] {
  return tokens(s.toLowerCase());
}

/**
 * Collapse repeated letters (e.g., "haikyuu" → "haikyu")
 * Helps match common typo variations
 */
export function collapseRepeatedLetters(str: string): string {
  return str.replace(/(.)\1+/g, '$1$1'); // Allow max 2 repeated, collapse 3+ to 2
}

/**
 * Calculate Levenshtein distance between two strings
 * Returns number of single-character edits needed
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  // Early exit for identical strings
  if (a === b) return 0;
  
  // Early exit for empty strings
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  // Build distance matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Check if two strings are fuzzy matches (within tolerance)
 * @param query User's search query
 * @param target Target string to match against
 * @param maxDistance Maximum edit distance (default: 2 for short strings, scales with length)
 */
export function isFuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  
  // Exact match
  if (q === t) return true;
  
  // Collapsed repeated letters match (haikyuu vs haikyu)
  const qCollapsed = collapseRepeatedLetters(q);
  const tCollapsed = collapseRepeatedLetters(t);
  if (qCollapsed === tCollapsed) return true;
  
  // One is substring of other (partial match)
  if (t.includes(q) || q.includes(t)) return true;
  
  // Levenshtein distance for short queries
  // Allow more tolerance for longer strings
  const minLen = Math.min(q.length, t.length);
  const maxDistance = minLen <= 4 ? 1 : minLen <= 8 ? 2 : 3;
  
  const distance = levenshteinDistance(q, t);
  return distance <= maxDistance;
}

/**
 * Generate search query variations for better TMDB matching
 * Returns array of normalized query variations to try
 */
export function generateQueryVariations(query: string): string[] {
  const normalized = normalizeQuery(query);
  const variations = new Set<string>([normalized]);
  
  // Add collapsed repeated letters version
  const collapsed = collapseRepeatedLetters(normalized);
  if (collapsed !== normalized) {
    variations.add(collapsed);
  }
  
  // Add version without common typo patterns
  // Double letter variations (e.g., try both "canceled" and "cancelled")
  const doubleLetterVariant = normalized.replace(/([bcdfgklmnprst])\1/g, '$1');
  if (doubleLetterVariant !== normalized) {
    variations.add(doubleLetterVariant);
  }
  
  return Array.from(variations);
}

