import React, { useEffect, useRef, useState } from "react";
import { APP_VERSION } from "../version";
import { useTranslations } from "../lib/language";
import AccountButton from "./AccountButton";
import SnarkDisplay from "./SnarkDisplay";
import UsernamePromptModal from "./UsernamePromptModal";
import { useUsername } from "../hooks/useUsername";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import SearchSuggestions, { addSearchToHistory } from "./SearchSuggestions";
import VoiceSearch from "./VoiceSearch";
import { fetchMarqueeContent, preloadMarqueeContent } from "../lib/marqueeApi";
import Portal from "./Portal";

const POPULAR_GENRES = [
  { id: null, name: 'All Genres' },
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 14, name: 'Fantasy' },
  { id: 53, name: 'Thriller' },
  { id: 16, name: 'Animation' },
  { id: 99, name: 'Documentary' },
  { id: 80, name: 'Crime' },
  { id: 12, name: 'Adventure' },
  { id: 10751, name: 'Family' },
  { id: 36, name: 'History' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' }
];

export type FlickletHeaderProps = {
  appName?: string;
  showMarquee?: boolean;
  messages?: string[];
  marqueeSpeedSec?: number;  // duration for one full traverse
  changeEveryMs?: number;    // how often to swap messages
  pauseOnHover?: boolean;    // pause marquee animation when hovered
  onSearch?: (query: string, genre?: number | null, searchType?: string) => void;
  onClear?: () => void;
  onHelpOpen?: () => void;   // callback for opening help modal
};

