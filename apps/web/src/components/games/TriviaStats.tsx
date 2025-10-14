import React, { useState, useEffect } from 'react';
import { useTranslations } from '@/lib/language';

interface TriviaStats {
  games: number;
  wins: number;
  losses: number;
  correct: number;
  total: number;
  streak: number;
  maxStreak: number;
}

const TriviaStats: React.FC = () => {
  const translations = useTranslations();
  const [stats, setStats] = useState<TriviaStats>({
    games: 0,
    wins: 0,
    losses: 0,
    correct: 0,
    total: 0,
    streak: 0,
    maxStreak: 0,
  });

  const loadStats = () => {
    try {
      const storedStats = JSON.parse(localStorage.getItem('trivia:stats') || '{}');
      const triviaStats = storedStats.trivia || storedStats || {};
      setStats({
        games: triviaStats.games || 0,
        wins: triviaStats.wins || 0,
        losses: triviaStats.losses || 0,
        correct: triviaStats.correct || 0,
        total: triviaStats.total || 0,
        streak: triviaStats.streak || 0,
        maxStreak: triviaStats.maxStreak || 0,
      });
    } catch (e) {
      console.error('Failed to load Trivia stats from localStorage', e);
    }
  };

  useEffect(() => {
    loadStats();
    // Listen for custom event to update stats after a game
    const handleStatsUpdate = () => loadStats();
    window.addEventListener('trivia:statsUpdated', handleStatsUpdate);
    return () => window.removeEventListener('trivia:statsUpdated', handleStatsUpdate);
  }, []);

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  const winRate = stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0;

  return (
    <div className="trivia-stats">
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">{translations.played || 'Played'}</span>
          <span className="stat-value">{stats.games}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{translations.accuracy || 'Accuracy'}</span>
          <span className="stat-value">{accuracy}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{translations.streak || 'Streak'}</span>
          <span className="stat-value">{stats.streak}</span>
        </div>
      </div>
    </div>
  );
};

export default TriviaStats;

