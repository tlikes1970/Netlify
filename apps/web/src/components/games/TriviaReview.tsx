/**
 * Process: Trivia Game Review
 * Purpose: Display completed Trivia games for review
 * Data Source: Completed games from gameReview.ts
 * Update Path: Loads from localStorage on mount
 * Dependencies: gameReview.ts, analytics.ts
 */

import { useState, useEffect } from 'react';
import { useSettings } from '@/lib/settings';
import { getCompletedTriviaGames, type CompletedTriviaGame } from '../../lib/gameReview';
import { getDailySeedDate } from '../../lib/dailySeed';
import { trackGameReview } from '../../lib/analytics';

interface TriviaReviewProps {
  onClose?: () => void;
}

export default function TriviaReview({ onClose }: TriviaReviewProps) {
  const settings = useSettings();
  const [completedGames, setCompletedGames] = useState<CompletedTriviaGame[]>([]);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);

  useEffect(() => {
    const games = getCompletedTriviaGames();
    setCompletedGames(games);
    
    // Track review view
    trackGameReview('trivia', null);
  }, []);

  const isProUser = settings.pro.isPro;
  const maxGames = isProUser ? 3 : 1;

  if (completedGames.length === 0) {
    return (
      <div className="trivia-review">
        <div className="trivia-review-empty">
          <h3>No Completed Games</h3>
          <p>Complete a game to review your results here!</p>
          {onClose && (
            <button className="btn-secondary" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  const selectedGameData = selectedGame !== null 
    ? completedGames.find(g => g.gameNumber === selectedGame)
    : null;

  return (
    <div className="trivia-review">
      <div className="trivia-review-header">
        <h3>📊 Today&apos;s Games</h3>
        {onClose && (
          <button className="btn-secondary" onClick={onClose}>
            ×
          </button>
        )}
      </div>
      
      <div className="trivia-review-games">
        {completedGames.map((game) => (
          <div key={game.gameNumber} className="trivia-review-game">
            <div className="trivia-review-game-header">
              <h4>Game {game.gameNumber}</h4>
              <span className={`trivia-review-score ${game.percentage >= 60 ? 'passed' : 'failed'}`}>
                {game.score}/{game.total} ({game.percentage}%)
              </span>
            </div>
            
            <div className="trivia-review-summary">
              <p>
                <strong>Score:</strong> {game.score} out of {game.total} correct
              </p>
              <p>
                <strong>Result:</strong> {game.percentage >= 60 ? '✅ Passed' : '❌ Failed'} 
                {game.percentage >= 60 && ' (60%+ required)'}
              </p>
            </div>
            
            <button
              className="btn-secondary"
              onClick={() => setSelectedGame(selectedGame === game.gameNumber ? null : game.gameNumber)}
            >
              {selectedGame === game.gameNumber ? 'Hide Details' : 'Show Details'}
            </button>
            
            {selectedGame === game.gameNumber && selectedGameData && (
              <div className="trivia-review-details">
                {selectedGameData.questions.map((q, idx) => (
                  <div key={idx} className={`trivia-review-question ${q.isCorrect ? 'correct' : 'incorrect'}`}>
                    <p className="question-text">
                      <strong>Q{idx + 1}:</strong> {q.question}
                    </p>
                    <p className="answer-text">
                      Your answer: <strong>{q.selectedAnswer >= 0 ? 'Option ' + (q.selectedAnswer + 1) : 'Not answered'}</strong>
                      {q.isCorrect ? ' ✅' : ' ❌'}
                    </p>
                    {!q.isCorrect && (
                      <p className="correct-answer-text">
                        Correct answer: <strong>Option {q.correctAnswer + 1}</strong>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

