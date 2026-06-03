# Mobile Search – Forensic Audit Report

**Date:** 2025-01-XX  
**Scope:** Read-only analysis of mobile search functionality  
**Focus:** Mobile viewport (<768px), responsive breakpoints, touch interactions

---

## Mobile Search – File Index

| Area                   | File path                                                | Role in mobile search                  | Notes (mobile specifics)                                                                                                                                                                                                                                                                              |
| ---------------------- | -------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Entry Point**        | `apps/web/src/App.tsx`                                   | Main app component that renders search | Lines 877-884: Mobile tabs (`block md:hidden`) clear search on tab change. Lines 564-568: Content area padding adjusts for iOS keyboard viewport offset. Lines 886-889: SearchResults wrapped in PullToRefreshWrapper on mobile.                                                                      |
| **Search Header**      | `apps/web/src/components/FlickletHeader.tsx`             | Sticky search bar component            | Lines 126-137: Sticky search bar with mobile padding (`px-2 py-1.5 md:px-4 md:py-2`). Lines 210-636: SearchRow component with mobile-specific styling (`px-2 py-2 md:px-4 md:py-3`, `text-xs md:text-sm`). Line 580: Mobile input padding reduced, voice button positioned `right-1 md:right-2`.      |
| **Search Input**       | `apps/web/src/components/FlickletHeader.tsx` (SearchRow) | Search input field and controls        | Lines 562-582: Input with mobile breakpoints for padding, font size, right padding for voice button. Lines 300-307: Blur handler with 300ms delay to allow suggestion clicks. Lines 278-290: Input change debounced 150ms for suggestions.                                                            |
| **Search Suggestions** | `apps/web/src/components/SearchSuggestions.tsx`          | Autocomplete dropdown                  | Lines 285-296: Absolute positioning with `zIndex: 9999`, `max-h-80` for mobile scrolling. Lines 321-328: `onMouseDown` prevents blur before click (touch-friendly). Lines 219-266: Keyboard navigation (ArrowUp/Down, Enter, Escape) works on mobile keyboards.                                       |
| **Voice Search**       | `apps/web/src/components/VoiceSearch.tsx`                | Voice input button                     | Lines 250-256: Touch-friendly button size (`w-10 h-10`), `active:scale-95` for touch feedback. Lines 59-61: Feature flag check (disabled by default). Line 236-238: Returns null if disabled/unsupported.                                                                                             |
| **Search Results**     | `apps/web/src/search/SearchResults.tsx`                  | Results display component              | Line 107: Mobile padding `px-3 sm:px-4` (12px mobile, 16px tablet+). Lines 128-135: Card spacing `space-y-6` (24px vertical gap). Lines 335-414: SearchResultCard with mobile-friendly layout (flex, responsive poster `w-24 h-36`). Lines 43-65: IntersectionObserver for infinite scroll on mobile. |
| **Search Logic**       | `apps/web/src/search/smartSearch.ts`                     | Search algorithm                       | No mobile-specific logic, but affects all search results.                                                                                                                                                                                                                                             |
| **Autocomplete API**   | `apps/web/src/search/enhancedAutocomplete.ts`            | TMDB autocomplete fetching             | No mobile-specific logic, but powers SearchSuggestions dropdown.                                                                                                                                                                                                                                      |
| **Relevance Scoring**  | `apps/web/src/lib/searchRelevance.ts`                    | Autocomplete ranking                   | No mobile-specific logic, but affects suggestion order.                                                                                                                                                                                                                                               |
| **Mobile Detection**   | `apps/web/src/lib/isMobile.ts`                           | Mobile viewport detection              | Line 10: Breakpoint `(max-width: 768px)`. Used by components to conditionally render mobile UI.                                                                                                                                                                                                       |
| **Mobile Flags**       | `apps/web/src/lib/mobileFlags.ts`                        | Feature flags for mobile               | No direct search usage, but may affect card rendering in search results.                                                                                                                                                                                                                              |
| **Mobile Tabs**        | `apps/web/src/components/MobileTabs.tsx`                 | Bottom navigation                      | Lines 23-154: Visual Viewport API handling for iOS keyboard. Line 210: Dynamic `bottom` position based on `viewportOffset`. Lines 81-118: Throttled viewport change handler (50ms) to detect keyboard.                                                                                                |
| **Portal Component**   | `apps/web/src/components/Portal.tsx`                     | Portal for dropdowns                   | Used by FlickletHeader filter dropdown to escape z-index stacking contexts.                                                                                                                                                                                                                           |
| **Pull to Refresh**    | `apps/web/src/components/PullToRefreshWrapper.tsx`       | Pull-to-refresh wrapper                | Wraps SearchResults on mobile (line 887 App.tsx).                                                                                                                                                                                                                                                     |
| **Global Styles**      | `apps/web/src/styles/global.css`                         | Base styles                            | Lines 89-127: Mobile nav positioning (`@media (max-width: 1024px)`). Lines 84-86: `--mobile-nav-height: 80px` CSS variable. Lines 954-976: Touch action utilities for swipe handling.                                                                                                                 |
| **Test Files**         | `apps/web/src/components/__tests__/SearchBar.test.tsx`   | SearchBar component tests              | Tests search functionality but not mobile-specific behavior.                                                                                                                                                                                                                                          |
| **Test Files**         | `apps/web/tests/search-smart.spec.ts`                    | E2E search tests                       | Playwright tests for search functionality, includes mobile viewport scenarios.                                                                                                                                                                                                                        |

