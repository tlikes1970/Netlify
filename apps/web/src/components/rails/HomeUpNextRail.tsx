import { useMemo } from 'react';
import UpNextCard from '../cards/UpNextCard';
import { useLibrary } from '../../lib/storage';
import { useTranslations } from '../../lib/language';
import { useSettings, getPersonalityText } from '../../lib/settings';
import { getShowStatusInfo } from '../../utils/showStatus';
import { getNextAirDate, getValidatedNextAirDate, getNextAirStatus } from '../../lib/constants/metadata';

export default function HomeUpNextRail() {
  const watching = useLibrary('watching');
  const translations = useTranslations();
  const settings = useSettings();
  
  // No need for separate event listener - useLibrary('watching') already subscribes
  // and will cause re-render when Library updates. This prevents double updates.
  
  const items = useMemo(() => {
    // Get all TV shows from watching list
    const tvShows = watching.filter(i => i.mediaType === 'tv');
    
    // Filter out completed shows (Ended/Canceled) - they shouldn't appear in Up Next
    const activeShows = tvShows.filter(i => {
      const statusInfo = getShowStatusInfo(i.showStatus);
      return !statusInfo?.isCompleted;
    });
    
    // Process shows with validated dates
    const showsWithValidDates = activeShows
      .map(show => {
        const rawDate = getNextAirDate(show);
        const validatedDate = getValidatedNextAirDate(rawDate);
        const airStatus = getNextAirStatus(rawDate);
        return { show, validatedDate, airStatus };
      })
      .filter(({ validatedDate, airStatus: _airStatus }) => validatedDate !== null && _airStatus !== 'tba')
      .sort((a, b) => {
        // Sort by status: soon first, then future
        if (a.airStatus === 'soon' && b.airStatus !== 'soon') return -1;
        if (a.airStatus !== 'soon' && b.airStatus === 'soon') return 1;
        // Within same status, sort by date
        if (a.validatedDate && b.validatedDate) {
          return a.validatedDate.getTime() - b.validatedDate.getTime();
        }
        return 0;
      })
      .map(({ show }) => show);
    
    // Shows without valid dates (TBA) - exclude completed shows
    const showsWithoutDates = activeShows
      .filter(i => {
        const rawDate = getNextAirDate(i);
        const _validatedDate = getValidatedNextAirDate(rawDate);
        return _validatedDate === null; // No valid date
      })
      .sort((a, b) => {
        // Sort by status priority: Returning Series > In Production > Planned
        const statusPriority = (status: string) => {
          switch (status) {
            case 'Returning Series': return 1;
            case 'In Production': return 2;
            case 'Planned': return 3;
            default: return 4;
          }
        };
        return statusPriority(a.showStatus || '') - statusPriority(b.showStatus || '');
      });
    
    // Combine: shows with valid dates first, then shows without dates
    const combined = [...showsWithValidDates, ...showsWithoutDates].slice(0, 12);
    
    console.log('🔍 HomeUpNextRail items:', combined.map(item => ({
      title: item.title,
      nextAirDate: item.nextAirDate,
      showStatus: item.showStatus,
      hasValidDate: getValidatedNextAirDate(getNextAirDate(item)) !== null
    })));
    
    return combined;
  }, [watching]);

  return (
    <div data-onboarding-id="up-next-section">
      <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--text)' }}>{translations.upNext}</h3>
      {items.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {items.map(item => (
            <div key={`${item.mediaType}:${item.id}:${item.nextAirDate}`} className="flex-shrink-0">
              <UpNextCard item={item} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-neutral-400">
          {getPersonalityText('emptyUpNext', settings.personalityLevel)} {translations.addTvShowsToWatchingList}
        </div>
      )}
    </div>
  );
}
