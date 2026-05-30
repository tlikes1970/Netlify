import { useMemo } from 'react';
import UpNextCard from '../cards/UpNextCard';
import { useTranslations } from '../../lib/language';
import { useSettings, getPersonalityText, DEFAULT_PERSONALITY } from '../../lib/settings';
import { useReturningShows } from '../../state/selectors/useReturningShows';
import { HOME_UP_NEXT_LIMIT } from '../../lib/upNextShows';

export default function HomeUpNextRail() {
  const translations = useTranslations();
  const settings = useSettings();
  const allItems = useReturningShows();
  const items = useMemo(
    () => allItems.slice(0, HOME_UP_NEXT_LIMIT),
    [allItems]
  );

  return (
    <div data-onboarding-id="up-next-section">
      <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--text)' }}>{translations.upNext}</h3>
      {items.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {items.map(item => (
            <div key={`${item.mediaType}:${item.id}:${item.nextAirDate ?? 'tba'}`} className="flex-shrink-0">
              <UpNextCard item={item} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-neutral-400">
          {getPersonalityText(settings.personality || DEFAULT_PERSONALITY, 'emptyUpNext')} {translations.addTvShowsToWatchingList}
        </div>
      )}
    </div>
  );
}