---

## File Contents – Key Mobile Search Files

### File: apps/web/src/App.tsx

<!-- RELEVANT TO MOBILE SEARCH START -->

```tsx
// Lines 268-278: Search state management
const [search, setSearch] = useState<SearchState>({ q: '', genre: null, type: 'all' });
const searchActive = !!search.q.trim();

const handleSearch = (q: string, genre: number | null, type: SearchType) => {
  const nextQ = q.trim();
  setSearch({ q: nextQ, genre, type });
};

const handleClear = () => setSearch({ q: '', genre: null, type: 'all' });

// Lines 535-543: FlickletHeader with search handlers (non-home view)
<FlickletHeader
  appName="Flicklet"
  onSearch={(q, g, t) => handleSearch(q, g ?? null, (t as SearchType) ?? 'all')}
  onClear={handleClear}
  onHelpOpen={() => {
    console.log('❓ App.tsx onHelpOpen prop called');
    handleHelpOpen();
  }}
/>

// Lines 545-561: Desktop vs Mobile tabs
{/* Desktop Tabs - tablet and above */}
<div className="hidden md:block">
  <Tabs current={view} onChange={(tab) => {
    // Clear search when switching tabs
    handleClear();
    setView(tab);
  }} />
</div>

{/* Mobile Tabs - mobile only */}
<div className="block md:hidden">
  <MobileTabs current={view} onChange={(tab) => {
    // Clear search when switching tabs
    handleClear();
    setView(tab);
  }} />
</div>

// Lines 563-568: Content area with iOS keyboard offset
<div className="pb-20 lg:pb-0" style={{
  paddingBottom: viewportOffset > 0 && window.visualViewport?.offsetTop === 0
    ? `${80 + viewportOffset}px`
    : undefined
}}>
  {searchActive ? (
    <SearchResults query={search.q} genre={search.genre} searchType={search.type} />
  ) : (
    // ... view content
  )}
</div>

// Lines 861-866: FlickletHeader (home view)
<FlickletHeader
  appName="Flicklet"
  onSearch={(q, g, t) => handleSearch(q, g ?? null, (t as SearchType) ?? 'all')}
  onClear={handleClear}
  onHelpOpen={handleHelpOpen}
/>

// Lines 886-889: SearchResults wrapped in PullToRefreshWrapper
{searchActive ? (
  <PullToRefreshWrapper onRefresh={handleRefresh}>
    <SearchResults query={search.q} genre={search.genre} searchType={search.type} />
  </PullToRefreshWrapper>
) : (
  // ... view content
)}
```

