// Daily Word API Service
// Provides the same word for all players each day
// Daily content is keyed off UTC date so users share the same daily content globally

import { getDailySeedDate } from './dailySeed';
import { getFlickWordDailyKey, CACHE_VERSIONS } from './cacheKeys';

/**
 * Get words used in the last N days for a specific game number
 * Used to prevent repeats within a recent window
 * 
 * FIXED: Now uses the same selection logic as getDeterministicWord() to ensure
 * the recent words list matches what was actually selected (accounting for
 * problematic letter filtering and other selection criteria).
 */
function getRecentWords(days: number, gameNumber: number, validWords: string[], currentDate: string): string[] {
  const recentWords: string[] = [];
  const today = new Date(currentDate + 'T00:00:00Z');
  
  // Build recent words list progressively, using previously selected words
  // This ensures each day's selection accounts for previous days' selections
  for (let i = 1; i <= days; i++) {
    const pastDate = new Date(today);
    pastDate.setUTCDate(pastDate.getUTCDate() - i);
    const pastDateStr = getDailySeedDate(pastDate);
    
    // Use previously selected words as recent words (slice to get only words before this date)
    // This ensures we're checking against what was actually selected, not recalculating
    const wordsBeforeThisDate = recentWords.slice(); // Copy of words selected so far
    
    // Use the same selection logic, but with the words we've already selected
    const word = getDeterministicWordForDate(pastDateStr, gameNumber, validWords, wordsBeforeThisDate);
    
    if (word) {
      // Add to front of array (most recent first) so slice works correctly
      recentWords.unshift(word);
    }
  }
  
  return recentWords;
}

/**
 * Core word selection logic - shared by getDeterministicWord() and getRecentWords()
 * This ensures both functions use the exact same selection algorithm.
 */
