import CardV2 from '@/components/cards/CardV2';
import type { MediaItem } from '@/components/cards/card.types';
import { Library } from '@/lib/storage';
import { useSettings, getPersonalityText } from '@/lib/settings';

type Item = { id: string; kind: 'movie'|'tv'; title: string; poster: string };

export default function ListPage({ title, items, mode = 'watching' }: {
  title: string;
  items: Item[];
  mode?: 'watching'|'catalog';
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
  };

  return (
    <section className="px-4 py-4">
      <h1 className="mb-3 text-base font-semibold text-neutral-200">{title}</h1>
      {items.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,154px)] gap-3">
          {items.map(it => {
            // Convert Item to MediaItem format
            const mediaItem: MediaItem = {
              id: it.id,
              mediaType: it.kind,
              title: it.title,
              posterUrl: it.poster,
              year: undefined, // TODO: Add year from data source
              voteAverage: undefined, // TODO: Add rating from data source
            };

            return (
              <CardV2
                key={it.id}
                item={mediaItem}
                context={context}
                actions={actions}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-neutral-400">
          <p className="text-sm">{getEmptyText()}</p>
          <p className="text-xs mt-2">Add some shows to get started!</p>
        </div>
      )}
    </section>
  );
}
