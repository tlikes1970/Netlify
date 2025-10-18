import { useState, useEffect } from 'react';
import type { MediaItem } from './card.types';
import { useTranslations } from '../../lib/language';
import { OptimizedImage } from '../OptimizedImage';
import { fetchCurrentEpisodeInfo } from '../../tmdb/tv';

export type UpNextCardProps = {
  item: MediaItem;
};

/**
 * UpNextCard — special card design for "Up Next" rail
 * - Larger size (220px vs 154px)
 * - Shows "Up Next: [date]" instead of action buttons
 * - Displays episode information
 * - Matches the design mockup exactly
 */
export default function UpNextCard({ item }: UpNextCardProps) {
  const { title, year, posterUrl, nextAirDate, mediaType, id } = item;
  const translations = useTranslations();
  const [episodeInfo, setEpisodeInfo] = useState<string>('S01E01');

  // Debug: Log the nextAirDate prop and timezone info
  console.log(`🔍 UpNextCard ${title} received nextAirDate:`, nextAirDate);
  console.log(`🌍 Current timezone:`, Intl.DateTimeFormat().resolvedOptions().timeZone);

  const formatAirDate = (dateString: string) => {
    try {
      // Parse the date string as UTC to avoid timezone issues
      const date = new Date(dateString + 'T00:00:00Z'); // Force UTC interpretation
      const formatted = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        timeZone: 'UTC' // Ensure we're working in UTC
      });
      console.log(`📅 Formatting ${dateString} → ${formatted} (UTC)`);
      return formatted;
    } catch {
      return dateString;
    }
  };

  // Fetch actual episode info from TMDB
  useEffect(() => {
    const fetchEpisodeInfo = async () => {
      try {
        const info = await fetchCurrentEpisodeInfo(Number(id));
        if (info) {
          setEpisodeInfo(`S${info.season.toString().padStart(2, '0')}E${info.episode.toString().padStart(2, '0')}`);
        }
      } catch (error) {
        console.log(`Failed to fetch episode info for ${title}:`, error);
      }
    };

    if (mediaType === 'tv') {
      fetchEpisodeInfo();
    }
  }, [id, title, mediaType]);

  return (
    <article 
      className="up-next-card group select-none" 
      style={{ width: 'var(--poster-w, 120px)' }} 
      data-testid="up-next-card" 
      aria-label={title}
    >
      <div 
        className="relative border shadow-sm overflow-hidden"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)', borderRadius: 'var(--radius, 12px)' }}
      >
        {/* Poster (2:3) */}
        <div 
          className="poster-wrap relative aspect-[2/3]" 
          role="img" 
          aria-label={title}
          style={{ backgroundColor: 'var(--muted)' }}
        >
          {posterUrl ? (
            <OptimizedImage
              src={posterUrl}
              alt={title}
              context="poster"
              className="h-full w-full"
              loading="lazy"
            />
          ) : (
            <div 
              className="flex h-full w-full items-center justify-center text-xs"
              style={{ color: 'var(--muted)' }}
            >
              {translations.noPoster}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 text-center">
          {/* Title */}
          <h3 
            className="font-bold text-sm mb-1 truncate" 
            title={title}
            style={{ color: 'var(--text)' }}
          >
            {title}
          </h3>

          {/* Meta */}
          <div 
            className="text-xs mb-1" 
            style={{ color: 'var(--muted)' }}
          >
            {year || 'TBA'} • {episodeInfo}
          </div>

          {/* Up Next Date */}
          <div 
            className="text-xs font-medium" 
            style={{ color: 'var(--accent)' }}
          >
            Up Next: {formatAirDate(nextAirDate!)}
          </div>
        </div>
      </div>
    </article>
  );
}
