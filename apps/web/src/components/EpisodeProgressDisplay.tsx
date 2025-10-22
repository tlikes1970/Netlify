import { getEpisodeProgress, formatEpisodeProgress, getProgressColor } from '@/utils/episodeProgress';

interface EpisodeProgressDisplayProps {
  showId: number;
  totalEpisodes?: number;
  compact?: boolean;
  showPercentage?: boolean;
}

export function EpisodeProgressDisplay({ 
  showId, 
  totalEpisodes,
  compact = false, 
  showPercentage = false 
}: EpisodeProgressDisplayProps) {
  const progress = getEpisodeProgress(showId, totalEpisodes);
  
  if (!progress.hasProgress) return null;
  
  const progressText = formatEpisodeProgress(progress);
  const progressColor = getProgressColor(progress);
  
  if (compact) {
    return (
      <div className="flex items-center gap-1 text-xs" style={{ color: progressColor }}>
        <span className="font-medium">{progressText}</span>
        {showPercentage && (
          <span className="opacity-75">({progress.percentage}%)</span>
        )}
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
          style={{ 
            width: `${progress.percentage}%`,
            backgroundColor: progressColor
          }}
        />
      </div>
      
      {/* Progress text */}
      <div className="text-xs font-medium" style={{ color: progressColor }}>
        {progressText}
        {showPercentage && ` (${progress.percentage}%)`}
      </div>
    </div>
  );
}
