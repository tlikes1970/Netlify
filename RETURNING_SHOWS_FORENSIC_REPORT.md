# 🔍 Returning Shows & Next-Air-Date Forensic Report

**Date:** Generated from codebase analysis  
**Scope:** READ-ONLY diagnostic of returning/next-air-date calculation, storage, and presentation  
**Status:** Complete - No code modifications made

---

## PART A – DATA SOURCES & FIELD MAPPING

### 1. TMDB → Internal Data Mapping

#### TMDB Fields Used:
- `next_episode_to_air.air_date` - ISO date string (e.g., "2025-01-15")
- `status` - String: "Returning Series", "Ended", "Canceled", "In Production", "Planned"
- `last_air_date` - ISO date string for last aired episode
- `first_air_date` - ISO date string (used for year extraction only)

#### Internal Type Structure:
**File:** `apps/web/src/components/cards/card.types.ts:3-22`

```typescript
interface MediaItem {
  nextAirDate?: string | null;  // ISO date string
  showStatus?: 'Ended' | 'Returning Series' | 'In Production' | 'Canceled' | 'Planned';
  lastAirDate?: string;  // ISO date string
  // ... other fields
}
```

#### Mapping Locations:

**A) Initial Search Result Mapping:**
- **File:** `apps/web/src/search/api.ts:175-223`
- **Function:** `mapTMDBToMediaItem(r: any): MediaItem`
- **Critical Finding:** This function does NOT map `next_episode_to_air` to `nextAirDate`
- **What it DOES map:**
  - `r.status` → `showStatus` (line 215)
  - `r.last_air_date` → `lastAirDate` (line 216)
- **What it MISSES:** `next_episode_to_air.air_date` is completely ignored

**B) When Adding to "Watching" List:**
- **File:** `apps/web/src/search/SearchResults.tsx:420-468`
- **Function:** `handleAction("currently-watching")`
- **Process:**
  1. Calls `fetchNextAirDate(Number(item.id))` (line 431)
  2. Calls `fetchShowStatus(Number(item.id))` (line 432)
  3. Merges results into item before `addToListWithConfirmation()` (lines 448-463)
- **Critical Detail:** `nextAirDate` is only fetched and set when user explicitly adds show to "watching" list
- **Preservation Logic:** Line 452 preserves existing `nextAirDate` if already set: `nextAirDate: nextAirDate || item.nextAirDate`

**C) TMDB Fetch Functions:**
- **File:** `apps/web/src/tmdb/tv.ts:1-16`
- **Function:** `fetchNextAirDate(tvId: number): Promise<string | null>`
- **Logic:**
  ```typescript
  const next = json?.next_episode_to_air?.air_date || null;
  return next || null;
  ```
- **No validation:** Returns date as-is from TMDB, even if it's in the past
- **No fallback:** If `next_episode_to_air` is missing, returns `null`

### 2. Metadata Helper Functions

**File:** `apps/web/src/lib/constants/metadata.ts`

#### `getNextAirDate(show: PossibleShow): Date | null`
- **Lines:** 16-22
- **Input:** Show object with `nextAirDate` (string) or `next_episode_to_air.air_date` (nested)
- **Logic:**
  1. Checks `show.nextAirDate` first (app-level field)
  2. Falls back to `show.next_episode_to_air?.air_date` (TMDB-style nested)
  3. Parses ISO string to `Date` object
  4. Returns `null` if invalid or missing
- **Critical:** No validation that date is in the future
- **Critical:** No timezone handling - uses native `Date` parsing

#### `getDisplayAirDate(show: PossibleShow): string`
- **Lines:** 43-51
- **Input:** Same as `getNextAirDate`
- **Logic:**
  1. Calls `getNextAirDate()` to get Date object
  2. If null, returns `'TBA'`
  3. Otherwise formats as: `d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })`
- **Example outputs:** "Jan 15, 2025" or "TBA"
- **No relative formatting:** Always absolute date, never "Tomorrow", "In 3 days", etc.

