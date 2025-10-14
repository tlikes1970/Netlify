import { useState } from 'react';
// import { useTranslations } from '@/lib/language'; // Unused

export type GenreDropdownProps = {
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
  className?: string;
};

/**
 * Genre dropdown component for For You section
 * - Multi-select dropdown with popular genres
 * - Updates parent component when selections change
 * - Used to customize discovery recommendations
 */
export default function GenreDropdown({ selectedGenres, onGenresChange, className = '' }: GenreDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  // const translations = useTranslations(); // Unused
  
  const genres = [
    { id: 'action', name: 'Action' },
    { id: 'adventure', name: 'Adventure' },
    { id: 'animation', name: 'Animation' },
    { id: 'comedy', name: 'Comedy' },
    { id: 'crime', name: 'Crime' },
    { id: 'documentary', name: 'Documentary' },
    { id: 'drama', name: 'Drama' },
    { id: 'family', name: 'Family' },
    { id: 'fantasy', name: 'Fantasy' },
    { id: 'history', name: 'History' },
    { id: 'horror', name: 'Horror' },
    { id: 'music', name: 'Music' },
    { id: 'mystery', name: 'Mystery' },
    { id: 'romance', name: 'Romance' },
    { id: 'science-fiction', name: 'Science Fiction' },
    { id: 'thriller', name: 'Thriller' },
    { id: 'war', name: 'War' },
    { id: 'western', name: 'Western' },
  ];
  
  const handleGenreToggle = (genreId: string) => {
    const newGenres = selectedGenres.includes(genreId)
      ? selectedGenres.filter(id => id !== genreId)
      : [...selectedGenres, genreId];
    
    onGenresChange(newGenres);
  };
  
  const getSelectedGenreNames = () => {
    return selectedGenres
      .map(id => genres.find(g => g.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors"
        style={{
          backgroundColor: 'var(--btn)',
          color: 'var(--text)',
          borderColor: 'var(--line)',
          border: '1px solid'
        }}
        aria-label="Select genres for recommendations"
      >
        <span className="text-lg">🎭</span>
        <span className="flex-1 text-left">
          {selectedGenres.length > 0 ? getSelectedGenreNames() : 'Select Genres'}
        </span>
        <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-1 bg-card border border-line rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)' }}
        >
          <div className="p-2">
            <div className="text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>
              Choose your favorite genres:
            </div>
            <div className="grid grid-cols-2 gap-1">
              {genres.map(genre => (
                <label
                  key={genre.id}
                  className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-opacity-10 hover:bg-accent transition-colors"
                  style={{ color: 'var(--text)' }}
                >
                  <input
                    type="checkbox"
                    checked={selectedGenres.includes(genre.id)}
                    onChange={() => handleGenreToggle(genre.id)}
                    className="rounded border-line"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span className="text-sm">{genre.name}</span>
                </label>
              ))}
            </div>
            
            {/* Clear Selection */}
            {selectedGenres.length > 0 && (
              <button
                onClick={() => onGenresChange([])}
                className="w-full mt-2 px-3 py-1 text-xs rounded border border-dashed transition-colors"
                style={{ 
                  color: 'var(--muted)', 
                  borderColor: 'var(--line)',
                  backgroundColor: 'transparent'
                }}
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
