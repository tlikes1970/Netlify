import { useEffect, useState } from 'react';
import type { MediaItem } from '../card.types';
import { Library } from '../../../lib/storage';

/** Keep mobile card item in sync with library rating/notes/synopsis. */
export function useMobileCardEnrichedItem(item: MediaItem): MediaItem {
  const [enrichedItem, setEnrichedItem] = useState(item);

  useEffect(() => {
    const updateFromLibrary = () => {
      const latestEntry = Library.getEntry(item.id, item.mediaType);
      if (latestEntry) {
        setEnrichedItem({
          ...item,
          synopsis: latestEntry.synopsis,
          userRating: latestEntry.userRating,
          userNotes: latestEntry.userNotes,
          tags: latestEntry.tags,
        });
      } else {
        setEnrichedItem(item);
      }
    };

    updateFromLibrary();
    const unsubscribe = Library.subscribe(updateFromLibrary);
    return () => {
      unsubscribe();
    };
  }, [item]);

  return enrichedItem;
}

export function getMobileTabContext(tabKey: 'watching' | 'watched' | 'want') {
  switch (tabKey) {
    case 'watching':
      return 'tab-watching' as const;
    case 'watched':
      return 'tab-watched' as const;
    case 'want':
      return 'tab-want' as const;
    default:
      return 'tab-watching' as const;
  }
}

export function getMobileListContext(
  tabKey: 'watching' | 'watched' | 'want'
): 'watching' | 'wishlist' | 'watched' | undefined {
  switch (tabKey) {
    case 'watching':
      return 'watching';
    case 'want':
      return 'wishlist';
    case 'watched':
      return 'watched';
    default:
      return undefined;
  }
}

export function formatMobileMetaLine(
  item: MediaItem,
  mediaType: 'tv' | 'movie'
): string {
  const yearText = item.year || 'TBA';
  return `${yearText} • ${mediaType === 'tv' ? 'TV Show' : 'Movie'}`;
}

/** Compact metadata from fields already on the library item (no new fetches). */
export function formatMovieCompactMeta(item: MediaItem): string | null {
  const parts: string[] = [];

  if (typeof item.voteAverage === 'number' && !Number.isNaN(item.voteAverage)) {
    parts.push(`${Math.round(item.voteAverage * 10) / 10}/10 TMDB`);
  }

  if (item.runtimeMins && item.runtimeMins > 0) {
    const hours = Math.floor(item.runtimeMins / 60);
    const mins = item.runtimeMins % 60;
    parts.push(hours > 0 ? `${hours}h ${mins}m` : `${mins} min`);
  }

  if (item.productionCompanies?.length) {
    parts.push(item.productionCompanies.slice(0, 2).join(', '));
  }

  return parts.length > 0 ? parts.join(' • ') : null;
}
