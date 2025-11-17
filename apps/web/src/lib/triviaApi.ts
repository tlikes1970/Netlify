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
}

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
 */
export function clearTriviaCache(): void {
  try {
    localStorage.removeItem(getTriviaDailyKey());
    console.log('🗑️ Cleared trivia cache');
  } catch (error) {
    console.warn('Failed to clear trivia cache:', error);
  }
}

/**
 * Get cached trivia or fetch from API
 * Daily content is keyed off UTC date so users share the same daily content globally
 * @param gameNumber Optional game number (1-3) for Pro users to get deterministic question sets
 */
export async function getCachedTrivia(gameNumber?: number, isPro?: boolean): Promise<TriviaApiResponse[]> {
  const today = getDailySeedDate(); // UTC-based date for consistent daily content
  
  try {
    // Try to get from cache
    const cached = localStorage.getItem(getTriviaDailyKey());
    if (cached) {
      const parsed: CachedTrivia = JSON.parse(cached);
      const cacheDate = parsed.date;
      
      // Use cache if it's from today and has at least 30 questions
      if (cacheDate === today) {
        // Validate cache version
        if (parsed.version !== CACHE_VERSIONS.TRIVIA_DAILY_QUESTIONS) {
          console.warn('🔄 Cache version mismatch, clearing old cache...');
          localStorage.removeItem(getTriviaDailyKey());
          // Fall through to refetch
        } else {
          const questions = parsed.questions || [];
          
          // Validate cache has at least 30 questions (all users need 30 per day)
          if (questions.length >= 30) {
          console.log(`✅ Using cached trivia questions (${questions.length} questions)`);
          
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
            console.warn(`⚠️ Cached trivia has only ${questions.length} questions, need 30. Refetching...`);
            // Cache has insufficient questions, will refetch below
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
   * @param url API URL
   * @param maxRetries Maximum number of retry attempts
   * @param initialDelay Initial delay in milliseconds
   */
  const fetchWithRetry = async (url: string, maxRetries: number = 3, initialDelay: number = 1000): Promise<Response> => {
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
          // Don't retry on 4xx errors (client errors)
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`HTTP ${response.status}`);
          }
          // Retry on 5xx errors (server errors) and network errors
          throw new Error(`HTTP ${response.status}`);
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on last attempt
        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt); // Exponential backoff
          console.warn(`⚠️ API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Failed to fetch after retries');
  };
  
  // Try each API endpoint and accumulate questions until we have enough
  for (const api of TRIVIA_APIS) {
    if (allApiQuestions.length >= questionsNeeded) break;
    
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
      console.warn(`❌ ${api.name} failed after retries:`, error);
    }
  }
  
  const apiQuestions = allApiQuestions;
  
  if (apiQuestions && apiQuestions.length > 0) {
    if (apiQuestions.length < questionsNeeded) {
      console.warn(`⚠️ Only got ${apiQuestions.length} questions, need ${questionsNeeded} for all users`);
      // Will supplement with fallback questions if needed
    }
    
    // Save to cache (only cache if we have at least 30 questions)
    if (apiQuestions.length >= 30) {
      try {
        localStorage.setItem(getTriviaDailyKey(), JSON.stringify({
          date: today,
          questions: apiQuestions.slice(0, 30), // Ensure exactly 30 questions cached
          version: CACHE_VERSIONS.TRIVIA_DAILY_QUESTIONS
        }));
        console.log('💾 Cached trivia questions (30 questions for all users)');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.error("❌ localStorage quota exceeded. Cannot cache trivia questions.");
        } else {
          console.warn('Failed to cache trivia:', error);
        }
      }
    } else {
      console.warn(`⚠️ Only have ${apiQuestions.length} questions, not caching (need 30)`);
    }
    
    // Regular users: 10 questions (gameNumber = 1, questions 0-9)
    // Pro users: 30 questions (gameNumber 1-3, questions 0-9, 10-19, 20-29)
    // All users get the same questions (Regular gets first 10, Pro gets all 30)
    if (gameNumber !== undefined && gameNumber >= 1 && gameNumber <= 3) {
      const startIndex = isPro ? (gameNumber - 1) * 10 : 0; // Regular always starts at 0
      const endIndex = startIndex + 10;
      const gameQuestions = apiQuestions.slice(startIndex, endIndex);
      console.log(`🎯 Returning questions for game ${gameNumber} (${isPro ? "Pro" : "Regular"}): ${gameQuestions.length} questions`);
      return gameQuestions;
    }
    
    // Return questions based on Pro status if no gameNumber specified
    return isPro ? apiQuestions.slice(0, 30) : apiQuestions.slice(0, 10);
  }
  
  console.warn('⚠️ API returned no questions, falling back to hardcoded questions');
  return [];
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
