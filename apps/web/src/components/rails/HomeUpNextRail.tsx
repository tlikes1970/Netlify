import React, { useMemo, useState, useEffect } from 'react';
import UpNextCard from '../cards/UpNextCard';
import { useLibrary } from '../../lib/storage';
import { useTranslations } from '../../lib/language';
import { useSettings, getPersonalityText } from '../../lib/settings';

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
    const filtered = watching
      .filter(i => i.mediaType === 'tv' && !!i.nextAirDate)
      .sort((a,b) => String(a.nextAirDate).localeCompare(String(b.nextAirDate)))
      .slice(0, 12);
    
    console.log('🔍 HomeUpNextRail items:', filtered.map(item => ({
      title: item.title,
      nextAirDate: item.nextAirDate
    })));
    
    return filtered;
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
