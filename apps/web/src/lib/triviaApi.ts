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

interface CachedTrivia {
  questions: TriviaApiResponse[];
  date: string;
  timestamp: number;
}

// Cache key for localStorage
const CACHE_KEY = 'flicklet:daily-trivia';

// API endpoints to try (in order of preference)
const TRIVIA_APIS: Array<{
  name: string;
  url: string;
  parser: (data: any) => TriviaApiResponse[];
}> = [
  {
    name: 'OpenTriviaDB',
    url: 'https://opentdb.com/api.php?amount=10&category=10&difficulty=medium&type=multiple&encode=url3986',
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
            category: 'Entertainment',
            difficulty: item.difficulty as 'easy' | 'medium' | 'hard'
          };
        });
      }
      return [];
    }
  },
  {
    name: 'OpenTriviaDB (Easy)',
    url: 'https://opentdb.com/api.php?amount=10&category=10&difficulty=easy&type=multiple&encode=url3986',
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
            category: 'Entertainment',
            difficulty: 'easy' as const
          };
        });
      }
      return [];
    }
  }
];

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Check if cached trivia is for today
 */
function isCachedTriviaValid(cached: CachedTrivia): boolean {
  return cached.date === getTodayString();
}

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

/**
 * Get today's trivia questions (same for all players)
 */
export async function getTodaysTrivia(): Promise<TriviaApiResponse[]> {
  const today = getTodayString();
  
  // Check cache first
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsedCache: CachedTrivia = JSON.parse(cached);
      if (isCachedTriviaValid(parsedCache)) {
        console.log(`📦 Using cached trivia for ${today}: ${parsedCache.questions.length} questions`);
        return parsedCache.questions;
      }
    }
  } catch (error) {
    console.warn('Failed to read cached trivia:', error);
  }

  // Try to fetch from API
  console.log(`🌐 Fetching new trivia for ${today}...`);
  const apiQuestions = await fetchTriviaFromApi();
  
  if (apiQuestions && apiQuestions.length > 0) {
    // Cache the API questions
    const cacheData: CachedTrivia = {
      questions: apiQuestions,
      date: today,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log(`💾 Cached ${apiQuestions.length} trivia questions`);
    } catch (error) {
      console.warn('Failed to cache trivia:', error);
    }
    
    return apiQuestions;
  }

  // Fallback to deterministic questions
  const fallbackQuestions = getDeterministicQuestions(today);
  console.log(`🔄 Using fallback trivia for ${today}: ${fallbackQuestions.length} questions`);
  
  // Cache the fallback questions
  const cacheData: CachedTrivia = {
    questions: fallbackQuestions,
    date: today,
    timestamp: Date.now()
  };
  
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache fallback trivia:', error);
  }

  return fallbackQuestions;
}

/**
 * Get deterministic questions based on date
 */
function getDeterministicQuestions(date: string): TriviaApiResponse[] {
  // Use date as seed for deterministic question selection
  const seed = date.split('-').join('');
  const seedNumber = parseInt(seed, 10);
  
  // Fallback questions pool
  const fallbackQuestions: TriviaApiResponse[] = [
    {
      question: 'Which movie won the Academy Award for Best Picture in 2023?',
      options: ['Everything Everywhere All at Once', 'The Banshees of Inisherin', 'Top Gun: Maverick', 'Avatar: The Way of Water'],
      correctAnswer: 0,
      explanation: 'Everything Everywhere All at Once won Best Picture at the 95th Academy Awards.',
      category: 'Awards',
      difficulty: 'medium'
    },
    {
      question: 'What is the highest-grossing movie of all time?',
      options: ['Avatar', 'Avengers: Endgame', 'Titanic', 'Star Wars: The Force Awakens'],
      correctAnswer: 0,
      explanation: 'Avatar (2009) holds the record for highest-grossing movie worldwide.',
      category: 'Box Office',
      difficulty: 'easy'
    },
    {
      question: 'Which streaming service produced "Stranger Things"?',
      options: ['Hulu', 'Netflix', 'Amazon Prime', 'Disney+'],
      correctAnswer: 1,
      explanation: 'Stranger Things is a Netflix original series.',
      category: 'Streaming',
      difficulty: 'easy'
    },
    {
      question: 'Who directed "The Dark Knight"?',
      options: ['Christopher Nolan', 'Zack Snyder', 'Tim Burton', 'Martin Scorsese'],
      correctAnswer: 0,
      explanation: 'Christopher Nolan directed The Dark Knight (2008).',
      category: 'Directors',
      difficulty: 'medium'
    },
    {
      question: 'What year was the first "Star Wars" movie released?',
      options: ['1975', '1977', '1979', '1981'],
      correctAnswer: 1,
      explanation: 'Star Wars: Episode IV - A New Hope was released in 1977.',
      category: 'History',
      difficulty: 'medium'
    }
  ];
  
  // Select 5 questions deterministically
  const selectedQuestions = [];
  for (let i = 0; i < 5; i++) {
    const questionIndex = (seedNumber + i) % fallbackQuestions.length;
    selectedQuestions.push(fallbackQuestions[questionIndex]);
  }
  
  return selectedQuestions;
}

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
