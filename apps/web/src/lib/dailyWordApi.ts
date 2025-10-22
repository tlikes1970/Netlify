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

// Common 5-letter words for validation fallback
const COMMON_WORDS = new Set([
  'about', 'above', 'abuse', 'actor', 'acute', 'admit', 'adopt', 'adult', 'after', 'again',
  'agent', 'agree', 'ahead', 'alarm', 'album', 'alert', 'alien', 'align', 'alike', 'alive',
  'allow', 'alone', 'along', 'alter', 'among', 'anger', 'angle', 'angry', 'apart', 'apple',
  'apply', 'arena', 'argue', 'arise', 'array', 'aside', 'asset', 'avoid', 'awake', 'award',
  'aware', 'badly', 'basic', 'beach', 'began', 'begin', 'being', 'below', 'bench', 'billy',
  'birth', 'black', 'blame', 'blind', 'block', 'blood', 'board', 'boost', 'booth', 'bound',
  'brain', 'brand', 'brass', 'brave', 'bread', 'break', 'breed', 'brief', 'bring', 'broad',
  'broke', 'brown', 'build', 'built', 'buyer', 'cable', 'calif', 'carry', 'catch', 'cause',
  'chain', 'chair', 'chaos', 'charm', 'chart', 'chase', 'cheap', 'check', 'chest', 'chief',
  'child', 'china', 'chose', 'civil', 'claim', 'class', 'clean', 'clear', 'click', 'climb',
  'clock', 'close', 'cloud', 'coach', 'coast', 'couch', 'could', 'count', 'court', 'cover', 'craft',
  'crash', 'crazy', 'cream', 'crime', 'cross', 'crowd', 'crown', 'crude', 'curve', 'cycle',
  'daily', 'dance', 'dated', 'dealt', 'death', 'debut', 'delay', 'depth', 'doing', 'doubt',
  'dozen', 'draft', 'drama', 'drank', 'dream', 'dress', 'drill', 'drink', 'drive', 'drove',
  'dying', 'eager', 'early', 'earth', 'eight', 'elite', 'empty', 'enemy', 'enjoy', 'enter',
  'entry', 'equal', 'error', 'event', 'every', 'exact', 'exist', 'extra', 'faith', 'false',
  'fault', 'fiber', 'field', 'fifth', 'fifty', 'fight', 'final', 'first', 'fixed', 'flash',
  'fleet', 'floor', 'fluid', 'focus', 'force', 'forth', 'forty', 'forum', 'found', 'frame',
  'frank', 'fraud', 'fresh', 'front', 'fruit', 'fully', 'funny', 'giant', 'given', 'glass',
  'globe', 'going', 'grace', 'grade', 'grand', 'grant', 'grass', 'grave', 'great', 'green',
  'gross', 'group', 'grown', 'guard', 'guess', 'guest', 'guide', 'happy', 'harry', 'heart',
  'heavy', 'horse', 'hotel', 'house', 'human', 'ideal', 'image', 'index', 'inner', 'input',
  'issue', 'japan', 'jimmy', 'joint', 'jones', 'judge', 'known', 'label', 'large', 'laser',
  'later', 'laugh', 'layer', 'learn', 'lease', 'least', 'leave', 'legal', 'level', 'lewis',
  'light', 'limit', 'links', 'lives', 'local', 'loose', 'lower', 'lucky', 'lunch', 'lying',
  'magic', 'major', 'maker', 'march', 'maria', 'match', 'maybe', 'mayor', 'meant', 'media',
  'metal', 'might', 'minor', 'minus', 'mixed', 'model', 'money', 'month', 'moral', 'motor',
  'mount', 'mouse', 'mouth', 'moved', 'movie', 'music', 'needs', 'never', 'newly', 'night',
  'noise', 'north', 'noted', 'novel', 'nurse', 'occur', 'ocean', 'offer', 'often', 'order',
  'other', 'ought', 'paint', 'panel', 'paper', 'party', 'peace', 'peter', 'phase', 'phone',
  'photo', 'piece', 'pilot', 'pitch', 'place', 'plain', 'plane', 'plant', 'plate', 'point',
  'pound', 'power', 'press', 'price', 'pride', 'prime', 'print', 'prior', 'prize', 'proof',
  'proud', 'prove', 'queen', 'quick', 'quiet', 'quite', 'radio', 'raise', 'range', 'rapid',
  'ratio', 'reach', 'ready', 'realm', 'rebel', 'refer', 'relax', 'reply', 'right', 'rigid',
  'rival', 'river', 'robin', 'roger', 'roman', 'rough', 'round', 'route', 'royal', 'rural',
  'scale', 'scene', 'scope', 'score', 'sense', 'serve', 'seven', 'shall', 'shape', 'share',
  'sharp', 'sheet', 'shelf', 'shell', 'shift', 'shine', 'shirt', 'shock', 'shoot', 'short',
  'shown', 'sight', 'silly', 'since', 'sixth', 'sixty', 'sized', 'skill', 'sleep', 'slide',
  'small', 'smart', 'smile', 'smith', 'smoke', 'snake', 'snow', 'solar', 'solid', 'solve',
  'sorry', 'sound', 'south', 'space', 'spare', 'speak', 'speed', 'spend', 'spent', 'split',
  'spoke', 'sport', 'staff', 'stage', 'stake', 'stand', 'start', 'state', 'steam', 'steel',
  'steep', 'steer', 'steps', 'stick', 'still', 'stock', 'stone', 'stood', 'store', 'storm',
  'story', 'strip', 'stuck', 'study', 'stuff', 'style', 'sugar', 'suite', 'super', 'sweet',
  'table', 'taken', 'taste', 'taxes', 'teach', 'terms', 'thank', 'theft', 'their', 'theme',
  'there', 'these', 'thick', 'thing', 'think', 'third', 'those', 'three', 'threw', 'throw',
  'thumb', 'tight', 'times', 'tired', 'title', 'today', 'topic', 'total', 'touch', 'tough',
  'tower', 'track', 'trade', 'train', 'treat', 'trend', 'trial', 'tribe', 'trick', 'tried',
  'tries', 'truck', 'truly', 'trust', 'truth', 'twice', 'under', 'undue', 'union', 'unity',
  'until', 'upper', 'upset', 'urban', 'usage', 'usual', 'valid', 'value', 'video', 'virus',
  'visit', 'vital', 'voice', 'waste', 'watch', 'water', 'wheel', 'where', 'which', 'while',
  'white', 'whole', 'whose', 'woman', 'women', 'world', 'worry', 'worse', 'worst', 'worth',
  'would', 'write', 'wrong', 'wrote', 'young', 'youth'
]);

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
 * Get today's date in YYYY-MM-DD format
 */
