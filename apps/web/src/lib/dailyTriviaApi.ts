// Trivia API Service
// Provides trivia questions with cache busting for testing

interface TriviaApiResponse {
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'multiple' | 'boolean';
}

// Cache key for localStorage
const TRIVIA_CACHE_KEY = 'flicklet:trivia-question';

// Fallback trivia questions for when API fails
const FALLBACK_TRIVIA = [
  {
    question: "What is the highest-grossing film of all time?",
    correct_answer: "Avatar",
    incorrect_answers: ["Titanic", "Avengers: Endgame", "Star Wars: The Force Awakens"],
    category: "Entertainment: Film",
    difficulty: "easy",
    type: "multiple"
  },
  {
    question: "Which TV show features the character Walter White?",
    correct_answer: "Breaking Bad",
    incorrect_answers: ["The Sopranos", "Mad Men", "The Wire"],
    category: "Entertainment: Television",
    difficulty: "easy",
    type: "multiple"
  },
  {
    question: "What year was the first Star Wars film released?",
    correct_answer: "1977",
    incorrect_answers: ["1975", "1978", "1976"],
    category: "Entertainment: Film",
    difficulty: "medium",
    type: "multiple"
  }
];

// Note: Legacy function removed as part of cleanup
// Use getFreshTrivia() for testing with cache busting

/**
 * Fetch trivia from API with fallback
 */
async function fetchTriviaFromApi(): Promise<TriviaApiResponse | null> {
  try {
    console.log(`🎯 Trying Open Trivia Database API...`);
    const response = await fetch('https://opentdb.com/api.php?amount=1&category=11&difficulty=easy&type=multiple', {
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
    
    if (data.results && data.results.length > 0) {
      const trivia = data.results[0];
      console.log(`✅ Successfully fetched trivia from API`);
      return {
        question: trivia.question,
        correct_answer: trivia.correct_answer,
        incorrect_answers: trivia.incorrect_answers,
        category: trivia.category,
        difficulty: trivia.difficulty,
        type: trivia.type
      };
    }
  } catch (error) {
    console.warn(`❌ Open Trivia Database API failed:`, error);
  }
  
  return null;
}

/**
 * Clear cached trivia (for testing)
 */
export function clearTriviaCache(): void {
  try {
    localStorage.removeItem(TRIVIA_CACHE_KEY);
    console.log('🗑️ Cleared trivia cache');
  } catch (error) {
    console.warn('Failed to clear trivia cache:', error);
  }
}

/**
 * Force refresh trivia (bypass cache for testing)
 */
export async function getFreshTrivia(): Promise<TriviaApiResponse> {
  // Clear cache first
  clearTriviaCache();
  
  // Force API fetch
  console.log('🔄 Force fetching fresh trivia from API...');
  const apiTrivia = await fetchTriviaFromApi();
  
  if (apiTrivia) {
    console.log('✅ Got fresh trivia from API');
    return apiTrivia;
  }

  // Use a different random fallback trivia for testing
  const testTrivia = FALLBACK_TRIVIA[Math.floor(Math.random() * FALLBACK_TRIVIA.length)];
  
  console.log('🔄 Using random test trivia');
  return {
    question: testTrivia.question,
    correct_answer: testTrivia.correct_answer,
    incorrect_answers: testTrivia.incorrect_answers,
    category: testTrivia.category,
    difficulty: testTrivia.difficulty as 'easy' | 'medium' | 'hard',
    type: testTrivia.type as 'multiple' | 'boolean'
  };
}
