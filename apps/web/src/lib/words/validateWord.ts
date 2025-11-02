/**
 * Process: Word Validation
 * Purpose: Validate guesses using accepted words list with dictionary API fallback
 * Data Source: accepted.json (primary), dictionary API (fallback)
 * Update Path: validateWord() function validates against local list, then dictionary API
 * Dependencies: lexicon.ts, localWords.ts, excludedWords.ts
 */

// apps/web/src/lib/words/validateWord.ts

import { normalize, isFiveLetters } from './lexicon';
import { isAcceptedLocal } from './localWords';
import { isExcluded } from './excludedWords';

export type Verdict = { valid: boolean; source: 'local' | 'dictionary' | 'none'; reason?: 'format' | 'not-found' | 'charset' | 'length'; soft?: boolean };

const MEMO = new Map<string, Verdict>();

/**
 * Check if word is valid using dictionary API as fallback
 * This allows valid words like "stilt" and "adieu" that aren't in accepted.json
 */
async function checkDictionary(word: string): Promise<boolean> {
  try {
    // Use Netlify function proxy via redirect path
    const proxyUrl = '/.netlify/functions/dict-proxy';
    const response = await fetch(`${proxyUrl}?word=${encodeURIComponent(word)}`, {
      cache: 'force-cache', // Cache results to avoid repeated API calls
    });

    if (!response.ok) {
      // API error - default to false (safer to reject than accept)
      return false;
    }

    // The dict-proxy returns { valid: boolean } format
    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    // Network error or parse error - default to false
    console.warn(`Dictionary API check failed for "${word}":`, error);
    return false;
  }
}

export async function validateWord(raw: string): Promise<Verdict> {
  const w = normalize(raw);
  if (!/^[a-z]+$/.test(w)) return { valid: false, source: 'none', reason: 'charset' };
  if (!isFiveLetters(w)) return { valid: false, source: 'none', reason: 'length' };

  if (MEMO.has(w)) return MEMO.get(w)!;

  // Check exclusion list first (reject non-words explicitly)
  if (isExcluded(w)) {
    const verdict: Verdict = { valid: false, source: 'none', reason: 'not-found' };
    MEMO.set(w, verdict);
    return verdict;
  }

  // Primary check: Use accepted.json (2,175 words) via isAcceptedLocal
  // This is much more comprehensive than the lexicon worker's valid-guess.txt
  if (await isAcceptedLocal(w)) {
    const verdict: Verdict = { valid: true, source: 'local' };
    MEMO.set(w, verdict);
    return verdict;
  }

  // Fallback: Check dictionary API for words not in accepted.json
  // This allows valid words like "stilt" and "adieu" that aren't in the curated list
  const isValidInDictionary = await checkDictionary(w);
  if (isValidInDictionary) {
    const verdict: Verdict = { valid: true, source: 'dictionary' };
    MEMO.set(w, verdict);
    return verdict;
  }

  // Reject words not found in local list or dictionary
  const verdict: Verdict = { valid: false, source: 'none', reason: 'not-found' };
  MEMO.set(w, verdict);
  return verdict;
}
