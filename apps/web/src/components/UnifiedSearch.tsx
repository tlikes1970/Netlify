import { useState } from 'react';

interface UnifiedSearchProps {
  onSearch?: (query: string, genre: string | null) => void;
}

export default function UnifiedSearch({ onSearch }: UnifiedSearchProps) {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onSearch?.(query, genre);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="flex items-center bg-neutral-950 border border-white/10 rounded-2xl overflow-hidden">
        {/* Search Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search movies and TV..."
          className="flex-1 px-4 py-2 bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none"
        />
        
        {/* Filters Icon */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-3 py-2 text-neutral-400 hover:text-white transition-colors"
          title="Filters"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
        
        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Filters Dropdown */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-white/10 rounded-lg shadow-lg z-50 p-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Genre
              </label>
              <select
                value={genre || ''}
                onChange={(e) => setGenre(e.target.value || null)}
                className="w-full px-3 py-2 bg-neutral-800 border border-white/10 rounded text-sm text-white"
              >
                <option value="">All Genres</option>
                <option value="18">Drama</option>
                <option value="35">Comedy</option>
                <option value="27">Horror</option>
                <option value="28">Action</option>
                <option value="12">Adventure</option>
                <option value="16">Animation</option>
                <option value="80">Crime</option>
                <option value="99">Documentary</option>
                <option value="14">Fantasy</option>
                <option value="36">History</option>
                <option value="10402">Music</option>
                <option value="9648">Mystery</option>
                <option value="10749">Romance</option>
                <option value="878">Science Fiction</option>
                <option value="10770">TV Movie</option>
                <option value="53">Thriller</option>
                <option value="10752">War</option>
                <option value="37">Western</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 px-3 py-2 bg-neutral-700 text-white text-sm rounded hover:bg-neutral-600 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setGenre(null);
                  setShowFilters(false);
                }}
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
