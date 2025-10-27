// Daily Word API Service
// Provides the same word for all players each day

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
}

// Module-level cache for accepted words list
let ACCEPTED_WORDS_CACHE: string[] | null = null;

/**
 * Load accepted words list from public/words/accepted.json
 * Cached after first load
 */
async function loadAcceptedWords(): Promise<string[]> {
  if (ACCEPTED_WORDS_CACHE) {
    return ACCEPTED_WORDS_CACHE;
  }
  
  try {
    const response = await fetch('/words/accepted.json');
    if (response.ok) {
      const words = await response.json();
      const normalizedWords = words.map((w: string) => w.toLowerCase());
      ACCEPTED_WORDS_CACHE = normalizedWords;
      console.log(`✅ Loaded ${normalizedWords.length} accepted words`);
      return normalizedWords;
    }
  } catch (error) {
    console.error('Failed to load accepted words from JSON:', error);
  }
  
  // Fallback to empty array - will rely on API or deterministic pool
  console.warn('⚠️ Using fallback word list (API or deterministic pool only)');
  ACCEPTED_WORDS_CACHE = [];
  return [];
}

// Cache key for localStorage
const CACHE_KEY = 'flicklet:daily-word';

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

/**
 * Get today's date in YYYY-MM-DD format (LOCAL timezone, not UTC)
 */
function getTodayString(): string {
  const now = new Date();
  // Use local timezone, not UTC
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Note: Legacy function removed as part of cleanup
// Use getFreshWord() for testing with cache busting

/**
 * Get today's word (same for all players, rotates daily)
 */
export async function getTodaysWord(): Promise<WordApiResponse> {
  const today = getTodayString();
  
  // Check cache first
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsedCache: CachedWord = JSON.parse(cached);
      if (isCachedWordValid(parsedCache)) {
        console.log(`📦 Using cached word for ${today}: ${parsedCache.word}`);
        
        // MIGRATION: If cache has old format or invalid data, clear it
        if (!parsedCache.date || typeof parsedCache.word !== 'string' || parsedCache.word.length !== 5) {
          console.warn('🔄 Invalid cache format detected, clearing...');
          localStorage.removeItem(CACHE_KEY);
        } else {
          return {
            word: parsedCache.word,
            date: parsedCache.date,
            definition: parsedCache.definition,
            difficulty: parsedCache.difficulty as any
          };
        }
      }
    }
  } catch (error) {
    console.warn('Failed to read cached word:', error);
  }

  // PRIMARY: Use deterministic word based on date (same for all players)
  const deterministicWord = await getDeterministicWord(today);
  console.log(`🎯 Using deterministic word for ${today}: ${deterministicWord}`);
  
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
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache word:', error);
  }

  return wordData;

  // API integration removed - using deterministic selection for consistent daily words
}

/**
 * Get deterministic word based on date (same word for all players each day)
 * Now uses the full accepted words list from accepted.json
 */
async function getDeterministicWord(date: string): Promise<string> {
  // Load accepted words list (cached after first load)
  const acceptedWords = await loadAcceptedWords();
  
  // Use date as seed for deterministic word selection
  const seed = date.split('-').join('');
  const seedNumber = parseInt(seed, 10);
  
  // If we have accepted words, use them; otherwise fallback to CRANE
  if (acceptedWords && acceptedWords.length > 0) {
    const wordIndex = seedNumber % acceptedWords.length;
    return acceptedWords[wordIndex].toUpperCase();
  }
  
  // Fallback if accepted words couldn't be loaded
  console.warn('⚠️ No accepted words loaded, using fallback');
  return 'CRANE';
}

/**
 * Check if cached word is for today
 */
function isCachedWordValid(cached: CachedWord): boolean {
  return cached.date === getTodayString();
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
          date: getTodayString(),
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
    const cached = localStorage.getItem(CACHE_KEY);
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
    date: getTodayString()
  };
}

/**
 * Clear cached word (for testing)
 */
export function clearWordCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
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
    date: getTodayString(),
    definition: `A test word for ${testWord.toLowerCase()}`,
    difficulty: 'medium'
  };
}


