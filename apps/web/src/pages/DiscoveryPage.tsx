import { useMemo } from 'react';
import { useSearch } from '@/hooks/useSearch';
import CardV2 from '@/components/cards/CardV2';
import type { MediaItem } from '@/components/cards/card.types';

export default function DiscoveryPage({ query, genreId }:{ query: string; genreId: number | null }) {
  const res = useSearch(query);
  const items = useMemo(() => {
    const all = res.data ?? [];
    if (!genreId) return all;
    return all.filter((it: any) => Array.isArray(it.genre_ids) && it.genre_ids.includes(genreId));
  }, [res.data, genreId]);

  return (
    <section className="px-4 py-4">
      <div className="max-w-screen-2xl mx-auto">
        {!query && <div className="text-xs text-neutral-500 mb-3">Type a search above.</div>}
        {query && res.isFetching && <div className="text-xs text-neutral-500 mb-3">Searching…</div>}
        <div className="grid grid-cols-[repeat(auto-fill,154px)] gap-3">
          {items.map((it: any) => {
            const mediaItem: MediaItem = {
              id: it.id,
              mediaType: it.kind,
              title: it.title,
              posterUrl: it.poster,
              year: undefined,
              voteAverage: undefined,
            };
            
            return (
              <CardV2 
                key={`${it.kind}-${it.id}`} 
                item={mediaItem} 
                context="search"
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