function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
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

  // Fallback to deterministic word based on date
  const fallbackWord = getDeterministicWord(today);
  console.log(`🔄 Using deterministic word for ${today}: ${fallbackWord}`);
  
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
 * Get deterministic word based on date (same word for all players each day)
 */
function getDeterministicWord(date: string): string {
  // Use date as seed for deterministic word selection
  const seed = date.split('-').join('');
  const seedNumber = parseInt(seed, 10);
  
  // Large pool of 5-letter words for daily rotation
  const dailyWords = [
    'ABOUT', 'ABOVE', 'ABUSE', 'ACTOR', 'ACUTE', 'ADMIT', 'ADOPT', 'ADULT', 'AFTER', 'AGAIN',
    'AGENT', 'AGREE', 'AHEAD', 'ALARM', 'ALBUM', 'ALERT', 'ALIEN', 'ALIGN', 'ALIKE', 'ALIVE',
    'ALLOW', 'ALONE', 'ALONG', 'ALTER', 'AMONG', 'ANGER', 'ANGLE', 'ANGRY', 'APART', 'APPLE',
    'APPLY', 'ARENA', 'ARGUE', 'ARISE', 'ARRAY', 'ASIDE', 'ASSET', 'AVOID', 'AWAKE', 'AWARD',
    'AWARE', 'BADLY', 'BASIC', 'BEACH', 'BEGAN', 'BEGIN', 'BEING', 'BELOW', 'BENCH', 'BILLY',
    'BIRTH', 'BLACK', 'BLAME', 'BLIND', 'BLOCK', 'BLOOD', 'BOARD', 'BOOST', 'BOOTH', 'BOUND',
    'BRAIN', 'BRAND', 'BRASS', 'BRAVE', 'BREAD', 'BREAK', 'BREED', 'BRIEF', 'BRING', 'BROAD',
    'BROKE', 'BROWN', 'BUILD', 'BUILT', 'BUYER', 'CABLE', 'CALIF', 'CARRY', 'CATCH', 'CAUSE',
    'CHAIN', 'CHAIR', 'CHAOS', 'CHARM', 'CHART', 'CHASE', 'CHEAP', 'CHECK', 'CHEST', 'CHIEF',
    'CHILD', 'CHINA', 'CHOSE', 'CIVIL', 'CLAIM', 'CLASS', 'CLEAN', 'CLEAR', 'CLICK', 'CLIMB',
    'CLOCK', 'CLOSE', 'CLOUD', 'COACH', 'COAST', 'COUCH', 'COULD', 'COUNT', 'COURT', 'COVER',
    'CRAFT', 'CRASH', 'CRAZY', 'CREAM', 'CRIME', 'CROSS', 'CROWD', 'CROWN', 'CRUDE', 'CURVE',
    'CYCLE', 'DAILY', 'DANCE', 'DATED', 'DEALT', 'DEATH', 'DEBUT', 'DELAY', 'DEPTH', 'DOING',
    'DOUBT', 'DOZEN', 'DRAFT', 'DRAMA', 'DRANK', 'DREAM', 'DRESS', 'DRILL', 'DRINK', 'DRIVE',
    'DROVE', 'DYING', 'EAGER', 'EARLY', 'EARTH', 'EIGHT', 'ELITE', 'EMPTY', 'ENEMY', 'ENJOY',
    'ENTER', 'ENTRY', 'EQUAL', 'ERROR', 'EVENT', 'EVERY', 'EXACT', 'EXIST', 'EXTRA', 'FAITH',
    'FALSE', 'FAULT', 'FIBER', 'FIELD', 'FIFTH', 'FIFTY', 'FIGHT', 'FINAL', 'FIRST', 'FIXED',
    'FLASH', 'FLEET', 'FLOOR', 'FLUID', 'FOCUS', 'FORCE', 'FORTH', 'FORTY', 'FORUM', 'FOUND',
    'FRAME', 'FRANK', 'FRAUD', 'FRESH', 'FRONT', 'FROST', 'FRUIT', 'FULLY', 'FUNNY', 'GIANT',
    'GIVEN', 'GLASS', 'GLOBE', 'GOING', 'GRACE', 'GRADE', 'GRAND', 'GRANT', 'GRASS', 'GRAVE',
    'GREAT', 'GREEN', 'GROSS', 'GROUP', 'GROWN', 'GUARD', 'GUESS', 'GUEST', 'GUIDE', 'HAPPY',
    'HARRY', 'HEART', 'HEAVY', 'HORSE', 'HOTEL', 'HOUSE', 'HUMAN', 'IDEAL', 'IMAGE', 'INDEX',
    'INNER', 'INPUT', 'ISSUE', 'JAPAN', 'JIMMY', 'JOINT', 'JONES', 'JUDGE', 'KNOWN', 'LABEL',
    'LARGE', 'LASER', 'LATER', 'LAUGH', 'LAYER', 'LEARN', 'LEASE', 'LEAST', 'LEAVE', 'LEGAL',
    'LEVEL', 'LEWIS', 'LIGHT', 'LIMIT', 'LINKS', 'LIVES', 'LOCAL', 'LOOSE', 'LOWER', 'LUCKY',
    'LUNCH', 'LYING', 'MAGIC', 'MAJOR', 'MAKER', 'MARCH', 'MARIA', 'MATCH', 'MAYBE', 'MAYOR',
    'MEANT', 'MEDIA', 'METAL', 'MIGHT', 'MINOR', 'MINUS', 'MIXED', 'MODEL', 'MONEY', 'MONTH',
    'MORAL', 'MOTOR', 'MOUNT', 'MOUSE', 'MOUTH', 'MOVED', 'MOVIE', 'MUSIC', 'NEEDS', 'NEVER',
    'NEWLY', 'NIGHT', 'NOISE', 'NORTH', 'NOTED', 'NOVEL', 'NURSE', 'OCCUR', 'OCEAN', 'OFFER',
    'OFTEN', 'ORDER', 'OTHER', 'OUGHT', 'PAINT', 'PANEL', 'PAPER', 'PARTY', 'PEACE', 'PETER',
    'PHASE', 'PHONE', 'PHOTO', 'PIANO', 'PIECE', 'PILOT', 'PITCH', 'PLACE', 'PLAIN', 'PLANE',
    'PLANT', 'PLATE', 'PLAZA', 'PLOT', 'PLUG', 'PLUS', 'POINT', 'POUND', 'POWER', 'PRESS',
    'PRICE', 'PRIDE', 'PRIME', 'PRINT', 'PRIOR', 'PRIZE', 'PROOF', 'PROUD', 'PROVE', 'QUEEN',
    'QUICK', 'QUIET', 'QUITE', 'RADIO', 'RAISE', 'RANGE', 'RAPID', 'RATIO', 'REACH', 'READY',
    'REALM', 'REBEL', 'REFER', 'RELAX', 'REPAY', 'REPLY', 'RIGHT', 'RIGID', 'RISKY', 'RIVER',
    'ROBIN', 'ROGER', 'ROMAN', 'ROUGH', 'ROUND', 'ROUTE', 'ROYAL', 'RURAL', 'SCALE', 'SCENE',
    'SCOPE', 'SCORE', 'SENSE', 'SERVE', 'SETUP', 'SEVEN', 'SHALL', 'SHAPE', 'SHARE', 'SHARP',
    'SHEET', 'SHELF', 'SHELL', 'SHIFT', 'SHINE', 'SHIRT', 'SHOCK', 'SHOOT', 'SHORT', 'SHOWN',
    'SIDED', 'SIGHT', 'SILLY', 'SINCE', 'SIXTH', 'SIXTY', 'SIZED', 'SKILL', 'SLEEP', 'SLIDE',
    'SMALL', 'SMART', 'SMILE', 'SMITH', 'SMOKE', 'SNAKE', 'SNOW', 'SOLAR', 'SOLID', 'SOLVE',
    'SORRY', 'SOUND', 'SOUTH', 'SPACE', 'SPARE', 'SPEAK', 'SPEED', 'SPEND', 'SPENT', 'SPLIT',
    'SPOKE', 'SPORT', 'STAFF', 'STAGE', 'STAKE', 'STAND', 'START', 'STATE', 'STEAM', 'STEEL',
    'STEEP', 'STEER', 'STEPS', 'STICK', 'STILL', 'STOCK', 'STONE', 'STOOD', 'STORE', 'STORM',
    'STORY', 'STRIP', 'STUCK', 'STUDY', 'STUFF', 'STYLE', 'SUGAR', 'SUITE', 'SUPER', 'SWEET',
    'TABLE', 'TAKEN', 'TASTE', 'TAXES', 'TEACH', 'TERMS', 'THANK', 'THEFT', 'THEIR', 'THEME',
    'THERE', 'THESE', 'THICK', 'THING', 'THINK', 'THIRD', 'THOSE', 'THREE', 'THREW', 'THROW',
    'THUMB', 'TIGHT', 'TIMES', 'TIRED', 'TITLE', 'TODAY', 'TOPIC', 'TOTAL', 'TOUCH', 'TOUGH',
    'TOWER', 'TRACK', 'TRADE', 'TRAIN', 'TREAT', 'TREND', 'TRIAL', 'TRIBE', 'TRICK', 'TRIED',
    'TRIES', 'TRUCK', 'TRULY', 'TRUST', 'TRUTH', 'TWICE', 'UNDER', 'UNDUE', 'UNION', 'UNITY',
    'UNTIL', 'UPPER', 'UPSET', 'URBAN', 'USAGE', 'USUAL', 'VALID', 'VALUE', 'VIDEO', 'VIRUS',
    'VISIT', 'VITAL', 'VOICE', 'WASTE', 'WATCH', 'WATER', 'WHEEL', 'WHERE', 'WHICH', 'WHILE',
    'WHITE', 'WHOLE', 'WHOSE', 'WOMAN', 'WOMEN', 'WORLD', 'WORRY', 'WORSE', 'WORST', 'WORTH',
    'WOULD', 'WRITE', 'WRONG', 'WROTE', 'YOUNG', 'YOUTH'
  ];
  
  // Select word deterministically based on date
  const wordIndex = seedNumber % dailyWords.length;
  return dailyWords[wordIndex];
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

/**
 * Validate if a word exists in dictionary
 */
export async function validateWord(word: string): Promise<boolean> {
  // Normalize the word to lowercase
  const normalizedWord = word.toLowerCase().trim();
  
  if (!normalizedWord || normalizedWord.length !== 5 || !/^[a-z]+$/.test(normalizedWord)) {
    console.log(`❌ Word validation failed for "${word}": invalid format`);
    return false;
  }

  try {
    // Try multiple dictionary APIs
    const apis = [
      `https://api.dictionaryapi.dev/api/v2/entries/en/${normalizedWord}`,
      `https://api.wordnik.com/v4/word.json/${normalizedWord}/definitions?limit=1&api_key=a2a73e7b926c924fad7001ca0641ab2aaf2bab5`
    ];

    for (const apiUrl of apis) {
      try {
        console.log(`🔍 Trying validation API: ${apiUrl}`);
        
        // Add timeout to prevent long waits
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const response = await fetch(apiUrl, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`✅ Word "${normalizedWord}" is valid`);
          return true;
        } else {
          console.log(`❌ API returned ${response.status} for "${normalizedWord}"`);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn(`⏰ API timeout for ${normalizedWord}`);
        } else {
          console.warn(`Dictionary API failed for ${normalizedWord}:`, error);
        }
      }
    }
  } catch (error) {
    console.warn('Word validation failed:', error);
  }

  console.log(`❌ Word "${normalizedWord}" not found in any dictionary`);
  
  // Fallback: check against common words list
  if (COMMON_WORDS.has(normalizedWord)) {
    console.log(`✅ Word "${normalizedWord}" found in common words list`);
    return true;
  }
  
  console.log(`❌ Word "${normalizedWord}" not found in common words list either`);
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


