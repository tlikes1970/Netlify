// Trivia API Service
// Provides trivia questions from external APIs with fallback
// Daily content is keyed off UTC date so users share the same daily content globally

import { getDailySeedDate } from './dailySeed';
import { getTriviaDailyKey, CACHE_VERSIONS } from './cacheKeys';

interface TriviaApiResponse {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface CachedTrivia {
  date: string;
  questions: TriviaApiResponse[];
  version?: string; // Cache version for invalidation
  apiQuestionCount?: number; // Track how many questions came from API vs fallback
  fallbackQuestionCount?: number; // Track fallback questions for cache quality assessment
}

// Minimum number of API questions required to cache a set as "healthy"
// Sets with fewer API questions are considered degraded and not cached long-term
// Config: Trivia caching policy - MIN_API_FOR_CACHE: 20
const MIN_API_FOR_CACHE = 20;

// Cache key for localStorage
// Cache key is now centralized in cacheKeys.ts

/**
 * Deterministic shuffle using seed
 * Same seed produces same shuffle order
 */
function seededShuffle<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  // Simple seeded random number generator
  let currentSeed = seed;
  const seededRandom = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// API endpoints to try (in order of preference)
// OpenTriviaDB Categories:
// 11 = Entertainment: Film (Movies)
// 14 = Entertainment: Television (TV Shows)
const TRIVIA_APIS: Array<{
  name: string;
  url: string;
  parser: (data: any, seed?: number) => TriviaApiResponse[];
}> = [
  {
    name: 'OpenTriviaDB - Movies',
    url: 'https://opentdb.com/api.php?amount=10&category=11&difficulty=medium&type=multiple&encode=url3986',
    parser: (data: any, seed?: number) => {
      if (data.response_code === 0 && data.results && data.results.length > 0) {
        return data.results.map((item: any, index: number) => {
          const correctAnswer = decodeURIComponent(item.correct_answer);
          const incorrectAnswers = item.incorrect_answers.map((ans: string) => decodeURIComponent(ans));
          const allChoices = [correctAnswer, ...incorrectAnswers];

          // Deterministic shuffle using seed (question index as part of seed for uniqueness)
          const questionSeed = seed !== undefined ? seed + index : Date.now() + index;
          const shuffledChoices = seededShuffle(allChoices, questionSeed);
          const correctIndex = shuffledChoices.indexOf(correctAnswer);

          return {
            question: decodeURIComponent(item.question),
            options: shuffledChoices,
            correctAnswer: correctIndex,
            explanation: `The correct answer is ${correctAnswer}.`,
            category: 'Film',
            difficulty: item.difficulty as 'easy' | 'medium' | 'hard'
          };
        });
      }
      return [];
    }
  },
  {
    name: 'OpenTriviaDB - TV Shows',
    url: 'https://opentdb.com/api.php?amount=10&category=14&difficulty=medium&type=multiple&encode=url3986',
    parser: (data: any, seed?: number) => {
      if (data.response_code === 0 && data.results && data.results.length > 0) {
        return data.results.map((item: any, index: number) => {
          const correctAnswer = decodeURIComponent(item.correct_answer);
          const incorrectAnswers = item.incorrect_answers.map((ans: string) => decodeURIComponent(ans));
          const allChoices = [correctAnswer, ...incorrectAnswers];

          // Deterministic shuffle using seed
          const questionSeed = seed !== undefined ? seed + index : Date.now() + index;
          const shuffledChoices = seededShuffle(allChoices, questionSeed);
          const correctIndex = shuffledChoices.indexOf(correctAnswer);

          return {
            question: decodeURIComponent(item.question),
            options: shuffledChoices,
            correctAnswer: correctIndex,
            explanation: `The correct answer is ${correctAnswer}.`,
            category: 'Television',
            difficulty: item.difficulty as 'easy' | 'medium' | 'hard'
          };
        });
      }
      return [];
    }
  },
  {
    name: 'OpenTriviaDB - Movies (Easy)',
    url: 'https://opentdb.com/api.php?amount=10&category=11&difficulty=easy&type=multiple&encode=url3986',
    parser: (data: any, seed?: number) => {
      if (data.response_code === 0 && data.results && data.results.length > 0) {
        return data.results.map((item: any, index: number) => {
          const correctAnswer = decodeURIComponent(item.correct_answer);
          const incorrectAnswers = item.incorrect_answers.map((ans: string) => decodeURIComponent(ans));
          const allChoices = [correctAnswer, ...incorrectAnswers];

          // Deterministic shuffle using seed
          const questionSeed = seed !== undefined ? seed + index : Date.now() + index;
          const shuffledChoices = seededShuffle(allChoices, questionSeed);
          const correctIndex = shuffledChoices.indexOf(correctAnswer);

          return {
            question: decodeURIComponent(item.question),
            options: shuffledChoices,
            correctAnswer: correctIndex,
            explanation: `The correct answer is ${correctAnswer}.`,
            category: 'Film',
            difficulty: 'easy' as const
          };
        });
      }
      return [];
    }
  },
  {
    name: 'OpenTriviaDB - TV Shows (Easy)',
    url: 'https://opentdb.com/api.php?amount=10&category=14&difficulty=easy&type=multiple&encode=url3986',
    parser: (data: any, seed?: number) => {
      if (data.response_code === 0 && data.results && data.results.length > 0) {
        return data.results.map((item: any, index: number) => {
          const correctAnswer = decodeURIComponent(item.correct_answer);
          const incorrectAnswers = item.incorrect_answers.map((ans: string) => decodeURIComponent(ans));
          const allChoices = [correctAnswer, ...incorrectAnswers];

          // Deterministic shuffle using seed
          const questionSeed = seed !== undefined ? seed + index : Date.now() + index;
          const shuffledChoices = seededShuffle(allChoices, questionSeed);
          const correctIndex = shuffledChoices.indexOf(correctAnswer);

          return {
            question: decodeURIComponent(item.question),
            options: shuffledChoices,
            correctAnswer: correctIndex,
            explanation: `The correct answer is ${correctAnswer}.`,
            category: 'Television',
            difficulty: 'easy' as const
          };
        });
      }
      return [];
    }
  }
];

// Note: Legacy function removed as part of cleanup
// Use getFreshTrivia() for testing with cache busting

/**
 * Fetch trivia questions from API with fallback
 * @param seed Optional seed for deterministic question ordering
 */
async function fetchTriviaFromApi(seed?: number): Promise<TriviaApiResponse[]> {
  for (const api of TRIVIA_APIS) {
    try {
      console.log(`🧠 Trying ${api.name}...`);
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
      const questions = api.parser(data, seed);
      
      if (questions && questions.length > 0) {
        console.log(`✅ Successfully fetched ${questions.length} questions from ${api.name}`);
        return questions;
      }
    } catch (error) {
      console.warn(`❌ ${api.name} failed:`, error);
    }
  }
  
  return [];
}

// Note: Legacy function removed as part of cleanup
// Use getFreshTrivia() for testing with cache busting

/**
 * Clear trivia cache (for testing)
 * Clears all trivia cache keys (category/difficulty combinations)
 */
export function clearTriviaCache(): void {
  try {
    // Clear all possible cache key combinations
    const categories = ['Film', 'Television', 'any'];
    const difficulties = ['easy', 'medium', 'hard', 'any'];
    const modes = ['daily'];
    
    for (const mode of modes) {
      for (const category of categories) {
        for (const difficulty of difficulties) {
          localStorage.removeItem(getTriviaDailyKey(category, difficulty, mode));
        }
      }
    }
    // Also clear legacy single key
    localStorage.removeItem('flicklet:daily-trivia');
    console.log('🗑️ Cleared trivia cache');
  } catch (error) {
    console.warn('Failed to clear trivia cache:', error);
  }
}

/**
 * Get recent fallback question IDs used for this context
 * Tracks last 50 fallback questions to avoid repetition
 * Config: Trivia fallback rotation - recent window: 50 questions
 */
function getRecentFallbackIds(contextKey: string): Set<string> {
  try {
    const key = `flicklet:trivia:fallback-recent:${contextKey}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const ids = JSON.parse(stored) as string[];
      return new Set(ids);
    }
  } catch (e) {
    console.warn('Failed to read recent fallback IDs:', e);
  }
  return new Set<string>();
}

/**
 * Update recent fallback question IDs
 * Stores last 50 fallback question IDs for rotation
 */
function updateRecentFallbackIds(contextKey: string, questionIds: string[]): void {
  try {
    const key = `flicklet:trivia:fallback-recent:${contextKey}`;
    const recent = getRecentFallbackIds(contextKey);
    
    // Add new IDs
    questionIds.forEach(id => recent.add(id));
    
    // Keep only last 50
    const idsArray = Array.from(recent);
    if (idsArray.length > 50) {
      idsArray.splice(0, idsArray.length - 50);
    }
    
    localStorage.setItem(key, JSON.stringify(idsArray));
  } catch (e) {
    console.warn('Failed to update recent fallback IDs:', e);
  }
}

/**
 * Select fallback questions with rotation to avoid repetition
 * Prefers questions not in recent window, falls back to all if needed
 * Config: Trivia fallback rotation - recent window: 50 questions
 */
function selectFallbackQuestionsWithRotation(
  needed: number,
  allFallback: Array<{ id: string; question: string; options: string[]; correctAnswer: number; explanation?: string; category: string; difficulty: string }>,
  contextKey: string
): Array<{ id: string; question: string; options: string[]; correctAnswer: number; explanation?: string; category: string; difficulty: string }> {
  const recentIds = getRecentFallbackIds(contextKey);
  
  // Separate into recent and non-recent
  const nonRecent = allFallback.filter(q => !recentIds.has(q.id));
  const recent = allFallback.filter(q => recentIds.has(q.id));
  
  // Prefer non-recent questions
  const selected: Array<{ id: string; question: string; options: string[]; correctAnswer: number; explanation?: string; category: string; difficulty: string }> = [];
  
  // First, take from non-recent pool
  for (let i = 0; i < needed && i < nonRecent.length; i++) {
    selected.push(nonRecent[i]);
  }
  
  // If we need more, take from recent pool
  if (selected.length < needed) {
    const remaining = needed - selected.length;
    for (let i = 0; i < remaining && i < recent.length; i++) {
      selected.push(recent[i]);
    }
  }
  
  // Update recent IDs
  if (selected.length > 0) {
    updateRecentFallbackIds(contextKey, selected.map(q => q.id));
  }
  
  return selected;
}

/**
 * Get cached trivia or fetch from API
 * Daily content is keyed off UTC date so users share the same daily content globally
 * Cache keys include category/difficulty to avoid cross-contamination
 * Config: Trivia caching - cache key includes category/difficulty/mode
 * 
 * @param gameNumber Optional game number (1-3) for Pro users to get deterministic question sets
 * @param category Optional category filter (defaults to 'any' for mixed categories)
 * @param difficulty Optional difficulty filter (defaults to 'any' for mixed difficulties)
 * @param mode Optional mode (defaults to 'daily')
 */
export async function getCachedTrivia(
  gameNumber?: number, 
  isPro?: boolean,
  category: string = 'any',
  difficulty: string = 'any',
  mode: string = 'daily'
): Promise<TriviaApiResponse[]> {
  const today = getDailySeedDate(); // UTC-based date for consistent daily content
  const contextKey = `${mode}:${category}:${difficulty}`;
  const cacheKey = getTriviaDailyKey(category, difficulty, mode);
  
  try {
    // Try to get from cache
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed: CachedTrivia = JSON.parse(cached);
      const cacheDate = parsed.date;
      
      // Use cache if it's from today and is a healthy set (20+ API questions)
      if (cacheDate === today) {
        // Validate cache version
        if (parsed.version !== CACHE_VERSIONS.TRIVIA_DAILY_QUESTIONS) {
          console.warn('🔄 Cache version mismatch, clearing old cache...');
          localStorage.removeItem(cacheKey);
          // Fall through to refetch
        } else {
          const questions = parsed.questions || [];
          const apiCount = parsed.apiQuestionCount ?? questions.length; // Default to all if not tracked
          
          // Only use cache if it's a healthy set (20+ API questions)
          // Config: Trivia caching policy - MIN_API_FOR_CACHE: 20
          if (questions.length >= 30 && apiCount >= MIN_API_FOR_CACHE) {
            console.log(`✅ Using cached trivia questions (${questions.length} questions, ${apiCount} from API)`);
            
            // Regular users: 10 questions (gameNumber = 1, questions 0-9)
            // Pro users: 30 questions (gameNumber 1-3, questions 0-9, 10-19, 20-29)
            // All users get the same questions (Regular gets first 10, Pro gets all 30)
            if (gameNumber !== undefined && gameNumber >= 1 && gameNumber <= 3) {
              const startIndex = isPro ? (gameNumber - 1) * 10 : 0; // Regular always starts at 0
              const endIndex = startIndex + 10;
              const gameQuestions = questions.slice(startIndex, endIndex);
              console.log(`🎯 Returning questions for game ${gameNumber} (${isPro ? "Pro" : "Regular"}): ${gameQuestions.length} questions`);
              return gameQuestions;
            }
            
            // Return questions based on Pro status if no gameNumber specified
            return isPro ? questions.slice(0, 30) : questions.slice(0, 10);
          } else {
            console.warn(`⚠️ Cached trivia is degraded (${apiCount} API questions, need ${MIN_API_FOR_CACHE}+). Refetching...`);
            // Cache is degraded, will refetch below
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to read cache:', error);
  }
  
  // Cache miss or expired - fetch from API
  // Use UTC date as seed for deterministic question ordering (ensures global consistency)
  // ALL users get 30 questions per day (same for everyone)
  const dateSeed = parseInt(today.replace(/-/g, ''), 10);
  console.log('🔄 Fetching trivia from API with UTC seed:', dateSeed);
  
  // Fetch from multiple endpoints to get 30 questions (all users get 30 questions per day)
  const allApiQuestions: TriviaApiResponse[] = [];
  const questionsNeeded = 30; // All users get 30 questions per day
  
  /**
   * Fetch with retry logic (exponential backoff)
   * Rate limit handling: On 429, immediately fail to avoid further rate limiting
   * @param url API URL
   * @param maxRetries Maximum number of retry attempts (reduced for rate limit safety)
   * @param initialDelay Initial delay in milliseconds
   */
  const fetchWithRetry = async (url: string, maxRetries: number = 1, initialDelay: number = 2000): Promise<Response> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Flicklet/1.0'
          }
        });

        if (!response.ok) {
          // Handle 429 (Too Many Requests) - immediately fail to avoid further rate limiting
          // We'll use fallback questions instead
          if (response.status === 429) {
            console.warn(`⚠️ Rate limited (429) from OpenTriviaDB. Using fallback questions to avoid further rate limits.`);
            throw new Error(`HTTP 429: Too Many Requests - Rate limited`);
          }
          
          // Don't retry on other 4xx errors (client errors)
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`HTTP ${response.status}`);
          }
          // Retry on 5xx errors (server errors) and network errors
          throw new Error(`HTTP ${response.status}`);
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on 429 - immediately fail to use fallback
        if (lastError.message.includes('429')) {
          throw lastError; // Immediately throw to stop retrying
        }
        
        // Don't retry on last attempt or if it's a 4xx error
        if (attempt < maxRetries && !lastError.message.includes('HTTP 4')) {
          const delay = initialDelay * Math.pow(2, attempt); // Exponential backoff
          console.warn(`⚠️ API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }
    
    throw lastError || new Error('Failed to fetch after retries');
  };
  
