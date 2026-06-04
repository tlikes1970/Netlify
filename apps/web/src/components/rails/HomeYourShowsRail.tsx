// import { useMemo } from 'react'; // Unused
import CardV2 from '../cards/CardV2';
import { useLibrary, Library } from '../../lib/storage';
import { removeMediaItemWithConfirmation } from '../../lib/confirmRemoveShow';
import { useTranslations } from '../../lib/language';
import { useSettings, getPersonalityText, DEFAULT_PERSONALITY } from '../../lib/settings';

export default function HomeYourShowsRail() {
  const items = useLibrary('watching');
  const translations = useTranslations();
  const settings = useSettings();
  
  return (
    <div data-onboarding-id="currently-watching-section">
      <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--text)' }}>{translations.currentlyWatching}</h3>
      {items.length > 0 ? (
        <div
          data-cards
          className="flex gap-3 overflow-x-auto snap-x snap-proximity pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent rail-scroll"
        >
          {items.map(item => (
            <div key={`${item.mediaType}:${item.id}`} className="flex-shrink-0">
              <CardV2
                item={item}
                context="home-cw-preview"
                disableSwipe={true}
                disableOverflow={true}
                actions={{
                  onWant: i => Library.move(i.id, i.mediaType, 'wishlist'),
                  onWatched: i => Library.move(i.id, i.mediaType, 'watched'),
                  onNotInterested: i => Library.move(i.id, i.mediaType, 'not'),
                  onDelete: (i) => removeMediaItemWithConfirmation(i),
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-neutral-400">
          {getPersonalityText(settings.personality || DEFAULT_PERSONALITY, 'emptyWatching')} {translations.addSomeFromSearchOrDiscovery}
        </div>
      )}
    </div>
  );
}
