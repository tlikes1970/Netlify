/**
 * Process: FlickWord Game Review
 * Purpose: Display completed FlickWord games for review
 * Data Source: Completed games from gameReview.ts
 * Update Path: Loads from localStorage on mount
 * Dependencies: gameReview.ts, analytics.ts
 */

import { useState, useEffect } from 'react';
import { useSettings } from '@/lib/settings';
import { getCompletedFlickWordGames, type CompletedFlickWordGame } from '../../lib/gameReview';
import { getDailySeedDate } from '../../lib/dailySeed';
import { trackGameReview, trackFlickWordShare } from '../../lib/analytics';

interface FlickWordReviewProps {
  onClose?: () => void;
}

export default function FlickWordReview({ onClose }: FlickWordReviewProps) {
  const settings = useSettings();
  const [completedGames, setCompletedGames] = useState<CompletedFlickWordGame[]>([]);

  useEffect(() => {
    const games = getCompletedFlickWordGames();
    setCompletedGames(games);
    
    // Track review view
    trackGameReview('flickword', null);
  }, []);

  const isProUser = settings.pro.isPro;

  // Generate share text for a single game
  const generateSingleShareText = (game: CompletedFlickWordGame): string => {
    const lines: string[] = [];
    const gameLabel = isProUser ? ` Game ${game.gameNumber}` : '';
    lines.push(`FlickWord ${game.date}${gameLabel}`);
    lines.push('');
    
    for (let i = 0; i < game.guesses.length; i++) {
      const result = game.lastResults[i] || [];
      const line = result.map(status => {
        if (status === 'correct') return '🟩';
        if (status === 'present') return '🟨';
        return '⬜';
      }).join('');
      lines.push(line);
    }
    
    lines.push('');
    lines.push('Play FlickWord at flicklet.app');
    
    return lines.join('\n');
  };

  // Generate share text for all games (Pro only)
  const generateAllShareText = (): string => {
    const lines: string[] = [];
    lines.push(`FlickWord ${getDailySeedDate()} - All Games`);
    lines.push('');
    
    completedGames.forEach((game, idx) => {
      if (idx > 0) lines.push('');
      lines.push(`Game ${game.gameNumber}:`);
      for (let i = 0; i < game.guesses.length; i++) {
        const result = game.lastResults[i] || [];
        const line = result.map(status => {
          if (status === 'correct') return '🟩';
          if (status === 'present') return '🟨';
          return '⬜';
        }).join('');
        lines.push(line);
      }
    });
    
    lines.push('');
    lines.push('Play FlickWord at flicklet.app');
    
    return lines.join('\n');
  };

  const handleShare = async (gameNumber?: number) => {
    let shareText = '';
    
    if (gameNumber) {
      const game = completedGames.find(g => g.gameNumber === gameNumber);
      if (!game) return;
      shareText = generateSingleShareText(game);
      trackFlickWordShare(gameNumber, 'single');
    } else {
      shareText = generateAllShareText();
      trackFlickWordShare(null, 'all');
    }
    
    const shareUrl = `${window.location.origin}/?game=flickword`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'FlickWord',
          text: shareText,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        alert('Share text copied to clipboard!');
      }
      setShowShareModal(false);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
          alert('Share text copied to clipboard!');
          setShowShareModal(false);
        } catch {
          alert('Failed to share');
        }
      }
    }
  };

  if (completedGames.length === 0) {
    return (
      <div className="fw-review">
        <div className="fw-review-empty">
          <h3>No Completed Games</h3>
          <p>Complete a game to review your results here!</p>
          {onClose && (
            <button className="fw-btn fw-btn-close" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fw-review">
      <div className="fw-review-header">
        <h3>📊 Today&apos;s Games</h3>
        {onClose && (
          <button className="fw-btn fw-btn-close" onClick={onClose}>
            ×
          </button>
        )}
      </div>
      
      <div className="fw-review-games">
        {completedGames.map((game) => (
          <div key={game.gameNumber} className="fw-review-game">
            <div className="fw-review-game-header">
              <h4>Game {game.gameNumber}</h4>
              <span className={`fw-review-status ${game.won ? 'won' : 'lost'}`}>
                {game.won ? '✅ Won' : '❌ Lost'}
              </span>
            </div>
            
            <div className="fw-review-grid">
              {game.guesses.map((guess, i) => {
                const result = game.lastResults[i] || [];
                return (
                  <div key={i} className="fw-review-row">
                    {result.map((status, j) => (
                      <div
                        key={j}
                        className={`fw-review-tile ${status}`}
                        aria-label={`${guess[j]}, ${status}`}
                      >
                        {guess[j]}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            
            <div className="fw-review-game-info">
              <p>Word: <strong>{game.target}</strong></p>
              <p>Guesses: {game.guesses.length}/6</p>
            </div>
            
            <button
              className="fw-btn fw-btn-share"
              onClick={() => handleShare(game.gameNumber)}
            >
              Share Game {game.gameNumber}
            </button>
          </div>
        ))}
      </div>
      
      {isProUser && completedGames.length === 3 && (
        <div className="fw-review-actions">
          <button
            className="fw-btn fw-btn-primary"
            onClick={() => handleShare()}
          >
            Share All 3 Games
          </button>
        </div>
      )}
    </div>
  );
}

