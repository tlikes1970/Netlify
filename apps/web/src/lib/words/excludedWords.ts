/**
 * Shared exclusion list for non-words that shouldn't be:
 * - Accepted as valid guesses
 * - Selected as daily words
 * 
 * This is a single source of truth for word exclusions.
 */

export const EXCLUDED_WORDS = new Set([
  'hollo',  // Not a standard English word (archaic/obsolete)
  'heres',  // Should be "here's" (contraction) or "herds"
  'drily',  // Uncommon alternate spelling - "dryly" is more common
  'gonif',  // Very uncommon Yiddish word (alternate spelling "ganef") - not familiar to most players
  // Add other non-words or uncommon alternate spellings here as needed
]);

/**
 * Check if a word is excluded
 */
export function isExcluded(word: string): boolean {
  return EXCLUDED_WORDS.has(word.toLowerCase());
}



