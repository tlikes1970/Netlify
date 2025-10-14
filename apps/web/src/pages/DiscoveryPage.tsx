import { useMemo, useEffect } from 'react';
import { useSearch } from '@/hooks/useSearch';
import { useSmartDiscovery } from '@/hooks/useSmartDiscovery';
import CardV2 from '@/components/cards/CardV2';
import type { MediaItem } from '@/components/cards/card.types';

export default function DiscoveryPage({ query, genreId }:{ query: string; genreId: number | null }) {
  const searchResults = useSearch(query);
  const smartRecommendations = useSmartDiscovery();
  
  const items = useMemo(() => {
    // If user is searching, use search results
    if (query.trim()) {
      const all = searchResults.data ?? [];
      if (!genreId) return all;
      return all.filter((it: any) => Array.isArray(it.genre_ids) && it.genre_ids.includes(genreId));
    }
    
    // Otherwise, use smart recommendations
    if (smartRecommendations.data) {
      return smartRecommendations.data.map(rec => ({
        id: rec.item.id,
        kind: rec.item.kind,
        title: rec.item.title,
        poster: rec.item.poster,
        genre_ids: [], // We'll add this from TMDB data
        recommendationScore: rec.score,
        recommendationReasons: rec.reasons
      }));
    }
    
    return [];
  }, [query, genreId, searchResults.data, smartRecommendations.data]);

  const isLoading = query.trim() ? searchResults.isFetching : smartRecommendations.isFetching;
  const hasError = query.trim() ? searchResults.error : smartRecommendations.error;

  return (
    <section className="px-4 py-4">
      <div className="max-w-screen-2xl mx-auto">
        {!query && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-neutral-200 mb-2">
              🎯 Smart Recommendations
            </h2>
            <p className="text-sm text-neutral-400">
              Personalized suggestions based on your ratings and preferences
            </p>
          </div>
        )}
        
        {!query && !items.length && !isLoading && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎬</div>
            <h3 className="text-lg font-medium text-neutral-200 mb-2">
              Start Building Your Profile
            </h3>
            <p className="text-sm text-neutral-400 mb-4">
              Add some movies and TV shows to your lists and rate them to get personalized recommendations.
            </p>
          </div>
        )}
        
        {query && !query.trim() && <div className="text-xs text-neutral-500 mb-3">Type a search above.</div>}
        {isLoading && <div className="text-xs text-neutral-500 mb-3">Loading recommendations...</div>}
        
        {hasError && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-neutral-200 mb-2">
              Failed to Load Recommendations
            </h3>
            <p className="text-sm text-neutral-400">
              Please try again later.
            </p>
          </div>
        )}
        
        {items.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,154px)] gap-3">
            {items.map((it: any, index: number) => {
              const mediaItem: MediaItem = {
                id: it.id,
                mediaType: it.kind,
                title: it.title,
                posterUrl: it.poster,
                year: undefined,
                voteAverage: undefined,
              };
              
              return (
                <div key={`${it.kind}-${it.id}-${index}`} className="relative">
                  <CardV2 
                    item={mediaItem} 
                    context="search"
                  />
                  {it.recommendationScore && (
                    <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-1 py-0.5 rounded text-[10px] font-medium">
                      {Math.round(it.recommendationScore * 100)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {!query && items.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-xs text-neutral-500">
              💡 Recommendations improve as you rate more content
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