function getDeterministicWordForDate(
  date: string, 
  gameNumber: number, 
  validWords: string[], 
  providedRecentWords: string[] | null = null
): string {
  // Use provided recent words if available, otherwise calculate them
  // (This prevents infinite recursion when getRecentWords() calls this)
  // Note: Empty array [] is valid and means no previous words (for first day in sequence)
  const recentWords = providedRecentWords !== null 
    ? providedRecentWords 
    : getRecentWords(14, gameNumber, validWords, date);
  
  // CRITICAL: Determine most recent word for pattern checking
  // When building with unshift() in getRecentWords(), order is [oldest, ..., newest]
  // (because we iterate backwards in time: day N-14, then N-13, ..., then N-1)
  // So most recent word is at the END (index length - 1)
  // When providedRecentWords is passed from progressive building, it's already in this order
  const mostRecentWord = recentWords.length > 0 
    ? recentWords[recentWords.length - 1]  // Most recent is always at the end
    : null;
  
  // For pattern detection, use chronological order (oldest to newest)
  // recentWords from unshift() is already chronological (oldest first, newest last)
  const chronologicalRecentWords = recentWords;
  
  // CRITICAL: Prevent ALL patterns to ensure game integrity
  // 1. No repeated first letters (even once) - NEVER allow same first letter twice in a row
  // 2. No alphabetical order patterns - Check if WORDS themselves are alphabetical
  // 3. No predictable sequences
  
  const problematicLetters = new Set<string>();
  const problematicWords = new Set<string>();
  
  // Rule 1: NEVER repeat the most recent word's first letter (even once)
  if (mostRecentWord) {
    const lastWordFirstLetter = mostRecentWord.charAt(0).toLowerCase();
    problematicLetters.add(lastWordFirstLetter);
  }
  
  // Rule 2: Detect alphabetical order patterns in WORDS (not just first letters)
  // Check if last 3+ words are in alphabetical order
  if (chronologicalRecentWords.length >= 3) {
    const lastThree = chronologicalRecentWords.slice(-3).map(w => w.toLowerCase());
    let isAlphabetical = true;
    for (let i = 1; i < lastThree.length; i++) {
      if (lastThree[i] <= lastThree[i - 1]) {
        isAlphabetical = false;
        break;
      }
    }
    
    if (isAlphabetical) {
      // If words are in alphabetical order, prevent continuing the sequence
      // Find words that would continue the alphabetical pattern
      const lastWord = lastThree[lastThree.length - 1];
      // Deprioritize words that come after last word alphabetically
      // We'll check this in the selection loop
      problematicWords.add(lastWord);
    }
  }
  
  // Rule 3: Check for alphabetical first letters pattern
  if (chronologicalRecentWords.length >= 3) {
    const lastThree = chronologicalRecentWords.slice(-3);
    const lastThreeLetters = lastThree.map(w => w.charAt(0).toLowerCase());
    let firstLettersAlphabetical = true;
    for (let i = 1; i < lastThreeLetters.length; i++) {
      if (lastThreeLetters[i] <= lastThreeLetters[i - 1]) {
        firstLettersAlphabetical = false;
        break;
      }
    }
    
    if (firstLettersAlphabetical) {
      // Prevent continuing alphabetical first-letter sequence
      const lastLetter = lastThreeLetters[lastThreeLetters.length - 1];
      const nextLetter = String.fromCharCode(lastLetter.charCodeAt(0) + 1);
      if (nextLetter <= 'z') {
        problematicLetters.add(nextLetter);
      }
    }
  }
  
  // Calculate base index using date + gameNumber (deterministic seed)
  // CRITICAL FIX: Use a more complex seed to avoid sequential patterns
  // The original formula created alphabetical patterns because validWords is sorted
  const epochDate = new Date('2000-01-01');
  const currentDate = new Date(date + 'T00:00:00Z');
  const daysSinceEpoch = Math.floor((currentDate.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24));
  const cycleDay = daysSinceEpoch % 365;
  
  // Use a more complex seed that breaks sequential patterns
  // Multiply by prime numbers and add gameNumber to create better distribution
  const seed1 = cycleDay * 7919; // Large prime
  const seed2 = (gameNumber - 1) * 9973; // Another large prime
  const combinedSeed = (seed1 + seed2) % validWords.length;
  const baseIndex = combinedSeed;
  
  // Find a word that passes all checks
  let candidateIndex = baseIndex;
  let attempts = 0;
  const maxAttempts = validWords.length;
  
  while (attempts < maxAttempts) {
    const candidateWord = validWords[candidateIndex].toUpperCase();
    const candidateLower = candidateWord.toLowerCase();
    const candidateFirstLetter = candidateLower.charAt(0);
    
    const isRecent = chronologicalRecentWords.some(w => w.toLowerCase() === candidateLower);
    const startsWithProblematic = problematicLetters.has(candidateFirstLetter);
    
    // Check: prevent alphabetical word continuation
    let continuesAlphabeticalWordPattern = false;
    if (chronologicalRecentWords.length >= 2 && problematicWords.size > 0) {
      const lastWord = chronologicalRecentWords[chronologicalRecentWords.length - 1].toLowerCase();
      const secondLastWord = chronologicalRecentWords[chronologicalRecentWords.length - 2].toLowerCase();
      
      // Check if last two words are alphabetical and candidate continues it
      if (secondLastWord < lastWord && lastWord < candidateLower) {
        continuesAlphabeticalWordPattern = true;
      }
    }
    
    // Check: prevent alphabetical first-letter continuation
    let continuesAlphabeticalLetterPattern = false;
    if (chronologicalRecentWords.length >= 2 && !startsWithProblematic) {
      const lastTwo = chronologicalRecentWords.slice(-2).map(w => w.charAt(0).toLowerCase());
      const lastLetter = lastTwo[lastTwo.length - 1];
      const secondLastLetter = lastTwo[lastTwo.length - 2];
      
      if (secondLastLetter < lastLetter && lastLetter < candidateFirstLetter) {
        continuesAlphabeticalLetterPattern = true;
      }
    }
    
    if (!isRecent && !startsWithProblematic && !continuesAlphabeticalWordPattern && !continuesAlphabeticalLetterPattern) {
      return candidateWord;
    }
    
    candidateIndex = (candidateIndex + 1) % validWords.length;
    attempts++;
  }
  
  // Fallback: prioritize avoiding problematic letters and patterns
  if (problematicLetters.size > 0 || problematicWords.size > 0) {
    candidateIndex = baseIndex;
    attempts = 0;
    while (attempts < maxAttempts) {
      const candidateWord = validWords[candidateIndex].toUpperCase();
      const candidateLower = candidateWord.toLowerCase();
      const candidateFirstLetter = candidateLower.charAt(0);
      const startsWithProblematic = problematicLetters.has(candidateFirstLetter);
      
      let continuesAlphabeticalWordPattern = false;
      if (chronologicalRecentWords.length >= 2 && problematicWords.size > 0) {
        const lastWord = chronologicalRecentWords[chronologicalRecentWords.length - 1].toLowerCase();
        const secondLastWord = chronologicalRecentWords[chronologicalRecentWords.length - 2].toLowerCase();
        if (secondLastWord < lastWord && lastWord < candidateLower) {
          continuesAlphabeticalWordPattern = true;
        }
      }
      
      let continuesAlphabeticalLetterPattern = false;
      if (chronologicalRecentWords.length >= 2 && !startsWithProblematic) {
        const lastTwo = chronologicalRecentWords.slice(-2).map(w => w.charAt(0).toLowerCase());
        const lastLetter = lastTwo[lastTwo.length - 1];
        const secondLastLetter = lastTwo[lastTwo.length - 2];
        if (secondLastLetter < lastLetter && lastLetter < candidateFirstLetter) {
          continuesAlphabeticalLetterPattern = true;
        }
      }
      
      if (!startsWithProblematic && !continuesAlphabeticalWordPattern && !continuesAlphabeticalLetterPattern) {
        return candidateWord;
      }
      
      candidateIndex = (candidateIndex + 1) % validWords.length;
      attempts++;
    }
  }
  
  // Final fallback
  return validWords[baseIndex].toUpperCase();
}

