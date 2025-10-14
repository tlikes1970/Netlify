import React, { useEffect, useState } from 'react';
// import CardV2 from '../components/cards/CardV2'; // Unused
import type { MediaItem } from '../components/cards/card.types';
import { searchMulti } from './api';
import { emit } from '../lib/events';
import { addToListWithConfirmation } from '../lib/storage';
import { fetchNextAirDate } from '../tmdb/tv';
import { useTranslations } from '../lib/language';
import { useSettings, getPersonalityText } from '../lib/settings';
import MyListToggle from '../components/MyListToggle';
import { OptimizedImage } from '../components/OptimizedImage';
import { usePerformanceOptimization, useEnhancedOfflineCache } from '../hooks/usePerformanceOptimization';
import { VirtualScrollContainer, LoadingStates, InfiniteScrollSentinel, PerformanceMetrics } from '../components/PerformanceComponents';

export default function SearchResults({ query, genre }: { query: string; genre?: string | null }) {
  const [initialItems, setInitialItems] = useState<MediaItem[]>([]);
  // const translations = useTranslations(); // Unused
  const settings = useSettings();
  
  // Enhanced offline cache
  const { isOnline, cacheStatus, preloadCriticalData } = useEnhancedOfflineCache();

  // Reset pagination when query changes
  useEffect(() => {
    setInitialItems([]);
  }, [query, genre]);

  // Load more function for infinite scroll
  const loadMoreItems = async (): Promise<MediaItem[]> => {
    if (query.startsWith('tag:')) {
      // Tag search - no pagination needed
      return [];
    }

    try {
      const results = await searchMulti(query, Math.floor(initialItems.length / 20) + 1, genre);
      return results;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Search failed');
    }
  };

  // Performance optimization system
  const performance = usePerformanceOptimization(initialItems, {
    enableInfinite: true,
    enableVirtual: initialItems.length > 100, // Enable virtual scrolling for large lists
    enableCache: true,
    onLoadMore: loadMoreItems,
    infinite: {
      pageSize: 20,
      threshold: 200,
      maxPages: 50
    },
    virtual: {
      itemHeight: 300, // Approximate height of search result cards
      overscan: 3,
      containerHeight: 600
    },
    cache: {
      maxItems: 500,
      preloadThreshold: 20,
      cleanupInterval: 30000
    }
  });

  // Preload critical data when online
  useEffect(() => {
    if (isOnline && performance.items.length > 0) {
      preloadCriticalData(performance.items.slice(0, 20));
    }
  }, [isOnline, performance.items, preloadCriticalData]);

  if (!query) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-3 sm:px-4 py-3" aria-labelledby="search-results-heading">
      <h2 id="search-results-heading" className="text-base font-semibold mb-6">
        {query.startsWith('tag:') 
          ? `Tag search results for "${query.substring(4)}"`
          : `Search results for "${query}"`
        }
      </h2>
      
      {performance.isLoading && performance.items.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          {getPersonalityText('searchLoading', settings.personalityLevel)}
        </p>
      )}
      
      {performance.error && (
        <p className="mt-2 text-sm text-red-600">
          ⚠️ {performance.error}
        </p>
      )}

      <VirtualScrollContainer
        ref={performance.containerRef}
        totalHeight={performance.totalHeight}
        offsetY={performance.offsetY}
        onScroll={performance.handleScroll}
        className="h-[600px]"
      >
        <div className="space-y-6">
          {performance.items.map(item => (
            <SearchResultCard 
              key={`${item.mediaType}:${item.id}`} 
              item={item} 
              onRemove={() => setInitialItems(prev => prev.filter(i => i.id !== item.id))}
            />
          ))}
        </div>
        
        <InfiniteScrollSentinel sentinelRef={performance.sentinelRef} />
        <LoadingStates 
          isLoading={performance.isLoading}
          hasMore={performance.hasMore}
          error={performance.error}
        />
      </VirtualScrollContainer>

      {/* Performance metrics (development only) */}
      <PerformanceMetrics
        cacheSize={performance.cacheSize}
        visibleItems={performance.items.length}
        totalItems={performance.allItems.length}
        isOnline={isOnline}
        cacheStatus={cacheStatus}
      />
    </section>
  );
}

