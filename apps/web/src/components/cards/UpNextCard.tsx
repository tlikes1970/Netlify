import { t, useLanguage } from "@/lib/language";
import { TitlePoster } from './TitlePoster';
import { useState, useEffect } from 'react';
import type { MediaItem } from './card.types';
import { fetchCurrentEpisodeInfo } from '../../tmdb/tv';
import { getShowStatusInfo, formatLastAirDate } from '../../utils/showStatus';
import { getNextAirDate, getValidatedNextAirDate, getNextAirStatus, getHumanizedAirDate, formatUpNextDate } from '../../lib/constants/metadata';
import { dlog } from '../../lib/log';

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
  useLanguage();
  const { title, year, nextAirDate, mediaType, id, showStatus, lastAirDate } = item;
  const [episodeInfo, setEpisodeInfo] = useState<string | null>(null);

  // Debug: Log the nextAirDate prop and timezone info
  dlog(`🔍 UpNextCard ${title} received nextAirDate:`, nextAirDate);
  dlog(`🌍 Current timezone:`, Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Get validated date and status
  const rawDate = getNextAirDate(item);
  const validatedDate = getValidatedNextAirDate(rawDate);
  const airStatus = getNextAirStatus(rawDate);

  // Fetch actual episode info from TMDB
  useEffect(() => {
    const fetchEpisodeInfo = async () => {
      try {
        const info = await fetchCurrentEpisodeInfo(Number(id));
        if (info) {
          setEpisodeInfo(`S${info.season.toString().padStart(2, '0')}E${info.episode.toString().padStart(2, '0')}`);
        }
      } catch (error) {
        dlog(`Failed to fetch episode info for ${title}:`, error);
      }
    };

    if (mediaType === 'tv') {
      fetchEpisodeInfo();
    }
  }, [id, title, mediaType]);

  // Determine if show is completed
  const statusInfo = getShowStatusInfo(showStatus);
  const isCompleted = statusInfo?.isCompleted || false;

  // Get the appropriate message based on show status and validated date
  const getStatusMessage = () => {
    if (isCompleted) {
      if (showStatus === 'Ended') {
        return t("episodesSeriesComplete");
      } else if (showStatus === 'Canceled') {
        return t("episodesSeriesCancelled");
      }
    }
    
    // If we have a validated date, show it with appropriate formatting
    if (validatedDate && airStatus !== 'tba') {
      const humanized = getHumanizedAirDate(rawDate);
      if (airStatus === 'soon') {
        // For soon dates, use humanized format (Today, Tomorrow, In X days)
        return t("episodesUpNextDate", { date: humanized });
      } else {
        // For future dates, use formatted date (Jan 14)
        return t("episodesUpNextDate", { date: formatUpNextDate(rawDate) });
      }
    }
    
    // If no valid date but show is returning/in production/planned, show status
    if (showStatus) {
      switch (showStatus) {
        case 'Returning Series':
          return t("episodesReturningSoon");
        case t("episodesInProduction"):
          return t("episodesInProduction");
        case t("episodesPlanned"):
          return t("episodesPlanned");
        default:
          return t("episodesComingSoon");
      }
    }
    
    return t("episodesComingSoon");
  };

  const getStatusColor = () => {
    if (isCompleted) {
      return showStatus === 'Canceled' ? '#dc2626' : 'var(--muted)'; // red for cancelled, muted for ended
    }
    
    // Different colors for shows without valid dates
    if (!validatedDate || airStatus === 'tba') {
      switch (showStatus) {
        case 'Returning Series':
          return '#16a34a'; // green - same as badge
        case t("episodesInProduction"):
          return '#ea580c'; // orange - same as badge
        case t("episodesPlanned"):
          return '#7c3aed'; // violet - same as badge
        default:
          return 'var(--accent)';
      }
    }
    
    // Color based on air status
    if (airStatus === 'soon') {
      return '#16a34a'; // green for soon dates
    }
    
    return 'var(--accent)'; // default blue for future dates
  };

  return (
    <article 
      className="up-next-card group select-none" 
      style={{ width: 'var(--poster-w, 160px)' }} 
      data-testid="up-next-card" 
      aria-label={title}
    >
      <div 
        className="relative border shadow-sm overflow-hidden"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)', borderRadius: 'var(--radius, 12px)' }}
      >
        {/* Poster (2:3) */}
        <div 
          className="poster-wrap relative aspect-[2/3] cursor-pointer" 
          role="img" 
          style={{ backgroundColor: 'var(--muted)' }}

        >
          <TitlePoster item={item} className="h-full w-full" />
        </div>

        {/* Content */}
        <div className="p-2 text-center">
          {/* Title */}
          <h3 
            className="font-bold text-sm mb-1 line-clamp-2 break-words min-h-[2.5em] leading-tight"
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
            {year || t("episodesTBA")}{episodeInfo ? ` • ${episodeInfo}` : ''}
          </div>

          {/* Status Message */}
          <div 
            className="text-xs font-medium" 
            style={{ color: getStatusColor() }}
          >
            {getStatusMessage()}
          </div>
          
          {/* Last Air Date for completed shows */}
          {isCompleted && lastAirDate && (
            <div 
              className="text-xs mt-1" 
              style={{ color: 'var(--muted)' }}
            >
              {t("episodesLastAired")} {formatLastAirDate(lastAirDate)}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
