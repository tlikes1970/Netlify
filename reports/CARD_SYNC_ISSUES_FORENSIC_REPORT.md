# Forensic Report: Card Synchronization Issues
## Ratings, Notes, and Cross-Device Sync Problems

**Date:** 2025-01-27  
**Branch:** modify-cards-in-search-results  
**Scope:** Search results cards, mobile/desktop card parity, notes persistence

---

## Executive Summary

**Problem:** Ratings, notes, and tags for TV shows and movies are not syncing between laptop and mobile devices. Additionally, notes saved on laptop are not accessible later, even on the same device.

**Root Causes Identified:**
1. Search results are not enriched with library data (ratings/notes) before display
2. Firebase sync merge logic doesn't update existing items with new user data
3. Search result cards don't check library for existing user data
4. Mobile and desktop cards use different data sources

---

## Detailed Findings

### Issue #1: Search Results Missing Library Data

**Location:** `apps/web/src/search/api.ts` - `mapTMDBToMediaItem()` function

**Problem:**
- Search results come directly from TMDB API
- `mapTMDBToMediaItem()` only maps TMDB fields to `MediaItem` format
- **No enrichment with library data** (userRating, userNotes, tags)
- SearchResultCard displays items without checking Library.getEntry()

**Evidence:**
```175:223:apps/web/src/search/api.ts
export function mapTMDBToMediaItem(r: any): MediaItem {
  // ... maps TMDB fields only
  const item: MediaItem = {
    id: r.id,
    mediaType,
    title: safeTitle,
    year,
    releaseDate,
    posterUrl,
    voteAverage: typeof r.vote_average === 'number' ? r.vote_average : undefined,
    voteCount: typeof r.vote_count === 'number' ? r.vote_count : undefined,
    synopsis: r.overview || '',
    showStatus: mediaType === 'tv' ? r.status : undefined,
    lastAirDate: mediaType === 'tv' ? r.last_air_date : undefined,
  };
  // ❌ NO userRating, userNotes, or tags enrichment
  return item;
}
```

**Impact:**
- Search results show items without user ratings/notes
- Even if item exists in library, search results don't show user data
- User sees different data in search vs. list tabs

---

### Issue #2: SearchResultCard Doesn't Enrich Items

**Location:** `apps/web/src/search/SearchResults.tsx` - `SearchResultCard` component

**Problem:**
- Component receives `item` prop directly from search results
- Never calls `Library.getEntry()` to enrich with user data
- Displays item as-is from TMDB search

**Evidence:**
```242:250:apps/web/src/search/SearchResults.tsx
function SearchResultCard({
  item,
  index,
  onRemove,
}: {
  item: MediaItem;
  index: number;
  onRemove: () => void;
}) {
  // ❌ No Library.getEntry() call to enrich item with userRating/userNotes
  const translations = useTranslations();
  const { posterUrl, mediaType, synopsis } = item;
```

**Impact:**
- Search results always show items without user data
- Even if user has rated/noted the item, it won't appear in search

---

### Issue #3: Firebase Sync Merge Doesn't Update Existing Items

**Location:** `apps/web/src/lib/firebaseSync.ts` - `mergeCloudData()` method

**Problem:**
- When loading from Firebase, merge logic only **adds** new items
- **Does NOT update existing items** with new ratings/notes from cloud
- Logic checks `existingIds.has(itemId)` and skips if item exists

**Evidence:**
```274:302:apps/web/src/lib/firebaseSync.ts
for (const list of lists) {
  // Merge movies
  if (cloudWatchlists.movies?.[list]) {
    for (const cloudItem of cloudWatchlists.movies[list]) {
      const key = `movie:${cloudItem.id}`;
      const itemId = `movie:${cloudItem.id}`;
      
      // Only add if not already in Library
      if (!existingIds.has(itemId)) {
        // ✅ Adds new items
        const localItem = {
          // ... includes userRating, userNotes
        };
        cleanedData[key] = localItem;
      } else {
        // ❌ SKIPS existing items - doesn't merge userRating/userNotes
        console.log('⏭️ Skipping duplicate movie:', cloudItem.title);
      }
    }
  }
}
```

**Impact:**
- If user rates/notes item on Device A, Device B won't get updates
- Only new items sync, existing items stay stale
- Cross-device sync broken for user data

---

### Issue #4: Notes Saved But Not Accessible

**Location:** Multiple - Notes saving vs. retrieval flow

