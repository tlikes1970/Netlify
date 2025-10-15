import { useState, useRef, useEffect } from 'react';
import { useTranslations } from '../lib/language';

export type FilterChipsProps = {
  selectedGenre: string | null;
  onGenreChange: (genre: string | null) => void;
  className?: string;
};

// Popular genres for search filtering - using TMDB genre IDs
const POPULAR_GENRES = [
  { id: null, name: 'All Genres' },
  { id: '28', name: 'Action' },
  { id: '35', name: 'Comedy' },
  { id: '18', name: 'Drama' },
  { id: '27', name: 'Horror' },
  { id: '10749', name: 'Romance' },
  { id: '878', name: 'Sci-Fi' },
  { id: '14', name: 'Fantasy' },
  { id: '53', name: 'Thriller' },
  { id: '16', name: 'Animation' },
  { id: '99', name: 'Documentary' },
  { id: '80', name: 'Crime' },
  { id: '12', name: 'Adventure' },
  { id: '10751', name: 'Family' },
  { id: '36', name: 'History' },
  { id: '10402', name: 'Music' },
  { id: '9648', name: 'Mystery' },
  { id: '10752', name: 'War' },
  { id: '37', name: 'Western' }
];

export default function FilterChips({ selectedGenre, onGenreChange, className = '' }: FilterChipsProps) {
  const translations = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get the selected genre name for display
  const selectedGenreName = POPULAR_GENRES.find(g => g.id === selectedGenre)?.name || translations.allGenres;
  
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
        <span className="truncate text-xs">{selectedGenreName}</span>
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
          <div className="py-2">
            {/* Simple List */}
            {POPULAR_GENRES.map(genre => (
              <button
                key={genre.id || 'all'}
                onClick={() => handleGenreClick(genre.id)}
                className={`
                  w-full text-left px-4 py-2 text-sm
                  transition-colors duration-200
                  hover:bg-muted
                  ${selectedGenre === genre.id
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground'
                  }
                `}
                style={{
                  backgroundColor: selectedGenre === genre.id ? 'var(--accent)' : 'transparent',
                  color: selectedGenre === genre.id ? 'var(--accent-foreground)' : 'var(--foreground)'
                }}
              >
                {genre.name}
              </button>
            ))}
          </div>
          </div>
        </>
      )}
    </div>
  );
}