<!-- RELEVANT TO MOBILE SEARCH END -->

### File: apps/web/src/components/FlickletHeader.tsx (SearchRow component)

<!-- RELEVANT TO MOBILE SEARCH START -->

```tsx
// Lines 126-137: Sticky search bar container with mobile padding
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

// Lines 210-636: SearchRow component (full component shown above in file index)
// Key mobile-specific lines:
// Line 389: Filter button padding `px-2 py-2 md:px-3 md:py-3`
// Line 580: Input padding `px-2 py-2 md:px-4 md:py-3 pr-8 md:pr-12 text-xs md:text-sm`
// Line 585: Voice button position `right-1 md:right-2`
// Line 621: Search button padding `px-2 py-2 md:px-3 md:py-3`
// Line 628: Clear button padding `px-2 py-2 md:px-3 md:py-3`
// Line 300-307: Blur handler with 300ms delay for touch clicks
// Line 278-290: Input change debounced 150ms
// Line 361-375: Global pointerdown listener (works for touch)
```

<!-- RELEVANT TO MOBILE SEARCH END -->

### File: apps/web/src/components/SearchSuggestions.tsx

```tsx
// Full file contents - all relevant to mobile search
// Lines 285-296: Mobile positioning and scrolling
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

// Lines 321-328: Touch-friendly click handling
onMouseDown={(e) => {
  e.preventDefault();
  e.stopPropagation();
}}
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  handleSuggestionClick(item);
}}

// Lines 219-266: Keyboard navigation (works on mobile keyboards)
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // ArrowUp/Down, Enter, Escape handling
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [isVisible, searchHistory, tmdbSuggestions, filteredSuggestions, selectedIndex, onClose]);
```

### File: apps/web/src/search/SearchResults.tsx

```tsx
// Line 107: Mobile padding
<section className="mx-auto w-full max-w-7xl px-3 sm:px-4 py-3" aria-labelledby="search-results-heading">

// Lines 127-135: Card spacing
<div className="space-y-6">
  {items.map(item => (
    <SearchResultCard
      key={`${item.mediaType}:${item.id}`}
      item={item}
      onRemove={() => setItems(prev => prev.filter(i => i.id !== item.id))}
    />
  ))}
</div>

// Lines 43-65: Infinite scroll for mobile
useEffect(() => {
  if (!sentinelRef.current) return;
  observerRef.current = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !isLoading && currentPage < totalPages) {
        void fetchPage(currentPage + 1);
      }
    },
    { threshold: 0.1 }
  );
  observerRef.current.observe(sentinelRef.current);
  return () => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  };
}, [currentPage, totalPages, isLoading]);

// Lines 335-414: SearchResultCard mobile layout
// Flex layout with responsive poster size (w-24 h-36)
// Touch-friendly buttons with active:scale-95
```

### File: apps/web/src/components/VoiceSearch.tsx

```tsx
// Lines 250-256: Touch-friendly button
<button
  className={`
    flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 ease-out
    hover:scale-105 active:scale-95
    ${isListening
      ? 'bg-red-500 text-white border-red-500 animate-pulse'
      : 'bg-card text-muted-foreground border-line hover:bg-muted hover:text-foreground'
    }
  `}
>

// Lines 59-61: Feature flag check (disabled by default)
const isVoiceSearchDisabled = typeof window !== 'undefined' &&
  (localStorage.getItem('flag:voice_search_disabled') === 'true' ||
   localStorage.getItem('flag:voice_search_enabled') !== 'true');
```

### File: apps/web/src/components/MobileTabs.tsx

