import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from '../lib/language';

export type FilterChipsProps = {
  selectedGenre: string | null;
  onGenreChange: (genre: string | null) => void;
  className?: string;
};

// Popular genres for search filtering - using TMDB genre IDs
const POPULAR_GENRES = [
  { id: null, name: 'All Genres', icon: '🎬' },
  { id: '28', name: 'Action', icon: '💥' },
  { id: '35', name: 'Comedy', icon: '😂' },
  { id: '18', name: 'Drama', icon: '🎭' },
  { id: '27', name: 'Horror', icon: '👻' },
  { id: '10749', name: 'Romance', icon: '💕' },
  { id: '878', name: 'Sci-Fi', icon: '🚀' },
  { id: '14', name: 'Fantasy', icon: '🧙' },
  { id: '53', name: 'Thriller', icon: '🔪' },
  { id: '16', name: 'Animation', icon: '🎨' },
  { id: '99', name: 'Documentary', icon: '📹' },
  { id: '80', name: 'Crime', icon: '🔍' },
  { id: '12', name: 'Adventure', icon: '🗺️' },
  { id: '10751', name: 'Family', icon: '👨‍👩‍👧‍👦' },
  { id: '36', name: 'History', icon: '📜' },
  { id: '10402', name: 'Music', icon: '🎵' },
  { id: '9648', name: 'Mystery', icon: '🕵️' },
  { id: '10752', name: 'War', icon: '⚔️' },
  { id: '37', name: 'Western', icon: '🤠' }
];

export default function FilterChips({ selectedGenre, onGenreChange, className = '' }: FilterChipsProps) {
  const translations = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get the selected genre name for display
  const selectedGenreName = POPULAR_GENRES.find(g => g.id === selectedGenre)?.name || translations.allGenres;
  const selectedGenreIcon = POPULAR_GENRES.find(g => g.id === selectedGenre)?.icon || '🎬';
  
  const handleGenreClick = (genreId: string | null) => {
    onGenreChange(genreId);
    setIsOpen(false); // Close dropdown after selection
  };

  // Close dropdown when clicking outside (handled by backdrop now)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full rounded-lg border px-2 py-2 text-xs text-left
          bg-card text-foreground border-line
          hover:bg-muted transition-colors duration-200
          flex items-center justify-between
        "
        style={{
          backgroundColor: 'var(--card)',
          color: 'var(--foreground)',
          borderColor: 'var(--line)'
        }}
      >
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-xs">{selectedGenreIcon}</span>
          <span className="truncate text-xs">{selectedGenreName}</span>
        </div>
        <span className={`text-xs transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      {/* Dropdown Content - Fixed positioning */}
      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          
          <div 
            className="
              fixed bg-card border border-line rounded-xl shadow-lg
              max-h-80 overflow-y-auto
            "
            style={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--line)',
              zIndex: 9999,
              top: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().bottom + 4 : 0,
              left: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().left : 0,
              width: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().width : 'auto',
              maxWidth: '400px'
            }}
          >
          <div className="p-3">
            <div className="text-xs font-medium mb-3" style={{ color: 'var(--muted)' }}>
              Choose a genre:
            </div>
            
            {/* Filter Chips Grid */}
            <div className="grid grid-cols-2 gap-2">
              {POPULAR_GENRES.map(genre => (
                <button
                  key={genre.id || 'all'}
                  onClick={() => handleGenreClick(genre.id)}
                  className={`
                    inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200 ease-out
                    hover:scale-105 active:scale-95
                    ${selectedGenre === genre.id
                      ? 'bg-accent text-accent-foreground shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }
                  `}
                  style={{
                    backgroundColor: selectedGenre === genre.id ? 'var(--accent)' : 'var(--muted)',
                    color: selectedGenre === genre.id ? 'var(--accent-foreground)' : 'var(--muted-foreground)'
                  }}
                >
                  <span className="text-base">{genre.icon}</span>
                  <span>{genre.name}</span>
                </button>
              ))}
            </div>
          </div>
          </div>
        </>
      )}
    </div>
  );
}