#### Constants:
- **`RETURNING_STATUS`:** `'Returning Series'` (line 3)
- **`RETURNING_NEAR_WINDOW_DAYS`:** `14` (line 4) - **DEFINED BUT NOT USED IN FILTERING**

#### Helper Functions (Unused in Returning Logic):
- **`isWithinWindow(d: Date, days: number): boolean`** (lines 37-41)
  - Checks if date is within ±N days of today
  - **NOT USED** in `useReturningShows` or `HomeUpNextRail`
- **`diffInDays(a: Date, b: Date): number`** (lines 30-35)
  - Calculates day difference between two dates
  - **NOT USED** in returning/up-next logic

### 3. Source of Truth Analysis

**FINDING: Multiple sources, no single canonical function**

1. **Primary Source:** `getNextAirDate()` in `metadata.ts`
   - Used by: `useReturningShows.ts` (line 45-46), `UpNextCard.tsx` (indirectly via `getDisplayAirDate`)
   - **Status:** Canonical for date extraction, but not for validation

2. **Direct Field Access:** `HomeUpNextRail.tsx`
   - **Line 22:** Directly checks `!!i.nextAirDate` (boolean check)
   - **Line 23:** Sorts by `String(a.nextAirDate).localeCompare(String(b.nextAirDate))`
   - **Issue:** String comparison instead of date comparison (works for ISO dates but not ideal)

3. **Inconsistent Usage:**
   - `useReturningShows` uses `getNextAirDate()` for sorting (Date objects)
   - `HomeUpNextRail` uses direct string comparison
   - Both can show past dates (no filtering)

---

## PART B – RETURNING SHOWS SELECTOR LOGIC

### 4. `useReturningShows.ts` Analysis

**File:** `apps/web/src/state/selectors/useReturningShows.ts`

#### Data Pipeline:

**Input:** `Library.getAll()` - All library entries across all lists

**Filtering (Line 37):**
```typescript
const onlyReturning = all.filter(x => x.mediaType === 'tv' && isReturning(x));
```

**`isReturning()` Function (metadata.ts:24-28):**
```typescript
export function isReturning(show: PossibleShow | null | undefined): boolean {
  if (!show) return false;
  const status = (show.showStatus || show.status || '').trim();
  return status === RETURNING_STATUS;  // 'Returning Series'
}
```

**Critical Findings:**
- ✅ Filters by `mediaType === 'tv'`
- ✅ Filters by `status === 'Returning Series'`
- ❌ **NO date filtering** - includes shows with past dates
- ❌ **NO date validation** - includes shows with no date (TBA)
- ❌ **NO window filtering** - includes shows years in the future
- ❌ **NO exclusion of ended/canceled** - relies solely on status

**Sorting (Lines 44-51):**
```typescript
const sorted = [...withDerived].sort((a, b) => {
  const ad = getNextAirDate(a);
  const bd = getNextAirDate(b);
  if (ad && bd) return ad.getTime() - bd.getTime();  // Soonest first
  if (ad && !bd) return -1;  // Dated before undated
  if (!ad && bd) return 1;
  return (a.title || '').localeCompare(b.title || '');  // Alphabetical for undated
});
```

**Sorting Behavior:**
1. Shows with dates: Sorted by date (ascending - soonest first)
2. Shows without dates: Sorted alphabetically
3. Dated shows always appear before undated shows

**Output:** Array of `ReturningShow[]` with added `displayAirDate: string` field

### 5. Filtering Rules Summary

#### When is a show INCLUDED in `useReturningShows`?
- ✅ `mediaType === 'tv'`
- ✅ `showStatus === 'Returning Series'` (or `status === 'Returning Series'`)
- ✅ **No date requirement** - TBA shows included
- ✅ **No date validation** - Past dates included
- ✅ **No future limit** - Shows years away included