**Problem:**
- Notes are saved via `Library.updateNotesAndTags()` ✅
- Firebase sync includes `user_notes` in `pruneItem()` ✅
- But when items are displayed, they're not enriched with library data ❌
- Search results don't check library ❌
- List pages get items from Library, but search doesn't ❌

**Evidence - Notes Saving Works:**
```493:521:apps/web/src/lib/storage.ts
updateNotesAndTags(
  id: string | number,
  mediaType: MediaType,
  notes: string,
  tags: string[]
) {
  const key = k(id, mediaType);
  if (state[key]) {
    state[key] = {
      ...state[key],
      userNotes: notes,
      tags: tags,
    };
    save(state);
    emit();
    // ✅ Triggers Firebase sync
  }
}
```

**Evidence - Firebase Sync Includes Notes:**
```51:70:apps/web/src/lib/firebaseSync.ts
private pruneItem(item: LibraryEntry): any {
  return {
    // ... other fields
    user_rating: typeof item.userRating === 'number' ? item.userRating : null,
    user_notes: item.userNotes || null, // ✅ Included in sync
    user_tags: item.tags || [], // ✅ Included in sync
    // ...
  };
}
```

**Evidence - But Search Results Don't Show Notes:**
- SearchResultCard doesn't enrich items with library data
- Even if notes exist in library, search results won't show them

**Impact:**
- User saves notes on laptop ✅
- Notes stored in localStorage ✅
- Notes synced to Firebase ✅
- But notes don't appear in search results ❌
- Notes may not appear on mobile if item already exists locally ❌

---

### Issue #5: Mobile vs Desktop Card Data Sources

**Location:** Multiple card components

**Problem:**
- **Mobile cards** (`TvCardMobile`, `MovieCardMobile`): Read `userRating` from `item` prop
- **Desktop cards** (`CardV2`, `TabCard`): Read `userRating` from `item` prop
- **List pages**: Items come from `Library.getByList()` which includes user data ✅
- **Search results**: Items come from TMDB search, no library enrichment ❌

**Evidence - Mobile Card:**
```49:50:apps/web/src/components/cards/mobile/TvCardMobile.tsx
export function TvCardMobile({ item, actions, tabKey = 'watching', index = 0, onDragStart, onDragEnd, onKeyboardReorder, isDragging }: TvCardMobileProps) {
  const { title, year, posterUrl, showStatus, userRating, synopsis } = item;
  // Uses item.userRating directly - no library lookup
```

**Evidence - Desktop TabCard:**
```74:98:apps/web/src/components/cards/TabCard.tsx
// Get latest rating from library to ensure we have the most up-to-date value
const [currentRating, setCurrentRating] = useState(item.userRating);

// Subscribe to library changes to update rating immediately
useEffect(() => {
  const updateRating = () => {
    const latestEntry = Library.getEntry(item.id, item.mediaType);
    if (latestEntry?.userRating !== undefined) {
      setCurrentRating(latestEntry.userRating);
    }
  };
  // ✅ TabCard DOES check library for updates
```

**Key Difference:**
- `TabCard` (used in list pages) subscribes to library changes ✅
- `SearchResultCard` (used in search) does NOT check library ❌
- Mobile cards rely on prop data, don't check library ❌

---

## Data Flow Analysis

### Current Flow (Broken)

**Search Results:**
```
TMDB API → mapTMDBToMediaItem() → SearchResultCard → Display
❌ No library enrichment
❌ No userRating/userNotes
```

**List Pages:**
```
Library.getByList() → TabCard → Display
✅ Includes userRating/userNotes
✅ TabCard subscribes to library updates
```

**Notes Saving:**
```
User edits notes → Library.updateNotesAndTags() → localStorage → Firebase sync ✅
But: Search results don't read from library ❌
```

**Cross-Device Sync:**
```
Device A: Save notes → Firebase ✅
Device B: Load from Firebase → mergeCloudData() → Only adds NEW items ❌
Device B: Existing items NOT updated with new notes ❌
```

---

## Code Locations Summary

### Files Requiring Changes

1. **`apps/web/src/search/api.ts`**
   - `mapTMDBToMediaItem()` - Add library enrichment
   - `searchMulti()` - Enrich results before returning
   - `discoverByGenre()` - Enrich results before returning

2. **`apps/web/src/search/SearchResults.tsx`**
   - `SearchResultCard` - Enrich item with library data on mount
   - Use `Library.getEntry()` to merge user data

3. **`apps/web/src/lib/firebaseSync.ts`**
   - `mergeCloudData()` - Update existing items with cloud user data
   - Merge userRating, userNotes, tags for existing items

