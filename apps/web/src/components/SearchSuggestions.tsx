import { useState, useEffect, useRef } from 'react';
import { fetchAutocomplete, type AutocompleteSuggestion } from '../search/autocomplete';
// import { useTranslations } from '../lib/language'; // Unused

export type SearchSuggestionsProps = {
  query: string;
  onSuggestionClick: (suggestion: string) => void;
  onClose: () => void;
  isVisible: boolean;
  className?: string;
};

// Popular search suggestions
const POPULAR_SUGGESTIONS = [
  'Marvel movies',
  'Netflix originals',
  'Anime series',
  'Horror movies',
  'Romantic comedies',
  'Sci-fi shows',
  'Documentaries',
  'Action movies',
  'Fantasy series',
  'Thriller movies',
  'Comedy shows',
  'Drama series',
  'Crime shows',
  'Mystery movies',
  'Family movies',
  'War movies',
  'Western movies',
  'Musical movies',
  'Historical dramas',
  'Superhero shows'
];

// Search history management with timestamps
const SEARCH_HISTORY_KEY = 'flicklet.search-history';
const MAX_HISTORY_ITEMS = 20;
const HISTORY_EXPIRY_DAYS = 90;

type HistoryEntry = { q: string; ts: number };

function getSearchHistory(): string[] {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!stored) return [];
    
    const entries: HistoryEntry[] = JSON.parse(stored);
    const cutoffTime = Date.now() - (HISTORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    
    // Filter out expired entries and return just the queries
    const valid = entries
      .filter(entry => entry.ts >= cutoffTime)
      .map(entry => entry.q);
    
    // Save cleaned history back
    if (valid.length !== entries.length) {
      saveSearchHistoryEntries(valid.map(q => ({ q, ts: Date.now() })));
    }
    
    return valid;
  } catch {
    return [];
  }
}

function saveSearchHistoryEntries(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(entries));
  } catch (error) {
    console.warn('Failed to save search history:', error);
  }
}

function addToSearchHistory(query: string): void {
  if (!query.trim()) return;
  
  const entries: HistoryEntry[] = getSearchHistoryEntries();
  const trimmedQuery = query.trim();
  
  // Remove if already exists
  const filtered = entries.filter(e => e.q !== trimmedQuery);
  
  // Add to beginning with current timestamp
  const newHistory = [
    { q: trimmedQuery, ts: Date.now() },
    ...filtered
  ].slice(0, MAX_HISTORY_ITEMS);
  
  saveSearchHistoryEntries(newHistory);
}

