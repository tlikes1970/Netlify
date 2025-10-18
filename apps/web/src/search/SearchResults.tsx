import React, { useEffect, useState, useRef } from 'react';
// import CardV2 from '../components/cards/CardV2'; // Unused
import type { MediaItem } from '../components/cards/card.types';
import { cachedSearchMulti } from './cache';
import { smartSearch } from './smartSearch';
import { emit } from '../lib/events';
import { addToListWithConfirmation } from '../lib/storage';
import { fetchNextAirDate } from '../tmdb/tv';
import { useTranslations } from '../lib/language';
import { useSettings, getPersonalityText } from '../lib/settings';
import MyListToggle from '../components/MyListToggle';
import { OptimizedImage } from '../components/OptimizedImage';

export default function SearchResults({
  query, genre, searchType = 'all', nonce
}: { query: string; genre?: string | null; searchType?: 'all'|'movies-tv'|'people'; nonce: number }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const settings = useSettings();

  useEffect(() => {
    // reset on any input change (including nonce)
    abortRef.current?.abort();
    setItems([]); setPage(0); setHasMore(true); setError(null);
    void fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, genre, searchType, nonce]);

  async function fetchPage(nextPage: number, replace = false) {
    if (isLoading || !hasMore) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setIsLoading(true);
    try {
      const useSmart = searchType !== 'people' && !query.startsWith('tag:');
      const results = useSmart
        ? await smartSearch(query, nextPage, searchType, { signal: ac.signal })
        : await cachedSearchMulti(query, nextPage, genre ?? null, searchType, { signal: ac.signal });

      setItems(prev => replace ? results : [...prev, ...results]);
      setPage(nextPage);
      setHasMore(results.length >= 20); // TMDB default page size
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
      {hasMore && (
        <div 
          className="h-20 flex items-center justify-center"
          ref={(el) => {
            if (el) {
              const observer = new IntersectionObserver(
                (entries) => {
                  if (entries[0].isIntersecting && !isLoading) {
                    fetchPage(page + 1);
                  }
                },
                { threshold: 0.1 }
              );
              observer.observe(el);
              return () => observer.disconnect();
            }
          }}
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
  
  // Safe title display helper
  function displayTitle(item: { title?: any; year?: string | number }) {
    const t = typeof item.title === 'string' ? item.title : String(item.title ?? '').trim();
    const safe = t || 'Untitled';
    return item.year ? `${safe} (${item.year})` : safe;
  }
  
  const title = displayTitle(item);
  
  // Handle person results differently
  if (mediaType === 'person') {
    return <PersonCard item={item} />;
  }
  
  // Mock data for demo - in real implementation, this would come from TMDB
  const runtime = mediaType === 'movie' ? '120m' : '45m';
  const genre = mediaType === 'movie' ? 'Drama' : 'TV Drama';
  const streamingService = 'Netflix';
  const badges = ['NEW', 'TRENDING'];
  

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
        case 'search-works':
          // Search for their works
          const event = new CustomEvent('search:person-works', { 
            detail: { 
              personName: item.title,
              personId: item.id
            }
          });
          document.dispatchEvent(event);
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
