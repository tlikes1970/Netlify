# Comprehensive Cross-Device Sync Audit Report
## All Settings and Data Points - Sync Status Review

**Date:** 2025-01-27  
**Branch:** modify-cards-in-search-results  
**Scope:** Complete audit of all user data and settings for cross-device synchronization

---

## Executive Summary

**Current Status:** Several critical user data points are stored **only in localStorage** and **NOT synchronized** to Firebase, meaning they won't transfer between devices.

**Synced ✅:**
- Watchlists (watching, wishlist, watched) - ✅ Synced
- User ratings - ✅ Synced (but merge logic broken - see previous report)
- User notes & tags - ✅ Synced (but merge logic broken - see previous report)
- Custom lists definitions - ✅ Synced
- Settings (theme, personality, layout, etc.) - ✅ Synced
- Game stats (FlickWord, Trivia) - ✅ Synced

**NOT Synced ❌:**
- Tab state (sort, filters, custom order) - ❌ LocalStorage only
- Episode progress/tracking - ❌ LocalStorage only
- Per-show notification settings - ❌ LocalStorage only
- Recent searches - ❌ LocalStorage only
- Onboarding state - ❌ LocalStorage only (intentionally device-specific)

---

## Detailed Findings

### Issue #1: Tab State Not Syncing

**Location:** `apps/web/src/lib/tabState.ts`

**What's Stored:**
- Sort mode (date-newest, alphabetical-az, custom, etc.)
- Filters (type: all/movie/tv, providers array)
- Custom order (array of item IDs for manual sorting)

**Storage:** localStorage keys:
- `flk.tab.{tabKey}.sort`
- `flk.tab.{tabKey}.filter.type`
- `flk.tab.{tabKey}.filter.providers`
- `flk.tab.{tabKey}.order.custom`

**Current Behavior:**
- Saved to localStorage on change ✅
- **NOT synced to Firebase** ❌
- **NOT loaded from Firebase** ❌

**Impact:**
- User sorts/filters on Device A → Doesn't appear on Device B
- User creates custom order on Device A → Lost on Device B
- Each device has independent tab state

**Evidence:**
```35:163:apps/web/src/lib/tabState.ts
export function restoreTabState(tabKey: string, availableItemIds: Set<string>): TabState {
  // Reads from localStorage only - no Firebase lookup
  const storedSort = localStorage.getItem(`flk.tab.${tabKey}.sort`);
  const storedType = localStorage.getItem(`flk.tab.${tabKey}.filter.type`);
  // ... no Firebase sync
}

export function saveTabState(tabKey: string, state: Partial<TabState>): void {
  // Saves to localStorage only - no Firebase sync
  localStorage.setItem(`flk.tab.${tabKey}.sort`, state.sort);
  // ... no Firebase sync call
}
```

**Recommendation:** Add tab state to Firebase sync
- Store in `users/{uid}/tabState/{tabKey}`
- Sync on save (debounced)
- Load on login and merge with local

---

### Issue #2: Episode Progress Not Syncing

**Location:** `apps/web/src/utils/episodeProgress.ts`, `apps/web/src/components/modals/EpisodeTrackingModal.tsx`

**What's Stored:**
- Per-show episode watched states
- Format: `episode-progress-${showId}` → `{ episodes: { "S1E1": true, "S1E2": false, ... }, totalEpisodes: 100 }`

**Storage:** localStorage keys:
- `episode-progress-{showId}` for each show

**Current Behavior:**
- Saved to localStorage on change ✅
- **NOT synced to Firebase** ❌
- **NOT loaded from Firebase** ❌

**Impact:**
- User tracks episodes on Device A → Progress lost on Device B
- User marks episodes watched on laptop → Doesn't appear on mobile
- Critical feature broken for multi-device users

**Evidence:**
```12:53:apps/web/src/utils/episodeProgress.ts
export function getEpisodeProgress(showId: number, totalEpisodes?: number): EpisodeProgress {
  // Reads from localStorage only
  const saved = localStorage.getItem(`episode-progress-${showId}`);
  // ... no Firebase lookup
}
```

```86:111:apps/web/src/components/modals/EpisodeTrackingModal.tsx
const getSavedEpisodeProgress = (showId: number): Record<string, boolean> => {
  // Reads from localStorage only
  const saved = localStorage.getItem(`episode-progress-${showId}`);
  // ... no Firebase lookup
}

const saveEpisodeProgress = (showId: number, progress: Record<string, boolean>) => {
  // Saves to localStorage only
  localStorage.setItem(`episode-progress-${showId}`, JSON.stringify({ episodes: progress }));
  // ... no Firebase sync call
}
```

**Recommendation:** Add episode progress to Firebase sync
- Store in `users/{uid}/episodeProgress/{showId}`
- Sync on save (debounced)
- Load on login and merge with local
- Batch sync all episode progress data

---

### Issue #3: Per-Show Notification Settings Not Syncing

**Location:** `apps/web/src/lib/notifications.ts`

