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

type FlickWordStatsProps = Record<string, never>;

export default function FlickWordStats(_props: FlickWordStatsProps) {
  const translations = useTranslations();
  const [stats, setStats] = useState<FlickWordStats>({
    games: 0,
    wins: 0,
    losses: 0,
    streak: 0,
    maxStreak: 0,
    winRate: 0
  });

  // Refresh stats when component mounts or when stats might have changed
  useEffect(() => {
    const loadStats = () => {
      try {
        // Try multiple possible keys
        const stored = localStorage.getItem('flickword:stats') || 
                      localStorage.getItem('flicklet-data') ||
                      localStorage.getItem('flicklet:stats');
        
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
    
    // Refresh on cross-tab storage and same-tab custom event
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'flickword:stats' || e.key === 'flicklet-data') {
        loadStats();
      }
    };
    const handleLocalUpdate = () => loadStats();
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('flickword:stats-updated', handleLocalUpdate as any);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('flickword:stats-updated', handleLocalUpdate as any);
    };
  }, []);

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
