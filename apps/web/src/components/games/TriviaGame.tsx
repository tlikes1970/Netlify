import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from '@/lib/language';
import { useSettings } from '@/lib/settings';

interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface TriviaGameProps {
  onClose?: () => void;
  onGameComplete?: (score: number, total: number) => void;
}

export default function TriviaGame({ onClose, onGameComplete }: TriviaGameProps) {
  // const translations = useTranslations(); // Unused
  const settings = useSettings();
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'completed'>('loading');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isProUser, setIsProUser] = useState(false);

  // Sample trivia questions (in a real app, these would come from an API)
  const sampleQuestions: TriviaQuestion[] = [
    {
      id: '1',
      question: 'Which movie won the Academy Award for Best Picture in 2023?',
      options: ['Everything Everywhere All at Once', 'The Banshees of Inisherin', 'Top Gun: Maverick', 'Avatar: The Way of Water'],
      correctAnswer: 0,
      explanation: 'Everything Everywhere All at Once won Best Picture at the 95th Academy Awards.',
      category: 'Awards',
      difficulty: 'medium'
    },
    {
      id: '2',
      question: 'What is the highest-grossing movie of all time?',
      options: ['Avatar', 'Avengers: Endgame', 'Titanic', 'Star Wars: The Force Awakens'],
      correctAnswer: 0,
      explanation: 'Avatar (2009) holds the record for highest-grossing movie worldwide.',
      category: 'Box Office',
      difficulty: 'easy'
    },
    {
      id: '3',
      question: 'Which streaming service produced "Stranger Things"?',
      options: ['Hulu', 'Netflix', 'Amazon Prime', 'Disney+'],
      correctAnswer: 1,
      explanation: 'Stranger Things is a Netflix original series.',
      category: 'Streaming',
      difficulty: 'easy'
    },
    {
      id: '4',
      question: 'Who directed "The Dark Knight"?',
      options: ['Christopher Nolan', 'Zack Snyder', 'Tim Burton', 'Martin Scorsese'],
      correctAnswer: 0,
      explanation: 'Christopher Nolan directed The Dark Knight (2008).',
      category: 'Directors',
      difficulty: 'medium'
    },
    {
      id: '5',
      question: 'What year was the first "Star Wars" movie released?',
      options: ['1975', '1977', '1979', '1981'],
      correctAnswer: 1,
      explanation: 'Star Wars: Episode IV - A New Hope was released in 1977.',
      category: 'History',
      difficulty: 'medium'
    }
  ];

  // Check if user is Pro (simplified check)
  useEffect(() => {
    // In a real app, this would check the user's subscription status
    setIsProUser(false); // Default to free user
  }, [settings.pro]);

  // Load questions
  useEffect(() => {
    const loadQuestions = () => {
      // Free users get first 10 questions, Pro users get up to 50
      const maxQuestions = isProUser ? 50 : 10;
      const availableQuestions = sampleQuestions.slice(0, maxQuestions);
      
      // Shuffle questions
      const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
      setGameState('playing');
    };

    if (gameState === 'loading') {
      loadQuestions();
    }
  }, [gameState, isProUser]);

  const handleAnswerSelect = useCallback((answerIndex: number) => {
    if (selectedAnswer !== null) return; // Prevent multiple selections
    
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    if (answerIndex === questions[currentQuestionIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  }, [selectedAnswer, questions, currentQuestionIndex]);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setGameState('completed');
      onGameComplete?.(score, questions.length);
    }
  }, [currentQuestionIndex, questions.length, score, onGameComplete]);

  const handleRestart = useCallback(() => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowExplanation(false);
    setGameState('loading');
  }, []);

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (gameState === 'loading') {
    return (
      <div className="trivia-game">
        <div className="trivia-loading">
          <div className="loading-spinner"></div>
          <p>Loading trivia questions...</p>
        </div>
      </div>
    );
  }

  if (gameState === 'completed') {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="trivia-game">
        <div className="trivia-completed">
          <h3>🎉 Quiz Complete!</h3>
          <div className="score-display">
            <div className="score-circle">
              <span className={`score-percentage ${getScoreColor(percentage)}`}>
                {percentage}%
              </span>
              <span className="score-fraction">
                {score}/{questions.length}
              </span>
            </div>
          </div>
          
          <div className="score-message">
            {percentage >= 80 && <p>🏆 Excellent! You're a movie trivia master!</p>}
            {percentage >= 60 && percentage < 80 && <p>👍 Good job! You know your movies!</p>}
            {percentage < 60 && <p>📚 Keep watching! You'll get better!</p>}
          </div>
          
          <div className="completion-actions">
            <button className="btn-primary" onClick={handleRestart}>
              Play Again
            </button>
            {onClose && (
              <button className="btn-secondary" onClick={onClose}>
                Close
              </button>
            )}
          </div>
          
          {!isProUser && (
            <div className="pro-upsell">
              <p>🔒 Want more questions? Upgrade to Pro for 50 daily trivia questions!</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="trivia-game">
      {/* Header */}
      <div className="trivia-header">
        <h3>🧠 Daily Trivia</h3>
        <div className="trivia-progress">
          <span>{currentQuestionIndex + 1}/{questions.length}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="trivia-question">
        <div className="question-meta">
          <span className="category">{currentQuestion.category}</span>
          <span className="difficulty">{currentQuestion.difficulty}</span>
        </div>
        <h4>{currentQuestion.question}</h4>
      </div>

      {/* Options */}
      <div className="trivia-options">
        {currentQuestion.options.map((option, index) => {
          let className = 'option-btn';
          
          if (selectedAnswer !== null) {
            if (index === currentQuestion.correctAnswer) {
              className += ' correct';
            } else if (index === selectedAnswer && index !== currentQuestion.correctAnswer) {
              className += ' incorrect';
            } else {
              className += ' disabled';
            }
          }
          
          return (
            <button
              key={index}
              className={className}
              onClick={() => handleAnswerSelect(index)}
              disabled={selectedAnswer !== null}
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {showExplanation && currentQuestion.explanation && (
        <div className="trivia-explanation">
          <p>{currentQuestion.explanation}</p>
        </div>
      )}

      {/* Actions */}
      <div className="trivia-actions">
        {selectedAnswer !== null && (
          <button className="btn-primary" onClick={handleNextQuestion}>
            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
          </button>
        )}
        
        {onClose && (
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}

