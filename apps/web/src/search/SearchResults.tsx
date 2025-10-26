import React, { useEffect, useState, useRef } from 'react';
// import CardV2 from '../components/cards/CardV2'; // Unused
import type { MediaItem } from '../components/cards/card.types';
import { cachedSearchMulti } from './cache';
import { smartSearch } from './smartSearch';
import { emit } from '../lib/events';
import { addToListWithConfirmation } from '../lib/storage';
import { fetchNextAirDate, fetchShowStatus } from '../tmdb/tv';
import { useTranslations } from '../lib/language';
import { useSettings, getPersonalityText } from '../lib/settings';
import MyListToggle from '../components/MyListToggle';
import { OptimizedImage } from '../components/OptimizedImage';
import { fetchNetworkInfo } from './api';
import { searchTagsLocal } from '../lib/libraryIndex';

type SearchResultWithPagination = {
  items: MediaItem[];
  page: number;
  totalPages: number;
};

export default function SearchResults({
  query, genre, searchType = 'all'
}: { query: string; genre?: number | null; searchType?: 'all'|'movies-tv'|'people' }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const settings = useSettings();

  useEffect(() => {
    // reset on any input change
    abortRef.current?.abort();
    setItems([]); setCurrentPage(1); setTotalPages(1); setError(null);
    void fetchPage(1, true);
    // eslint-disable-next-line
  }, [query, genre, searchType]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;

    // Create single observer instance
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && currentPage < totalPages) {
          void fetchPage(currentPage + 1);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [currentPage, totalPages, isLoading]);

  async function fetchPage(nextPage: number, replace = false) {
    if (isLoading) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setIsLoading(true);
    try {
      let result: SearchResultWithPagination;

      if (query.startsWith('tag:')) {
        // Tag search from local library
        const tagQuery = query.substring(4);
        const localResults = searchTagsLocal(tagQuery);
        result = {
          items: localResults,
          page: 1,
          totalPages: 1 // Tag search is single page
        };
      } else {
        const useSmart = searchType !== 'people';
        const searchResult = useSmart
          ? await smartSearch(query, nextPage, searchType, { signal: ac.signal })
          : await cachedSearchMulti(query, nextPage, genre ?? null, searchType, { signal: ac.signal });

        result = searchResult;
      }

      setItems(prev => replace ? result.items : [...prev, ...result.items]);
      setCurrentPage(result.page);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      if (err?.name !== 'AbortError') setError(err?.message || 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }

  if (!query) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-3 sm:px-4 py-3" aria-labelledby="search-results-heading">
      <h2 id="search-results-heading" className="text-base font-semibold mb-6">
        {query.startsWith('tag:') 
          ? `Tag search results for "${query.substring(4)}"`
          : `Search results for "${query}"`
        }
      </h2>
      
      {isLoading && items.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          {getPersonalityText('searchLoading', settings.personalityLevel)}
        </p>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600">
          ⚠️ {error}
        </p>
      )}

      <div className="space-y-6">
        {items.map(item => (
          <SearchResultCard 
            key={`${item.mediaType}:${item.id}`} 
            item={item} 
            onRemove={() => setItems(prev => prev.filter(i => i.id !== item.id))}
          />
        ))}
      </div>
      
      {/* Infinite scroll sentinel */}
      {currentPage < totalPages && (
        <div 
          ref={sentinelRef}
          className="h-20 flex items-center justify-center"
        >
          {isLoading && <div className="text-sm text-muted-foreground">Loading more...</div>}
        </div>
      )}
    </section>
  );
}

