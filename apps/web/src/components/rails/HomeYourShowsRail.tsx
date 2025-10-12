import React from 'react';
import CardV2 from '../cards/CardV2';
import { useLibrary, Library } from '../../lib/storage';
import { useTranslations } from '../../lib/language';
import { useSettings, getPersonalityText } from '../../lib/settings';

export default function HomeYourShowsRail() {
  const items = useLibrary('watching');
  const translations = useTranslations();
  const settings = useSettings();
  
  return (
    <section id="home-your-shows" className="px-3 sm:px-4 py-3">
      <h2 className="text-base font-semibold">{translations.yourShows}</h2>
      {items.length > 0 ? (
        <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(154px,1fr))] gap-3">
          {items.map(item => (
            <CardV2
              key={`${item.mediaType}:${item.id}`}
              item={item}
              context="tab-watching"
              actions={{
                onWant: i => Library.move(i.id, i.mediaType, 'wishlist'),
                onWatched: i => Library.move(i.id, i.mediaType, 'watched'),
                onNotInterested: i => Library.move(i.id, i.mediaType, 'not'),
                onDelete: i => Library.remove(i.id, i.mediaType),
              }}
            />
          ))}
        </div>
      ) : (
        <div className="mt-2 text-sm text-neutral-400">
          {getPersonalityText('emptyWatching', settings.personalityLevel)} {translations.addSomeFromSearchOrDiscovery}
        </div>
      )}
    </section>
  );
}
