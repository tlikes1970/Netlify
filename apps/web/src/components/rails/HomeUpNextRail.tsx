import React, { useMemo } from 'react';
import CardV2 from '../cards/CardV2';
import { useLibrary } from '../../lib/storage';
import { useTranslations } from '../../lib/language';
import { useSettings, getPersonalityText } from '../../lib/settings';

export default function HomeUpNextRail() {
  const watching = useLibrary('watching');
  const translations = useTranslations();
  const settings = useSettings();
  
  const items = useMemo(() => watching
    .filter(i => i.mediaType === 'tv' && !!i.nextAirDate)
    .sort((a,b) => String(a.nextAirDate).localeCompare(String(b.nextAirDate)))
    .slice(0, 12)
  , [watching]);

  return (
    <section id="home-up-next" className="px-3 sm:px-4 py-3">
      <h2 className="text-base font-semibold">{translations.upNext}</h2>
      {items.length > 0 ? (
        <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(154px,1fr))] gap-3">
          {items.map(item => (
            <CardV2 key={`${item.mediaType}:${item.id}`} item={item} context="home" />
          ))}
        </div>
      ) : (
        <div className="mt-2 text-sm text-neutral-400">
          {getPersonalityText('emptyUpNext', settings.personalityLevel)} {translations.addTvShowsToWatchingList}
        </div>
      )}
    </section>
  );
}
