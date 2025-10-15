import React, { useEffect, useRef, useState } from "react";
import { APP_VERSION } from "../version";
import { useTranslations } from "../lib/language";
import AccountButton from "./AccountButton";
import SnarkDisplay from "./SnarkDisplay";
import UsernamePromptModal from "./UsernamePromptModal";
import { useUsername } from "../hooks/useUsername";
import FilterChips from "./FilterChips";
import SearchSuggestions, { addSearchToHistory } from "./SearchSuggestions";
import VoiceSearch from "./VoiceSearch";
import { fetchMarqueeContent, preloadMarqueeContent } from "../lib/marqueeApi";

export type FlickletHeaderProps = {
  appName?: string;
  showMarquee?: boolean;
  messages?: string[];
  marqueeSpeedSec?: number;  // duration for one full traverse
  changeEveryMs?: number;    // how often to swap messages
  pauseOnHover?: boolean;    // pause marquee animation when hovered
  onSearch?: (query: string, genre?: string | null) => void;
  onClear?: () => void;
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
}: FlickletHeaderProps) {
  const translations = useTranslations();
  const { username, needsUsernamePrompt } = useUsername();
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  
  // Use provided messages or default translated messages
  // const defaultMessages = [ // Unused
  //   translations.marqueeMessage1,
  //   translations.marqueeMessage2,
  //   translations.marqueeMessage3,
  //   translations.marqueeMessage4,
  //   translations.marqueeMessage5,
  // ];
  
  // const marqueeMessages = messages || defaultMessages; // Unused
  // Persisted marquee visibility
  const [marqueeHidden, setMarqueeHidden] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('flicklet.marqueeHidden') : null;
      setMarqueeHidden(saved === '1');
    } catch {}
  }, []);

  const hideMarquee = () => {
    setMarqueeHidden(true);
    try { window.localStorage.setItem('flicklet.marqueeHidden', '1'); } catch {}
  };

  const showMarqueePref = () => {
    setMarqueeHidden(false);
    try { window.localStorage.removeItem('flicklet.marqueeHidden'); } catch {}
  };

  // Check if username prompt is needed
  useEffect(() => {
    console.log('🔍 Checking username prompt:', { 
      needsPrompt: needsUsernamePrompt(), 
      username, 
      showModal: showUsernamePrompt 
    });
    
    if (needsUsernamePrompt()) {
      setShowUsernamePrompt(true);
    } else {
      setShowUsernamePrompt(false);
    }
  }, [username]); // Remove needsUsernamePrompt from dependencies

  return (
    <>
      {/* Main header (not sticky) */}
      <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6">
          <div className="grid grid-cols-3 items-center gap-4 py-4 sm:py-6">
            {/* Left: username + snark */}
            <div className="min-w-0 text-left">
              <SnarkDisplay />
            </div>
            {/* Center: title */}
            <div className="text-center">
              <AppTitle text={appName} />
            </div>
            {/* Right: version + optional show toggle + auth */}
            <div className="flex items-center justify-end gap-2">
              <span
                className="select-none text-[11px] leading-none text-muted-foreground"
                title="App version"
                data-testid="app-version"
              >
                v{APP_VERSION}
              </span>
              {marqueeHidden && (
                <button
                  type="button"
                  onClick={showMarqueePref}
                  className="rounded-full border px-2 py-1 text-[11px] leading-none text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  aria-pressed="false"
                  data-testid="marquee-show"
                  title="Show marquee"
                >
                  {translations.showMarquee}
                </button>
              )}
              <AccountButton />
            </div>
          </div>
        </div>
      </header>

      {/* Sticky search bar */}
      <div className="sticky top-[var(--safe-top,0px)] z-[1000] border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-4 py-2">
          <div className="relative flex items-center gap-3 rounded-2xl border bg-background p-3 sm:p-4" data-testid="search-row">
            <SearchRow onSearch={onSearch} onClear={onClear} />
          </div>
        </div>
      </div>

      {/* Marquee (Home only) */}
      {showMarquee && !marqueeHidden && (
        <MarqueeBar
          messages={messages || []}
          speedSec={marqueeSpeedSec}
          changeEveryMs={changeEveryMs}
          pauseOnHover={pauseOnHover}
          onClose={hideMarquee}
        />
      )}

      {/* Username prompt modal */}
      <UsernamePromptModal 
        isOpen={showUsernamePrompt} 
        onClose={() => setShowUsernamePrompt(false)} 
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

function SearchRow({ onSearch, onClear }: { onSearch?: (q: string, g?: string | null, searchType?: string) => void; onClear?: () => void }) {
  const translations = useTranslations();
  const [q, setQ] = React.useState('');
  const [g, setG] = React.useState<string | null>(null);
  const [searchMode, setSearchMode] = React.useState<'title' | 'tag'>('title');
  const [searchType, setSearchType] = React.useState<'all' | 'movies-tv' | 'people'>('all');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  
  const submit = () => {
    if (searchMode === 'tag') {
      // For tag search, we'll use a special prefix to indicate it's a tag search
      onSearch?.(`tag:${q.trim()}`, g, searchType);
    } else {
      onSearch?.(q.trim(), g, searchType);
    }
    
    // Add to search history
    if (q.trim()) {
      addSearchToHistory(q.trim());
    }
    
    setShowSuggestions(false);
  };
  
  const clear = () => { 
    setQ(''); 
    setG(null); 
    setSearchMode('title'); 
    setSearchType('all');
    setShowSuggestions(false);
    onClear?.(); 
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
    setQ(e.target.value);
    setShowSuggestions(e.target.value.length > 0 && isFocused);
  };
  
  const handleInputFocus = () => {
    setIsFocused(true);
    setShowSuggestions(q.length > 0);
  };
  
  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 150);
  };
  
  // Close suggestions when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <>
      {/* Search Input and Controls - All in one horizontal line */}
      <div className="flex items-center gap-3 w-full">
        {/* Search Input - Takes up most of the space */}
        <div className="relative flex-1 min-w-0">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder={searchMode === 'tag' ? 'Search by tag...' : translations.searchPlaceholder}
              value={q}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={e => { 
                if (e.key === 'Enter') submit(); 
                if (e.key === 'Escape') clear(); 
              }}
              className="w-full rounded-xl border px-4 py-3 pr-12 text-sm outline-none ring-0 focus:border-primary"
              spellCheck="true"
            />
            
            {/* Voice Search Button */}
            <div className="absolute right-2">
              <VoiceSearch
                onVoiceResult={(text) => {
                  setQ(text);
                  setShowSuggestions(false);
                  // Auto-submit the voice result
                  setTimeout(() => {
                    if (searchMode === 'tag') {
                      onSearch?.(`tag:${text.trim()}`, g);
                    } else {
                      onSearch?.(text.trim(), g);
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
          
          {/* Search Suggestions Dropdown */}
          <SearchSuggestions
            query={q}
            onSuggestionClick={handleSuggestionClick}
            onClose={() => setShowSuggestions(false)}
            isVisible={showSuggestions}
          />
        </div>
        
        {/* Controls - All in a horizontal line */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Search Mode Toggle */}
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setSearchMode('title')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                searchMode === 'title' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              Title
            </button>
            <button
              onClick={() => setSearchMode('tag')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                searchMode === 'tag' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              Tag
            </button>
          </div>
          
          {/* Search Type Toggle */}
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setSearchType('all')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                searchType === 'all' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSearchType('movies-tv')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                searchType === 'movies-tv' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              Movies/TV
            </button>
            <button
              onClick={() => setSearchType('people')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                searchType === 'people' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              People
            </button>
          </div>
          
          {/* Genre Filter Chips */}
          <div className="w-32">
            <FilterChips 
              selectedGenre={g}
              onGenreChange={setG}
              className="w-full"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-accent hover:text-accent-foreground transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md" onClick={submit}>{translations.search}</button>
            <button className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md" onClick={clear}>{translations.clear}</button>
          </div>
        </div>
      </div>
    </>
  );
}

function MarqueeBar({
  messages,
  speedSec = 30,
  changeEveryMs = 20000,
  pauseOnHover = true,
  onClose,
}: {
  messages: string[];
  speedSec?: number;
  changeEveryMs?: number;
  pauseOnHover?: boolean;
  onClose?: () => void;
}) {
  const translations = useTranslations();
  const [idx, setIdx] = useState(0);
  const [apiMessages, setApiMessages] = useState<string[]>([]);
  const keyRef = useRef(0);

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
    }, Math.max(4000, changeEveryMs));
    return () => clearInterval(t);
  }, [apiMessages, messages, changeEveryMs]);

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
          {/* Close / Hide control */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-1.5 top-1.5 z-[2] rounded-md border px-2 py-0.5 text-[11px] leading-none backdrop-blur hover:bg-accent hover:text-accent-foreground"
              aria-label="Hide marquee"
              data-testid="marquee-hide"
            >
              {translations.hideMarquee}
            </button>
          )}
          <div
            key={keyRef.current}
            className="absolute inset-0 whitespace-nowrap f-marquee-scroll"
            style={{ ["--marquee-duration" as any]: `${Math.max(10, speedSec)}s` }}
            aria-live="polite"
            data-testid="marquee-scroller"
          >
            <span className="pr-[100vw] align-middle text-sm sm:text-base md:text-lg">{msg}</span>
            <span className="pr-[100vw] align-middle text-sm sm:text-base md:text-lg" aria-hidden>{msg}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// function oneOf<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] } // Unused