```tsx
// Lines 23-154: iOS keyboard handling with Visual Viewport API
const [viewportOffset, setViewportOffset] = useState(0);

useEffect(() => {
  if (!window.visualViewport) {
    // Fallback for browsers without Visual Viewport API
    // Uses resize/orientationchange events
  }

  const handleViewportChange = () => {
    // Throttled (50ms) to prevent rapid fires
    // Filters out toolbar animations (>50px offsetTop changes)
    // Only applies offset if significant (>50px)
  };

  window.visualViewport.addEventListener('resize', handleViewportChange);
}, []);

// Line 210: Dynamic bottom position for keyboard
style={{
  bottom: `${viewportOffset}px`, // Adjusts when keyboard opens
  // ... other styles
}}
```

### File: apps/web/src/lib/isMobile.ts

```tsx
// Line 10: Mobile breakpoint definition
export const isMobileQuery = "(max-width: 768px)";

// Lines 16-19: Mobile detection function
export function isMobileNow(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function")
    return false;
  return window.matchMedia(isMobileQuery).matches;
}
```

### File: apps/web/src/styles/global.css

```css
/* Lines 84-86: Mobile nav height variable */
:root {
  --mobile-nav-height: 80px;
}

/* Lines 89-127: Mobile nav positioning */
@media (max-width: 1024px) {
  html {
    height: 100lvh;
    overflow: hidden;
  }

  body {
    height: 100lvh;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  main {
    min-height: calc(100lvh - var(--mobile-nav-height));
    padding-bottom: var(--mobile-nav-height);
  }

  .mobile-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: var(--z-nav);
    max-height: 100lvh;
    display: flex;
    visibility: visible;
    opacity: 1;
    transform: translate3d(0, 0, 0);
    -webkit-backface-visibility: hidden;
  }
}

/* Lines 954-976: Touch action utilities */
.touch-pan-y {
  touch-action: pan-y;
}
.swipe-surface {
  touch-action: pan-y;
}
.swipeable {
  touch-action: pan-y;
  -webkit-user-select: none;
  user-select: none;
}
```

---

## Mobile Search – UX & Layout Summary

### Entry Points

- **Sticky Search Bar**: Always visible at top of screen (sticky positioning, `z-index: var(--z-overlay)`)
- **No dedicated search tab**: Search is accessed via header bar on all views
- **Mobile tabs clear search**: Switching tabs (via MobileTabs component) automatically clears search state
- **Pull-to-refresh**: Search results wrapped in PullToRefreshWrapper for mobile refresh gesture

### Search Header / Controls

**Visible Controls (left to right):**

1. **Filters Button** (left side):
   - Shows "Filters", genre name, or search type
   - Opens dropdown menu with: Title/Tag mode, All/Movies-TV/People type, Genre list (8 visible, expandable)
   - Mobile padding: `px-2 py-2` (8px horizontal, 8px vertical)
   - Desktop padding: `md:px-3 md:py-3` (12px horizontal, 12px vertical)

2. **Search Input** (center, flex-1):
   - Mobile padding: `px-2 py-2` (8px), font size `text-xs` (12px)
   - Desktop padding: `md:px-4 md:py-3` (16px/12px), font size `md:text-sm` (14px)
   - Right padding: `pr-8` mobile, `md:pr-12` desktop (for voice button)
   - Voice search button positioned `right-1` (4px) mobile, `md:right-2` (8px) desktop

3. **Voice Search Button** (inside input, absolute right):
   - Size: `w-10 h-10` (40px × 40px) - touch-friendly
   - Touch feedback: `active:scale-95`
   - Disabled by default (feature flag check)

4. **Search Button** (right side):
   - Mobile padding: `px-2 py-2`
   - Desktop padding: `md:px-3 md:py-3`
   - Text: Uses translation for "Search"

5. **Clear Button** (right side, next to Search):
   - Mobile padding: `px-2 py-2`
   - Desktop padding: `md:px-3 md:py-3`
   - Text: Uses translation for "Clear"

**Total visible buttons on mobile: 4** (Filters, Search, Clear, plus Voice inside input = effectively 5 touch targets)

