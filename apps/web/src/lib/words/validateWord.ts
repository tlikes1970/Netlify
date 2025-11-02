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
    // Use Netlify function proxy
    const proxyUrl = '/.netlify/functions/dict-proxy';
    const url = `${proxyUrl}?word=${encodeURIComponent(word)}`;
    
    console.log(`🔍 Checking dictionary for "${word}": ${url}`);
    
    const response = await fetch(url, {
      cache: 'force-cache', // Cache results to avoid repeated API calls
    });

    console.log(`📡 Dictionary API response for "${word}":`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      // Log the error details
      const errorText = await response.text().catch(() => 'Unable to read error');
      console.warn(`❌ Dictionary API error for "${word}":`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      // API error - default to false (safer to reject than accept)
      return false;
    }

    // The dict-proxy should return { valid: boolean } format
    const data = await response.json();
    
    // Handle both formats: {valid: boolean} or raw array from API
    let isValid = false;
    if (typeof data === 'object' && data !== null) {
      if ('valid' in data) {
        // New format: {valid: boolean}
        isValid = data.valid === true;
      } else if (Array.isArray(data)) {
        // Legacy format: raw array from dictionary API
        isValid = data.length > 0;
      }
    }
    
    console.log(`✅ Dictionary API result for "${word}":`, { 
      valid: isValid, 
      dataType: Array.isArray(data) ? 'array' : typeof data,
      dataLength: Array.isArray(data) ? data.length : undefined,
      hasValidProperty: data && typeof data === 'object' && 'valid' in data,
      rawData: data
    });
    
    return isValid;
  } catch (error) {
    // Network error or parse error - default to false
    console.error(`❌ Dictionary API check failed for "${word}":`, error);
    return false;
  }
}

export async function validateWord(raw: string): Promise<Verdict> {
  const w = normalize(raw);
  console.log(`🔍 validateWord called for "${raw}" (normalized: "${w}")`);
  
  if (!/^[a-z]+$/.test(w)) {
    console.log(`❌ Invalid charset for "${w}"`);
    return { valid: false, source: 'none', reason: 'charset' };
  }
  if (!isFiveLetters(w)) {
    console.log(`❌ Invalid length for "${w}"`);
    return { valid: false, source: 'none', reason: 'length' };
  }

  if (MEMO.has(w)) {
    const cached = MEMO.get(w)!;
    console.log(`📦 Using cached result for "${w}":`, cached);
    return cached;
  }

  // Check exclusion list first (reject non-words explicitly)
  if (isExcluded(w)) {
    console.log(`🚫 "${w}" is excluded`);
    const verdict: Verdict = { valid: false, source: 'none', reason: 'not-found' };
    MEMO.set(w, verdict);
    return verdict;
  }

  // Primary check: Use accepted.json (2,175 words) via isAcceptedLocal
  // This is much more comprehensive than the lexicon worker's valid-guess.txt
  const isLocal = await isAcceptedLocal(w);
  console.log(`📚 Local check for "${w}":`, isLocal);
  if (isLocal) {
    const verdict: Verdict = { valid: true, source: 'local' };
    MEMO.set(w, verdict);
    return verdict;
  }

  // Fallback: Check dictionary API for words not in accepted.json
  // This allows valid words like "stilt" and "adieu" that aren't in the curated list
  console.log(`🌐 Word "${w}" not in local list, checking dictionary API...`);
  const isValidInDictionary = await checkDictionary(w);
  if (isValidInDictionary) {
    console.log(`✅ Dictionary API confirmed "${w}" is valid`);
    const verdict: Verdict = { valid: true, source: 'dictionary' };
    MEMO.set(w, verdict);
    return verdict;
  }

  // Reject words not found in local list or dictionary
  console.log(`❌ "${w}" not found in local list or dictionary`);
  const verdict: Verdict = { valid: false, source: 'none', reason: 'not-found' };
  MEMO.set(w, verdict);
  return verdict;
}