#### When is a show EXCLUDED?
- ❌ `mediaType !== 'tv'`
- ❌ `showStatus !== 'Returning Series'`
- ❌ **NOT excluded for:** Past dates, missing dates, far future dates, ended/canceled status (if status field is wrong)

#### Constants & Thresholds:
- **`RETURNING_STATUS`:** `'Returning Series'` - Used for filtering
- **`RETURNING_NEAR_WINDOW_DAYS`:** `14` - **DEFINED BUT UNUSED**
- **No maximum window** - No limit on how far in future
- **No minimum validation** - No check if date is in past

---

## PART C – UI & PRESENTATION (HOME RAILS)

### 6. HomeUpNextRail Component

**File:** `apps/web/src/components/rails/HomeUpNextRail.tsx`

#### Data Source:
- **Hook:** `useLibrary('watching')` (line 9)
- **NOT using:** `useReturningShows()` - This is a separate selector
- **Scope:** Only shows in "watching" list, not all library

#### Filtering Logic (Lines 16-41):

**Step 1:** Filter to TV shows only
```typescript
const tvShows = watching.filter(i => i.mediaType === 'tv');
```

**Step 2:** Separate by date presence
```typescript
const showsWithDates = tvShows
  .filter(i => !!i.nextAirDate)  // Has any date (past or future)
  .sort((a,b) => String(a.nextAirDate).localeCompare(String(b.nextAirDate)));

const showsWithoutDates = tvShows
  .filter(i => !i.nextAirDate && !getShowStatusInfo(i.showStatus)?.isCompleted)
  .sort(/* by status priority */);
```

**Critical Findings:**
- ❌ **NO date validation** - Past dates included in `showsWithDates`
- ❌ **NO status filtering** - All TV shows in watching list included (not just "Returning Series")
- ✅ **Excludes completed shows** - Uses `getShowStatusInfo()?.isCompleted` to filter out "Ended"/"Canceled" from undated list
- ⚠️ **String sorting** - Uses `localeCompare` on ISO date strings (works but not ideal)

**Step 3:** Combine and limit
```typescript
const combined = [...showsWithDates, ...showsWithoutDates].slice(0, 12);
```

**Final Output:** Up to 12 shows, dated first, then undated

#### UI Labels (via UpNextCard):

**File:** `apps/web/src/components/cards/UpNextCard.tsx:68-97`

**Message Logic:**
1. **If completed (Ended/Canceled):** "Series Complete" or "Series Cancelled"
2. **If has `nextAirDate`:** `"Up Next: {formatted date}"` (e.g., "Up Next: Jan 15")
3. **If no date but has status:**
   - "Returning Series" → "Returning Soon"
   - "In Production" → "In Production"
   - "Planned" → "Planned"
   - Default → "Coming Soon"
4. **Fallback:** "Coming Soon"

**Date Formatting (Lines 29-43):**
```typescript
const formatAirDate = (dateString: string) => {
  const date = new Date(dateString + 'T00:00:00Z');  // Force UTC
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    timeZone: 'UTC'
  });
};
```
- **Output format:** "Jan 15" (no year, no "Tomorrow", no relative)
- **Timezone handling:** Forces UTC to avoid timezone issues

### 7. Date Formatting Behavior

#### Current Behavior:
- **Today:** Shows as "Jan 15" (if today is Jan 15)
- **Within 7 days:** Shows as "Jan 16", "Jan 17", etc. (no "Tomorrow", "In 3 days")
- **Within 30 days:** Same absolute format
- **More than 30 days:** Same absolute format
- **Past dates:** Shows as "Jan 10" (if today is Jan 15 and date is Jan 10) - **NO INDICATION IT'S PAST**

#### Mismatches Identified:

1. **Selector vs UI:**
   - `useReturningShows` uses `getDisplayAirDate()` which includes year: "Jan 15, 2025"
   - `UpNextCard` uses custom `formatAirDate()` which excludes year: "Jan 15"
   - **Inconsistency:** Different formatting functions