/**
 * Get first letters of words used in the last N days for a specific game number
 * Used to detect same-letter patterns
 */
interface WordApiResponse {
  word: string;
  date: string;
  definition?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface CachedWord {
  word: string;
  date: string;
  definition?: string;
  difficulty?: string;
  timestamp: number;
  version?: string; // Cache version for invalidation
}

// Module-level cache for accepted words list (deprecated - using commonWords.ts now)

// API endpoints to try (in order of preference)
const WORD_APIS: Array<{
  name: string;
  url: string;
  parser: (data: any) => { word: string; definition?: string; difficulty: string };
}> = [
  {
    name: 'Datamuse API',
    url: 'https://api.datamuse.com/words?sp=?????&max=1&md=d',
    parser: (data: any) => ({
      word: data[0]?.word?.toLowerCase(),
      definition: data[0]?.defs?.[0]?.split('\t')[1],
      difficulty: 'medium'
    })
  },
  {
    name: 'Random Word Generator',
    url: 'https://random-word-api.herokuapp.com/word?length=5',
    parser: (data: any) => ({
      word: data[0]?.toLowerCase(),
      definition: `A random 5-letter word`,
      difficulty: 'medium'
    })
  }
];

// Note: Legacy function removed as part of cleanup
// Use getFreshWord() for testing with cache busting

/**
 * Get today's word(s) - deterministic based on UTC date and game number
 * Regular: 1 word per day (gameNumber = 1)
 * Pro: 3 words per day (gameNumber = 1, 2, or 3)
 * Daily content is keyed off UTC date so users share the same daily content globally
 * @param gameNumber Optional game number (1-3) for Pro users. Defaults to 1 for Regular users.
 */
export async function getTodaysWord(gameNumber: number = 1): Promise<WordApiResponse> {
  const today = getDailySeedDate(); // UTC-based date for consistent daily content
  
  // Validate gameNumber
  if (gameNumber < 1 || gameNumber > 3) {
    console.warn(`Invalid gameNumber ${gameNumber}, defaulting to 1`);
    gameNumber = 1;
  }
  
  // Cache key includes game number for Pro users (uses UTC date for consistency)
  const gameCacheKey = getFlickWordDailyKey(gameNumber);
  
  // Check cache first, but validate it's not excluded
  try {
    const cached = localStorage.getItem(gameCacheKey);
    if (cached) {
      const parsedCache: CachedWord = JSON.parse(cached);
      if (isCachedWordValid(parsedCache)) {
        // Validate cache version
        if (parsedCache.version !== CACHE_VERSIONS.FLICKWORD_DAILY_WORD) {
          console.warn('🔄 Cache version mismatch, clearing old cache...');
          localStorage.removeItem(gameCacheKey);
          // Fall through to get a new word
        } else if (parsedCache.date && typeof parsedCache.word === 'string' && parsedCache.word.length === 5) {
          // Validate cached word is not in exclusion list
          const { isExcluded } = await import('./words/excludedWords');
          const cachedWordLower = parsedCache.word.toLowerCase();
          
          if (isExcluded(cachedWordLower)) {
            console.warn(`🚫 Cached word "${parsedCache.word}" is now excluded, clearing cache...`);
            localStorage.removeItem(gameCacheKey);
            // Fall through to get a new word
          } else {
            console.log(`📦 Using cached word for ${today}, game ${gameNumber}: ${parsedCache.word}`);
            return {
              word: parsedCache.word,
              date: parsedCache.date,
              definition: parsedCache.definition,
              difficulty: parsedCache.difficulty as any
            };
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to read cached word:', error);
  }

  // PRIMARY: Use deterministic word based on date + game number
  const deterministicWord = await getDeterministicWord(today, gameNumber);
  console.log(`🎯 Using deterministic word for ${today}, game ${gameNumber}: ${deterministicWord}`);
  
  const wordData: WordApiResponse = {
    word: deterministicWord,
    date: today,
    definition: undefined,
    difficulty: 'medium'
  };

  // Cache the word
  const cacheData: CachedWord = {
    word: deterministicWord,
    date: today,
    definition: undefined,
    difficulty: 'medium',
    timestamp: Date.now()
  };
  
  try {
    localStorage.setItem(gameCacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache word:', error);
  }

  return wordData;

  // API integration removed - using deterministic selection for consistent daily words
}

/**
 * Get deterministic word based on UTC date and game number
 * Regular users: gameNumber = 1 (same word for all Regular users globally)
 * Pro users: gameNumber = 1, 2, or 3 (3 different words, same for all Pro users globally)
 * Uses commonWords list to ensure only familiar, everyday words are selected
 * Daily content is keyed off UTC date so users share the same daily content globally
 * 
 * Word selection improvements:
 * - No repeats within last 14 days
 * - Avoids same-letter runs (if last 3 days share first letter, deprioritize that letter)
 * - Still deterministic (same date + gameNumber = same word for everyone)
 */
async function getDeterministicWord(date: string, gameNumber: number = 1): Promise<string> {
  // Import exclusion list and common words
  const { isExcluded } = await import('./words/excludedWords');
  const { getCommonWordsArray } = await import('./words/commonWords');
  
  try {
    // Use common words list (curated familiar words) instead of all accepted.json
    const commonWords = getCommonWordsArray();
    
    if (commonWords && commonWords.length > 0) {
      console.log(`📚 Loaded ${commonWords.length} common words`);
      
      // Filter out excluded words from common words
      const validWords = commonWords.filter(w => {
        const excluded = isExcluded(w);
        if (excluded) {
          console.log(`🚫 Filtered out excluded word from common list: ${w}`);
        }
        return !excluded;
      });
      
      console.log(`✅ After filtering excluded words: ${validWords.length} valid common words`);
      
      if (validWords.length > 0) {
        // Use shared selection logic
        const selectedWord = getDeterministicWordForDate(date, gameNumber, validWords);
        console.log(`✅ Selected word: ${selectedWord}`);
        return selectedWord;
      }
    }
    
    // Fallback: try accepted.json if commonWords fails
    console.warn('⚠️ Common words list not available, falling back to accepted.json');
    const response = await fetch('/words/accepted.json', { cache: 'force-cache' });
    if (response.ok) {
      const allWords: string[] = await response.json();
      console.log(`📚 Loaded ${allWords.length} words from accepted.json`);
      
      // Filter out excluded words - this is critical!
      const validWords = allWords.filter(w => {
        const excluded = isExcluded(w);
        if (excluded) {
          console.log(`🚫 Filtered out excluded word: ${w}`);
        }
        return !excluded;
      });
      
      console.log(`✅ After filtering excluded words: ${validWords.length} valid words`);
      
      if (validWords.length > 0) {
        // Use shared selection logic
        const selectedWord = getDeterministicWordForDate(date, gameNumber, validWords);
        console.log(`📚 Selected from accepted.json: ${selectedWord}`);
        return selectedWord;
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to load words:', error);
  }
  
  // Final fallback - different words for different game numbers
  const fallbackWords = ['HOUSE', 'CRANE', 'BLISS'];
  const fallbackWord = fallbackWords[(gameNumber - 1) % fallbackWords.length];
  console.warn(`⚠️ Using fallback word for game ${gameNumber}: ${fallbackWord}`);
  return fallbackWord;
}

/**
 * Check if cached word is for today
 */
function isCachedWordValid(cached: CachedWord): boolean {
  return cached.date === getDailySeedDate();
}

/**
 * Fetch word from API with fallback
 */
async function fetchWordFromApi(): Promise<WordApiResponse | null> {
  for (const api of WORD_APIS) {
    try {
      console.log(`🎯 Trying ${api.name}...`);
      const response = await fetch(api.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Flicklet/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const parsed = api.parser(data);
      
      if (parsed.word && parsed.word.length === 5 && /^[a-z]+$/.test(parsed.word)) {
        console.log(`✅ Successfully fetched word from ${api.name}: ${parsed.word}`);
        return {
          word: parsed.word,
          date: getDailySeedDate(),
          definition: parsed.definition,
          difficulty: parsed.difficulty as 'easy' | 'medium' | 'hard' | undefined
        };
      }
    } catch (error) {
      console.warn(`❌ ${api.name} failed:`, error);
    }
  }
  
  return null;
}

// Note: Legacy function removed as part of cleanup
// Use getFreshWord() for testing with cache busting
// Word validation is now handled by apps/web/src/lib/words/validateWord.ts

/**
 * Get word statistics for debugging
 */
export function getWordStats(): { cached: boolean; date: string; word?: string } {
  try {
    const cached = localStorage.getItem(getFlickWordDailyKey(1));
    if (cached) {
      const parsed: CachedWord = JSON.parse(cached);
      return {
        cached: isCachedWordValid(parsed),
        date: parsed.date,
        word: parsed.word
      };
    }
  } catch (error) {
    console.warn('Failed to get word stats:', error);
  }

  return {
    cached: false,
    date: getDailySeedDate()
  };
}

/**
 * Clear cached word (for testing)
 */
export function clearWordCache(): void {
  try {
    // Clear all game cache keys (1-3)
    for (let i = 1; i <= 3; i++) {
      localStorage.removeItem(getFlickWordDailyKey(i));
    }
    console.log('🗑️ Cleared word cache');
  } catch (error) {
    console.warn('Failed to clear word cache:', error);
  }
}

/**
 * Force refresh word (bypass cache for testing)
 */
export async function getFreshWord(): Promise<WordApiResponse> {
  // Clear cache first
  clearWordCache();
  
  // Force API fetch
  console.log('🔄 Force fetching fresh word from API...');
  const apiWord = await fetchWordFromApi();
  
  if (apiWord) {
    console.log('✅ Got fresh word from API:', apiWord.word);
    return apiWord;
  }

  // Use a different random fallback word for testing
  const testWords = ['CRANE', 'BLISS', 'GRAVY', 'MASKS', 'TOAST', 'PRIDE', 'TIGER', 'SPINE', 'CROWN', 'HAPPY'];
  const randomIndex = Math.floor(Math.random() * testWords.length);
  const testWord = testWords[randomIndex];
  
  console.log('🔄 Using random test word:', testWord);
  return {
    word: testWord,
    date: getDailySeedDate(),
    definition: `A test word for ${testWord.toLowerCase()}`,
    difficulty: 'medium'
  };
}


