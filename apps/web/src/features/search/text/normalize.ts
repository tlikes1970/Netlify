/**
 * Process: Search Text Normalization
 * Purpose: Standardize search queries for consistent matching across titles, people, and tags
 * Data Source: User input queries and media metadata
 * Update Path: Extend locale support, add transliteration maps, or adjust token rules
 * Dependencies: None (pure functions)
 */

const STOPWORDS = new Set(['of', 'and', 'in', 'la', 'le', 'de', 'da', 'do', 'das', 'dos']);
const ARTICLES = new Set(['the', 'a', 'an']);

/**
 * Base normalization: lowercase, trim, collapse spaces
 */
export function normalizeBase(s: string, locale = 'en'): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Normalize with leading article removal for title matching
 */
export function normalizeTitleLoose(s: string, locale = 'en'): string {
  const base = normalizeBase(s, locale);
  const parts = base.split(/\s+/);
  
  // Remove leading article if present
  if (parts.length > 1 && ARTICLES.has(parts[0])) {
    return parts.slice(1).join(' ');
  }
  
  return base;
}

/**
 * Strip punctuation except inner quotes
 */
export function stripPunctuation(s: string): string {
  // Keep apostrophes for contractions like "don't"
  // Remove everything else but spaces
  return s.replace(/[^\w\s']/g, '');
}

/**
 * Fold diacritics: é -> e, ñ -> n, etc.
 */
export function foldDiacritics(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

/**
 * Tokenize with stopword removal
 */
export function tokens(s: string, locale = 'en'): string[] {
  const normalized = foldDiacritics(stripPunctuation(normalizeBase(s, locale)));
  return normalized
    .split(/\s+/)
    .filter(token => token.length > 0 && !STOPWORDS.has(token));
}

/**
 * Full normalization pipeline for matching
 */
export function normalizeForMatch(s: string, locale = 'en'): string {
  return foldDiacritics(stripPunctuation(normalizeBase(s, locale)));
}

/**
 * Check if two strings match loosely (after normalization)
 */
export function matchesLoose(a: string, b: string, locale = 'en'): boolean {
  return normalizeTitleLoose(a, locale) === normalizeTitleLoose(b, locale);
}

