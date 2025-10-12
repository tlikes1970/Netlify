import React from 'react';
import CardV2 from '../cards/CardV2';
import { useLibrary, Library } from '../../lib/storage';
import { useTranslations } from '../../lib/language';

export default function HomeYourShowsRail() {
  const items = useLibrary('watching');
  const translations = useTranslations();
  
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
                onWatched: i => Library.move(i.id, i.mediaType, 'watched'),
                onNotInterested: i => Library.move(i.id, i.mediaType, 'not'),
                onDelete: i => Library.remove(i.id, i.mediaType),
              }}
            />
          ))}
        </div>
      ) : (
        <div className="mt-2 text-sm text-neutral-400">
          {translations.noShowsInCurrentlyWatching} {translations.addSomeFromSearchOrDiscovery}
        </div>
      )}
    </section>
  );
}