export default function FlickletHeader({
  appName = "Flicklet",
  showMarquee = false,
  messages,
  marqueeSpeedSec = 30,
  changeEveryMs = 20000,
  pauseOnHover = true,
  onSearch,
  onClear,
  onHelpOpen,
}: FlickletHeaderProps) {
  const { username, needsUsernamePrompt, loading: usernameLoading } = useUsername();
  const { isInstallable, promptInstall } = useInstallPrompt();
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  
  // Persisted marquee visibility
  const [marqueeHidden, setMarqueeHidden] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('flicklet.marqueeHidden') : null;
      setMarqueeHidden(saved === '1');
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const hideMarquee = () => {
    setMarqueeHidden(true);
    try { window.localStorage.setItem('flicklet.marqueeHidden', '1'); } catch {
      // Ignore localStorage errors
    }
  };

  // Check if username prompt is needed
  // Use a ref to track if we've already shown the prompt to prevent loops
  const promptShownRef = React.useRef(false);
  const isPromptingRef = React.useRef(false);
  
  useEffect(() => {
    // Skip if username is still loading - wait for it to finish
    if (usernameLoading) {
      return;
    }
    
    // Skip if we're already processing a prompt action
    if (isPromptingRef.current) {
      return;
    }
    
    const needsPrompt = needsUsernamePrompt();
    
    // Only show if we haven't already shown it in this session
    if (needsPrompt && !promptShownRef.current && !showUsernamePrompt) {
      setShowUsernamePrompt(true);
      promptShownRef.current = true;
    } else if (!needsPrompt) {
      setShowUsernamePrompt(false);
      // Reset the ref when prompt is no longer needed (user has username or skipped)
      promptShownRef.current = false;
    }
  }, [username, usernameLoading, needsUsernamePrompt, showUsernamePrompt]);
  
  const handleCloseUsernamePrompt = () => {
    isPromptingRef.current = true;
    setShowUsernamePrompt(false);
    // Reset the ref when modal is closed so it can be shown again if needed
    promptShownRef.current = false;
    // Allow prompting again after a short delay
    setTimeout(() => {
      isPromptingRef.current = false;
    }, 100);
  };

  return (
    <>
      {/* Main header (not sticky) */}
      <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-screen-2xl px-3 py-3 md:px-6 md:py-6">
          <div className="grid grid-cols-3 items-center gap-2 md:gap-4">
            {/* Left: username + snark */}
            <div className="min-w-0 text-left md:text-sm">
              <SnarkDisplay />
            </div>
            {/* Center: title */}
            <div className="text-center">
              <AppTitle text={appName} />
            </div>
            {/* Right: version + help + optional show toggle + auth */}
            <div className="flex items-center justify-end gap-1 md:gap-2">
              <span
                className="select-none text-[10px] md:text-[11px] leading-none text-muted-foreground"
                title="App version"
                data-testid="app-version"
              >
                v{APP_VERSION}
              </span>
              {/* Install Button */}
              {isInstallable && (
                <button
                  onClick={promptInstall}
                  className="rounded-full border border-gray-300 dark:border-gray-600 px-1.5 py-0.5 md:px-2 md:py-1 text-[10px] md:text-[11px] leading-none text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  aria-label="Install app"
                  title="Install Flicklet"
                  data-testid="install-button"
                >
                  Install
                </button>
              )}
              {/* Help Button */}
              <button
                onClick={() => {
                  try {
                    if (onHelpOpen) {
                      onHelpOpen();
                    }
                  } catch (error) {
                    console.error('Error calling onHelpOpen:', error);
                  }
                }}
                className="rounded-full border border-gray-300 dark:border-gray-600 px-1.5 py-0.5 md:px-2 md:py-1 text-[10px] md:text-[11px] leading-none text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="Open help"
                title="Help & Support"
                data-testid="help-button"
              >
                ?
              </button>
              <AccountButton />
            </div>
          </div>
        </div>
      </header>

      {/* Sticky search bar */}
      <div 
        className="sticky top-0"
        style={{ 
          zIndex: 'var(--z-overlay)',
          backgroundColor: 'rgba(15, 17, 21, 0.75)',
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div className="mx-auto w-full max-w-screen-2xl px-2 py-1.5 md:px-4 md:py-2">
          <SearchRow 
            onSearch={(q, g, type) => {
              console.log('[SEARCH]', { q, g, type });
              onSearch?.(q, g, type);
            }} 
            onClear={() => {
              console.log('[CLEAR]');
              onClear?.();
            }} 
          />
        </div>
      </div>

      {/* Marquee (Home only) */}
      {showMarquee && !marqueeHidden && (
        <MarqueeBar
          messages={messages || []}
          speedSec={marqueeSpeedSec}
          changeEveryMs={changeEveryMs}
          pauseOnHover={pauseOnHover}
        />
      )}

      {/* Username prompt modal */}
      <UsernamePromptModal 
        isOpen={showUsernamePrompt} 
        onClose={handleCloseUsernamePrompt} 
      />
    </>
  );
}

function AppTitle({ text }: { text: string }) {
  return (
    <h1
      className="select-none text-balance font-extrabold tracking-tight text-3xl sm:text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]"
      title={text}
      data-testid="app-title"
    >
      <span className="inline-block transition-transform duration-300 ease-out hover:scale-[1.02]">{text}</span>
    </h1>
  );
}

// function UserChip({ username }: { username: string }) { // Unused component
//   const translations = useTranslations();
//   const snark = useMemo(() => oneOf([
//     translations.hasExquisiteTaste,
//     translations.definitelyNotProcrastinating,
//     translations.breaksForPopcornOnly,
//     translations.curatesChaosLikeAPro,
//   ]), [translations]);

//   return (
//     <div className="max-w-full truncate text-sm text-muted-foreground" data-testid="user-chip">
//       <span className="font-semibold text-foreground">{username}</span>{" "}
//       <span className="hidden sm:inline">•</span>{" "}
//       <span className="truncate align-middle">{snark}</span>
//     </div>
//   );
// }

function SearchRow({ onSearch, onClear }: { onSearch?: (q: string, g?: number | null, searchType?: string) => void; onClear?: () => void }) {
  const translations = useTranslations();
  const [q, setQ] = React.useState('');
  const [g, setG] = React.useState<number | null>(null);
  const [searchMode, setSearchMode] = React.useState<'title' | 'tag'>('title');
  const [searchType, setSearchType] = React.useState<'all' | 'movies-tv' | 'people'>('all');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [isComposing, setIsComposing] = React.useState(false);
  const [showFiltersDropdown, setShowFiltersDropdown] = React.useState(false);
  const [showAllGenres, setShowAllGenres] = React.useState(false);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const filtersDropdownRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceTimerRef = React.useRef<number | null>(null);
  
  const submit = () => {
    if (isComposing) return; // Don't submit during IME composition
    
    const trimmed = q.trim();
    if (trimmed) {
      if (searchMode === 'tag') {
        onSearch?.(`tag:${trimmed}`, g, searchType);
      } else {
        onSearch?.(trimmed, g, searchType);
      }
      
      // Add to search history
      addSearchToHistory(trimmed);
    }
    
    setShowSuggestions(false);
  };
  
  const clear = () => { 
    setQ(''); 
    setG(null); 
    setSearchMode('title'); 
    setSearchType('all');
    setShowSuggestions(false);
    setShowFiltersDropdown(false);
    onClear?.();
    inputRef.current?.focus();
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setQ(suggestion);
    setShowSuggestions(false);
    // Auto-submit the suggestion
    setTimeout(() => {
      if (searchMode === 'tag') {
        onSearch?.(`tag:${suggestion.trim()}`, g, searchType);
      } else {
        onSearch?.(suggestion.trim(), g, searchType);
      }
      addSearchToHistory(suggestion.trim());
    }, 100);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isComposing) return; // Don't update during IME composition
    
    setQ(e.target.value);
    
    // Debounce suggestions
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      setShowSuggestions(e.target.value.length > 0 && isFocused);
    }, 250);
  };
  
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (q.length > 0) {
      setShowSuggestions(true);
    }
    e.currentTarget.select();
  };
  
  const handleInputBlur = () => {
    // Let suggestions handle mousedown before blur
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 200);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isComposing) {
      e.preventDefault();
      e.stopPropagation();
      submit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      clear();
    }
  };
  
  // Cleanup debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Build labels for the filters button
  const selectedGenreName =
    (g === null
      ? 'All Genres'
      : POPULAR_GENRES.find(genre => genre.id === g)?.name) ?? 'All Genres';

  const selectedTypeName =
    searchType === 'all' ? '' : (searchType === 'movies-tv' ? 'Movies/TV' : 'People');

  function getFiltersLabel() {
    // Priority: show genre if not default, otherwise show type if not default,
    // otherwise just "Filters".
    if (selectedGenreName !== 'All Genres') return selectedGenreName;
    if (selectedTypeName) return selectedTypeName;
    if (searchMode !== 'title') return 'Tag';
    return 'Filters';
  }

  // Optional: keep the full summary for tooltip/aria
  function getFiltersSummary() {
    const parts = [];
    parts.push(selectedGenreName);
    parts.push(selectedTypeName || 'All');
    parts.push(searchMode === 'tag' ? 'Tag mode' : 'Title mode');
    return parts.filter(Boolean).join(' · ');
  }

  // Close suggestions and dropdown when clicking outside
  React.useEffect(() => {
    const handleGlobalPointerDown = (event: PointerEvent) => {
      const t = event.target as Node;
      const insideTrigger = filtersDropdownRef.current?.contains(t);
      const insideMenu = menuRef.current?.contains(t);
      if (!insideTrigger && !insideMenu) {
        setShowFiltersDropdown(false);
        setShowSuggestions(false);
      }
    };

    document.addEventListener('pointerdown', handleGlobalPointerDown);
    return () => document.removeEventListener('pointerdown', handleGlobalPointerDown);
  }, []);
  
  return (
    <div className="flex items-stretch gap-0 rounded-2xl border bg-background p-0" data-testid="search-row" ref={searchContainerRef}>
      {/* Filters Dropdown Button - LEFT SIDE */}
      <div className="relative" ref={filtersDropdownRef}>
        <button
          type="button"
          onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
          className="rounded-l-2xl border-r-0 px-2 py-2 md:px-3 md:py-3 text-xs font-semibold hover:bg-accent hover:text-accent-foreground transition-all h-full"
          aria-haspopup="menu"
          aria-expanded={showFiltersDropdown}
          aria-label={`Filters: ${getFiltersSummary()}`}
          title={getFiltersSummary()}
        >
          {getFiltersLabel()}
          <span className="ml-1">▾</span>
        </button>
        
        {/* Dropdown Menu - Portal to escape stacking contexts */}
        {showFiltersDropdown && filtersDropdownRef.current && (
          <Portal>
            <>
              <div
                ref={menuRef}
                role="menu"
                className="fixed rounded-lg border shadow-2xl bg-white text-black"
                onPointerDown={(e) => e.stopPropagation()}
                style={{ 
                  zIndex: 1000,
                  top: `${filtersDropdownRef.current.getBoundingClientRect().bottom + 8}px`,
                  left: `${filtersDropdownRef.current.getBoundingClientRect().left}px`,
                  width: '320px',
                  maxWidth: '90vw',
                  maxHeight: '70vh',
                  overflowY: 'auto',
                  padding: '12px'
                }}
              >
                <div className="space-y-2">
            {/* Title */}
              <button
                type="button"
                onClick={() => { setSearchMode('title'); setShowFiltersDropdown(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded transition-colors text-black ${
                  searchMode === 'title' 
                    ? 'bg-blue-500 text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                Title
              </button>
              
              {/* Tag */}
              <button
                type="button"
                onClick={() => { setSearchMode('tag'); setShowFiltersDropdown(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded transition-colors text-black ${
                  searchMode === 'tag' 
                    ? 'bg-blue-500 text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                Tag
              </button>
              
              {/* Divider */}
              <div className="h-px bg-gray-300 my-1"></div>
              
              {/* All */}
              <button
                type="button"
                onClick={() => { setSearchType('all'); setShowFiltersDropdown(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded transition-colors text-black ${
                  searchType === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                All
              </button>
              
              {/* Movies/TV */}
              <button
                type="button"
                onClick={() => { setSearchType('movies-tv'); setShowFiltersDropdown(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded transition-colors text-black ${
                  searchType === 'movies-tv' 
                    ? 'bg-blue-500 text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                Movies/TV
              </button>
              
              {/* People */}
              <button
                type="button"
                onClick={() => { setSearchType('people'); setShowFiltersDropdown(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded transition-colors text-black ${
                  searchType === 'people' 
                    ? 'bg-blue-500 text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                People
              </button>
              
                  {/* Divider */}
                  <div className="h-px bg-gray-300 my-1"></div>
                  
                  {/* Genres */}
                  {(showAllGenres ? POPULAR_GENRES : POPULAR_GENRES.slice(0, 8)).map(genre => (
                    <button
                      key={genre.id ?? 'all'}
                      type="button"
                      onClick={() => { setG(genre.id); setShowFiltersDropdown(false); }}
                      className={`w-full text-left px-3 py-2.5 text-xs font-medium rounded transition-colors leading-normal whitespace-normal ${
                        g === genre.id 
                          ? 'bg-blue-500 text-white' 
                          : 'hover:bg-gray-100 text-black'
                      }`}
                    >
                      {genre.name}
                    </button>
                  ))}
                  
                  {POPULAR_GENRES.length > 8 && (
                    <button
                      type="button"
                      onClick={() => setShowAllGenres(v => !v)}
                      className="w-full mt-1 px-3 py-2 text-xs font-semibold rounded bg-gray-50 hover:bg-gray-100 text-gray-700"
                    >
                      {showAllGenres ? 'Show fewer' : 'Show more'}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Backdrop to close dropdown - behind the menu */}
              <div 
                className="fixed inset-0"
                onClick={() => setShowFiltersDropdown(false)}
                style={{ 
                  zIndex: 999
                }}
              />
          </>
          </Portal>
        )}
      </div>

      {/* Search Input - Takes up most of the space */}
      <div className="relative flex-1 min-w-0">
        <form onSubmit={e => { e.preventDefault(); submit(); }}>
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="search"
              role="searchbox"
              inputMode="search"
              aria-label="Search movies, shows, people"
              placeholder={searchMode === 'tag' ? 'Search by tag...' : translations.searchPlaceholder}
              value={q}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              className="w-full rounded-none border-l-0 border-r-0 border-y-0 px-2 py-2 md:px-4 md:py-3 pr-8 md:pr-12 text-xs md:text-sm outline-none ring-0 focus:border-primary"
              spellCheck="true"
            />
          
            {/* Voice Search Button */}
            <div className="absolute right-1 md:right-2">
              <VoiceSearch
                onVoiceResult={(text) => {
                  setQ(text);
                  setShowSuggestions(false);
                  // Auto-submit the voice result
                  setTimeout(() => {
                    if (searchMode === 'tag') {
                      onSearch?.(`tag:${text.trim()}`, g, searchType);
                    } else {
                      onSearch?.(text.trim(), g, searchType);
                    }
                    addSearchToHistory(text.trim());
                  }, 100);
                }}
                onError={(error) => {
                  console.warn('Voice search error:', error);
                }}
              />
            </div>
          </div>
        </form>
        
        {/* Search Suggestions Dropdown */}
        <SearchSuggestions
          query={q}
          onSuggestionClick={handleSuggestionClick}
          onClose={() => setShowSuggestions(false)}
          isVisible={showSuggestions}
        />
      </div>
      
      {/* Action Buttons */}
      <div className="flex">
        <button type="submit" className="rounded-r-2xl rounded-l-none border-l-0 border-r-0 px-2 py-2 md:px-3 md:py-3 text-xs font-semibold hover:bg-accent hover:text-accent-foreground transition-all duration-150 ease-out" onClick={submit}>{translations.search}</button>
        <button type="button" className="rounded-r-2xl rounded-l-none border-l-0 px-2 py-2 md:px-3 md:py-3 text-xs font-semibold hover:bg-muted transition-all duration-150 ease-out" onClick={clear}>{translations.clear}</button>
      </div>
    </div>
  );
}

function MarqueeBar({
  messages,
  speedSec = 30,
  changeEveryMs = 20000,
  pauseOnHover = true,
}: {
  messages: string[];
  speedSec?: number;
  changeEveryMs?: number;
  pauseOnHover?: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [apiMessages, setApiMessages] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const keyRef = useRef(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Load API content when component mounts
  useEffect(() => {
    const loadApiContent = async () => {
      try {
        const content = await fetchMarqueeContent();
        const texts = content.map(item => item.text);
        setApiMessages(texts);
      } catch (error) {
        console.warn('Failed to load marquee content from API:', error);
        // Fallback to provided messages
        setApiMessages(messages);
      }
    };

    loadApiContent();
  }, [messages]);

  // Preload content for better performance
  useEffect(() => {
    preloadMarqueeContent();
  }, []);

  useEffect(() => {
    const currentMessages = apiMessages.length > 0 ? apiMessages : messages;
    if (!currentMessages?.length) return;
    
    const t = setInterval(() => {
      setIdx(i => (i + 1) % currentMessages.length);
      keyRef.current += 1; // restart CSS animation
      setIsPaused(false); // Resume animation when message changes
    }, Math.max(4000, changeEveryMs));
    return () => clearInterval(t);
  }, [apiMessages, messages, changeEveryMs]);

  // Handle click to pause/resume
  const handleClick = () => {
    if (scrollerRef.current) {
      const newPaused = !isPaused;
      setIsPaused(newPaused);
      scrollerRef.current.style.animationPlayState = newPaused ? 'paused' : 'running';
    }
  };

  const currentMessages = apiMessages.length > 0 ? apiMessages : messages;
  const msg = currentMessages[idx] || "";

  return (
    <div
      className="marquee-rail f-marquee-rail w-full border-t bg-muted/60 text-muted-foreground"
      data-testid="marquee-rail"
      data-pause-on-hover={pauseOnHover ? 'true' : 'false'}
    >
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-4">
        <div className="relative h-9 sm:h-10 overflow-hidden">
          <div
            ref={scrollerRef}
            key={keyRef.current}
            className="absolute inset-0 whitespace-nowrap f-marquee-scroll cursor-pointer"
            style={{ 
              ["--marquee-duration" as any]: `${Math.max(10, speedSec)}s`,
              animationPlayState: isPaused ? 'paused' : 'running'
            }}
            onClick={handleClick}
            aria-live="polite"
            data-testid="marquee-scroller"
            title={isPaused ? 'Click to resume' : 'Click to pause'}
          >
            <span className="inline-block align-middle text-sm sm:text-base md:text-lg whitespace-nowrap">{msg}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// function oneOf<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] } // Unused
