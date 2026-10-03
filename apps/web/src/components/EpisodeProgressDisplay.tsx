import { t as coreText, useLanguage } from "../lib/language";
import { useEffect, useState } from 'react';
import { getCurrentSeasonProgress } from '@/utils/episodeProgress';

interface EpisodeProgressDisplayProps {
  showId: number;
  totalEpisodes?: number;
  compact?: boolean;
  showPercentage?: boolean;
}

export function EpisodeProgressDisplay({ 
  showId, 
  compact = false, 
}: EpisodeProgressDisplayProps) {
  useLanguage();
  const [, refresh] = useState(0);
  useEffect(() => {
    const onUpdate = (event: Event) => {
      if ((event as CustomEvent<{ showId: number }>).detail?.showId === showId) refresh((value) => value + 1);
    };
    window.addEventListener('episode-progress:updated', onUpdate);
    return () => window.removeEventListener('episode-progress:updated', onUpdate);
  }, [showId]);
  const progress = getCurrentSeasonProgress(showId);
  if (!progress) return null;
  const next = progress.nextEpisode === null
    ? coreText('coreSeasonComplete', {season:progress.seasonNumber})
    : coreText('coreUpNextProgress', {season:progress.seasonNumber,episode:progress.nextEpisode});
  const progressText = `${next} · ${coreText('coreProgressWatched', {watched:progress.watched,total:progress.total})}`;
  
  if (compact) {
    return (
      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
        <span className="font-medium">{progressText}</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      {/* Progress bar */}
      <div 
        className="flex-1 h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--muted)' }}
      >
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{ width: `${progress.total ? Math.round((progress.watched / progress.total) * 100) : 0}%`, backgroundColor: 'var(--accent)' }}
        />
      </div>
      
      {/* Progress text */}
      <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
        {progressText}
      </div>
    </div>
  );
}
