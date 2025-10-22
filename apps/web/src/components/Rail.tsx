import CardV2 from './cards/CardV2';
import type { MediaItem } from './cards/card.types';
import { Library } from '@/lib/storage';
import { useRailImagePreload } from '../hooks/useImagePreload';

type Item = { id: string; kind?: 'movie'|'tv'; title?: string; poster?: string; year?: number };

type Props = {
  id: string;
  title: string;
  enabled?: boolean;
  skeletonCount?: number;
  items?: Item[];
};

export default function Rail({ id, title, enabled = true, skeletonCount = 0, items }: Props) {
  if (!enabled) return null;
  const list = items && items.length ? items : Array.from({ length: skeletonCount }).map(() => ({} as Item));
  
  // Map rail ID to CardV2 context
  const getContext = (railId: string): 'home' | 'tab-watching' | 'tab-foryou' => {
    if (railId === 'currently-watching') return 'tab-watching';
    if (railId.startsWith('for-you-') || railId === 'in-theaters') return 'tab-foryou';
    return 'home';
  };

  const context = getContext(id);

  // Preload images for better performance
  useRailImagePreload(list.map(item => ({ posterUrl: item.poster })));

  // Action handlers using new Library system
  const actions = {
    onWant: (item: MediaItem) => {
      console.log('🎬 For You Want button clicked:', item);
      if (item.id && item.mediaType) {
        Library.upsert({ 
          id: item.id, 
          mediaType: item.mediaType, 
          title: item.title,
          posterUrl: item.posterUrl,
          year: item.year,
          voteAverage: item.voteAverage
        }, 'wishlist');
        console.log('✅ Item added to wishlist:', item.title);
      }
    },
    onWatched: (item: MediaItem) => {
      console.log('🎬 For You Watched button clicked:', item);
      if (item.id && item.mediaType) {
        Library.upsert({ 
          id: item.id, 
          mediaType: item.mediaType, 
          title: item.title,
          posterUrl: item.posterUrl,
          year: item.year,
          voteAverage: item.voteAverage
        }, 'watched');
        console.log('✅ Item added to watched:', item.title);
      }
    },
    onNotInterested: (item: MediaItem) => {
      console.log('🎬 For You Not Interested button clicked:', item);
      if (item.id && item.mediaType) {
        Library.upsert({ 
          id: item.id, 
          mediaType: item.mediaType, 
          title: item.title,
          posterUrl: item.posterUrl,
          year: item.year,
          voteAverage: item.voteAverage
        }, 'not');
        console.log('✅ Item added to not interested:', item.title);
      }
    },
    onDelete: (item: MediaItem) => {
      console.log('🎬 For You Delete button clicked:', item);
      if (item.id && item.mediaType) {
        Library.remove(item.id, item.mediaType);
        console.log('✅ Item deleted:', item.title);
      }
    },
  };

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const scroller = e.currentTarget;
    const card = scroller.querySelector<HTMLElement>('[data-testid="cardv2"]');
    const gap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--space-3').replace('px', '')) || 12; // matches Tailwind gap-3 ≈ 12px
    const cardWidth = card ? card.getBoundingClientRect().width : 166; // 154 + padding
    const delta = cardWidth + gap;

    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); scroller.scrollBy({ left: +delta, behavior: 'smooth' }); break;
      case 'ArrowLeft':  e.preventDefault(); scroller.scrollBy({ left: -delta, behavior: 'smooth' }); break;
      case 'Home':       e.preventDefault(); scroller.scrollTo({ left: 0, behavior: 'smooth' }); break;
      case 'End':        e.preventDefault(); scroller.scrollTo({ left: scroller.scrollWidth, behavior: 'smooth' }); break;
      case 'Enter': {
        const first = scroller.querySelector<HTMLElement>('[data-testid="cardv2"]');
        if (first) first.focus();
        break;
      }
    }
  }

  return (
    <section data-rail={id} aria-label={title} className="px-4 py-3">
      <h2 className="mb-2 text-base font-semibold" style={{ color: 'var(--text)' }}>{title}</h2>
      <div
        data-cards
        role="list"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2"
      >
        {list.map((it, i) => {
          // Convert Item to MediaItem format with proper title validation
          const safeTitle = (() => {
            // Ensure title is a string and not the same as id
            if (typeof it.title === 'string' && it.title.trim() && it.title !== String(it.id)) {
              return it.title.trim();
            }
            // If title is missing, undefined, or same as id, use fallback
            return 'Untitled';
          })();
          
          const mediaItem: MediaItem = {
            id: it.id || i,
            mediaType: (it.kind as 'movie'|'tv') || 'movie',
            title: safeTitle,
            posterUrl: it.poster,
            year: it.year ? String(it.year) : undefined, // Convert number to string for MediaItem
            voteAverage: undefined, // TODO: Add rating from data source
          };

          return (
            <div key={it.id ?? i} role="listitem" className="snap-start">
              <CardV2
                item={mediaItem}
                context={context}
                actions={actions}
                disableSwipe={true}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