  // Try each API endpoint and accumulate questions until we have enough
  // Add delay between API calls to avoid rate limiting
  // Rate limit handling: Stop immediately on 429 to avoid further rate limiting
  let rateLimited = false;
  for (let i = 0; i < TRIVIA_APIS.length; i++) {
    if (allApiQuestions.length >= questionsNeeded || rateLimited) break;
    
    // Add delay between API calls (except first one) - increased to 2 seconds to reduce rate limiting
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between API calls
    }
    
    const api = TRIVIA_APIS[i];
    try {
      console.log(`🧠 Trying ${api.name} for additional questions...`);
      const response = await fetchWithRetry(api.url);
      const data = await response.json();
      const questions = api.parser(data, dateSeed);
      
      if (questions && questions.length > 0) {
        // Add questions we don't already have (dedupe by question text)
        const existingQuestions = new Set(allApiQuestions.map(q => q.question));
        for (const q of questions) {
          if (!existingQuestions.has(q.question) && allApiQuestions.length < questionsNeeded) {
            allApiQuestions.push(q);
          }
        }
        console.log(`✅ Added ${questions.length} questions from ${api.name}, total: ${allApiQuestions.length}`);
      }
    } catch (error) {
      console.warn(`❌ ${api.name} failed:`, error);
      // If we get rate limited, immediately stop trying more APIs
      if (error instanceof Error && error.message.includes('429')) {
        console.warn('⚠️ Rate limited (429), stopping all API calls immediately. Will use fallback questions.');
        rateLimited = true;
        break; // Stop immediately, don't try other APIs
      }
    }
  }
  
  const apiQuestions = allApiQuestions;
  
  // If no API questions at all, use fallback-only path
  if (apiQuestions.length === 0) {
    return await getFallbackOnlyQuestions(questionsNeeded, contextKey, gameNumber, isPro);
  }
  const apiQuestionCount = apiQuestions.length;
  
  // Supplement with fallback questions if needed
  const finalQuestions = [...apiQuestions];
  let fallbackQuestionCount = 0;
  
  if (apiQuestionCount < questionsNeeded) {
    console.warn(`⚠️ Only got ${apiQuestionCount} questions from API, need ${questionsNeeded}. Using fallback questions with rotation.`);
    
    // Import fallback questions
    const { SAMPLE_TRIVIA_QUESTIONS } = await import('./triviaQuestions');
    
    // Use fallback questions with rotation to fill remaining slots
    const existingQuestionTexts = new Set(apiQuestions.map(q => q.question));
    const availableFallback = SAMPLE_TRIVIA_QUESTIONS
      .filter(q => !existingQuestionTexts.has(q.question))
      .map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        category: q.category,
        difficulty: q.difficulty
      }));
    
    // Select fallback questions with rotation (avoids recent questions)
    const fallbackNeeded = questionsNeeded - apiQuestionCount;
    const selectedFallback = selectFallbackQuestionsWithRotation(
      fallbackNeeded,
      availableFallback,
      contextKey
    );
    
    // Convert fallback questions to API format
    const fallbackApiQuestions: TriviaApiResponse[] = selectedFallback.map(q => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      category: q.category,
      difficulty: q.difficulty as 'easy' | 'medium' | 'hard'
    }));
    
    finalQuestions.push(...fallbackApiQuestions);
    fallbackQuestionCount = fallbackApiQuestions.length;
    console.log(`✅ Added ${fallbackQuestionCount} fallback questions with rotation, total: ${finalQuestions.length}`);
  }
  
  // Caching policy: Only cache "healthy" sets (20+ API questions)
  // Degraded sets (mostly fallback) are used for this session but not cached long-term
  // Config: Trivia caching policy - MIN_API_FOR_CACHE: 20
  // This prevents locking in small, repetitive question pools
  const isHealthySet = apiQuestionCount >= MIN_API_FOR_CACHE;
  
  if (isHealthySet && finalQuestions.length >= 30) {
    try {
      // Cache healthy sets (20+ API questions)
      const questionsToCache = finalQuestions.slice(0, 30);
      
      localStorage.setItem(cacheKey, JSON.stringify({
        date: today,
        questions: questionsToCache,
        apiQuestionCount: apiQuestionCount,
        fallbackQuestionCount: fallbackQuestionCount,
        version: CACHE_VERSIONS.TRIVIA_DAILY_QUESTIONS
      }));
      console.log(`💾 Cached healthy trivia set (${questionsToCache.length} questions: ${apiQuestionCount} API, ${fallbackQuestionCount} fallback)`);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error("❌ localStorage quota exceeded. Cannot cache trivia questions.");
      } else {
        console.warn('Failed to cache trivia:', error);
      }
    }
  } else {
    // Degraded set - use for this session but don't cache
    // This prevents locking in small, repetitive question pools
    console.warn(`⚠️ Degraded set (${apiQuestionCount} API questions, need ${MIN_API_FOR_CACHE}+). Using for this session but not caching.`);
  }
  
  // Regular users: 10 questions (gameNumber = 1, questions 0-9)
  // Pro users: 30 questions (gameNumber 1-3, questions 0-9, 10-19, 20-29)
  // All users get the same questions (Regular gets first 10, Pro gets all 30)
  if (gameNumber !== undefined && gameNumber >= 1 && gameNumber <= 3) {
    const startIndex = isPro ? (gameNumber - 1) * 10 : 0; // Regular always starts at 0
    const endIndex = startIndex + 10;
    const gameQuestions = finalQuestions.slice(startIndex, endIndex);
    console.log(`🎯 Returning questions for game ${gameNumber} (${isPro ? "Pro" : "Regular"}): ${gameQuestions.length} questions`);
    return gameQuestions;
  }
  
  // Return questions based on Pro status if no gameNumber specified
  return isPro ? finalQuestions.slice(0, 30) : finalQuestions.slice(0, 10);
}