function SearchResultCard({ item, onRemove }: { item: MediaItem; onRemove: () => void }) {
  const translations = useTranslations();
  const { posterUrl, mediaType, synopsis } = item;
  const [pressedButtons, setPressedButtons] = React.useState<Set<string>>(new Set());
  const [networkInfo, setNetworkInfo] = React.useState<{ networks?: string[]; productionCompanies?: string[] }>({});
  
  // Fetch network information when component mounts
  React.useEffect(() => {
    if (mediaType === 'movie' || mediaType === 'tv') {
      fetchNetworkInfo(Number(item.id), mediaType).then(setNetworkInfo);
    }
  }, [item.id, mediaType]);
  
  // Safe title display helper
  function displayTitle(item: { title?: any; year?: string | number }) {
    const t = typeof item.title === 'string' ? item.title : String(item.title ?? '').trim();
    const safe = t || 'Untitled';
    return item.year ? `${safe} (${item.year})` : safe;
  }
  
  const title = displayTitle(item);
  
  // Genre ID to name mapping (common TMDB genres)
  const getGenreName = (genreIds?: number[]) => {
    if (!genreIds || genreIds.length === 0) return 'Genre TBA';
    
    const genreMap: Record<number, string> = {
      28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
      99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
      27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
      10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
    };
    
    const firstGenre = genreIds[0];
    return genreMap[firstGenre] || 'Genre TBA';
  };
  
  // Handle person results differently
  if (mediaType === 'person') {
    return <PersonCard item={item} />;
  }
  
  // Use actual data from TMDB or sensible defaults
  const genre = getGenreName((item as any).genre_ids);
  const mediaTypeLabel = mediaType === 'movie' ? 'Movie' : 'TV Series';
  const badges = ['NEW', 'TRENDING']; // TODO: Generate based on actual data
  
  // Get streaming service information
  const getStreamingInfo = () => {
    if (mediaType === 'tv' && networkInfo.networks && networkInfo.networks.length > 0) {
      return `On ${networkInfo.networks[0]}${networkInfo.networks.length > 1 ? ` (+${networkInfo.networks.length - 1} more)` : ''}`;
    } else if (mediaType === 'movie' && networkInfo.productionCompanies && networkInfo.productionCompanies.length > 0) {
      return `From ${networkInfo.productionCompanies[0]}${networkInfo.productionCompanies.length > 1 ? ` (+${networkInfo.productionCompanies.length - 1} more)` : ''}`;
    }
    // Don't show placeholder text - only show when we have real data
    return null;
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
        case 'currently-watching': {
          // Fetch next air date and show status for TV shows
          let nextAirDate: string | null = null;
          let showStatus: string | undefined = undefined;
          let lastAirDate: string | undefined = undefined;
          
          if (mediaType === 'tv') {
            nextAirDate = await fetchNextAirDate(Number(item.id));
            const statusData = await fetchShowStatus(Number(item.id));
            if (statusData) {
              showStatus = statusData.status;
              lastAirDate = statusData.lastAirDate || undefined;
            }
          }
          
          addToListWithConfirmation({ 
            ...item, 
            nextAirDate,
            showStatus: showStatus as 'Ended' | 'Returning Series' | 'In Production' | 'Canceled' | 'Planned' | undefined,
            lastAirDate
          }, 'watching', () => {
            onRemove(); // Remove from search results
          });
          break;
        }
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
        <div className="font-bold text-lg mb-1">{title}</div>
        
        {/* Meta */}
        <div className="text-muted-foreground text-sm mb-1">{genre} • {mediaTypeLabel}</div>
        
        {/* Streaming Info - only show when we have real data */}
        {getStreamingInfo() && (
          <div className="text-accent text-sm mb-2">{getStreamingInfo()}</div>
        )}
        
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
          <span className="text-muted-foreground text-lg cursor-pointer">☆</span>
          <span className="text-muted-foreground text-lg cursor-pointer">☆</span>
          <span className="text-muted-foreground text-lg cursor-pointer">☆</span>
          <span className="text-muted-foreground text-lg cursor-pointer">☆</span>
          <span className="text-muted-foreground text-lg cursor-pointer">☆</span>
          <span className="text-muted-foreground text-xs ml-2">(Your rating)</span>
          {item.voteAverage && (
            <span className="text-muted-foreground text-xs ml-4">
              TMDB: {item.voteAverage.toFixed(1)}/10
            </span>
          )}
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
          
        </div>
      </div>
    </div>
  );
}

function PersonCard({ item }: { item: MediaItem }) {
  const { posterUrl } = item;
  const [pressedButtons, setPressedButtons] = React.useState<Set<string>>(new Set());
  
  // Safe title display helper
  function displayTitle(item: { title?: any; year?: string | number }) {
    const t = typeof item.title === 'string' ? item.title : String(item.title ?? '').trim();
    const safe = t || 'Untitled';
    return item.year ? `${safe} (${item.year})` : safe;
  }
  
  const title = displayTitle(item);
  
  // Get known for works from the item
  const knownFor = (item as any).known_for || [];
  const knownForText = knownFor.length > 0 
    ? knownFor.map((work: any) => work.title || work.name).join(', ')
    : 'Actor/Actress';
  
  const handleAction = async (action: string) => {
    console.log('🎬 Person action called with:', action, 'for person:', item.title);
    const buttonKey = `${action}-${item.id}`;
    
    // Add pressed state
    setPressedButtons(prev => new Set(prev).add(buttonKey));
    
    try {
      switch (action) {
        case 'view-profile':
          // Open TMDB person page
          window.open(`https://www.themoviedb.org/person/${item.id}`, '_blank');
          break;
        case 'search-works': {
          // Search for their works
          const event = new CustomEvent('search:person-works', { 
            detail: { 
              personName: item.title,
              personId: item.id
            }
          });
          document.dispatchEvent(event);
          break;
        }
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
    
    return (
      <button 
        onClick={() => handleAction(action)}
        className={`px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 ease-out ${
          isPressed ? 'scale-95 active:shadow-inner' : 'hover:scale-105 hover:shadow-md'
        } cursor-pointer`}
        style={{ 
          backgroundColor: isPressed ? 'var(--accent)' : 'var(--btn)', 
          color: isSpecial ? 'white' : 'var(--text)', 
          borderColor: 'var(--line)', 
          border: '1px solid' 
        }}
        disabled={isPressed}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="relative flex bg-card border border-line rounded-xl overflow-hidden shadow-lg hover:transform hover:-translate-y-0.5 transition-transform">
      {/* Profile Photo */}
      <a 
        href={`https://www.themoviedb.org/person/${item.id}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex-shrink-0 w-24 h-36 bg-muted cursor-pointer"
        title="View profile on TMDB"
      >
        {posterUrl ? (
          <OptimizedImage
            src={posterUrl}
            alt={title}
            context="poster"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-sm text-muted-foreground">
            No photo
          </div>
        )}
      </a>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col relative">
        {/* Name */}
        <div className="font-bold text-lg mb-1">{title}</div>
        
        {/* Known For */}
        <div className="text-muted-foreground text-sm mb-2">
          Known for: {knownForText}
        </div>
        
        {/* Popularity */}
        <div className="text-accent text-sm mb-2">
          Popularity: {item.voteAverage ? Math.round(item.voteAverage) : 'N/A'}
        </div>
        
        {/* Actions */}
        <div className="mt-auto flex flex-wrap gap-2 justify-between items-center">
          <div className="flex flex-wrap gap-2 p-2 rounded-lg" style={{ borderColor: 'var(--line)', border: '1px dashed' }}>
            {createButton('view-profile', 'View Profile')}
            {createButton('search-works', 'Search Works')}
          </div>
        </div>
      </div>
    </div>
  );
}
