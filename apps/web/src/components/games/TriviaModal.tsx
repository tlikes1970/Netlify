import React, { useEffect, useRef } from 'react';
import TriviaGame from './TriviaGame';
import { useTranslations } from '@/lib/language';

interface TriviaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TriviaModal: React.FC<TriviaModalProps> = ({ isOpen, onClose }) => {
  const translations = useTranslations();
  const modalRef = useRef<HTMLDivElement>(null);

  const handleGameComplete = (score: number, total: number) => {
    console.log('Trivia completed:', { score, total });
    // Update stats in localStorage
    try {
      const storedStats = JSON.parse(localStorage.getItem('trivia:stats') || '{}');
      const triviaStats = storedStats.trivia || {};

      triviaStats.games = (triviaStats.games || 0) + 1;
      triviaStats.correct = (triviaStats.correct || 0) + score;
      triviaStats.total = (triviaStats.total || 0) + total;
      
      const isWin = score === total;
      triviaStats.wins = (triviaStats.wins || 0) + (isWin ? 1 : 0);
      triviaStats.losses = (triviaStats.losses || 0) + (isWin ? 0 : 1);
      
      // Update streak
      if (isWin) {
        triviaStats.streak = (triviaStats.streak || 0) + 1;
        if (triviaStats.streak > (triviaStats.maxStreak || 0)) {
          triviaStats.maxStreak = triviaStats.streak;
        }
      } else {
        triviaStats.streak = 0; // Reset streak on loss
      }

      localStorage.setItem('trivia:stats', JSON.stringify({ ...storedStats, trivia: triviaStats }));
      window.dispatchEvent(new CustomEvent('trivia:statsUpdated'));
    } catch (e) {
      console.error('Failed to update trivia stats:', e);
    }
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="game-modal" role="dialog" aria-modal="true" aria-labelledby="trivia-modal-title">
      <div className="gm-overlay" onClick={onClose}></div>
      <div className="gm-dialog" ref={modalRef}>
        <div className="gm-header">
          <h3 id="trivia-modal-title">{translations.daily_trivia || 'Daily Trivia'}</h3>
          <button className="gm-close" onClick={onClose} aria-label={translations.close_game || 'Close Game'}>
            &times;
          </button>
        </div>
        <div className="gm-body">
          <TriviaGame onClose={onClose} onGameComplete={handleGameComplete} />
        </div>
      </div>
    </div>
  );
};

export default TriviaModal;
