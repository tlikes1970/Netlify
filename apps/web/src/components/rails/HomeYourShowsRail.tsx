import { useMemo } from 'react';
import CardV2 from '../cards/CardV2';
import { useLibrary, Library } from '../../lib/storage';
import { useTranslations } from '../../lib/language';
import { useSettings, getPersonalityText } from '../../lib/settings';

export default function HomeYourShowsRail() {
  const items = useLibrary('watching');
  const translations = useTranslations();
  const settings = useSettings();
  
  return (
    <div>
      <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--text)' }}>{translations.currentlyWatching}</h3>
      {items.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {items.map(item => (
            <div key={`${item.mediaType}:${item.id}`} className="flex-shrink-0">
              <CardV2
                item={item}
                context="tab-watching"
                disableSwipe={true}
                actions={{
                  onWant: i => Library.move(i.id, i.mediaType, 'wishlist'),
                  onWatched: i => Library.move(i.id, i.mediaType, 'watched'),
                  onNotInterested: i => Library.move(i.id, i.mediaType, 'not'),
                  onDelete: i => Library.remove(i.id, i.mediaType),
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-neutral-400">
          {getPersonalityText('emptyWatching', settings.personalityLevel)} {translations.addSomeFromSearchOrDiscovery}
        </div>
      )}
    </div>
  );
}
