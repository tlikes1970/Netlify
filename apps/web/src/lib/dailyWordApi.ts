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

// Fallback words for when API fails
const FALLBACK_WORDS = [
  'bliss', 'crane', 'flick', 'gravy', 'masks', 'toast', 'crown', 'spine', 'tiger', 'pride',
  'happy', 'smile', 'peace', 'light', 'dream', 'magic', 'story', 'music', 'dance', 'heart',
  'world', 'house', 'water', 'earth', 'night', 'day', 'love', 'hope', 'life', 'time',
  'space', 'place', 'grace', 'trace', 'brace', 'chase', 'phase', 'raise', 'phase', 'glaze'
];

// Cache key for localStorage
const CACHE_KEY = 'flicklet:daily-word';

// API endpoints to try (in order of preference)
const WORD_APIS = [
  {
    name: 'Wordnik Random Word',
    url: 'https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&minCorpusCount=1000&minLength=5&maxLength=5&api_key=a2a73e7b926c924fad7001ca0641ab2aaf2bab5',
    parser: (data: any) => ({
      word: data.word?.toLowerCase(),
      definition: data.definitions?.[0]?.text,
      difficulty: data.word?.length === 5 ? 'medium' : 'easy'
    })
  },
  {
    name: 'Random Words API',
    url: 'https://random-words-api.vercel.app/word',
    parser: (data: any) => ({
      word: data.word?.toLowerCase(),
      definition: data.definition,
      difficulty: 'medium'
    })
  },
  {
    name: 'Datamuse API',
    url: 'https://api.datamuse.com/words?sp=?????&max=1&md=d',
    parser: (data: any) => ({
      word: data[0]?.word?.toLowerCase(),
      definition: data[0]?.defs?.[0]?.split('\t')[1],
      difficulty: 'medium'
    })
  }
];

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Get a deterministic word for today based on date
 * This ensures all players get the same word each day
 */
function getDeterministicWord(date: string): string {
  // Use date as seed for deterministic word selection
  const seed = date.split('-').join('');
  const seedNumber = parseInt(seed, 10);
  const wordIndex = seedNumber % FALLBACK_WORDS.length;
  return FALLBACK_WORDS[wordIndex];
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

/**
 * Get today's word (same for all players)
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
        return {
          word: parsedCache.word,
          date: parsedCache.date,
          definition: parsedCache.definition,
          difficulty: parsedCache.difficulty as any
        };
      }
    }
  } catch (error) {
    console.warn('Failed to read cached word:', error);
  }

  // Try to fetch from API
  console.log(`🌐 Fetching new word for ${today}...`);
  const apiWord = await fetchWordFromApi();
  
  if (apiWord) {
    // Cache the API word
    const cacheData: CachedWord = {
      word: apiWord.word,
      date: apiWord.date,
      definition: apiWord.definition,
      difficulty: apiWord.difficulty,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log(`💾 Cached API word: ${apiWord.word}`);
    } catch (error) {
      console.warn('Failed to cache word:', error);
    }
    
    return apiWord;
  }

  // Fallback to deterministic word
  const fallbackWord = getDeterministicWord(today);
  console.log(`🔄 Using fallback word for ${today}: ${fallbackWord}`);
  
  const fallbackData: WordApiResponse = {
    word: fallbackWord,
    date: today,
    definition: undefined,
    difficulty: 'medium'
  };

  // Cache the fallback word
  const cacheData: CachedWord = {
    word: fallbackWord,
    date: today,
    definition: undefined,
    difficulty: 'medium',
    timestamp: Date.now()
  };
  
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache fallback word:', error);
  }

  return fallbackData;
}

/**
 * Validate if a word exists in dictionary
 */
export async function validateWord(word: string): Promise<boolean> {
  if (!word || word.length !== 5 || !/^[a-z]+$/.test(word)) {
    return false;
  }

  try {
    // Try multiple dictionary APIs
    const apis = [
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
      `https://api.wordnik.com/v4/word.json/${word}/definitions?limit=1&api_key=a2a73e7b926c924fad7001ca0641ab2aaf2bab5`
    ];

    for (const apiUrl of apis) {
      try {
        const response = await fetch(apiUrl);
        if (response.ok) {
          return true;
        }
      } catch (error) {
        console.warn(`Dictionary API failed for ${word}:`, error);
      }
    }
  } catch (error) {
    console.warn('Word validation failed:', error);
  }

  return false;
}

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


