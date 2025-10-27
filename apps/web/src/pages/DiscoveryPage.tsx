import { useMemo } from 'react';
import { useSearch } from '@/hooks/useSearch';
import { useSmartDiscovery } from '@/hooks/useSmartDiscovery';
import CardV2 from '@/components/cards/CardV2';
import type { MediaItem } from '@/components/cards/card.types';
import { Library } from '@/lib/storage';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function DiscoveryPage({ query, genreId }:{ query: string; genreId: number | null }) {
  const searchResults = useSearch(query);
  const { recommendations, isLoading: discoveryLoading, error: discoveryError } = useSmartDiscovery();
  
  const items = useMemo(() => {
    // If user is searching, use search results
    if (query.trim()) {
      const all = searchResults.data ?? [];
      if (!genreId) return all;
      return all.filter((it: any) => Array.isArray(it.genre_ids) && it.genre_ids.includes(genreId));
    }
    
    // For discovery without search, use smart recommendations
    return recommendations.map(rec => ({
      id: rec.item.id,
      kind: rec.item.kind,
      title: rec.item.title,
      poster: rec.item.poster,
      posterUrl: rec.item.poster, // Ensure posterUrl is available for CardV2
      genre_ids: [], // Will be populated by TMDB data
      score: rec.score,
      reasons: rec.reasons
    }));
  }, [query, genreId, searchResults.data, recommendations]);

  const isLoading = query.trim() ? searchResults.isFetching : discoveryLoading;
  const hasError = query.trim() ? searchResults.error : discoveryError;

  // Action handlers using Library.upsert
  const actions = {
    onWant: (item: MediaItem) => {
      if (item.id && item.mediaType) {
        Library.upsert({ 
          id: item.id, 
          mediaType: item.mediaType, 
          title: item.title,
          posterUrl: item.posterUrl,
          year: item.year,
          voteAverage: item.voteAverage,
          showStatus: item.showStatus,
          lastAirDate: item.lastAirDate
        }, 'wishlist');
      }
    },
    onWatched: (item: MediaItem) => {
      if (item.id && item.mediaType) {
        Library.upsert({ 
          id: item.id, 
          mediaType: item.mediaType, 
          title: item.title,
          posterUrl: item.posterUrl,
          year: item.year,
          voteAverage: item.voteAverage,
          showStatus: item.showStatus,
          lastAirDate: item.lastAirDate
        }, 'watched');
      }
    },
    onNotInterested: (item: MediaItem) => {
      if (item.id && item.mediaType) {
        Library.upsert({ 
          id: item.id, 
          mediaType: item.mediaType, 
          title: item.title,
          posterUrl: item.posterUrl,
          year: item.year,
          voteAverage: item.voteAverage,
          showStatus: item.showStatus,
          lastAirDate: item.lastAirDate
        }, 'not');
      }
    }
  };

  return (
    <section className="px-4 py-4">
      <div className="max-w-screen-2xl mx-auto">
        {!query && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-neutral-200 mb-2">
              🎯 Personalized Recommendations
            </h2>
            <p className="text-sm text-neutral-400">
              Based on your ratings and preferences
            </p>
          </div>
        )}
        
        {!query && !items.length && !isLoading && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎬</div>
            <h3 className="text-lg font-medium text-neutral-200 mb-2">
              Building Your Recommendations
            </h3>
            <p className="text-sm text-neutral-400 mb-4">
              Rate some movies and TV shows to get personalized recommendations, or use the search bar to find specific content.
            </p>
          </div>
        )}
        
        {query && !query.trim() && <div className="text-xs text-neutral-500 mb-3">Type a search above.</div>}
        {isLoading && (
          <div className="text-xs text-neutral-500 mb-3">
            {query.trim() ? 'Loading search results...' : 'Loading personalized recommendations...'}
          </div>
        )}
        
        {hasError && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-neutral-200 mb-2">
              Failed to Load Search Results
            </h3>
            <p className="text-sm text-neutral-400">
              Please try again later.
            </p>
          </div>
        )}
        
        {items.length > 0 && (
          <ErrorBoundary name="DiscoveryResults" onReset={() => {
            // Refetch search results if searching, otherwise discovery will auto-refetch
            if (query.trim()) {
              searchResults.refetch();
            }
          }}>
            <div className="grid grid-cols-[repeat(auto-fill,154px)] gap-3">
              {items.map((it: any, index: number) => {
                const mediaItem: MediaItem = {
                  id: it.id,
                  mediaType: it.kind,
                  title: it.title,
                  posterUrl: it.posterUrl || it.poster, // Use posterUrl if available, fallback to poster
                  year: it.year,
                  voteAverage: it.voteAverage,
                };
                
                return (
                  <div key={`${it.kind}-${it.id}-${index}`} className="relative">
                    <CardV2 
                      item={mediaItem} 
                      context="tab-foryou"
                      actions={actions}
                    />
                  </div>
                );
              })}
            </div>
          </ErrorBoundary>
        )}
        
      </div>
    </section>
  );
}