4. **`apps/web/src/components/cards/mobile/TvCardMobile.tsx`**
   - Subscribe to library changes like TabCard does
   - Update rating/notes when library changes

5. **`apps/web/src/components/cards/mobile/MovieCardMobile.tsx`**
   - Subscribe to library changes like TabCard does
   - Update rating/notes when library changes

---

## Recommended Fixes

### Fix #1: Enrich Search Results with Library Data

**Location:** `apps/web/src/search/api.ts`

Add enrichment function:
```typescript
function enrichWithLibraryData(item: MediaItem): MediaItem {
  const libraryEntry = Library.getEntry(item.id, item.mediaType);
  if (libraryEntry) {
    return {
      ...item,
      userRating: libraryEntry.userRating,
      userNotes: libraryEntry.userNotes,
      tags: libraryEntry.tags,
    };
  }
  return item;
}
```

Apply in `searchMulti()` and `discoverByGenre()`:
```typescript
const mapped = filtered.map(mapTMDBToMediaItem)
  .map(enrichWithLibraryData) // ✅ Add enrichment
  .filter(Boolean);
```

### Fix #2: Update Firebase Merge Logic

**Location:** `apps/web/src/lib/firebaseSync.ts`

Change merge logic to update existing items:
```typescript
if (!existingIds.has(itemId)) {
  // Add new item
} else {
  // ✅ UPDATE existing item with cloud user data
  const existingKey = key;
  if (cleanedData[existingKey]) {
    cleanedData[existingKey] = {
      ...cleanedData[existingKey],
      userRating: cloudItem.user_rating || cleanedData[existingKey].userRating,
      userNotes: cloudItem.user_notes || cleanedData[existingKey].userNotes,
      tags: cloudItem.user_tags || cleanedData[existingKey].tags,
    };
  }
}
```

### Fix #3: SearchResultCard Library Subscription

**Location:** `apps/web/src/search/SearchResults.tsx`

Add library subscription like TabCard:
```typescript
useEffect(() => {
  const enrichItem = () => {
    const libraryEntry = Library.getEntry(item.id, item.mediaType);
    if (libraryEntry) {
      // Update item with library data
      setEnrichedItem({
        ...item,
        userRating: libraryEntry.userRating,
        userNotes: libraryEntry.userNotes,
        tags: libraryEntry.tags,
      });
    }
  };
  
  enrichItem();
  const unsubscribe = Library.subscribe(enrichItem);
  return unsubscribe;
}, [item.id, item.mediaType]);
```

### Fix #4: Mobile Cards Library Subscription

**Location:** `apps/web/src/components/cards/mobile/TvCardMobile.tsx` and `MovieCardMobile.tsx`

Add library subscription like TabCard:
```typescript
useEffect(() => {
  const updateFromLibrary = () => {
    const latestEntry = Library.getEntry(item.id, item.mediaType);
    if (latestEntry) {
      // Update local state with library data
      setUserRating(latestEntry.userRating);
      setUserNotes(latestEntry.userNotes);
      setTags(latestEntry.tags);
    }
  };
  
  updateFromLibrary();
  const unsubscribe = Library.subscribe(updateFromLibrary);
  return unsubscribe;
}, [item.id, item.mediaType]);
```

---

## Testing Checklist

- [ ] Search for item that exists in library - verify rating/notes appear
- [ ] Rate item on Device A - verify appears on Device B
- [ ] Add notes on Device A - verify appears on Device B
- [ ] Update notes on Device A - verify updates on Device B
- [ ] Search results show library data (ratings/notes)
- [ ] Mobile cards show library data
- [ ] Desktop cards show library data
- [ ] Cross-device sync updates existing items

---

## Impact Assessment

**Severity:** HIGH
- Core functionality broken (ratings/notes not syncing)
- User data not accessible where expected
- Cross-device sync partially broken

**Affected Users:** All users with multiple devices or who use search

**Data Loss Risk:** LOW
- Data is saved correctly
- Issue is display/enrichment, not storage
- Fix should restore access to existing data

---

## Next Steps

1. Implement Fix #1 (enrich search results)
2. Implement Fix #2 (update Firebase merge)
3. Implement Fix #3 (SearchResultCard subscription)
4. Implement Fix #4 (mobile cards subscription)
5. Test cross-device sync
6. Verify notes persistence
7. Test search results display

---

**Report Generated:** 2025-01-27  
**Status:** Ready for implementation


