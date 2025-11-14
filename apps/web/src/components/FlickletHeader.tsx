import React, { useEffect, useState } from "react";
import { APP_VERSION } from "../version";
import { useTranslations } from "../lib/language";
import AccountButton from "./AccountButton";
import SnarkDisplay from "./SnarkDisplay";
import UsernamePromptModal from "./UsernamePromptModal";
import { useUsername } from "../hooks/useUsername";
import { useCanInstallPWA } from "../pwa/useInstall";
import { promptInstall } from "../pwa/installSignal";
import { authManager } from "../lib/auth";
import SearchSuggestions, { addSearchToHistory } from "./SearchSuggestions";
import VoiceSearch from "./VoiceSearch";
import Portal from "./Portal";
import { isMobileNow } from "../lib/isMobile";

const POPULAR_GENRES = [
  { id: null, name: "All Genres" },
  { id: 28, name: "Action" },
  { id: 35, name: "Comedy" },
  { id: 18, name: "Drama" },
  { id: 27, name: "Horror" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 14, name: "Fantasy" },
  { id: 53, name: "Thriller" },
  { id: 16, name: "Animation" },
  { id: 99, name: "Documentary" },
  { id: 80, name: "Crime" },
  { id: 12, name: "Adventure" },
  { id: 10751, name: "Family" },
  { id: 36, name: "History" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

export type FlickletHeaderProps = {
  appName?: string;
  onSearch?: (
    query: string,
    genre?: number | null,
    searchType?: string
  ) => void;
  onClear?: () => void;
  onHelpOpen?: () => void; // callback for opening help modal
};

export default function FlickletHeader({
  appName = "Flicklet",
  onSearch,
  onClear,
  onHelpOpen,
}: FlickletHeaderProps) {
  const {
    username,
    usernamePrompted,
    loading: usernameLoading,
  } = useUsername();
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);

  // Non-blocking prompt check
  useEffect(() => {
    // Skip if username already exists or prompt was shown
    if (usernameLoading) return;

    const currentUser = authManager.getCurrentUser();
    const needsPrompt = !!(currentUser?.uid && !username && !usernamePrompted);

    if (needsPrompt && !showUsernamePrompt) {
      setShowUsernamePrompt(true);
    }
  }, [username, usernamePrompted, usernameLoading, showUsernamePrompt]);

  return (
    <>
      {/* Main header (not sticky) */}
      <header className="border-b" style={{ backgroundColor: "var(--bg)" }}>
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
                data-role="version"
              >
                v{APP_VERSION}
              </span>
              {/* Install Button Slot - stable width to prevent header jump */}
              <InstallButtonSlot />
              {/* Help Button */}
              <button
                onClick={() => {
                  try {
                    if (onHelpOpen) {
                      onHelpOpen();
                    }
                  } catch {
                    // Ignore errors
                  }
                }}
                className="rounded-full border border-gray-300 dark:border-gray-600 px-1.5 py-0.5 md:px-2 md:py-1 text-[10px] md:text-[11px] leading-none text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="Open help"
                title="Help & Support"
                data-testid="help-button"
                data-role="help"
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
        className="sticky top-0 border-b"
        style={{
          zIndex: "var(--z-overlay)",
          backgroundColor: "var(--bg)",
          borderColor: "var(--line)",
        }}
      >
        <div className="mx-auto w-full max-w-screen-2xl px-2 py-1.5 md:px-4 md:py-2">
          <SearchRow onSearch={onSearch} onClear={onClear} />
        </div>
      </div>

      {/* Modal overlay - doesn't block UI */}
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
      className="min-w-[6rem] select-none text-balance font-extrabold tracking-tight text-3xl sm:text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]"
      title={text}
      data-testid="app-title"
    >
      <span className="inline-block transition-transform duration-300 ease-out hover:scale-[1.02]">
        {text}
      </span>
    </h1>
  );
}

function InstallButtonSlot() {
  const can = useCanInstallPWA();
  
  // Reserve space: match the button width so header doesn't shift
  const style: React.CSSProperties = {
    display: 'inline-block',
    width: '64px',
    textAlign: 'center',
  };
  
  if (!can) {
    return <span id="install-slot" data-role="install" style={style} aria-hidden="true"></span>;
  }
  
  return (
    <button
      id="install-slot"
      data-role="install"
      onClick={() => promptInstall()}
      style={style}
      className="rounded-full border border-gray-300 dark:border-gray-600 px-1.5 py-0.5 md:px-2 md:py-1 text-[10px] md:text-[11px] leading-none text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      aria-label="Install app"
      title="Install Flicklet"
      data-testid="install-button"
    >
      Install
    </button>
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

function SearchRow({
  onSearch,
  onClear,
}: {
  onSearch?: (q: string, g?: number | null, searchType?: string) => void;
  onClear?: () => void;
}) {
  const translations = useTranslations();
  const [q, setQ] = React.useState("");
  const [g, setG] = React.useState<number | null>(null);
  const [searchMode, setSearchMode] = React.useState<"title" | "tag">("title");
  const [searchType, setSearchType] = React.useState<
    "all" | "movies-tv" | "people"
  >("all");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [isComposing, setIsComposing] = React.useState(false);
  const [showFiltersDropdown, setShowFiltersDropdown] = React.useState(false);
  const [showAllGenres, setShowAllGenres] = React.useState(false);
  const [hasVoiceSearch, setHasVoiceSearch] = React.useState(false);
  // Mobile filter sheet: temporary state for applying filters
  const [pendingFilters, setPendingFilters] = React.useState<{
    mode: "title" | "tag";
    type: "all" | "movies-tv" | "people";
    genre: number | null;
  }>({ mode: searchMode, type: searchType, genre: g });
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const filtersDropdownRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const voiceSearchRef = React.useRef<HTMLDivElement>(null);
  const debounceTimerRef = React.useRef<number | null>(null);
  const isMobile = isMobileNow();
  
  // Detect if voice search is actually rendered (for mobile padding calculation)
  React.useEffect(() => {
    if (!isMobile || !voiceSearchRef.current) {
      setHasVoiceSearch(false);
      return;
    }
    // Check if VoiceSearch component rendered (it returns null when disabled)
    const hasRendered = voiceSearchRef.current.children.length > 0;
    setHasVoiceSearch(hasRendered);
  }, [isMobile]);

  // Sync pending filters when dropdown opens
  React.useEffect(() => {
    if (showFiltersDropdown) {
      setPendingFilters({ mode: searchMode, type: searchType, genre: g });
    }
  }, [showFiltersDropdown, searchMode, searchType, g]);

  // Lock body scroll when mobile filter sheet is open
  React.useEffect(() => {
    if (!isMobile || !showFiltersDropdown) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobile, showFiltersDropdown]);

  // Apply filters (mobile sheet)
  const applyFilters = () => {
    setSearchMode(pendingFilters.mode);
    setSearchType(pendingFilters.type);
    setG(pendingFilters.genre);
    setShowFiltersDropdown(false);
    setShowAllGenres(false);
  };

  // Reset filters to defaults
  const resetFilters = () => {
    setPendingFilters({ mode: "title", type: "all", genre: null });
  };

  const submit = () => {
    if (isComposing) return; // Don't submit during IME composition

    const trimmed = q.trim();
    if (trimmed) {
      if (searchMode === "tag") {
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
    setQ("");
    setG(null);
    setSearchMode("title");
    setSearchType("all");
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
      if (searchMode === "tag") {
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

    // Debounce suggestions (150ms as per requirements)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      setShowSuggestions(e.target.value.length > 0 && isFocused);
    }, 150);
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
    // Increased timeout to ensure click events complete
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isComposing) {
      e.preventDefault();
      e.stopPropagation();
      submit();
    } else if (e.key === "Escape") {
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
      ? "All Genres"
      : POPULAR_GENRES.find((genre) => genre.id === g)?.name) ?? "All Genres";

  const selectedTypeName =
    searchType === "all"
      ? ""
      : searchType === "movies-tv"
        ? "Movies/TV"
        : "People";

  function getFiltersLabel() {
    // Priority: show genre if not default, otherwise show type if not default,
    // otherwise just "Filters".
    if (selectedGenreName !== "All Genres") return selectedGenreName;
    if (selectedTypeName) return selectedTypeName;
    if (searchMode !== "title") return "Tag";
    return "Filters";
  }

  // Optional: keep the full summary for tooltip/aria
  function getFiltersSummary() {
    const parts = [];
    parts.push(selectedGenreName);
    parts.push(selectedTypeName || "All");
    parts.push(searchMode === "tag" ? "Tag mode" : "Title mode");
    return parts.filter(Boolean).join(" · ");
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

    document.addEventListener("pointerdown", handleGlobalPointerDown);
    return () =>
      document.removeEventListener("pointerdown", handleGlobalPointerDown);
  }, []);

  return (
    <div
      className="flex items-stretch gap-0 rounded-2xl border bg-background p-0"
      data-testid="search-row"
      data-role="searchbar"
      ref={searchContainerRef}
    >
      {/* Filters Dropdown Button - LEFT SIDE */}
      <div className="relative" ref={filtersDropdownRef}>
        <button
          type="button"
          onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
          className={`rounded-l-2xl border-r-0 px-2 py-2 md:px-3 md:py-3 font-semibold hover:bg-accent hover:text-accent-foreground transition-all h-full ${
            isMobile ? 'text-sm' : 'text-xs'
          }`}
          aria-haspopup="menu"
          aria-expanded={showFiltersDropdown}
          aria-label={`Filters: ${getFiltersSummary()}`}
          title={getFiltersSummary()}
        >
          {getFiltersLabel()}
          <span className="ml-1">▾</span>
        </button>

        {/* Filter Menu - Mobile Sheet or Desktop Dropdown */}
        {showFiltersDropdown && filtersDropdownRef.current && (
          <Portal>
            {isMobile ? (
              // Mobile: Bottom Sheet
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                  onClick={() => setShowFiltersDropdown(false)}
                  style={{ zIndex: 10000 }}
                />
                {/* Sheet */}
                <div
                  ref={menuRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Search Filters"
                  className="fixed left-0 right-0 bottom-0 rounded-t-2xl border-t border-l border-r shadow-2xl"
                  style={{
                    zIndex: 10001,
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--line)',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {/* Sheet Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--line)' }}>
                    <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Filters</h3>
                    <button
                      type="button"
                      onClick={() => setShowFiltersDropdown(false)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                      aria-label="Close filters"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto px-4 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {/* Search Mode Section */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>Search Mode</h4>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPendingFilters(p => ({ ...p, mode: "title" }))}
                          className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                            pendingFilters.mode === "title"
                              ? "bg-accent text-white"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                          style={{
                            backgroundColor: pendingFilters.mode === "title" ? 'var(--accent)' : 'var(--muted)',
                            color: pendingFilters.mode === "title" ? 'white' : 'var(--text)',
                          }}
                        >
                          Title
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingFilters(p => ({ ...p, mode: "tag" }))}
                          className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                            pendingFilters.mode === "tag"
                              ? "bg-accent text-white"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                          style={{
                            backgroundColor: pendingFilters.mode === "tag" ? 'var(--accent)' : 'var(--muted)',
                            color: pendingFilters.mode === "tag" ? 'white' : 'var(--text)',
                          }}
                        >
                          Tag
                        </button>
                      </div>
                    </div>

                    {/* Search Type Section */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>Search In</h4>
                      <div className="space-y-2">
                        {(["all", "movies-tv", "people"] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setPendingFilters(p => ({ ...p, type }))}
                            className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                              pendingFilters.type === type
                                ? "bg-accent text-white"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                            style={{
                              backgroundColor: pendingFilters.type === type ? 'var(--accent)' : 'var(--muted)',
                              color: pendingFilters.type === type ? 'white' : 'var(--text)',
                            }}
                          >
                            {type === "all" ? "All" : type === "movies-tv" ? "Movies/TV" : "People"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Genres Section */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>Genre</h4>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_GENRES.map((genre) => (
                          <button
                            key={genre.id ?? "all"}
                            type="button"
                            onClick={() => setPendingFilters(p => ({ ...p, genre: genre.id }))}
                            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                              pendingFilters.genre === genre.id
                                ? "bg-accent text-white"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                            style={{
                              backgroundColor: pendingFilters.genre === genre.id ? 'var(--accent)' : 'var(--muted)',
                              color: pendingFilters.genre === genre.id ? 'white' : 'var(--text)',
                            }}
                          >
                            {genre.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sheet Footer with Actions */}
                  <div className="px-4 py-3 border-t flex gap-2" style={{ borderColor: 'var(--line)' }}>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                      style={{ color: 'var(--text)' }}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={applyFilters}
                      className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-accent text-white hover:opacity-90 transition-opacity"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // Desktop: Dropdown Menu
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
                    width: "320px",
                    maxWidth: "90vw",
                    maxHeight: "70vh",
                    overflowY: "auto",
                    padding: "12px",
                  }}
                >
                  <div className="space-y-2">
                    {/* Title */}
                    <button
                      type="button"
                      onClick={() => {
                        setSearchMode("title");
                        setShowFiltersDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium rounded transition-colors text-black ${
                        searchMode === "title"
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      Title
                    </button>

                    {/* Tag */}
                    <button
                      type="button"
                      onClick={() => {
                        setSearchMode("tag");
                        setShowFiltersDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium rounded transition-colors text-black ${
                        searchMode === "tag"
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      Tag
                    </button>

                    {/* Divider */}
                    <div className="h-px bg-gray-300 my-1"></div>

                    {/* All */}
                    <button
                      type="button"
                      onClick={() => {
                        setSearchType("all");
                        setShowFiltersDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium rounded transition-colors text-black ${
                        searchType === "all"
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      All
                    </button>

                    {/* Movies/TV */}
                    <button
                      type="button"
                      onClick={() => {
                        setSearchType("movies-tv");
                        setShowFiltersDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium rounded transition-colors text-black ${
                        searchType === "movies-tv"
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      Movies/TV
                    </button>

                    {/* People */}
                    <button
                      type="button"
                      onClick={() => {
                        setSearchType("people");
                        setShowFiltersDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium rounded transition-colors text-black ${
                        searchType === "people"
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      People
                    </button>

                    {/* Divider */}
                    <div className="h-px bg-gray-300 my-1"></div>

                    {/* Genres */}
                    {(showAllGenres
                      ? POPULAR_GENRES
                      : POPULAR_GENRES.slice(0, 8)
                    ).map((genre) => (
                      <button
                        key={genre.id ?? "all"}
                        type="button"
                        onClick={() => {
                          setG(genre.id);
                          setShowFiltersDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 text-xs font-medium rounded transition-colors leading-normal whitespace-normal ${
                          g === genre.id
                            ? "bg-blue-500 text-white"
                            : "hover:bg-gray-100 text-black"
                        }`}
                      >
                        {genre.name}
                      </button>
                    ))}

                    {POPULAR_GENRES.length > 8 && (
                      <button
                        type="button"
                        onClick={() => setShowAllGenres((v) => !v)}
                        className="w-full mt-1 px-3 py-2 text-xs font-semibold rounded bg-gray-50 hover:bg-gray-100 text-gray-700"
                      >
                        {showAllGenres ? "Show fewer" : "Show more"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Backdrop to close dropdown - behind the menu */}
                <div
                  className="fixed inset-0"
                  onClick={() => setShowFiltersDropdown(false)}
                  style={{
                    zIndex: 999,
                  }}
                />
              </>
            )}
          </Portal>
        )}
      </div>

      {/* Search Input - Takes up most of the space */}
      <div className="relative flex-1 min-w-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="search"
              role="searchbox"
              inputMode="search"
              aria-label="Search movies, shows, people"
              placeholder={
                searchMode === "tag"
                  ? "Search by tag..."
                  : translations.searchPlaceholder
              }
              value={q}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              className={`w-full rounded-none border-l-0 border-r-0 border-y-0 py-2 md:py-3 outline-none ring-0 focus:border-primary ${
                isMobile
                  ? `px-3 text-sm ${q.length > 0 ? (hasVoiceSearch ? 'pr-20' : 'pr-10') : (hasVoiceSearch ? 'pr-10' : 'pr-3')}`
                  : 'px-4 pr-12 text-sm'
              }`}
              spellCheck="true"
            />

            {/* Inline Clear Button (Mobile) */}
            {isMobile && q.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setQ("");
                  setShowSuggestions(false);
                  inputRef.current?.focus();
                }}
                className="absolute right-1 flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors"
                aria-label="Clear search"
                style={{ right: hasVoiceSearch ? '40px' : '4px' }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: 'var(--muted)' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}

            {/* Voice Search Button */}
            <div ref={voiceSearchRef} className="absolute right-1 md:right-2">
              <VoiceSearch
                onVoiceResult={(text) => {
                  setQ(text);
                  setShowSuggestions(false);
                  // Auto-submit the voice result
                  setTimeout(() => {
                    if (searchMode === "tag") {
                      onSearch?.(`tag:${text.trim()}`, g, searchType);
                    } else {
                      onSearch?.(text.trim(), g, searchType);
                    }
                    addSearchToHistory(text.trim());
                  }, 100);
                }}
                onError={() => {
                  // Ignore errors
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
        <button
          type="submit"
          className={`rounded-r-2xl rounded-l-none border-l-0 border-r-0 px-3 py-2 md:px-3 md:py-3 font-semibold hover:bg-accent hover:text-accent-foreground transition-all duration-150 ease-out ${
            isMobile ? 'text-sm' : 'text-xs'
          }`}
          onClick={submit}
        >
          {translations.search}
        </button>
        {/* Clear button - hidden on mobile (replaced by inline clear icon) */}
        {!isMobile && (
          <button
            type="button"
            className="rounded-r-2xl rounded-l-none border-l-0 px-2 py-2 md:px-3 md:py-3 text-xs font-semibold hover:bg-muted transition-all duration-150 ease-out"
            onClick={clear}
          >
            {translations.clear}
          </button>
        )}
      </div>
    </div>
  );
}

// function oneOf<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] } // Unused