2. **No Relative Dates:**
   - No "Tomorrow", "Today", "In 3 days" formatting
   - Always absolute dates

3. **No Past Date Indicators:**
   - Past dates shown identically to future dates
   - No visual distinction or label

---

## PART D – EDGE CASES & FAILURE MODES

### 8. Edge Case Handling

#### Case 1: Show marked "Returning Series" but TMDB has NO `next_episode_to_air`

**Current Behavior:**
- **`getNextAirDate()`:** Returns `null` (metadata.ts:18)
- **`getDisplayAirDate()`:** Returns `'TBA'` (metadata.ts:45)
- **`useReturningShows`:** ✅ **INCLUDED** - Shows up in returning list with `displayAirDate: 'TBA'`
- **Sorting:** Appears after all dated shows (alphabetically sorted with other TBA shows)
- **UI:** Shows "Returning Soon" in UpNextCard (line 86)

**File References:**
- `apps/web/src/lib/constants/metadata.ts:16-22` (getNextAirDate)
- `apps/web/src/lib/constants/metadata.ts:43-51` (getDisplayAirDate)
- `apps/web/src/state/selectors/useReturningShows.ts:37` (filtering)
- `apps/web/src/components/cards/UpNextCard.tsx:86` (UI label)

#### Case 2: Show has `next_episode_to_air` date in the PAST