function getSearchHistoryEntries(): HistoryEntry[] {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addSearchToHistory(query: string): void {
  addToSearchHistory(query);
}

export default function SearchSuggestions({ 
  query, 
  onSuggestionClick, 
  onClose, 
  isVisible, 
  className = '' 
}: SearchSuggestionsProps) {
  // const translations = useTranslations(); // Unused
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [tmdbSuggestions, setTmdbSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Load search history on mount
  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);
  
  // Fetch TMDB autocomplete suggestions
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setTmdbSuggestions([]);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const fetchSuggestions = async () => {
      try {
        const suggestions = await fetchAutocomplete(query, abortControllerRef.current?.signal);
        setTmdbSuggestions(suggestions);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.warn('Failed to fetch autocomplete:', error);
        }
        setTmdbSuggestions([]);
      }
    };

    // Debounce TMDB requests
    const timer = setTimeout(fetchSuggestions, 300);
    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query]);

  // Filter suggestions based on query
  useEffect(() => {
    if (!query.trim()) {
      setFilteredSuggestions([]);
      return;
    }
    
    const queryLower = query.toLowerCase();
    
    // Filter popular suggestions that match the query
    const matchingPopular = POPULAR_SUGGESTIONS.filter(suggestion =>
      suggestion.toLowerCase().includes(queryLower)
    );
    
    // Filter search history that matches the query
    const matchingHistory = searchHistory.filter(item =>
      item.toLowerCase().includes(queryLower)
    );
    
    // Combine and deduplicate (history first, then popular)
    const combined = [...matchingHistory, ...matchingPopular.filter(p => !matchingHistory.includes(p))];
    
    setFilteredSuggestions(combined.slice(0, 8)); // Limit to 8 suggestions
    setSelectedIndex(-1);
  }, [query, searchHistory]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const hasHistory = searchHistory.length > 0;
      const maxIndex = (hasHistory ? 3 : 0) + tmdbSuggestions.length + filteredSuggestions.length;
      
      if (!isVisible || maxIndex === 0) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredSuggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
            handleSuggestionClick(filteredSuggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, filteredSuggestions, selectedIndex, onClose]);
  
  const handleSuggestionClick = (suggestion: string) => {
    onSuggestionClick(suggestion);
    onClose();
  };
  
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.setItem('searchHistory', JSON.stringify([]));
  };
  
  const totalSuggestions = tmdbSuggestions.length + filteredSuggestions.length;
  
  if (!isVisible || totalSuggestions === 0) {
    return null;
  }
  
  return (
    <div 
      ref={suggestionsRef}
      className={`
        absolute top-full left-0 right-0 mt-1 bg-card border border-line rounded-xl shadow-lg
        max-h-80 overflow-y-auto
        ${className}
      `}
      style={{ 
        backgroundColor: 'var(--card)', 
        borderColor: 'var(--line)',
        zIndex: 9999
      }}
    >
      <div className="p-2">
        {/* Search History Section */}
        {searchHistory.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                Recent Searches
              </div>
              <button
                onClick={clearHistory}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                style={{ color: 'var(--muted)' }}
              >
                Clear
              </button>
            </div>
            
            <div className="space-y-1">
              {searchHistory.slice(0, 3).map((item, index) => (
                <button
                  key={`history-${item}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSuggestionClick(item);
                  }}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer
                    ${selectedIndex === index
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted text-foreground'
                    }
                  `}
                  style={{
                    backgroundColor: selectedIndex === index ? 'var(--accent)' : 'transparent',
                    color: selectedIndex === index ? 'var(--accent-foreground)' : 'var(--foreground)'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs">🕒</span>
                    <span>{item}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* TMDB Autocomplete Section */}
        {tmdbSuggestions.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>
              From TMDB
            </div>
            
            <div className="space-y-1">
              {tmdbSuggestions.map((suggestion, index) => {
                const adjustedIndex = index;
                
                return (
                  <button
                    key={`tmdb-${suggestion.type}-${suggestion.id}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSuggestionClick(suggestion.title);
                    }}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer
                      ${selectedIndex === adjustedIndex
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted text-foreground'
                      }
                    `}
                    style={{
                      backgroundColor: selectedIndex === adjustedIndex ? 'var(--accent)' : 'transparent',
                      color: selectedIndex === adjustedIndex ? 'var(--accent-foreground)' : 'var(--foreground)'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{suggestion.type === 'movie' ? '🎬' : suggestion.type === 'tv' ? '📺' : '👤'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{suggestion.title}</div>
                        {suggestion.subtitle && (
                          <div className="text-xs opacity-75 truncate">{suggestion.subtitle}</div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Suggestions Section */}
        {filteredSuggestions.length > 0 && (
          <div>
            <div className="text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>
              Popular
            </div>
            
            <div className="space-y-1">
              {filteredSuggestions.map((suggestion, index) => {
                const isHistoryItem = searchHistory.includes(suggestion);
                const adjustedIndex = tmdbSuggestions.length + index + (searchHistory.length > 0 ? 3 : 0);
                
                return (
                  <button
                    key={`suggestion-${suggestion}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSuggestionClick(suggestion);
                    }}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer
                      ${selectedIndex === adjustedIndex
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted text-foreground'
                      }
                    `}
                    style={{
                      backgroundColor: selectedIndex === adjustedIndex ? 'var(--accent)' : 'transparent',
                      color: selectedIndex === adjustedIndex ? 'var(--accent-foreground)' : 'var(--foreground)'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{isHistoryItem ? '🕒' : '💡'}</span>
                      <span>{suggestion}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
