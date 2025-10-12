import React, { useEffect, useState } from 'react';
import CardV2 from '../components/cards/CardV2';
import type { MediaItem } from '../components/cards/card.types';
import { searchMulti } from './api';
import { emit } from '../lib/events';
import { Library } from '../lib/storage';
import { fetchNextAirDate } from '../tmdb/tv';

export default function SearchResults({ query, genre }: { query: string; genre?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!query) { setItems([]); setError(null); return; }
    setLoading(true);
    setError(null);
    searchMulti(query, 1, genre).then(res => {
      if (!cancelled) setItems(res);
    }).catch(err => {
      if (!cancelled) setError(err.message || 'Search failed');
    }).finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [query, genre]);

  if (!query) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-3 sm:px-4 py-3" aria-labelledby="search-results-heading">
      <h2 id="search-results-heading" className="text-base font-semibold mb-6">Search results for "{query}"</h2>
      {loading && <p className="mt-2 text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="space-y-6">
        {items.map(item => (
          <SearchResultCard key={`${item.mediaType}:${item.id}`} item={item} />
        ))}
      </div>

      {!loading && !error && items.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">No results. Try another search.</p>
      )}
    </section>
  );
}

function SearchResultCard({ item }: { item: MediaItem }) {
  const { title, year, posterUrl, voteAverage, mediaType, synopsis } = item;
  
  // Mock data for demo - in real implementation, this would come from TMDB
  const runtime = mediaType === 'movie' ? '120m' : '45m';
  const genre = mediaType === 'movie' ? 'Drama' : 'TV Drama';
  const streamingService = 'Netflix';
  const badges = ['NEW', 'TRENDING'];
  
  const handleAction = async (action: string) => {
    switch (action) {
      case 'want':
        Library.upsert(item, 'wishlist');
        emit('card:want', { id: item.id, mediaType: item.mediaType as any });
        break;
      case 'currently-watching':
        // Fetch next air date for TV shows
        let nextAirDate: string | null = null;
        if (mediaType === 'tv') {
          nextAirDate = await fetchNextAirDate(Number(item.id));
        }
        Library.upsert({ ...item, nextAirDate }, 'watching');
        break;
      case 'holiday':
        emit('card:holidayAdd', { id: item.id, mediaType: item.mediaType as any });
        break;
      default:
        console.log(`${action} clicked for ${title}`);
    }
  };

  return (
    <div className="relative flex bg-card border border-line rounded-xl overflow-hidden shadow-lg hover:transform hover:-translate-y-0.5 transition-transform">
      {/* Poster */}
      <a 
        href={`https://www.themoviedb.org/${mediaType}/${item.id}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex-shrink-0 w-30 aspect-[2/3] bg-muted cursor-pointer"
        title="Opens in TMDB"
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
          {synopsis || "No synopsis available."}
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
            <button 
              onClick={() => handleAction('want')}
              className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              Want to Watch
            </button>
            <button 
              onClick={() => handleAction('currently-watching')}
              className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              Currently Watching
            </button>
            <button 
              className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              Watched
            </button>
            <button 
              className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              Not Interested
            </button>
            <button 
              className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              Review/Notes
            </button>
            <button 
              onClick={() => handleAction('holiday')}
              className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'white', borderColor: 'var(--line)', border: '1px solid' }}
            >
              Holiday +
            </button>
          </div>
          
          <div className="flex gap-2">
            <button 
              className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn2)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              Similar To
            </button>
            <button 
              className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--btn2)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              Refine Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