**What's Stored:**
- Global notification settings
- Per-show notification overrides
- Format: `notification-settings` → `{ globalEnabled, freeTierTiming, proTierTiming, methods, showOverrides: { [showId]: {...} } }`

**Storage:** localStorage key:
- `notification-settings`

**Current Behavior:**
- Saved to localStorage on change ✅
- **NOT synced to Firebase** ❌
- **NOT loaded from Firebase** ❌

**Impact:**
- User configures notifications on Device A → Settings lost on Device B
- User sets per-show overrides on laptop → Doesn't appear on mobile
- Notification preferences don't sync

**Evidence:**
```66:96:apps/web/src/lib/notifications.ts
loadSettings(): NotificationSettings {
  // Reads from localStorage only
  const saved = localStorage.getItem('notification-settings');
  // ... no Firebase lookup
}

saveSettings(): void {
  // Saves to localStorage only
  localStorage.setItem('notification-settings', JSON.stringify(this.settings));
  // ... no Firebase sync call
}
```

**Recommendation:** Add notification settings to Firebase sync
- Store in `users/{uid}/notificationSettings`
- Sync on save (debounced)
- Load on login and merge with local
- Include both global and per-show settings

---

### Issue #4: Recent Searches Not Syncing

**Location:** `apps/web/src/store/recentSearches.ts`

**What's Stored:**
- Recent search queries with timestamps
- Format: `flk.search.recent` → `[{ query: "string", timestamp: number }, ...]`
- Max 20 searches

**Storage:** localStorage key:
- `flk.search.recent`

**Current Behavior:**
- Saved to localStorage on search ✅
- **NOT synced to Firebase** ❌
- **NOT loaded from Firebase** ❌

**Impact:**
- User searches on Device A → Recent searches don't appear on Device B
- Minor UX issue - not critical but nice to have

**Evidence:**
```20:61:apps/web/src/store/recentSearches.ts
export function getRecentSearches(max: number = 5): string[] {
  // Reads from localStorage only
  const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
  // ... no Firebase lookup
}

export function addRecentSearch(query: string): void {
  // Saves to localStorage only
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newEntries));
  // ... no Firebase sync call
}
```

**Recommendation:** Optional - Add recent searches to Firebase sync
- Store in `users/{uid}/recentSearches`
- Sync on add (debounced)
- Load on login and merge with local
- Low priority - nice-to-have feature

---

### Issue #5: Onboarding State (Intentionally Device-Specific)

**Location:** `apps/web/src/lib/onboarding.ts`

**What's Stored:**
- Onboarding completion flag
- Search tip dismissed flag
- Format: `flicklet.onboardingCompleted` → `"true"` | `null`
- Format: `flicklet.searchTipDismissed` → `"true"` | `null`

**Storage:** localStorage keys:
- `flicklet.onboardingCompleted`
- `flicklet.searchTipDismissed`

**Current Behavior:**
- Saved to localStorage ✅
- **NOT synced to Firebase** ✅ (by design)
- **NOT loaded from Firebase** ✅ (by design)

**Impact:** None - This is intentional
- Onboarding should be device-specific
- User might want to see onboarding on new device
- Comment in code confirms this is intentional

**Evidence:**
```8:12:apps/web/src/lib/onboarding.ts
/**
 * IMPORTANT: Onboarding completion is stored in localStorage (not Firestore) because:
 * - It needs to be available immediately on page load
 * - It's device-specific (user might want to see onboarding on a new device)
 * - For signed-in users, we also check auth state to prevent showing welcome to returning users
 */
```

**Recommendation:** No change needed - This is correct behavior

---

## Data Currently Syncing (Verification)

### ✅ Watchlists - Syncing
**Location:** `apps/web/src/lib/firebaseSync.ts`
- Synced via `saveToFirebase()` ✅
- Loaded via `loadFromFirebase()` ✅
- Includes: watching, wishlist, watched lists ✅

### ✅ User Ratings - Syncing (but merge broken)
**Location:** `apps/web/src/lib/firebaseSync.ts`
- Included in `pruneItem()` ✅
- Synced to Firebase ✅
- **BUT:** Merge logic doesn't update existing items ❌ (see previous report)

### ✅ User Notes & Tags - Syncing (but merge broken)
**Location:** `apps/web/src/lib/firebaseSync.ts`
- Included in `pruneItem()` ✅
- Synced to Firebase ✅
- **BUT:** Merge logic doesn't update existing items ❌ (see previous report)

### ✅ Custom Lists - Syncing
**Location:** `apps/web/src/lib/firebaseSync.ts`
- Synced via `saveToFirebase()` ✅
- Loaded via `loadFromFirebase()` ✅
- Includes: custom list definitions ✅

### ✅ Settings - Syncing
**Location:** `apps/web/src/lib/settings.ts`
- Synced via `syncSettingsToFirebase()` ✅
- Loaded via `loadSettingsFromFirebase()` ✅
- Includes: theme, personality, layout, notifications, pro status ✅