function SearchResultCard({ item, onRemove }: { item: MediaItem; onRemove: () => void }) {
  const translations = useTranslations();
  const { title, year, posterUrl, mediaType, synopsis } = item;
  const [pressedButtons, setPressedButtons] = React.useState<Set<string>>(new Set());
  
  // Mock data for demo - in real implementation, this would come from TMDB
  const runtime = mediaType === 'movie' ? '120m' : '45m';
  const genre = mediaType === 'movie' ? 'Drama' : 'TV Drama';
  const streamingService = 'Netflix';
  const badges = ['NEW', 'TRENDING'];
  
  // Genre ID to name mapping
  const getGenreName = (genreId: number): string => {
    const genreMap: Record<number, string> = {
      // Movies
      28: 'action',
      12: 'adventure', 
      16: 'animation',
      35: 'comedy',
      80: 'crime',
      99: 'documentary',
      18: 'drama',
      10751: 'family',
      14: 'fantasy',
      36: 'history',
      27: 'horror',
      10402: 'music',
      9648: 'mystery',
      10749: 'romance',
      878: 'science fiction',
      10770: 'tv movie',
      53: 'thriller',
      10752: 'war',
      37: 'western',
      // TV
      10759: 'action & adventure',
      10762: 'kids',
      10763: 'news',
      10764: 'reality',
      10765: 'sci-fi & fantasy',
      10766: 'soap',
      10767: 'talk',
      10768: 'war & politics'
    };
    return genreMap[genreId] || 'unknown';
  };

  const handleSimilarTo = (item: MediaItem) => {
    console.log('🔍 Similar To clicked for:', item.title);
    
    // Genre-focused similarity search with human-readable names
    const genres = (item as any).genre_ids || [];
    const primaryGenre = genres[0];
    const secondaryGenre = genres[1];
    const rating = item.voteAverage || 0;
    const ratingTier = rating >= 8 ? 'high rated' : rating >= 6 ? 'rated' : '';
    
    // Build natural language similarity query
    const similarityFactors = [];
    
    // Primary genre (most important) - use human-readable name
    if (primaryGenre) {
      const primaryGenreName = getGenreName(primaryGenre);
      similarityFactors.push(primaryGenreName);
    }
    
    // Secondary genre for subgenre matching
    if (secondaryGenre) {
      const secondaryGenreName = getGenreName(secondaryGenre);
      similarityFactors.push(secondaryGenreName);
    }
    
    // Media type context
    similarityFactors.push(item.mediaType === 'movie' ? 'movies' : 'tv shows');
    
    // Rating tier (less important than genre)
    if (ratingTier) {
      similarityFactors.push(ratingTier);
    }
    
    const similarQuery = similarityFactors.join(' ');
    console.log('📤 Dispatching search:similar event with query:', similarQuery);
    console.log('🎯 Genre-focused similarity factors:', { 
      genres, 
      primaryGenre, 
      secondaryGenre, 
      primaryGenreName: primaryGenre ? getGenreName(primaryGenre) : null,
      secondaryGenreName: secondaryGenre ? getGenreName(secondaryGenre) : null,
      rating, 
      ratingTier,
      mediaType: item.mediaType 
    });
    
    // Dispatch event with enhanced genre data
    const event = new CustomEvent('search:similar', { 
      detail: { 
        originalItem: item, 
        query: similarQuery,
        genre: primaryGenre || null,
        similarityFactors: {
          genres,
          primaryGenre,
          secondaryGenre,
          primaryGenreName: primaryGenre ? getGenreName(primaryGenre) : null,
          secondaryGenreName: secondaryGenre ? getGenreName(secondaryGenre) : null,
          rating,
          ratingTier,
          mediaType: item.mediaType,
          genreCount: genres.length
        }
      }
    });
    document.dispatchEvent(event);
  };

  const handleRefineSearch = (item: MediaItem) => {
    console.log('🎯 Refine Search clicked for:', item.title);
    
    // Smart filtering based on item properties
    const year = item.year || '';
    const rating = item.voteAverage || 0;
    const genre = (item as any).genre_ids?.[0] || '';
    
    // Create specific search criteria
    const filters = [];
    
    // Year-based filtering
    if (year) {
      const currentYear = new Date().getFullYear();
      const itemYear = parseInt(year);
      if (itemYear >= currentYear - 2) {
        filters.push('recent');
      } else if (itemYear >= currentYear - 10) {
        filters.push('2010s 2020s');
      } else {
        filters.push('classic');
      }
    }
    
    // Rating-based filtering
    if (rating >= 8) {
      filters.push('critically acclaimed');
    } else if (rating >= 6) {
      filters.push('well rated');
    }
    
    // Genre-based filtering - use human-readable name
    if (genre) {
      const genreName = getGenreName(genre);
      filters.push(genreName);
    }
    
    // Media type
    filters.push(item.mediaType === 'movie' ? 'movies' : 'tv series');
    
    const refinedQuery = filters.join(' ');
    console.log('📤 Dispatching search:refine event with query:', refinedQuery);
    console.log('🎯 Refinement filters:', { year, rating, genre, genreName: genre ? getGenreName(genre) : null, filters });
    
    // Dispatch event with enhanced data
    const event = new CustomEvent('search:refine', { 
      detail: { 
        originalItem: item, 
        query: refinedQuery,
        genre: (item as any).genre_ids?.[0] || null,
        refinementFilters: {
          year,
          rating,
          genre,
          genreName: genre ? getGenreName(genre) : null,
          mediaType: item.mediaType,
          filters
        }
      }
    });
    document.dispatchEvent(event);
  };

  const handleAction = async (action: string) => {
    console.log('🎬 handleAction called with:', action, 'for item:', item.title);
    const buttonKey = `${action}-${item.id}`;
    
    // Add pressed state
    setPressedButtons(prev => new Set(prev).add(buttonKey));
    
    try {
      switch (action) {
        case 'want':
          addToListWithConfirmation(item, 'wishlist', () => {
            emit('card:want', { id: item.id, mediaType: item.mediaType as any });
            onRemove(); // Remove from search results
          });
          break;
        case 'currently-watching':
          // Fetch next air date for TV shows
          let nextAirDate: string | null = null;
          if (mediaType === 'tv') {
            nextAirDate = await fetchNextAirDate(Number(item.id));
          }
          addToListWithConfirmation({ ...item, nextAirDate }, 'watching', () => {
            onRemove(); // Remove from search results
          });
          break;
        case 'watched':
          addToListWithConfirmation(item, 'watched', () => {
            emit('card:watched', { id: item.id, mediaType: item.mediaType as any });
            onRemove(); // Remove from search results
          });
          break;
        case 'not-interested':
          addToListWithConfirmation(item, 'not', () => {
            emit('card:notInterested', { id: item.id, mediaType: item.mediaType as any });
            onRemove(); // Remove from search results
          });
          break;
        case 'holiday':
          emit('card:holidayAdd', { id: item.id, mediaType: item.mediaType as any });
          break;
        case 'similar-to':
          handleSimilarTo(item);
          break;
        case 'refine-search':
          handleRefineSearch(item);
          break;
        default:
          console.log(`${action} clicked for ${title}`);
      }
    } finally {
      // Remove pressed state after action completes
      setTimeout(() => {
        setPressedButtons(prev => {
          const newSet = new Set(prev);
          newSet.delete(buttonKey);
          return newSet;
        });
      }, 300);
    }
  };

  const createButton = (action: string, label: string, isSpecial = false) => {
    const buttonKey = `${action}-${item.id}`;
    const isPressed = pressedButtons.has(buttonKey);
    const isLoading = action === 'currently-watching' && pressedButtons.has(buttonKey);
    
    return (
      <button 
        onClick={() => handleAction(action)}
        className={`px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 ease-out ${
          isPressed ? 'scale-95 active:shadow-inner' : 'hover:scale-105 hover:shadow-md'
        } ${isLoading ? 'cursor-wait' : 'cursor-pointer'}`}
        style={{ 
          backgroundColor: isPressed ? 'var(--accent)' : 'var(--btn)', 
          color: isSpecial ? 'white' : 'var(--text)', 
          borderColor: 'var(--line)', 
          border: '1px solid' 
        }}
        disabled={isPressed}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1"></div>
            <span className="text-[10px]">...</span>
          </div>
        ) : (
          label
        )}
      </button>
    );
  };

  return (
    <div className="relative flex bg-card border border-line rounded-xl overflow-hidden shadow-lg hover:transform hover:-translate-y-0.5 transition-transform">
      {/* Poster - proper size */}
      <a 
        href={`https://www.themoviedb.org/${mediaType}/${item.id}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex-shrink-0 w-24 h-36 bg-muted cursor-pointer"
        title={translations.opensInTmdb}
      >
        {posterUrl ? (
          <OptimizedImage
            src={posterUrl}
            alt={title}
            context="poster"
            className="w-full h-full"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-sm text-muted-foreground">
            No poster
          </div>
        )}
      </a>

      {/* Content - proper spacing and sizing */}
      <div className="flex-1 p-4 flex flex-col relative">
        {/* Title */}
        <div className="font-bold text-lg mb-1">{title} ({year})</div>
        
        {/* Meta */}
        <div className="text-muted-foreground text-sm mb-1">{genre} • Runtime: {runtime}</div>
        
        {/* Streaming Info */}
        <div className="text-accent text-sm mb-2">Where to Watch: {streamingService}</div>
        
        {/* Synopsis */}
        <div className="text-muted-foreground text-sm mb-2 max-h-12 overflow-hidden">
          {synopsis || translations.noSynopsisAvailable}
        </div>
        
        {/* Badges */}
        <div className="flex gap-2 mb-2">
          {badges.map(badge => (
            <span key={badge} className="border border-line rounded px-2 py-0.5 text-xs text-muted-foreground">
              {badge}
            </span>
          ))}
        </div>
        
        {/* Rating */}
        <div className="flex items-center gap-1 mb-4">
          <span className="text-accent text-lg cursor-pointer">★</span>
          <span className="text-accent text-lg cursor-pointer">★</span>
          <span className="text-muted-foreground text-lg cursor-pointer">☆</span>
          <span className="text-muted-foreground text-lg cursor-pointer">☆</span>
          <span className="text-muted-foreground text-lg cursor-pointer">☆</span>
          <span className="text-muted-foreground text-xs ml-2">(Your rating)</span>
        </div>
        
        {/* Actions */}
        <div className="mt-auto flex flex-wrap gap-2 justify-between items-center">
          <div className="flex flex-wrap gap-2 p-2 rounded-lg" style={{ borderColor: 'var(--line)', border: '1px dashed' }}>
            {createButton('want', translations.wantToWatchAction)}
            {createButton('currently-watching', translations.currentlyWatchingAction)}
            {createButton('watched', translations.watchedAction)}
            {createButton('not-interested', translations.notInterestedAction)}
            <MyListToggle item={item} />
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Similar To button clicked');
                handleAction('similar-to');
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground"
              style={{ backgroundColor: 'var(--btn2)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.similarToAction || 'Similar To'}
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Refine Search button clicked');
                handleAction('refine-search');
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground"
              style={{ backgroundColor: 'var(--btn2)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.refineSearchAction || 'Refine Search'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
