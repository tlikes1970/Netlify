// Trivia API Service
// Provides trivia questions from external APIs with fallback
// Daily content is keyed off UTC date so users share the same daily content globally

import { getDailySeedDate } from './dailySeed';

interface TriviaApiResponse {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Cache key for localStorage
const CACHE_KEY = 'flicklet:daily-trivia';

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
    localStorage.removeItem(CACHE_KEY);
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
export async function getCachedTrivia(gameNumber?: number): Promise<TriviaApiResponse[]> {
  const today = getDailySeedDate(); // UTC-based date for consistent daily content
  
  try {
    // Try to get from cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      const cacheDate = parsed.date;
      
      // Use cache if it's from today
      if (cacheDate === today) {
        console.log('✅ Using cached trivia questions');
        const questions = parsed.questions || [];
        
        // For Pro users with gameNumber, return specific slice
        if (gameNumber !== undefined && gameNumber >= 1 && gameNumber <= 3) {
          const startIndex = (gameNumber - 1) * 10;
          const endIndex = startIndex + 10;
          const gameQuestions = questions.slice(startIndex, endIndex);
          console.log(`🎯 Returning questions for game ${gameNumber}: ${gameQuestions.length} questions`);
          return gameQuestions;
        }
        
        return questions;
      }
    }
  } catch (error) {
    console.warn('Failed to read cache:', error);
  }
  
  // Cache miss or expired - fetch from API
  // Use UTC date as seed for deterministic question ordering (ensures global consistency)
  const dateSeed = parseInt(today.replace(/-/g, ''), 10);
  console.log('🔄 Fetching trivia from API with UTC seed:', dateSeed);
  
  // Fetch from multiple endpoints to get 30 questions (3 games × 10 questions for Pro users)
  const allApiQuestions: TriviaApiResponse[] = [];
  const questionsNeeded = 30; // Max needed for Pro users
  
  // Try each API endpoint and accumulate questions until we have enough
  for (const api of TRIVIA_APIS) {
    if (allApiQuestions.length >= questionsNeeded) break;
    
    try {
      console.log(`🧠 Trying ${api.name} for additional questions...`);
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
    }
  }
  
  const apiQuestions = allApiQuestions;
  
  if (apiQuestions && apiQuestions.length > 0) {
    if (apiQuestions.length < questionsNeeded) {
      console.warn(`⚠️ Only got ${apiQuestions.length} questions, need ${questionsNeeded} for Pro users`);
      // Will supplement with fallback questions if needed
    }
    
    // Save to cache
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        date: today,
        questions: apiQuestions
      }));
      console.log('💾 Cached trivia questions');
    } catch (error) {
      console.warn('Failed to cache trivia:', error);
    }
    
    // For Pro users with gameNumber, return specific slice
    if (gameNumber !== undefined && gameNumber >= 1 && gameNumber <= 3) {
      const startIndex = (gameNumber - 1) * 10;
      const endIndex = startIndex + 10;
      const gameQuestions = apiQuestions.slice(startIndex, endIndex);
      console.log(`🎯 Returning questions for game ${gameNumber}: ${gameQuestions.length} questions`);
      return gameQuestions;
    }
    
    return apiQuestions;
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