### ✅ Game Stats - Syncing
**Location:** `apps/web/src/lib/gameStatsSync.ts`
- Synced to Firebase ✅
- Loaded from Firebase ✅
- Includes: FlickWord stats, Trivia stats ✅

---

## Summary Table

| Data Point | Storage | Firebase Sync | Load on Login | Priority |
|------------|---------|--------------|---------------|----------|
| Watchlists | localStorage + Firebase | ✅ Yes | ✅ Yes | HIGH |
| User Ratings | localStorage + Firebase | ✅ Yes | ⚠️ Broken merge | HIGH |
| User Notes/Tags | localStorage + Firebase | ✅ Yes | ⚠️ Broken merge | HIGH |
| Custom Lists | localStorage + Firebase | ✅ Yes | ✅ Yes | HIGH |
| Settings | localStorage + Firebase | ✅ Yes | ✅ Yes | HIGH |
| Game Stats | localStorage + Firebase | ✅ Yes | ✅ Yes | MEDIUM |
| **Tab State** | **localStorage only** | ❌ No | ❌ No | **HIGH** |
| **Episode Progress** | **localStorage only** | ❌ No | ❌ No | **HIGH** |
| **Notification Settings** | **localStorage only** | ❌ No | ❌ No | **MEDIUM** |
| Recent Searches | localStorage only | ❌ No | ❌ No | LOW |
| Onboarding State | localStorage only | ✅ By design | ✅ By design | N/A |

---

## Recommended Implementation Order

### Priority 1: Critical Fixes (From Previous Report)
1. ✅ Fix search results enrichment with library data
2. ✅ Fix Firebase merge logic for ratings/notes
3. ✅ Add library subscriptions to cards

### Priority 2: High Priority Missing Syncs
4. **Episode Progress Sync** - Critical for multi-device users
   - Add to Firebase sync
   - Store in `users/{uid}/episodeProgress/{showId}`
   - Batch sync all progress on save

5. **Tab State Sync** - Important for UX consistency
   - Add to Firebase sync
   - Store in `users/{uid}/tabState/{tabKey}`
   - Sync sort, filters, custom order

### Priority 3: Medium Priority Missing Syncs
6. **Notification Settings Sync** - Important for notification preferences
   - Add to Firebase sync
   - Store in `users/{uid}/notificationSettings`
   - Include global and per-show settings

### Priority 4: Low Priority (Optional)
7. **Recent Searches Sync** - Nice-to-have
   - Optional enhancement
   - Low impact on user experience

---

## Implementation Notes

### Episode Progress Sync
- **Storage Format:** `users/{uid}/episodeProgress/{showId}`
- **Data Structure:** `{ episodes: { "S1E1": true, ... }, totalEpisodes: number, lastUpdated: timestamp }`
- **Sync Strategy:** Batch sync all episode progress on save (debounced)
- **Merge Strategy:** Last-write-wins per show

### Tab State Sync
- **Storage Format:** `users/{uid}/tabState/{tabKey}`
- **Data Structure:** `{ sort: SortMode, filter: ListFiltersState, order: TabOrderState }`
- **Sync Strategy:** Sync on save (debounced 1s)
- **Merge Strategy:** Firebase wins (most recent settings)

### Notification Settings Sync
- **Storage Format:** `users/{uid}/notificationSettings`
- **Data Structure:** `{ globalEnabled, freeTierTiming, proTierTiming, methods, showOverrides }`
- **Sync Strategy:** Sync on save (debounced 1s)
- **Merge Strategy:** Deep merge (Firebase wins for conflicts)

---

## Testing Checklist

### Episode Progress
- [ ] Track episodes on Device A → Verify appears on Device B
- [ ] Update progress on Device B → Verify updates on Device A
- [ ] Multiple shows tracked → All sync correctly

### Tab State
- [ ] Change sort on Device A → Verify appears on Device B
- [ ] Set filters on Device A → Verify appears on Device B
- [ ] Create custom order on Device A → Verify appears on Device B

### Notification Settings
- [ ] Configure notifications on Device A → Verify appears on Device B
- [ ] Set per-show overrides on Device A → Verify appears on Device B
- [ ] Change global settings on Device B → Verify updates on Device A

---

## Files Requiring Changes

### Episode Progress Sync
1. `apps/web/src/utils/episodeProgress.ts` - Add Firebase sync
2. `apps/web/src/components/modals/EpisodeTrackingModal.tsx` - Add Firebase sync on save
3. `apps/web/src/lib/firebaseSync.ts` - Add episode progress to sync/load

### Tab State Sync
1. `apps/web/src/lib/tabState.ts` - Add Firebase sync
2. `apps/web/src/lib/firebaseSync.ts` - Add tab state to sync/load

### Notification Settings Sync
1. `apps/web/src/lib/notifications.ts` - Add Firebase sync
2. `apps/web/src/lib/firebaseSync.ts` - Add notification settings to sync/load

---

**Report Generated:** 2025-01-27  
**Status:** Ready for implementation prioritization


