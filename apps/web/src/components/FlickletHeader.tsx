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
    searchType?: string,
    mediaTypeFilter?: "tv" | "movie" | null
  ) => void;
  onClear?: () => void;
  onHelpOpen?: () => void; // callback for opening help modal
  onNavigateHome?: () => void; // callback for navigating to home
};

export default function FlickletHeader({
  appName = "Flicklet",
  onSearch,
  onClear,
  onHelpOpen,
  onNavigateHome,
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
              <AppTitle text={appName} onClick={onNavigateHome} />
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
                  } catch (error) {
                    // Ignore errors
                    void error;
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
          minHeight: "48px", // Stable height to prevent jumpiness
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

function AppTitle({ text, onClick }: { text: string; onClick?: () => void }) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <h1
      className={`min-w-[6rem] select-none text-balance font-extrabold tracking-tight text-3xl sm:text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_1px_0_rgba(255,255,255,0.35)] ${onClick ? "cursor-pointer" : ""}`}
      title={onClick ? `Go to ${text} home` : text}
      data-testid="app-title"
      onClick={onClick ? handleClick : undefined}
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
    display: "inline-block",
    width: "64px",
    textAlign: "center",
  };

  if (!can) {
    return (
      <span
        id="install-slot"
        data-role="install"
        style={style}
        aria-hidden="true"
      ></span>
    );
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
  onSearch?: (
    q: string,
    g?: number | null,
    searchType?: string,
    mediaTypeFilter?: "tv" | "movie" | null
  ) => void;
  onClear?: () => void;
}) {
  const translations = useTranslations();
  const [q, setQ] = React.useState("");
  const [g, setG] = React.useState<number | null>(null);
  const [searchMode, setSearchMode] = React.useState<"title" | "tag">("title");
  const [searchType, setSearchType] = React.useState<
    "all" | "movies-tv" | "people"
  >("all");
  const [mediaTypeFilter, setMediaTypeFilter] = React.useState<
    "tv" | "movie" | null
  >(null);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [isComposing, setIsComposing] = React.useState(false);
  const [showFiltersDropdown, setShowFiltersDropdown] = React.useState(false);
  const [showGenreSubmenu, setShowGenreSubmenu] = React.useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = React.useState(false);
  // Removed unused showAllGenres state - kept for potential future use
  // const [showAllGenres, setShowAllGenres] = React.useState(false);
  const [hasVoiceSearch, setHasVoiceSearch] = React.useState(false);
  // Mobile filter sheet: temporary state for applying filters
  const [pendingFilters, setPendingFilters] = React.useState<{
    mode: "title" | "tag";
    type: "all" | "movies-tv" | "people";
    genre: number | null;
    mediaType: "tv" | "movie" | null;
  }>({
    mode: searchMode,
    type: searchType,
    genre: g,
    mediaType: mediaTypeFilter,
  });
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const suggestionsContainerRef = React.useRef<HTMLDivElement>(null);
  const filtersDropdownRef = React.useRef<HTMLDivElement>(null);
  const isClickingSuggestionRef = React.useRef(false);
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
      setPendingFilters({
        mode: searchMode,
        type: searchType,
        genre: g,
        mediaType: mediaTypeFilter,
      });
    }
  }, [showFiltersDropdown, searchMode, searchType, g, mediaTypeFilter]);

  // Lock body scroll when mobile filter sheet is open
  React.useEffect(() => {
    if (!isMobile || !showFiltersDropdown) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobile, showFiltersDropdown]);

  // Apply filters (mobile sheet)
  const applyFilters = () => {
    setSearchMode(pendingFilters.mode);
    setSearchType(pendingFilters.type);
    setG(pendingFilters.genre);
    setMediaTypeFilter(pendingFilters.mediaType);
    setShowFiltersDropdown(false);
    // setShowAllGenres(false); // Removed unused state
    setShowAdvancedSearch(false);
  };

  // Reset filters to defaults
  const resetFilters = () => {
    setPendingFilters({
      mode: "title",
      type: "all",
      genre: null,
      mediaType: null,
    });
  };

  // Quick filter handlers (apply immediately)
  const handleQuickFilter = (type: "tv" | "movie" | "people" | "genre") => {
    if (type === "tv") {
      setMediaTypeFilter("tv");
      setSearchType("movies-tv");
      setShowFiltersDropdown(false);
      setShowGenreSubmenu(false);
    } else if (type === "movie") {
      setMediaTypeFilter("movie");
      setSearchType("movies-tv");
      setShowFiltersDropdown(false);
      setShowGenreSubmenu(false);
    } else if (type === "people") {
      setMediaTypeFilter(null);
      setSearchType("people");
      setShowFiltersDropdown(false);
      setShowGenreSubmenu(false);
    } else if (type === "genre") {
      setShowGenreSubmenu(true);
    }
  };

  // Handle genre selection (apply immediately)
  const handleGenreSelect = (genreId: number | null) => {
    setG(genreId);
    setShowGenreSubmenu(false);
    setShowFiltersDropdown(false);
  };

  const submit = () => {
    if (isComposing) return; // Don't submit during IME composition

    const trimmed = q.trim();
    // Allow submission if there's a query OR a genre selected (for genre-only search)
    if (trimmed || g != null) {
      // Pass mediaTypeFilter separately
      // If genre is selected, ensure searchType is 'movies-tv' (genres only apply to movies/TV)
      let effectiveSearchType = mediaTypeFilter
        ? searchType === "movies-tv"
          ? searchType
          : "movies-tv"
        : searchType;

      // For genre-only searches, force searchType to 'movies-tv'
      if (g != null && !trimmed) {
        effectiveSearchType = "movies-tv";
      }

      if (searchMode === "tag") {
        onSearch?.(`tag:${trimmed}`, g, effectiveSearchType, mediaTypeFilter);
      } else {
        onSearch?.(trimmed, g, effectiveSearchType, mediaTypeFilter);
      }

      // Add to search history only if there's a query
      if (trimmed) {
        addSearchToHistory(trimmed);
      }
    }

    setShowSuggestions(false);
  };

  const clear = () => {
    setQ("");
    setG(null);
    setSearchMode("title");
    setSearchType("all");
    setMediaTypeFilter(null);
    setShowSuggestions(false);
    setShowFiltersDropdown(false);
    setShowGenreSubmenu(false);
    setShowAdvancedSearch(false);
    onClear?.();
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (
    suggestion: string,
    _itemId?: string,
    _mediaType?: "movie" | "tv" | "person"
  ) => {
    // Mark that we're clicking a suggestion to prevent blur from interfering
    isClickingSuggestionRef.current = true;

    const trimmedSuggestion = suggestion.trim();
    setQ(trimmedSuggestion);
    setShowSuggestions(false);
    setIsFocused(false); // Explicitly close focus state

    // Auto-submit the suggestion immediately
    const effectiveSearchType = mediaTypeFilter
      ? searchType === "movies-tv"
        ? searchType
        : "movies-tv"
      : searchType;

    if (searchMode === "tag") {
      onSearch?.(
        `tag:${trimmedSuggestion}`,
        g,
        effectiveSearchType,
        mediaTypeFilter
      );
    } else {
      // For TMDB suggestions with IDs, the exact title match should be pinned to rank 1
      // by smartSearch's canonical pinning logic
      onSearch?.(trimmedSuggestion, g, effectiveSearchType, mediaTypeFilter);
    }
    addSearchToHistory(trimmedSuggestion);
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
      // Don't close if we're clicking on a suggestion
      if (!isClickingSuggestionRef.current) {
        setIsFocused(false);
        setShowSuggestions(false);
      }
      // Reset the flag
      isClickingSuggestionRef.current = false;
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
        ? mediaTypeFilter === "tv"
          ? "TV"
          : mediaTypeFilter === "movie"
            ? "Movie"
            : "Movies/TV"
        : "People";

  function getFiltersLabel() {
    // Priority: show genre if not default, then media type (TV/Movie), then search type, then mode
    if (selectedGenreName !== "All Genres") return selectedGenreName;
    if (mediaTypeFilter === "tv") return "TV";
    if (mediaTypeFilter === "movie") return "Movie";
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
      const insideSuggestions = suggestionsContainerRef.current?.contains(t);
      const insideSearchContainer = searchContainerRef.current?.contains(t);

      // Don't close if clicking inside search container (includes suggestions) or filter menu
      if (
        !insideTrigger &&
        !insideMenu &&
        !insideSearchContainer &&
        !insideSuggestions
      ) {
        setShowFiltersDropdown(false);
        setShowSuggestions(false);
        setShowGenreSubmenu(false);
        setShowAdvancedSearch(false);
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
            isMobile ? "text-sm min-h-[44px]" : "text-xs"
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
              // Mobile: Simplified Menu (same as desktop)
              <>
                {!showGenreSubmenu && !showAdvancedSearch ? (
                  // Main simplified menu
                  <div
                    ref={menuRef}
                    role="menu"
                    className="fixed rounded-lg border shadow-2xl"
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                      zIndex: 10001,
                      top: `${filtersDropdownRef.current.getBoundingClientRect().bottom + 8}px`,
                      left: `${filtersDropdownRef.current.getBoundingClientRect().left}px`,
                      width: "200px",
                      maxWidth: "90vw",
                      padding: "8px",
                      backgroundColor: "var(--card)",
                      borderColor: "var(--line)",
                    }}
                  >
                    <div className="space-y-1">
                      {/* TV */}
                      <button
                        type="button"
                        onClick={() => handleQuickFilter("tv")}
                        className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded transition-colors ${
                          mediaTypeFilter === "tv" && searchType === "movies-tv"
                            ? "bg-accent text-white"
                            : "hover:bg-muted/80"
                        }`}
                        style={{
                          backgroundColor:
                            mediaTypeFilter === "tv" &&
                            searchType === "movies-tv"
                              ? "var(--accent)"
                              : "transparent",
                          color:
                            mediaTypeFilter === "tv" &&
                            searchType === "movies-tv"
                              ? "white"
                              : "var(--text)",
                        }}
                      >
                        TV
                      </button>

                      {/* Movie */}
                      <button
                        type="button"
                        onClick={() => handleQuickFilter("movie")}
                        className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded transition-colors ${
                          mediaTypeFilter === "movie" &&
                          searchType === "movies-tv"
                            ? "bg-accent text-white"
                            : "hover:bg-muted/80"
                        }`}
                        style={{
                          backgroundColor:
                            mediaTypeFilter === "movie" &&
                            searchType === "movies-tv"
                              ? "var(--accent)"
                              : "transparent",
                          color:
                            mediaTypeFilter === "movie" &&
                            searchType === "movies-tv"
                              ? "white"
                              : "var(--text)",
                        }}
                      >
                        Movie
                      </button>

                      {/* Genre (opens submenu) */}
                      <button
                        type="button"
                        onClick={() => handleQuickFilter("genre")}
                        className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded transition-colors flex items-center justify-between ${
                          g !== null
                            ? "bg-accent text-white"
                            : "hover:bg-muted/80"
                        }`}
                        style={{
                          backgroundColor:
                            g !== null ? "var(--accent)" : "transparent",
                          color: g !== null ? "white" : "var(--text)",
                        }}
                      >
                        <span>Genre</span>
                        <span className="ml-2">→</span>
                      </button>

                      {/* People */}
                      <button
                        type="button"
                        onClick={() => handleQuickFilter("people")}
                        className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded transition-colors ${
                          searchType === "people"
                            ? "bg-accent text-white"
                            : "hover:bg-muted/80"
                        }`}
                        style={{
                          backgroundColor:
                            searchType === "people"
                              ? "var(--accent)"
                              : "transparent",
                          color:
                            searchType === "people" ? "white" : "var(--text)",
                        }}
                      >
                        People
                      </button>

                      {/* Divider */}
                      <div
                        className="h-px my-1"
                        style={{ backgroundColor: "var(--line)" }}
                      ></div>

                      {/* Advanced Search */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowAdvancedSearch(true);
                          setShowGenreSubmenu(false);
                        }}
                        className="w-full text-left px-3 py-2.5 text-sm font-medium rounded transition-colors hover:bg-muted/80"
                        style={{ color: "var(--muted)" }}
                      >
                        Advanced Search →
                      </button>
                    </div>
                  </div>
                ) : showGenreSubmenu ? (
                  // Genre submenu
                  <div
                    ref={menuRef}
                    role="menu"
                    className="fixed rounded-lg border shadow-2xl"
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                      zIndex: 10001,
                      top: `${filtersDropdownRef.current.getBoundingClientRect().bottom + 8}px`,
                      left: `${filtersDropdownRef.current.getBoundingClientRect().left}px`,
                      width: "240px",
                      maxWidth: "90vw",
                      maxHeight: "70vh",
                      overflowY: "auto",
                      padding: "8px",
                      backgroundColor: "var(--card)",
                      borderColor: "var(--line)",
                    }}
                  >
                    <div className="space-y-1">
                      {/* Back button */}
                      <button
                        type="button"
                        onClick={() => setShowGenreSubmenu(false)}
                        className="w-full text-left px-3 py-2.5 text-sm font-medium rounded transition-colors hover:bg-muted/80 flex items-center"
                        style={{ color: "var(--muted)" }}
                      >
                        <span className="mr-2">←</span>
                        <span>Back</span>
                      </button>

                      {/* Divider */}
                      <div
                        className="h-px my-1"
                        style={{ backgroundColor: "var(--line)" }}
                      ></div>

                      {/* Genres */}
                      {POPULAR_GENRES.map((genre) => (
                        <button
                          key={genre.id ?? "all"}
                          type="button"
                          onClick={() => handleGenreSelect(genre.id)}
                          className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded transition-colors ${
                            g === genre.id
                              ? "bg-accent text-white"
                              : "hover:bg-muted/80"
                          }`}
                          style={{
                            backgroundColor:
                              g === genre.id ? "var(--accent)" : "transparent",
                            color: g === genre.id ? "white" : "var(--text)",
                          }}
                        >
                          {genre.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Advanced Search - Full filter sheet
                  <>
                    {/* 
                      Z-index hierarchy (mobile):
                      - Mobile nav: 9999 (MobileTabs.tsx)
                      - Filter sheet backdrop: 10000
                      - Filter sheet: 10001 (above backdrop, below suggestions)
                      - Search suggestions: 10002 (SearchSuggestions.tsx)
                      - More menu dropdown: 10003 (SearchResults.tsx)
                    */}
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                      onClick={() => {
                        setShowAdvancedSearch(false);
                        setShowFiltersDropdown(false);
                      }}
                      style={{ zIndex: 10000 }}
                    />
                    {/* Sheet */}
                    <div
                      ref={menuRef}
                      role="dialog"
                      aria-modal="true"
                      aria-label="Advanced Search Filters"
                      className="fixed left-0 right-0 bottom-0 rounded-t-2xl border-t border-l border-r shadow-2xl"
                      style={{
                        zIndex: 10001, // Above mobile nav (9999) and backdrop (10000)
                        backgroundColor: "var(--card)",
                        borderColor: "var(--line)",
                        maxHeight: "80vh",
                        display: "flex",
                        flexDirection: "column",
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      {/* Sheet Header */}
                      <div
                        className="flex items-center justify-between px-4 py-3 border-b"
                        style={{ borderColor: "var(--line)" }}
                      >
                        <h3
                          className="text-base font-semibold"
                          style={{ color: "var(--text)" }}
                        >
                          Advanced Search
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAdvancedSearch(false);
                            setShowFiltersDropdown(false);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                          aria-label="Close filters"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: "var(--text)" }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Scrollable Content */}
                      <div
                        className="flex-1 overflow-y-auto px-4 py-4"
                        style={{ WebkitOverflowScrolling: "touch" }}
                      >
                        {/* Search Mode Section */}
                        <div className="mb-6">
                          <h4
                            className="text-sm font-medium mb-3"
                            style={{ color: "var(--muted)" }}
                          >
                            Search Mode
                          </h4>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setPendingFilters((p) => ({
                                  ...p,
                                  mode: "title",
                                }))
                              }
                              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                pendingFilters.mode === "title"
                                  ? "bg-accent text-white"
                                  : "bg-muted hover:bg-muted/80"
                              }`}
                              style={{
                                backgroundColor:
                                  pendingFilters.mode === "title"
                                    ? "var(--accent)"
                                    : "var(--muted)",
                                color:
                                  pendingFilters.mode === "title"
                                    ? "white"
                                    : "var(--text)",
                              }}
                            >
                              Title
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingFilters((p) => ({
                                  ...p,
                                  mode: "tag",
                                }))
                              }
                              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                pendingFilters.mode === "tag"
                                  ? "bg-accent text-white"
                                  : "bg-muted hover:bg-muted/80"
                              }`}
                              style={{
                                backgroundColor:
                                  pendingFilters.mode === "tag"
                                    ? "var(--accent)"
                                    : "var(--muted)",
                                color:
                                  pendingFilters.mode === "tag"
                                    ? "white"
                                    : "var(--text)",
                              }}
                            >
                              Tag
                            </button>
                          </div>
                        </div>

                        {/* Search Type Section */}
                        <div className="mb-6">
                          <h4
                            className="text-sm font-medium mb-3"
                            style={{ color: "var(--muted)" }}
                          >
                            Search In
                          </h4>
                          <div className="space-y-2">
                            {(["all", "movies-tv", "people"] as const).map(
                              (type) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() =>
                                    setPendingFilters((p) => ({ ...p, type }))
                                  }
                                  className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                    pendingFilters.type === type
                                      ? "bg-accent text-white"
                                      : "bg-muted hover:bg-muted/80"
                                  }`}
                                  style={{
                                    backgroundColor:
                                      pendingFilters.type === type
                                        ? "var(--accent)"
                                        : "var(--muted)",
                                    color:
                                      pendingFilters.type === type
                                        ? "white"
                                        : "var(--text)",
                                  }}
                                >
                                  {type === "all"
                                    ? "All"
                                    : type === "movies-tv"
                                      ? "Movies/TV"
                                      : "People"}
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        {/* Media Type Filter Section */}
                        {pendingFilters.type === "movies-tv" && (
                          <div className="mb-6">
                            <h4
                              className="text-sm font-medium mb-3"
                              style={{ color: "var(--muted)" }}
                            >
                              Media Type
                            </h4>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setPendingFilters((p) => ({
                                    ...p,
                                    mediaType: null,
                                  }))
                                }
                                className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                  pendingFilters.mediaType === null
                                    ? "bg-accent text-white"
                                    : "bg-muted hover:bg-muted/80"
                                }`}
                                style={{
                                  backgroundColor:
                                    pendingFilters.mediaType === null
                                      ? "var(--accent)"
                                      : "var(--muted)",
                                  color:
                                    pendingFilters.mediaType === null
                                      ? "white"
                                      : "var(--text)",
                                }}
                              >
                                All
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setPendingFilters((p) => ({
                                    ...p,
                                    mediaType: "tv",
                                  }))
                                }
                                className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                  pendingFilters.mediaType === "tv"
                                    ? "bg-accent text-white"
                                    : "bg-muted hover:bg-muted/80"
                                }`}
                                style={{
                                  backgroundColor:
                                    pendingFilters.mediaType === "tv"
                                      ? "var(--accent)"
                                      : "var(--muted)",
                                  color:
                                    pendingFilters.mediaType === "tv"
                                      ? "white"
                                      : "var(--text)",
                                }}
                              >
                                TV
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setPendingFilters((p) => ({
                                    ...p,
                                    mediaType: "movie",
                                  }))
                                }
                                className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                  pendingFilters.mediaType === "movie"
                                    ? "bg-accent text-white"
                                    : "bg-muted hover:bg-muted/80"
                                }`}
                                style={{
                                  backgroundColor:
                                    pendingFilters.mediaType === "movie"
                                      ? "var(--accent)"
                                      : "var(--muted)",
                                  color:
                                    pendingFilters.mediaType === "movie"
                                      ? "white"
                                      : "var(--text)",
                                }}
                              >
                                Movie
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Genres Section */}
                        <div className="mb-6">
                          <h4
                            className="text-sm font-medium mb-3"
                            style={{ color: "var(--muted)" }}
                          >
                            Genre
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {POPULAR_GENRES.map((genre) => (
                              <button
                                key={genre.id ?? "all"}
                                type="button"
                                onClick={() =>
                                  setPendingFilters((p) => ({
                                    ...p,
                                    genre: genre.id,
                                  }))
                                }
                                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                                  pendingFilters.genre === genre.id
                                    ? "bg-accent text-white"
                                    : "bg-muted hover:bg-muted/80"
                                }`}
                                style={{
                                  backgroundColor:
                                    pendingFilters.genre === genre.id
                                      ? "var(--accent)"
                                      : "var(--muted)",
                                  color:
                                    pendingFilters.genre === genre.id
                                      ? "white"
                                      : "var(--text)",
                                }}
                              >
                                {genre.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Sheet Footer with Actions */}
                      <div
                        className="px-4 py-3 border-t flex gap-2"
                        style={{ borderColor: "var(--line)" }}
                      >
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                          style={{ color: "var(--text)" }}
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
                )}

                {/* Backdrop to close dropdown */}
                <div
                  className="fixed inset-0"
                  onClick={() => {
                    setShowFiltersDropdown(false);
                    setShowGenreSubmenu(false);
                    setShowAdvancedSearch(false);
                  }}
                  style={{
                    zIndex: 9999,
                  }}
                />
              </>
            ) : (
              // Desktop: Simplified Dropdown Menu
              <>
                {!showGenreSubmenu && !showAdvancedSearch ? (
                  // Main simplified menu
                  <div
                    ref={menuRef}
                    role="menu"
                    className="fixed rounded-lg border shadow-2xl bg-white text-black"
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                      zIndex: 1000,
                      top: `${filtersDropdownRef.current.getBoundingClientRect().bottom + 8}px`,
                      left: `${filtersDropdownRef.current.getBoundingClientRect().left}px`,
                      width: "200px",
                      maxWidth: "90vw",
                      padding: "8px",
                    }}
                  >
                    <div className="space-y-1">
                      {/* TV */}
                      <button
                        type="button"
                        onClick={() => handleQuickFilter("tv")}
                        className={`w-full text-left px-3 py-2 text-sm font-medium rounded transition-colors ${
                          mediaTypeFilter === "tv" && searchType === "movies-tv"
                            ? "bg-blue-500 text-white"
                            : "hover:bg-gray-100 text-black"
                        }`}
                      >
                        TV
                      </button>

                      {/* Movie */}
                      <button
                        type="button"
                        onClick={() => handleQuickFilter("movie")}
                        className={`w-full text-left px-3 py-2 text-sm font-medium rounded transition-colors ${
                          mediaTypeFilter === "movie" &&
                          searchType === "movies-tv"
                            ? "bg-blue-500 text-white"
                            : "hover:bg-gray-100 text-black"
                        }`}
                      >
                        Movie
                      </button>

                      {/* Genre (opens submenu) */}
                      <button
                        type="button"
                        onClick={() => handleQuickFilter("genre")}
                        className={`w-full text-left px-3 py-2 text-sm font-medium rounded transition-colors flex items-center justify-between ${
                          g !== null
                            ? "bg-blue-500 text-white"
                            : "hover:bg-gray-100 text-black"
                        }`}
                      >
                        <span>Genre</span>
                        <span className="ml-2">→</span>
                      </button>

                      {/* People */}
                      <button
                        type="button"
                        onClick={() => handleQuickFilter("people")}
                        className={`w-full text-left px-3 py-2 text-sm font-medium rounded transition-colors ${
                          searchType === "people"
                            ? "bg-blue-500 text-white"
                            : "hover:bg-gray-100 text-black"
                        }`}
                      >
                        People
                      </button>

                      {/* Divider */}
                      <div className="h-px bg-gray-300 my-1"></div>

                      {/* Advanced Search */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowAdvancedSearch(true);
                          setShowGenreSubmenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm font-medium rounded transition-colors hover:bg-gray-100 text-gray-600"
                      >
                        Advanced Search →
                      </button>
                    </div>
                  </div>
                ) : showGenreSubmenu ? (
                  // Genre submenu
                  <div
                    ref={menuRef}
                    role="menu"
                    className="fixed rounded-lg border shadow-2xl bg-white text-black"
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                      zIndex: 1000,
                      top: `${filtersDropdownRef.current.getBoundingClientRect().bottom + 8}px`,
                      left: `${filtersDropdownRef.current.getBoundingClientRect().left}px`,
                      width: "240px",
                      maxWidth: "90vw",
                      maxHeight: "70vh",
                      overflowY: "auto",
                      padding: "8px",
                    }}
                  >
                    <div className="space-y-1">
                      {/* Back button */}
                      <button
                        type="button"
                        onClick={() => setShowGenreSubmenu(false)}
                        className="w-full text-left px-3 py-2 text-sm font-medium rounded transition-colors hover:bg-gray-100 text-gray-600 flex items-center"
                      >
                        <span className="mr-2">←</span>
                        <span>Back</span>
                      </button>

                      {/* Divider */}
                      <div className="h-px bg-gray-300 my-1"></div>

                      {/* Genres */}
                      {POPULAR_GENRES.map((genre) => (
                        <button
                          key={genre.id ?? "all"}
                          type="button"
                          onClick={() => handleGenreSelect(genre.id)}
                          className={`w-full text-left px-3 py-2 text-sm font-medium rounded transition-colors ${
                            g === genre.id
                              ? "bg-blue-500 text-white"
                              : "hover:bg-gray-100 text-black"
                          }`}
                        >
                          {genre.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Advanced Search - show full filter sheet (same as mobile)
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                      onClick={() => {
                        setShowAdvancedSearch(false);
                        setShowFiltersDropdown(false);
                      }}
                      style={{ zIndex: 10000 }}
                    />
                    {/* Sheet */}
                    <div
                      ref={menuRef}
                      role="dialog"
                      aria-modal="true"
                      aria-label="Advanced Search Filters"
                      className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border shadow-2xl"
                      style={{
                        zIndex: 10001,
                        backgroundColor: "var(--card)",
                        borderColor: "var(--line)",
                        maxHeight: "80vh",
                        width: "90vw",
                        maxWidth: "500px",
                        display: "flex",
                        flexDirection: "column",
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      {/* Sheet Header */}
                      <div
                        className="flex items-center justify-between px-4 py-3 border-b"
                        style={{ borderColor: "var(--line)" }}
                      >
                        <h3
                          className="text-base font-semibold"
                          style={{ color: "var(--text)" }}
                        >
                          Advanced Search
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAdvancedSearch(false);
                            setShowFiltersDropdown(false);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                          aria-label="Close filters"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: "var(--text)" }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Scrollable Content */}
                      <div
                        className="flex-1 overflow-y-auto px-4 py-4"
                        style={{ WebkitOverflowScrolling: "touch" }}
                      >
                        {/* Search Mode Section */}
                        <div className="mb-6">
                          <h4
                            className="text-sm font-medium mb-3"
                            style={{ color: "var(--muted)" }}
                          >
                            Search Mode
                          </h4>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setPendingFilters((p) => ({
                                  ...p,
                                  mode: "title",
                                }))
                              }
                              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                pendingFilters.mode === "title"
                                  ? "bg-accent text-white"
                                  : "bg-muted hover:bg-muted/80"
                              }`}
                              style={{
                                backgroundColor:
                                  pendingFilters.mode === "title"
                                    ? "var(--accent)"
                                    : "var(--muted)",
                                color:
                                  pendingFilters.mode === "title"
                                    ? "white"
                                    : "var(--text)",
                              }}
                            >
                              Title
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingFilters((p) => ({
                                  ...p,
                                  mode: "tag",
                                }))
                              }
                              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                pendingFilters.mode === "tag"
                                  ? "bg-accent text-white"
                                  : "bg-muted hover:bg-muted/80"
                              }`}
                              style={{
                                backgroundColor:
                                  pendingFilters.mode === "tag"
                                    ? "var(--accent)"
                                    : "var(--muted)",
                                color:
                                  pendingFilters.mode === "tag"
                                    ? "white"
                                    : "var(--text)",
                              }}
                            >
                              Tag
                            </button>
                          </div>
                        </div>

                        {/* Search Type Section */}
                        <div className="mb-6">
                          <h4
                            className="text-sm font-medium mb-3"
                            style={{ color: "var(--muted)" }}
                          >
                            Search In
                          </h4>
                          <div className="space-y-2">
                            {(["all", "movies-tv", "people"] as const).map(
                              (type) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() =>
                                    setPendingFilters((p) => ({ ...p, type }))
                                  }
                                  className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                    pendingFilters.type === type
                                      ? "bg-accent text-white"
                                      : "bg-muted hover:bg-muted/80"
                                  }`}
                                  style={{
                                    backgroundColor:
                                      pendingFilters.type === type
                                        ? "var(--accent)"
                                        : "var(--muted)",
                                    color:
                                      pendingFilters.type === type
                                        ? "white"
                                        : "var(--text)",
                                  }}
                                >
                                  {type === "all"
                                    ? "All"
                                    : type === "movies-tv"
                                      ? "Movies/TV"
                                      : "People"}
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        {/* Media Type Filter Section */}
                        <div className="mb-6">
                          <h4
                            className="text-sm font-medium mb-3"
                            style={{ color: "var(--muted)" }}
                          >
                            Media Type
                          </h4>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setPendingFilters((p) => ({
                                  ...p,
                                  mediaType: null,
                                }))
                              }
                              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                pendingFilters.mediaType === null
                                  ? "bg-accent text-white"
                                  : "bg-muted hover:bg-muted/80"
                              }`}
                              style={{
                                backgroundColor:
                                  pendingFilters.mediaType === null
                                    ? "var(--accent)"
                                    : "var(--muted)",
                                color:
                                  pendingFilters.mediaType === null
                                    ? "white"
                                    : "var(--text)",
                              }}
                            >
                              All
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingFilters((p) => ({
                                  ...p,
                                  mediaType: "tv",
                                }))
                              }
                              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                pendingFilters.mediaType === "tv"
                                  ? "bg-accent text-white"
                                  : "bg-muted hover:bg-muted/80"
                              }`}
                              style={{
                                backgroundColor:
                                  pendingFilters.mediaType === "tv"
                                    ? "var(--accent)"
                                    : "var(--muted)",
                                color:
                                  pendingFilters.mediaType === "tv"
                                    ? "white"
                                    : "var(--text)",
                              }}
                            >
                              TV
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingFilters((p) => ({
                                  ...p,
                                  mediaType: "movie",
                                }))
                              }
                              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                pendingFilters.mediaType === "movie"
                                  ? "bg-accent text-white"
                                  : "bg-muted hover:bg-muted/80"
                              }`}
                              style={{
                                backgroundColor:
                                  pendingFilters.mediaType === "movie"
                                    ? "var(--accent)"
                                    : "var(--muted)",
                                color:
                                  pendingFilters.mediaType === "movie"
                                    ? "white"
                                    : "var(--text)",
                              }}
                            >
                              Movie
                            </button>
                          </div>
                        </div>

                        {/* Genres Section */}
                        <div className="mb-6">
                          <h4
                            className="text-sm font-medium mb-3"
                            style={{ color: "var(--muted)" }}
                          >
                            Genre
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {POPULAR_GENRES.map((genre) => (
                              <button
                                key={genre.id ?? "all"}
                                type="button"
                                onClick={() =>
                                  setPendingFilters((p) => ({
                                    ...p,
                                    genre: genre.id,
                                  }))
                                }
                                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                                  pendingFilters.genre === genre.id
                                    ? "bg-accent text-white"
                                    : "bg-muted hover:bg-muted/80"
                                }`}
                                style={{
                                  backgroundColor:
                                    pendingFilters.genre === genre.id
                                      ? "var(--accent)"
                                      : "var(--muted)",
                                  color:
                                    pendingFilters.genre === genre.id
                                      ? "white"
                                      : "var(--text)",
                                }}
                              >
                                {genre.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Sheet Footer with Actions */}
                      <div
                        className="px-4 py-3 border-t flex gap-2"
                        style={{ borderColor: "var(--line)" }}
                      >
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                          style={{ color: "var(--text)" }}
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
                )}

                {/* Backdrop to close dropdown - behind the menu */}
                <div
                  className="fixed inset-0"
                  onClick={() => {
                    setShowFiltersDropdown(false);
                    setShowGenreSubmenu(false);
                    setShowAdvancedSearch(false);
                  }}
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
                  ? `px-3 text-sm ${q.length > 0 ? (hasVoiceSearch ? "pr-20" : "pr-10") : hasVoiceSearch ? "pr-10" : "pr-3"}`
                  : "px-4 pr-12 text-sm"
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
                style={{ right: hasVoiceSearch ? "40px" : "4px" }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "var(--muted)" }}
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
                    const effectiveSearchType = mediaTypeFilter
                      ? searchType === "movies-tv"
                        ? searchType
                        : "movies-tv"
                      : searchType;

                    if (searchMode === "tag") {
                      onSearch?.(
                        `tag:${text.trim()}`,
                        g,
                        effectiveSearchType,
                        mediaTypeFilter
                      );
                    } else {
                      onSearch?.(
                        text.trim(),
                        g,
                        effectiveSearchType,
                        mediaTypeFilter
                      );
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
        <div ref={suggestionsContainerRef}>
          <SearchSuggestions
            query={q}
            onSuggestionClick={handleSuggestionClick}
            onClose={() => setShowSuggestions(false)}
            isVisible={showSuggestions}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex">
        <button
          type="submit"
          className={`rounded-r-2xl rounded-l-none border-l-0 border-r-0 px-3 py-2 md:px-3 md:py-3 font-semibold hover:bg-accent hover:text-accent-foreground transition-all duration-150 ease-out ${
            isMobile ? "text-sm min-h-[44px]" : "text-xs"
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
