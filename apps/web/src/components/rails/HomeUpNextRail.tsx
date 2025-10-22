import { useMemo, useState, useEffect } from 'react';
import UpNextCard from '../cards/UpNextCard';
import { useLibrary } from '../../lib/storage';
import { useTranslations } from '../../lib/language';
import { useSettings, getPersonalityText } from '../../lib/settings';
import { getShowStatusInfo } from '../../utils/showStatus';

export default function HomeUpNextRail() {
  const watching = useLibrary('watching');
  const translations = useTranslations();
  const settings = useSettings();
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Listen for library updates to force re-render
  useEffect(() => {
    const handleLibraryUpdate = () => {
      console.log('🔄 Library updated, forcing re-render of UpNextRail');
      setForceUpdate(prev => prev + 1);
    };
    
    const handleForceRefresh = () => {
      console.log('🔄 Force refresh triggered for UpNextRail');
      setForceUpdate(prev => prev + 1);
    };
    
    window.addEventListener('library:updated', handleLibraryUpdate);
    window.addEventListener('force-refresh', handleForceRefresh);
    return () => {
      window.removeEventListener('library:updated', handleLibraryUpdate);
      window.removeEventListener('force-refresh', handleForceRefresh);
    };
  }, []);
  
  const items = useMemo(() => {
    // Get all TV shows from watching list
    const tvShows = watching.filter(i => i.mediaType === 'tv');
    
    // Separate shows with dates vs without dates
    const showsWithDates = tvShows
      .filter(i => !!i.nextAirDate)
      .sort((a,b) => String(a.nextAirDate).localeCompare(String(b.nextAirDate)));
    
    const showsWithoutDates = tvShows
      .filter(i => !i.nextAirDate && !getShowStatusInfo(i.showStatus)?.isCompleted)
      .sort((a,b) => {
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
    
    // Combine: shows with dates first, then shows without dates
    const combined = [...showsWithDates, ...showsWithoutDates].slice(0, 12);
    
    console.log('🔍 HomeUpNextRail items:', combined.map(item => ({
      title: item.title,
      nextAirDate: item.nextAirDate,
      showStatus: item.showStatus,
      hasDate: !!item.nextAirDate
    })));
    
    return combined;
  }, [watching, forceUpdate]);

  return (
    <div>
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
