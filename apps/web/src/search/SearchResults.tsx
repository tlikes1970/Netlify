import React, { useEffect, useState } from 'react';
import CardV2 from '../components/cards/CardV2';
import type { MediaItem } from '../components/cards/card.types';
import { searchMulti } from './api';
import { emit } from '../lib/events';
import { addToListWithConfirmation } from '../lib/storage';
import { fetchNextAirDate } from '../tmdb/tv';
import { useTranslations } from '../lib/language';
import { useSettings, getPersonalityText } from '../lib/settings';
import MyListToggle from '../components/MyListToggle';

export default function SearchResults({ query, genre }: { query: string; genre?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const translations = useTranslations();
  const settings = useSettings();

  useEffect(() => {
    let cancelled = false;
    if (!query) { setItems([]); setError(null); return; }
    setLoading(true);
    setError(null);
    searchMulti(query, 1, genre).then(res => {
      if (!cancelled) setItems(res);
    }).catch(err => {
      if (!cancelled) setError(err.message || translations.searchFailed);
    }).finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [query, genre, translations.searchFailed]);

  if (!query) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-3 sm:px-4 py-3" aria-labelledby="search-results-heading">
      <h2 id="search-results-heading" className="text-base font-semibold mb-6">Search results for "{query}"</h2>
      {loading && <p className="mt-2 text-sm text-muted-foreground">{getPersonalityText('searchLoading', settings.personalityLevel)}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{getPersonalityText('errorGeneric', settings.personalityLevel)}</p>}

      <div className="space-y-6">
        {items.map(item => (
          <SearchResultCard key={`${item.mediaType}:${item.id}`} item={item} />
        ))}
      </div>

      {!loading && !error && items.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">{getPersonalityText('searchEmpty', settings.personalityLevel)}</p>
      )}
    </section>
  );
}

function SearchResultCard({ item }: { item: MediaItem }) {
  const translations = useTranslations();
  const { title, year, posterUrl, voteAverage, mediaType, synopsis } = item;
  const [pressedButtons, setPressedButtons] = React.useState<Set<string>>(new Set());
  
  // Mock data for demo - in real implementation, this would come from TMDB
  const runtime = mediaType === 'movie' ? '120m' : '45m';
  const genre = mediaType === 'movie' ? 'Drama' : 'TV Drama';
  const streamingService = 'Netflix';
  const badges = ['NEW', 'TRENDING'];
  
  const handleAction = async (action: string) => {
    const buttonKey = `${action}-${item.id}`;
    
    // Add pressed state
    setPressedButtons(prev => new Set(prev).add(buttonKey));
    
    try {
      switch (action) {
        case 'want':
          addToListWithConfirmation(item, 'wishlist', () => {
            emit('card:want', { id: item.id, mediaType: item.mediaType as any });
          });
          break;
        case 'currently-watching':
          // Fetch next air date for TV shows
          let nextAirDate: string | null = null;
          if (mediaType === 'tv') {
            nextAirDate = await fetchNextAirDate(Number(item.id));
          }
          addToListWithConfirmation({ ...item, nextAirDate }, 'watching');
          break;
        case 'watched':
          addToListWithConfirmation(item, 'watched', () => {
            emit('card:watched', { id: item.id, mediaType: item.mediaType as any });
          });
          break;
        case 'not-interested':
          addToListWithConfirmation(item, 'not', () => {
            emit('card:notInterested', { id: item.id, mediaType: item.mediaType as any });
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
        className={`px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 ${
          isPressed ? 'scale-95 opacity-80' : 'hover:scale-105 hover:opacity-90'
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
      {/* Poster */}
      <a 
        href={`https://www.themoviedb.org/${mediaType}/${item.id}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex-shrink-0 w-30 aspect-[2/3] bg-muted cursor-pointer"
        title={translations.opensInTmdb}
      >
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-xs text-muted-foreground">
            No poster
          </div>
        )}
      </a>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col relative">
        {/* Title and Meta */}
        <div className="font-bold text-base mb-1">{title} ({year})</div>
        <div className="text-muted-foreground text-xs mb-1">{genre} • Runtime: {runtime}</div>
        
        {/* Streaming Info */}
        <div className="text-accent text-xs mb-2">Where to Watch: {streamingService}</div>
        
        {/* Synopsis */}
        <div className="text-muted-foreground text-sm mb-2 max-h-12 overflow-hidden">
          {synopsis || translations.noSynopsisAvailable}
        </div>
        
        {/* Badges */}
        <div className="flex gap-2 mb-2">
          {badges.map(badge => (
            <span key={badge} className="border border-line rounded-md px-2 py-0.5 text-xs text-muted-foreground">
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
            <button 
              className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.reviewNotesAction}
            </button>
            <MyListToggle item={item} />
          </div>
          
          <div className="flex gap-2">
            <button 
              className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn2)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.similarToAction}
            </button>
            <button 
              className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn2)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.refineSearchAction}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