### Layout Behavior

**Mobile Breakpoints:**

- Default (mobile): `< 768px` (no prefix)
- Tablet+: `md:` prefix = `≥ 768px`
- Desktop: `lg:` prefix = `≥ 1024px`

**Mobile-Specific Layout Changes:**

1. **Search bar padding**: Reduced from `px-4 py-2` to `px-2 py-1.5` (50% reduction)
2. **Input font size**: `text-xs` (12px) vs `md:text-sm` (14px) - 14% smaller
3. **Button padding**: All buttons use `px-2 py-2` mobile vs `md:px-3 md:py-3` desktop
4. **Filter dropdown**: Fixed width `320px`, `maxWidth: "90vw"` for small screens, `maxHeight: "70vh"` scrollable
5. **Search suggestions**: `max-h-80` (320px max height), scrollable with `overflow-y-auto`
6. **Search results**: Padding `px-3` (12px) mobile, `sm:px-4` (16px) tablet+
7. **Card spacing**: `space-y-6` (24px vertical gap between cards)
8. **iOS keyboard handling**: Content area padding adjusts dynamically using `viewportOffset` from MobileTabs

**Z-Index Layering:**

- Search suggestions: `9999` (highest)
- Filter dropdown menu: `1000`
- Filter dropdown backdrop: `999`
- Mobile nav: `9999` (same as suggestions - potential conflict)
- Sticky search bar: `var(--z-overlay)`

### Gestures / Swipe

**No swipe gestures directly in search:**

- Search input, suggestions, and results do not use swipe gestures
- Filter dropdown uses click/tap only
- Search results cards may inherit swipe behavior from card components, but no search-specific swipe logic found

**Touch Event Handling:**

- `pointerdown` events used for closing dropdowns (works for touch)
- `onMouseDown` prevents blur before click in suggestions (touch-friendly)
- No `useSwipe` hook usage in search components

### Major Pain Contributors

**"Too Many Buttons" Sources:**

1. **Filter Dropdown Complexity**:
   - 2 mode buttons (Title/Tag)
   - 3 type buttons (All/Movies-TV/People)
   - 8+ genre buttons (expandable to 18)
   - "Show more/fewer" button
   - **Total: 14+ buttons in dropdown** when expanded

2. **Search Bar Button Density**:
   - Filters button (left)
   - Voice button (inside input, right)
   - Search button (right)
   - Clear button (right)
   - **Total: 4 visible buttons** in search bar

3. **Search Result Cards**:
   - Each card has 5 action buttons: Want, Currently Watching, Watched, Not Interested, MyList toggle
   - Plus poster link, rating stars (5 clickable)
   - **Total: 11+ interactive elements per card**

4. **Search Suggestions**:
   - Up to 3 history items
   - Up to 10 TMDB suggestions
   - Up to 8 popular suggestions
   - **Total: Up to 21 clickable suggestions** in dropdown

**Visual Overload Sources:**

1. **Filter dropdown positioning**: Fixed positioning may break on scroll (line 410 FlickletHeader.tsx)
2. **Z-index conflicts**: Search suggestions (9999) and mobile nav (9999) share same z-index
3. **Blur delay timing**: 300ms delay may be too short for slow taps on some devices
4. **Debounce mismatch**: Input change (150ms) vs TMDB fetch (300ms) creates inconsistent UX
5. **No scroll locking**: Suggestions dropdown doesn't lock body scroll when open
6. **iOS keyboard handling**: Viewport offset may not account for search bar position when keyboard opens

**Layout Cramping:**

1. **Mobile input padding**: `px-2` (8px) may be too tight for comfortable typing
2. **Button text size**: `text-xs` (12px) may be hard to read on small screens
3. **Filter button label**: May truncate genre names on very small screens
4. **Voice button size**: `w-10 h-10` (40px) is minimum touch target, but positioned inside input reduces available space

---

**End of Forensic Audit Report**
