// Trivia API Service
// Provides trivia questions from external APIs with fallback

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

// API endpoints to try (in order of preference)
// OpenTriviaDB Categories:
// 11 = Entertainment: Film (Movies)
// 14 = Entertainment: Television (TV Shows)
const TRIVIA_APIS: Array<{
  name: string;
  url: string;
  parser: (data: any) => TriviaApiResponse[];
}> = [
  {
    name: 'OpenTriviaDB - Movies',
    url: 'https://opentdb.com/api.php?amount=10&category=11&difficulty=medium&type=multiple&encode=url3986',
    parser: (data: any) => {
      if (data.response_code === 0 && data.results && data.results.length > 0) {
        return data.results.map((item: any) => {
          const correctAnswer = decodeURIComponent(item.correct_answer);
          const incorrectAnswers = item.incorrect_answers.map((ans: string) => decodeURIComponent(ans));
          const allChoices = [correctAnswer, ...incorrectAnswers];

          // Shuffle choices and track correct index
          const shuffledChoices = [...allChoices].sort(() => Math.random() - 0.5);
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
    parser: (data: any) => {
      if (data.response_code === 0 && data.results && data.results.length > 0) {
        return data.results.map((item: any) => {
          const correctAnswer = decodeURIComponent(item.correct_answer);
          const incorrectAnswers = item.incorrect_answers.map((ans: string) => decodeURIComponent(ans));
          const allChoices = [correctAnswer, ...incorrectAnswers];

          const shuffledChoices = [...allChoices].sort(() => Math.random() - 0.5);
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
    parser: (data: any) => {
      if (data.response_code === 0 && data.results && data.results.length > 0) {
        return data.results.map((item: any) => {
          const correctAnswer = decodeURIComponent(item.correct_answer);
          const incorrectAnswers = item.incorrect_answers.map((ans: string) => decodeURIComponent(ans));
          const allChoices = [correctAnswer, ...incorrectAnswers];

          const shuffledChoices = [...allChoices].sort(() => Math.random() - 0.5);
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
    parser: (data: any) => {
      if (data.response_code === 0 && data.results && data.results.length > 0) {
        return data.results.map((item: any) => {
          const correctAnswer = decodeURIComponent(item.correct_answer);
          const incorrectAnswers = item.incorrect_answers.map((ans: string) => decodeURIComponent(ans));
          const allChoices = [correctAnswer, ...incorrectAnswers];

          const shuffledChoices = [...allChoices].sort(() => Math.random() - 0.5);
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
 */
async function fetchTriviaFromApi(): Promise<TriviaApiResponse[]> {
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
      const questions = api.parser(data);
      
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
 */
export async function getCachedTrivia(): Promise<TriviaApiResponse[]> {
  try {
    // Try to get from cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      const cacheDate = new Date(parsed.date);
      const now = new Date();
      
      // Use cache if it's from today
      if (cacheDate.toDateString() === now.toDateString()) {
        console.log('✅ Using cached trivia questions');
        return parsed.questions;
      }
    }
  } catch (error) {
    console.warn('Failed to read cache:', error);
  }
  
  // Cache miss or expired - fetch from API
  console.log('🔄 Fetching trivia from API...');
  const apiQuestions = await fetchTriviaFromApi();
  
  if (apiQuestions && apiQuestions.length > 0) {
    // Save to cache
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        date: new Date().toISOString(),
        questions: apiQuestions
      }));
      console.log('💾 Cached trivia questions');
    } catch (error) {
      console.warn('Failed to cache trivia:', error);
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
