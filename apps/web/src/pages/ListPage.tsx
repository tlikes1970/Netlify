import TabCard from '@/components/cards/TabCard';
import type { MediaItem } from '@/components/cards/card.types';
import { Library, LibraryEntry } from '@/lib/storage';
import { useSettings, getPersonalityText } from '@/lib/settings';

export default function ListPage({ title, items, mode = 'watching' }: {
  title: string;
  items: LibraryEntry[];
  mode?: 'watching'|'want'|'watched'|'discovery';
}) {
  const settings = useSettings();
  
  // Map mode to CardV2 context
  const context = mode === 'watching' ? 'tab-watching' : 'tab-foryou';

  // Get appropriate empty state text based on title
  const getEmptyText = () => {
    if (title.toLowerCase().includes('watching')) {
      return getPersonalityText('emptyWatching', settings.personalityLevel);
    } else if (title.toLowerCase().includes('wishlist') || title.toLowerCase().includes('want')) {
      return getPersonalityText('emptyWishlist', settings.personalityLevel);
    } else if (title.toLowerCase().includes('watched')) {
      return getPersonalityText('emptyWatched', settings.personalityLevel);
    }
    return getPersonalityText('empty', settings.personalityLevel);
  };

  // Action handlers using new Library system
  const actions = {
    onWant: (item: MediaItem) => {
      if (item.id && item.mediaType) {
        Library.upsert({ id: item.id, mediaType: item.mediaType, title: item.title }, 'wishlist');
      }
    },
    onWatched: (item: MediaItem) => {
      if (item.id && item.mediaType) {
        Library.move(item.id, item.mediaType, 'watched');
      }
    },
    onNotInterested: (item: MediaItem) => {
      if (item.id && item.mediaType) {
        Library.move(item.id, item.mediaType, 'not');
      }
    },
    onDelete: (item: MediaItem) => {
      if (item.id && item.mediaType) {
        Library.remove(item.id, item.mediaType);
      }
    },
    onRatingChange: (item: MediaItem, rating: number) => {
      if (item.id && item.mediaType) {
        Library.updateRating(item.id, item.mediaType, rating);
      }
    },
  };

  console.log(`🔍 ListPage(${title}) rendering:`, { itemsCount: items.length, items: items.slice(0, 2) });

  return (
    <section className="px-4 py-4">
      <h1 className="mb-3 text-base font-semibold" style={{ color: 'var(--text)' }}>{title}</h1>
      {items.length > 0 ? (
        <div className="space-y-0">
          {items.map(item => {
            // LibraryEntry already has all MediaItem properties
            const mediaItem: MediaItem = {
              id: item.id,
              mediaType: item.mediaType,
              title: item.title,
              posterUrl: item.posterUrl,
              year: item.year,
              voteAverage: item.voteAverage,
              userRating: item.userRating,
              synopsis: item.synopsis,
              nextAirDate: item.nextAirDate,
            };

            return (
              <TabCard
                key={item.id}
                item={mediaItem}
                actions={actions}
                tabType={mode}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8" style={{ color: 'var(--muted)' }}>
          <p className="text-sm">{getEmptyText()}</p>
          <p className="text-xs mt-2">Add some shows to get started!</p>
        </div>
      )}
    </section>
  );
}
