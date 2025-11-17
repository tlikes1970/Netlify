// Daily Word API Service
// Provides the same word for all players each day
// Daily content is keyed off UTC date so users share the same daily content globally

import { getDailySeedDate } from './dailySeed';
import { getFlickWordDailyKey, CACHE_VERSIONS } from './cacheKeys';

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
        // Use UTC date + gameNumber as seed for deterministic word selection
        // This ensures different words for each game number on the same UTC day
        // All users get the same 3 words per day (gameNumber 1, 2, 3)
        // Words rotate on a 180-day (6 month) cycle to prevent repeats
        
        // Calculate days since epoch (Jan 1, 2000) for 180-day cycle
        const epochDate = new Date('2000-01-01');
        const currentDate = new Date(date + 'T00:00:00Z');
        const daysSinceEpoch = Math.floor((currentDate.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24));
        const cycleDay = daysSinceEpoch % 180; // 180-day (6 month) cycle
        
        // Calculate word index: cycleDay * 3 (for 3 words per day) + gameNumber - 1
        // This ensures all users get the same 3 words per day, and no repeats for 180 days
        const dailyWordIndex = cycleDay * 3 + (gameNumber - 1);
        const wordIndex = dailyWordIndex % validWords.length;
        const selectedWord = validWords[wordIndex].toUpperCase();
        
        // Double-check the selected word is not excluded (safety check)
        if (isExcluded(selectedWord.toLowerCase())) {
          console.error(`❌ ERROR: Selected word "${selectedWord}" is excluded! This should not happen.`);
          // Pick the next word as fallback
          const fallbackIndex = (wordIndex + 1) % validWords.length;
          const fallbackWord = validWords[fallbackIndex].toUpperCase();
          console.log(`🔄 Using fallback word: ${fallbackWord}`);
          return fallbackWord;
        }
        
        console.log(`📚 Selected from ${validWords.length} common words, game ${gameNumber}, index ${wordIndex}: ${selectedWord}`);
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
        // Use UTC date + gameNumber as seed for deterministic word selection
        // All users get the same 3 words per day (gameNumber 1, 2, 3)
        // Words rotate on a 180-day (6 month) cycle to prevent repeats
        
        // Calculate days since epoch (Jan 1, 2000) for 180-day cycle
        const epochDate = new Date('2000-01-01');
        const currentDate = new Date(date + 'T00:00:00Z');
        const daysSinceEpoch = Math.floor((currentDate.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24));
        const cycleDay = daysSinceEpoch % 180; // 180-day (6 month) cycle
        
        // Calculate word index: cycleDay * 3 (for 3 words per day) + gameNumber - 1
        const dailyWordIndex = cycleDay * 3 + (gameNumber - 1);
        const wordIndex = dailyWordIndex % validWords.length;
        const selectedWord = validWords[wordIndex].toUpperCase();
        console.log(`📚 Selected from accepted.json, game ${gameNumber}, cycle day ${cycleDay}, index ${wordIndex}: ${selectedWord}`);
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