// Complete API failure - use fallback questions with rotation
async function getFallbackOnlyQuestions(
  questionsNeeded: number,
  contextKey: string,
  gameNumber?: number,
  isPro?: boolean
): Promise<TriviaApiResponse[]> {
  console.warn('⚠️ API returned no questions, using fallback questions with rotation');
  const { SAMPLE_TRIVIA_QUESTIONS } = await import('./triviaQuestions');
  
  const availableFallback = SAMPLE_TRIVIA_QUESTIONS.map(q => ({
    id: q.id,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    category: q.category,
    difficulty: q.difficulty
  }));
  
  const selectedFallback = selectFallbackQuestionsWithRotation(
    questionsNeeded,
    availableFallback,
    contextKey
  );
  
  const fallbackApiQuestions: TriviaApiResponse[] = selectedFallback.map(q => ({
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    category: q.category,
    difficulty: q.difficulty as 'easy' | 'medium' | 'hard'
  }));
  
  // Don't cache fallback-only sets (they're degraded)
  console.log(`✅ Using ${fallbackApiQuestions.length} fallback questions (not caching - degraded set)`);
  
  if (gameNumber !== undefined && gameNumber >= 1 && gameNumber <= 3) {
    const startIndex = isPro ? (gameNumber - 1) * 10 : 0;
    const endIndex = startIndex + 10;
    return fallbackApiQuestions.slice(startIndex, endIndex);
  }
  
  return isPro ? fallbackApiQuestions.slice(0, 30) : fallbackApiQuestions.slice(0, 10);
}

