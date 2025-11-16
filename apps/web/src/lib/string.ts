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

