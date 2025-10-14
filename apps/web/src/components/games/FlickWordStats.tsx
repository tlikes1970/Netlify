import { useState, useEffect } from 'react';
import { useTranslations } from '@/lib/language';

interface FlickWordStats {
  games: number;
  wins: number;
  losses: number;
  streak: number;
  maxStreak: number;
  winRate: number;
}

interface FlickWordStatsProps {
  onGameComplete?: (won: boolean, guesses: number) => void;
}

export default function FlickWordStats({ onGameComplete }: FlickWordStatsProps) {
  const translations = useTranslations();
  const [stats, setStats] = useState<FlickWordStats>({
    games: 0,
    wins: 0,
    losses: 0,
    streak: 0,
    maxStreak: 0,
    winRate: 0
  });

  // Load stats from localStorage
  useEffect(() => {
    const loadStats = () => {
      try {
        const stored = localStorage.getItem('flickword:stats');
        if (stored) {
          const data = JSON.parse(stored);
          const flickwordStats = data.flickword || data;
          
          setStats({
            games: flickwordStats.games || 0,
            wins: flickwordStats.wins || 0,
            losses: flickwordStats.losses || 0,
            streak: flickwordStats.streak || 0,
            maxStreak: flickwordStats.maxStreak || 0,
            winRate: flickwordStats.games > 0 ? Math.round((flickwordStats.wins / flickwordStats.games) * 100) : 0
          });
        }
      } catch (error) {
        console.error('Failed to load FlickWord stats:', error);
      }
    };

    loadStats();
  }, []);

  // Update stats when game completes
  useEffect(() => {
    if (onGameComplete) {
      const handleGameComplete = (won: boolean) => {
        setStats(prevStats => {
          const newStats = {
            games: prevStats.games + 1,
            wins: prevStats.wins + (won ? 1 : 0),
            losses: prevStats.losses + (won ? 0 : 1),
            streak: won ? prevStats.streak + 1 : prevStats.streak,
            maxStreak: won ? Math.max(prevStats.maxStreak, prevStats.streak + 1) : prevStats.maxStreak,
            winRate: 0 // Will be calculated below
          };
          
          newStats.winRate = Math.round((newStats.wins / newStats.games) * 100);
          
          // Save to localStorage
          try {
            const existingData = JSON.parse(localStorage.getItem('flicklet-data') || '{}');
            const updatedData = {
              ...existingData,
              flickword: {
                games: newStats.games,
                wins: newStats.wins,
                losses: newStats.losses,
                streak: newStats.streak,
                maxStreak: newStats.maxStreak
              }
            };
            localStorage.setItem('flicklet-data', JSON.stringify(updatedData));
            localStorage.setItem('flickword:stats', JSON.stringify(updatedData));
          } catch (error) {
            console.error('Failed to save FlickWord stats:', error);
          }
          
          return newStats;
        });
      };

      // Store the handler for external access
      (window as any).handleFlickWordGameComplete = handleGameComplete;
    }
  }, [onGameComplete]);

  return (
    <div className="flickword-stats">
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">{translations.games || 'Games'}</span>
          <span className="stat-value">{stats.games}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{translations.won || 'Won'}</span>
          <span className="stat-value">{stats.wins}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{translations.lost || 'Lost'}</span>
          <span className="stat-value">{stats.losses}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{translations.streak || 'Streak'}</span>
          <span className="stat-value">{stats.streak}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{translations.best || 'Best'}</span>
          <span className="stat-value">{stats.maxStreak}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{translations.win_percent || 'Win %'}</span>
          <span className="stat-value">{stats.winRate}%</span>
        </div>
      </div>
    </div>
  );
}