/**
 * Force refresh trivia (bypass cache for testing)
 */
export async function getFreshTrivia(): Promise<TriviaApiResponse[]> {
  // Clear cache first
  clearTriviaCache();
  
  // Force API fetch
  console.log('🔄 Force fetching fresh trivia from API...');
  const apiQuestions = await fetchTriviaFromApi();
  
  if (apiQuestions && apiQuestions.length > 0) {
    console.log('✅ Got fresh trivia from API:', apiQuestions.length, 'questions');
    return apiQuestions;
  }

  // Use different test questions for testing
  const testQuestions: TriviaApiResponse[] = [
    {
      question: 'Which movie won Best Picture in 2024?',
      options: ['Oppenheimer', 'Barbie', 'Killers of the Flower Moon', 'Poor Things'],
      correctAnswer: 0,
      explanation: 'Oppenheimer won Best Picture at the 96th Academy Awards.',
      category: 'Awards',
      difficulty: 'medium'
    },
    {
      question: 'What is the highest-grossing animated movie?',
      options: ['Frozen II', 'The Lion King (2019)', 'Incredibles 2', 'Toy Story 4'],
      correctAnswer: 1,
      explanation: 'The Lion King (2019) is the highest-grossing animated movie.',
      category: 'Box Office',
      difficulty: 'easy'
    },
    {
      question: 'Which streaming service produced "The Mandalorian"?',
      options: ['Netflix', 'Disney+', 'Amazon Prime', 'HBO Max'],
      correctAnswer: 1,
      explanation: 'The Mandalorian is a Disney+ original series.',
      category: 'Streaming',
      difficulty: 'easy'
    },
    {
      question: 'Who directed "Dune" (2021)?',
      options: ['Denis Villeneuve', 'Christopher Nolan', 'Ridley Scott', 'James Cameron'],
      correctAnswer: 0,
      explanation: 'Denis Villeneuve directed Dune (2021).',
      category: 'Directors',
      difficulty: 'medium'
    },
    {
      question: 'What year was "Top Gun: Maverick" released?',
      options: ['2020', '2021', '2022', '2023'],
      correctAnswer: 2,
      explanation: 'Top Gun: Maverick was released in 2022.',
      category: 'History',
      difficulty: 'easy'
    }
  ];
  
  console.log('🔄 Using fresh test questions');
  return testQuestions;
}