**Current Behavior:**
- **`getNextAirDate()`:** Returns `Date` object for past date (no validation)
- **`getDisplayAirDate()`:** Returns formatted past date string (e.g., "Jan 5, 2025")
- **`useReturningShows`:** ✅ **INCLUDED** - Shows up in returning list
- **Sorting:** Sorted by date (past dates appear first if they're the earliest)
- **UI:** Shows "Up Next: Jan 5" with no indication it's in the past
- **HomeUpNextRail:** ✅ **INCLUDED** - Appears in "showsWithDates" array

**File References:**
- `apps/web/src/lib/constants/metadata.ts:16-22` (no past-date validation)
- `apps/web/src/state/selectors/useReturningShows.ts:44-51` (no date filtering)
- `apps/web/src/components/rails/HomeUpNextRail.tsx:21-23` (no date validation)
- `apps/web/src/components/cards/UpNextCard.tsx:78-79` (no past-date detection)

#### Case 3: Show is marked "Ended" or "Canceled" but still has upcoming dates in data

**Current Behavior:**
- **`isReturning()`:** Returns `false` (status check fails)
- **`useReturningShows`:** ❌ **EXCLUDED** - Status filter removes it
- **HomeUpNextRail:** Behavior depends on date:
  - **If has date:** ✅ **INCLUDED** in `showsWithDates` (no status check for dated shows)
  - **If no date:** ❌ **EXCLUDED** from `showsWithoutDates` (line 26: `!getShowStatusInfo(i.showStatus)?.isCompleted`)

**Critical Finding:** HomeUpNextRail shows ended/canceled shows IF they have a `nextAirDate`, even though status says ended.

**File References:**
- `apps/web/src/lib/constants/metadata.ts:24-28` (isReturning status check)
- `apps/web/src/components/rails/HomeUpNextRail.tsx:21-23` (no status check for dated shows)
- `apps/web/src/components/rails/HomeUpNextRail.tsx:25-26` (status check only for undated shows)

#### Case 4: TBA / Unknown dates

**Current Behavior:**
- **Internal representation:** `nextAirDate: null` or `nextAirDate: undefined`
- **`getDisplayAirDate()`:** Returns `'TBA'` string
- **UI Labels:**
  - UpNextCard: "Returning Soon", "In Production", "Planned", or "Coming Soon" (status-based)
  - useReturningShows: `displayAirDate: 'TBA'`
- **Inclusion:**
  - `useReturningShows`: ✅ Included (if status is "Returning Series")
  - HomeUpNextRail: ✅ Included in `showsWithoutDates` array

**File References:**
- `apps/web/src/lib/constants/metadata.ts:43-51` (TBA return)
- `apps/web/src/components/cards/UpNextCard.tsx:82-96` (status-based labels)

#### Case 5: Streaming drops entire season on one date

**Current Behavior:**
- **Before drop:** If TMDB has `next_episode_to_air` with drop date, shows that date
- **After drop:** TMDB typically removes `next_episode_to_air` after all episodes air
  - If removed: `nextAirDate` becomes `null`, shows as TBA/status-based label
  - If still present: Shows stale date (Case 2 scenario)
- **No special handling:** Treated same as weekly episode shows

**File References:**
- `apps/web/src/tmdb/tv.ts:1-16` (fetches whatever TMDB returns)
- No refresh mechanism for existing shows (see Case 6)

#### Case 6: Stale data - `nextAirDate` never refreshed after initial fetch

**Current Behavior:**
- **Initial fetch:** Only happens when adding to "watching" list (SearchResults.tsx:431)
- **No automatic refresh:** No background job, no periodic update, no on-app-open refresh
- **Manual refresh:** `populateNextAirDates()` in `testData.ts` exists but is test-only
- **Preservation logic:** `Library.upsert()` preserves existing `nextAirDate` if new item doesn't have one (storage.ts:285-287)

**Critical Finding:** Once set, `nextAirDate` can become stale and never updates unless:
1. User manually triggers test function (not in production)
2. User removes and re-adds show to library
3. Some other code path explicitly calls `fetchNextAirDate()` and updates

**File References:**
- `apps/web/src/lib/storage.ts:284-287` (preservation logic)
- `apps/web/src/lib/testData.ts:126-169` (manual refresh function - test only)
- `apps/web/src/search/SearchResults.tsx:431` (only fetch point)

### 9. Inconsistencies Identified

#### Inconsistency 1: Date Formatting
- **`useReturningShows`:** Uses `getDisplayAirDate()` → "Jan 15, 2025" (with year)
- **`UpNextCard`:** Uses custom `formatAirDate()` → "Jan 15" (no year)
- **Location:** Different formatting functions for same data

#### Inconsistency 2: Status Filtering
- **`useReturningShows`:** Filters by `status === 'Returning Series'` only
- **HomeUpNextRail:** No status filter for dated shows, only filters completed shows from undated list
- **Result:** HomeUpNextRail can show "Ended" shows with dates, useReturningShows cannot

#### Inconsistency 3: Date Validation
- **Both selectors:** No validation that dates are in the future
- **Both selectors:** Include past dates without indication
- **Result:** Stale return dates shown to users

#### Inconsistency 4: Source of Date
- **`getNextAirDate()`:** Checks `nextAirDate` field first, then `next_episode_to_air.air_date`
- **HomeUpNextRail:** Only checks `nextAirDate` field (direct property access)
- **Result:** If show has `next_episode_to_air` but not `nextAirDate`, HomeUpNextRail misses it, but useReturningShows would find it

---

## PART E – CONCRETE SCENARIOS

### Scenario A: Legit Returning Show

**Input:**
- TMDB: `status = "Returning Series"`, `next_episode_to_air.air_date = "2025-01-20"` (5 days from now)
- Library: Show is in "watching" list with `showStatus = "Returning Series"`, `nextAirDate = "2025-01-20"`

**Step-by-Step:**

1. **`useReturningShows` processing:**
   - Filter: `mediaType === 'tv'` ✅, `isReturning()` checks `showStatus === 'Returning Series'` ✅
   - **Result:** Included in `onlyReturning` array

2. **Date extraction:**
   - `getNextAirDate(show)` → Checks `show.nextAirDate` → Finds `"2025-01-20"` → Parses to `Date` object
   - `getDisplayAirDate(show)` → Formats to `"Jan 20, 2025"`

3. **Sorting:**
   - Has date → Sorted by `date.getTime()` → Appears in chronological position

4. **UI Display:**
   - `useReturningShows`: Shows with `displayAirDate: "Jan 20, 2025"`
   - HomeUpNextRail: Included in `showsWithDates`, sorted by string comparison
   - UpNextCard: Shows `"Up Next: Jan 20"` (no year in this component)

**Final Result:** ✅ Appears in both returning rails, sorted correctly, labeled with date

### Scenario B: Stale / Past Date Still Shown

**Input:**
- TMDB: `next_episode_to_air.air_date = "2025-01-05"` (10 days ago, but data hasn't updated)
- Library: Show has `nextAirDate = "2025-01-05"`, `showStatus = "Returning Series"`

**Step-by-Step:**

1. **`useReturningShows` processing:**
   - Filter: ✅ Passes (status is "Returning Series")
   - Date: `getNextAirDate()` returns `Date` object for Jan 5 (past date, but no validation)
   - **Result:** ✅ **INCLUDED** - No past-date filter

2. **Sorting:**
   - Sorted by date → Past dates appear first (if they're the earliest in the list)
   - **Issue:** Past date could be sorted before future dates if user has multiple shows

3. **UI Display:**
   - `getDisplayAirDate()` → `"Jan 5, 2025"` (no indication it's past)
   - UpNextCard → `"Up Next: Jan 5"` (looks like future date)

**Final Result:** ❌ **SHOWS STALE DATE** - User sees "Up Next: Jan 5" with no indication the episode already aired 10 days ago

**File References:**
- No past-date validation in: `metadata.ts:16-22`, `useReturningShows.ts:44-51`, `HomeUpNextRail.tsx:21-23`

### Scenario C: TBA / No Clear Date

**Input:**
- TMDB: `status = "Returning Series"`, `next_episode_to_air = null` (no upcoming episode)
- Library: Show has `showStatus = "Returning Series"`, `nextAirDate = null`

**Step-by-Step:**

1. **`useReturningShows` processing:**
   - Filter: ✅ Passes (status is "Returning Series")
   - Date: `getNextAirDate()` → `null` (no date field)
   - `getDisplayAirDate()` → `'TBA'`
   - **Result:** ✅ **INCLUDED** with `displayAirDate: 'TBA'`

2. **Sorting:**
   - No date → Falls to alphabetical sort
   - Appears after all dated shows

3. **UI Display:**
   - `useReturningShows`: Shows with `displayAirDate: 'TBA'`
   - HomeUpNextRail: Included in `showsWithoutDates` array
   - UpNextCard: `getStatusMessage()` → Checks `nextAirDate` (null) → Checks `showStatus` → Returns `"Returning Soon"` (line 86)

**Final Result:** ✅ Appears in rails, labeled as "Returning Soon" (not "TBA" in UpNextCard)

**File References:**
- `apps/web/src/lib/constants/metadata.ts:43-51` (TBA handling)
- `apps/web/src/components/cards/UpNextCard.tsx:82-96` (status-based fallback)

---

## PART F – SYNTHESIZED FINDINGS & FIX TARGETS

### A) Data Source & Mapping

#### Where "next air date" truly comes from:

1. **Primary Source:** TMDB API `next_episode_to_air.air_date` field
2. **Fetch Point:** `fetchNextAirDate()` in `apps/web/src/tmdb/tv.ts:1-16`
3. **Storage:** Stored in `LibraryEntry.nextAirDate` (string | null)
4. **Extraction:** `getNextAirDate()` in `apps/web/src/lib/constants/metadata.ts:16-22`

#### Conflicting/Duplicate Logic:

1. **`mapTMDBToMediaItem()` does NOT set `nextAirDate`:**
   - **File:** `apps/web/src/search/api.ts:175-223`
   - **Issue:** Search results never have `nextAirDate` until explicitly added to watching list
   - **Impact:** Search UI cannot show return dates

2. **Two formatting functions:**
   - `getDisplayAirDate()` → "Jan 15, 2025" (with year)
   - `UpNextCard.formatAirDate()` → "Jan 15" (no year)
   - **Impact:** Inconsistent date presentation

3. **Dual field checking:**
   - `getNextAirDate()` checks both `nextAirDate` and `next_episode_to_air.air_date`
   - `HomeUpNextRail` only checks `nextAirDate` directly
   - **Impact:** Potential missed dates if nested field exists but top-level doesn't

#### Single Source of Truth Status:

- ❌ **NO single source of truth**
- Date extraction: `getNextAirDate()` is canonical but not always used
- Date formatting: Two different functions
- Date validation: None exists

### B) Returning / Up-Next Logic

#### Real Inclusion/Exclusion Rules:

**`useReturningShows`:**
- ✅ Include: `mediaType === 'tv'` AND `status === 'Returning Series'`
- ❌ Exclude: Everything else
- ❌ **NO date-based filtering**

**HomeUpNextRail:**
- ✅ Include: All TV shows in "watching" list
- ❌ Exclude: Only completed shows (Ended/Canceled) from undated list
- ❌ **NO date-based filtering**
- ❌ **NO status-based filtering for dated shows**

#### Time Windows and Thresholds:

- **`RETURNING_NEAR_WINDOW_DAYS = 14`:** Defined but **UNUSED**
- **No maximum window:** Shows years in future included
- **No minimum validation:** Past dates included
- **No refresh window:** Dates never automatically updated

#### Stale/Weird Data Handling:

- **Past dates:** ✅ Included (no filtering)
- **Missing dates:** ✅ Included (shows as TBA/status-based label)
- **Far future dates:** ✅ Included (no limit)
- **Ended shows with dates:** Mixed behavior (excluded from useReturningShows, included in HomeUpNextRail if dated)
- **Stale cached dates:** ✅ Preserved indefinitely (no refresh mechanism)

### C) UI Behavior

#### How Dates Are Actually Presented:

1. **Absolute dates only:** "Jan 15", "Jan 20, 2025" (format varies by component)
2. **No relative dates:** No "Tomorrow", "In 3 days", "Today"
3. **No past indicators:** Past dates look identical to future dates
4. **TBA handling:** Shows status-based labels ("Returning Soon") instead of "TBA" in UpNextCard

#### Gaps Between Logic and User Experience:

1. **Stale dates shown:** User sees "Up Next: Jan 5" but episode already aired
2. **No refresh:** Dates never update unless user re-adds show
3. **Inconsistent formatting:** Some places show year, some don't
4. **No urgency indication:** "Jan 20" and "Jan 20, 2026" look the same (no "in 5 days" context)

### D) Known / Likely Failure Modes

#### Specific Conditions That Cause Issues:

1. **Stale Return Dates:**
   - **Condition:** `nextAirDate` set in past, never refreshed
   - **Result:** Shows "Up Next: [past date]" with no indication it's stale
   - **Files affected:** All UI components, no validation anywhere

2. **Hide Legit Returning Shows:**
   - **Condition:** Show has `status !== 'Returning Series'` but is actually returning
   - **Result:** Excluded from `useReturningShows` (status-based filter too strict)
   - **Files affected:** `useReturningShows.ts:37` (isReturning filter)

3. **Show Ended Shows:**
   - **Condition:** Show marked "Ended" but has `nextAirDate` set
   - **Result:** Appears in HomeUpNextRail (no status check for dated shows)
   - **Files affected:** `HomeUpNextRail.tsx:21-23` (no status filter)

4. **Mislabel Status:**
   - **Condition:** Show has no date but status is "Returning Series"
   - **Result:** Shows "Returning Soon" (correct) but could be misleading if show is actually on hiatus
   - **Files affected:** `UpNextCard.tsx:82-96` (status-based fallback)

5. **Search Results Missing Dates:**
   - **Condition:** User searches for show, sees result
   - **Result:** No `nextAirDate` shown (not fetched until added to watching)
   - **Files affected:** `search/api.ts:175-223` (mapTMDBToMediaItem doesn't fetch dates)

### E) Surgical Fix Targets (NO CHANGES YET)

#### Smallest Set of Functions/Files to Adjust:

**Priority 1: Centralize `nextAirDate` Logic**

1. **File:** `apps/web/src/lib/constants/metadata.ts`
   - **Function:** `getNextAirDate()`
   - **Change:** Add past-date validation (return null if date is in past)
   - **Alternative:** Add parameter to control validation behavior

2. **File:** `apps/web/src/lib/constants/metadata.ts`
   - **Function:** `getDisplayAirDate()`
   - **Change:** Make this the single formatting function, remove duplicate in UpNextCard
   - **Enhancement:** Add relative date formatting ("Tomorrow", "In 3 days")

**Priority 2: Enforce Clear Window for "Returning Soon"**

3. **File:** `apps/web/src/state/selectors/useReturningShows.ts`
   - **Function:** `useReturningShows()`
   - **Change:** Add date filtering using `isWithinWindow()` or similar
   - **Logic:** Filter out past dates, optionally filter far-future dates
   - **Enhancement:** Use `RETURNING_NEAR_WINDOW_DAYS` constant (currently unused)

4. **File:** `apps/web/src/components/rails/HomeUpNextRail.tsx`
   - **Function:** `items` useMemo
   - **Change:** Add past-date filtering for `showsWithDates`
   - **Change:** Add status validation for dated shows (exclude Ended/Canceled)

**Priority 3: Handle TBA and Stale Data Gracefully**

5. **File:** `apps/web/src/components/cards/UpNextCard.tsx`
   - **Function:** `getStatusMessage()`
   - **Change:** Detect past dates and show appropriate message ("Aired [date]" or hide)
   - **Enhancement:** Use centralized `getDisplayAirDate()` instead of custom formatter

6. **File:** `apps/web/src/lib/storage.ts`
   - **Function:** `Library.upsert()`
   - **Change:** Add optional refresh mechanism for `nextAirDate` on existing shows
   - **Alternative:** Create separate refresh function called periodically or on app open

**Priority 4: Fix Data Mapping**

7. **File:** `apps/web/src/search/api.ts`
   - **Function:** `mapTMDBToMediaItem()`
   - **Change:** Optionally fetch `next_episode_to_air` if available in search result
   - **Note:** May require async changes or separate enhancement

**Priority 5: Consistency Fixes**

8. **File:** `apps/web/src/components/rails/HomeUpNextRail.tsx`
   - **Change:** Use `getNextAirDate()` for date comparison instead of string comparison
   - **Change:** Use same status filtering as `useReturningShows` for consistency

---

## SUMMARY

### Current State:
- ✅ Date extraction works (when data exists)
- ✅ Status-based filtering works (for useReturningShows)
- ❌ No past-date validation
- ❌ No automatic date refresh
- ❌ Inconsistent date formatting
- ❌ Inconsistent status filtering between components
- ❌ Stale dates shown to users

### Recommended Fix Strategy:
1. **Add past-date validation** to `getNextAirDate()` or filtering logic
2. **Unify date formatting** - use single function everywhere
3. **Add date window filtering** - use existing `RETURNING_NEAR_WINDOW_DAYS` constant
4. **Add refresh mechanism** - periodic or on-app-open update of `nextAirDate`
5. **Unify status filtering** - consistent rules across all components
6. **Enhance UI** - show relative dates and past-date indicators

### Files Requiring Changes (in order of impact):
1. `apps/web/src/lib/constants/metadata.ts` - Core date logic
2. `apps/web/src/state/selectors/useReturningShows.ts` - Returning shows filter
3. `apps/web/src/components/rails/HomeUpNextRail.tsx` - Up-next rail filter
4. `apps/web/src/components/cards/UpNextCard.tsx` - Date display
5. `apps/web/src/lib/storage.ts` - Optional refresh mechanism

---

**Report Complete** - Ready for implementation phase











