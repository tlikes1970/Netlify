# 🔍 List Membership Indicators - Forensic Report

**Date:** Generated from codebase analysis  
**Scope:** READ-ONLY diagnostic of list membership determination and display  
**Status:** Complete - No code modifications made

---

## PART A – SOURCE OF TRUTH FOR MEMBERSHIP

### 1. Single Source of Truth

#### Canonical Data Structure:

**A) Library Entries:**

- **File:** `apps/web/src/lib/storage.ts`
- **Data Structure:** `State = Record<string, LibraryEntry>`
- **Key Format:** `${mediaType}:${id}` (e.g., `"tv:123"`)
- **Storage:** `localStorage.getItem("flicklet.library.v2")`
- **Entry Structure:**
  ```typescript
  interface LibraryEntry extends MediaItem {
    list: ListName; // "watching" | "wishlist" | "watched" | "not" | "custom:{id}"
    addedAt: number;
    ratingUpdatedAt?: number;
  }
  ```
- **Lines:** 80-89 (State definition), 39-43 (LibraryEntry interface)

**B) Custom List Membership:**

- **File:** `apps/web/src/lib/customLists.ts`
- **Data Structure:** `UserLists` with `customLists: CustomList[]`
- **Storage:** `localStorage.getItem("flicklet.customLists.v2")`
- **Membership:** Stored in Library entries as `list: "custom:{listId}"`
- **Lines:** 8-12 (DEFAULT_USER_LISTS), 75-85 (loadUserLists)

#### Functions for Adding/Removing:

**A) Adding to List:**

- **Function:** `Library.upsert(item: MediaItem, list: ListName)`
- **File:** `apps/web/src/lib/storage.ts:258-345`
- **Inputs:** `item` (MediaItem), `list` (ListName)
- **Outputs:** Updates state, saves to localStorage, emits change
- **Usage:** Used consistently across app (SearchResults, ListSelectorModal, etc.)

**B) Moving Between Lists:**

- **Function:** `Library.move(id, mediaType, list: ListName)`
- **File:** `apps/web/src/lib/storage.ts:346-382`
- **Inputs:** `id`, `mediaType`, `list`
- **Outputs:** Updates entry's `list` field, preserves all other data
- **Usage:** Used in TabCard actions, HomeYourShowsRail

**C) Removing from Library:**

- **Function:** `Library.remove(id, mediaType)`
- **File:** `apps/web/src/lib/storage.ts:466-489`
- **Inputs:** `id`, `mediaType`
- **Outputs:** Deletes entry from state
- **Usage:** Used in card actions, rails

#### Functions for Reading Membership:

**A) Get Current List:**

- **Function:** `Library.getCurrentList(id, mediaType): ListName | null`
- **File:** `apps/web/src/lib/storage.ts:529-532`
- **Inputs:** `id`, `mediaType`
- **Outputs:** `ListName | null` (returns which list item is in, or null if not in library)
- **Usage:**
  - SearchResults.tsx:271 (checks if item is in library)
  - ListSelectorModal.tsx:31 (checks existing list before adding)
  - App.tsx:649-650 (checks list for notifications)

**B) Check if in Library:**

- **Function:** `Library.has(id, mediaType): boolean`
- **File:** `apps/web/src/lib/storage.ts:526-528`
- **Inputs:** `id`, `mediaType`
- **Outputs:** `boolean` (true if item exists in any list)
- **Usage:**
  - DiscoveryPage.tsx:39, 61 (filters out items already in library)

**C) Get Entry:**

- **Function:** `Library.getEntry(id, mediaType): LibraryEntry | null`
- **File:** `apps/web/src/lib/storage.ts:533-535`
- **Inputs:** `id`, `mediaType`
- **Outputs:** Full `LibraryEntry` or null
- **Usage:** TabCard.tsx:73 (gets latest rating)

**D) Get List Display Name:**

- **Function:** `getListDisplayName(listName: ListName): string`
- **File:** `apps/web/src/lib/storage.ts:189-207`
- **Inputs:** `listName` (ListName)
- **Outputs:** Human-readable string
- **Mapping:**
  - `"watching"` → `"Currently Watching"`
  - `"wishlist"` → `"Want to Watch"`
  - `"watched"` → `"Watched"`
  - `"not"` → `"Not Interested"`
  - `"custom:{id}"` → Custom list name (via customListManager)
- **Usage:** ListSelectorModal.tsx:33, storage.ts:221-222 (confirmation dialogs)

**E) Custom List Name Helper:**

- **Function:** `customListManager.getListName(listName: ListName): string`
- **File:** `apps/web/src/lib/customLists.ts:285-300`
- **Inputs:** `listName` (ListName)
- **Outputs:** Human-readable string (same as getListDisplayName but in customLists module)
- **Usage:** Internal to customLists module

### 2. Consistency Analysis

#### ✅ Consistent Usage:

- `Library.getCurrentList()` is used consistently across:
  - SearchResults (line 271)
  - ListSelectorModal (line 31)
  - App.tsx (lines 649-650)
- `Library.upsert()` is the standard way to add items
- `Library.move()` is used consistently for moving items

#### ⚠️ Duplicated Logic:

- **List Name Display:**
  - `getListDisplayName()` in `storage.ts:189-207`
  - `customListManager.getListName()` in `customLists.ts:285-300`
  - **Issue:** Two functions doing the same thing (both handle custom lists)
  - **Impact:** Low - both work, but could be unified

#### ❌ Missing Centralization:

- **No unified "get membership info" function:**
  - Components must call `Library.getCurrentList()` directly
  - No helper that returns both list name and display name together
  - No helper that checks multiple lists at once

---

## PART B – WHERE MEMBERSHIP IS DISPLAYED

### 3. Search Results

**File:** `apps/web/src/search/SearchResults.tsx`

#### How Membership is Determined:

- **Line 271:** `const currentList = Library.getCurrentList(item.id, item.mediaType);`
- **Line 272:** `const isInList = !!currentList;`
- **Logic:** Uses canonical `Library.getCurrentList()` function

#### How Status is Decided:

- **Line 271-272:** Checks if item is in any list
- **Line 274:** Uses `isInList` to determine if search tip should show
- **No visual indicator:** The `currentList` value is computed but **NOT displayed anywhere**

#### Where Pill/Badge is Rendered:

- **❌ NOT RENDERED** - There is no visual indicator of list membership in search results
- The `currentList` variable is computed but never used for display
- Only used to:
  - Hide search tip if item is already in list (line 274)
  - Determine button text/behavior (not shown in visible code)

#### Inline Logic:

- **✅ Uses Library helper:** No duplication, uses `Library.getCurrentList()`
- **❌ Missing display:** Computes membership but doesn't show it

#### Conditionals:

- **No special conditionals** - Simple boolean check: `!!currentList`

**Critical Finding:** Search results compute membership but **never display it visually**.

---

### 4. Rails (HomeYourShowsRail, HomeUpNextRail)

#### HomeYourShowsRail:

**File:** `apps/web/src/components/rails/HomeYourShowsRail.tsx`

**How Items are Fetched:**

- **Line 8:** `const items = useLibrary('watching');`
- **Source:** `useLibrary('watching')` hook from `storage.ts`
- **Returns:** All items in "watching" list

**Where Membership is Passed:**

- **Lines 19-30:** Items passed to `CardV2` component
- **Line 21:** `context="tab-watching"` (hardcoded, not dynamic)
- **❌ No membership prop:** `CardV2` receives `item` but not explicit `currentList` prop

**Does CardV2 Decide Status:**

- **CardV2.tsx:36:** `const showMyListBtn = context === 'tab-foryou' || context === 'search' || context === 'home' || context === 'tab-watching' || context === 'holiday';`
- **CardV2.tsx:80-82:** Shows `MyListToggle` component
- **MyListToggle.tsx:26-28:** Always shows `"My List +"` text (no current list indication)
- **❌ CardV2 does NOT check membership:** It just shows the toggle button
- **❌ No visual indicator:** No pill/badge showing "Watching" or current list

**Critical Finding:** Rails show items from specific lists, but cards don't display which list they're in.

#### HomeUpNextRail:

**File:** `apps/web/src/components/rails/HomeUpNextRail.tsx`

**How Items are Fetched:**

- **Line 9:** `const watching = useLibrary('watching');`
- **Line 18:** Filters to TV shows only
- **Source:** All items from "watching" list

**Where Membership is Passed:**

- **Lines 58-61:** Items passed to `UpNextCard` component
- **❌ No membership prop:** `UpNextCard` receives `item` but not explicit list info

**Does UpNextCard Show Membership:**

- **UpNextCard.tsx:** No membership indicator visible
- **Only shows:** Next air date, episode info, status
- **❌ No list membership badge/pill**

**Critical Finding:** Up Next rail shows items from "watching" list, but cards don't indicate they're in "Watching".

---

### 5. Tabbed Pages (Watching/Want/Watched)

#### ListPage:

**File:** `apps/web/src/pages/ListPage.tsx`

**How Each Tab Decides Which List:**

- **Line 40:** `mode?: "watching" | "want" | "watched" | "returning" | "discovery"`
- **Line 50:** `items: LibraryEntry[]` (pre-filtered by parent)
- **Logic:** Items are already filtered to the correct list before being passed to ListPage
- **No filtering in ListPage:** Assumes items are already in the correct list

**How Membership is Visually Indicated:**

- **❌ NOT VISUALLY INDICATED** - No pill/badge showing list name
- **Implicit assumption:** Since items are pre-filtered, they're assumed to be in that list
- **TabCard.tsx:661:** Shows `MyListToggle` but doesn't show current list

#### TabCard:

**File:** `apps/web/src/components/cards/TabCard.tsx`

**How Membership is Indicated:**

- **Line 661:** `<MyListToggle item={item} />`
- **MyListToggle.tsx:26-28:** Always shows `"My List +"` (no current list)
- **❌ No visual indicator:** No badge/pill showing "Watching", "Want to Watch", etc.
- **Implicit:** Since item is on "Watching" tab, user assumes it's in "Watching" list

**Differences:**

- **Label text:** None (no membership labels)
- **Icon styles:** None (no membership icons)
- **Presence/absence of pill:** **ABSENT** - No membership pill anywhere

**Critical Finding:** Tab pages implicitly show membership (items are on the correct tab), but cards don't display which list they're in.

---

## PART C – VISUAL RULES & INCONSISTENCIES

### 6. Card Component Visual Elements

#### CardV2:

**File:** `apps/web/src/components/cards/CardV2.tsx`

**Visual Elements for Membership:**

- **MyListToggle button (lines 80-82):**
  - Text: Always `"My List +"` (MyListToggle.tsx:27)
  - Position: Top-right corner of poster
  - Style: Rounded button with backdrop blur
  - **❌ Does NOT indicate current list** - Always shows "+" regardless of membership

**How Component Decides:**

- **Line 36:** `showMyListBtn` based on context (not membership)
- **No membership check:** CardV2 does NOT check `Library.getCurrentList()`
- **No conditional text:** Button always says "My List +"

**When to Show:**

- Based on `context` prop, not membership status
- Shows for: `'tab-foryou'`, `'search'`, `'home'`, `'tab-watching'`, `'holiday'`

**Multiple Lists:**

- **Not handled:** CardV2 doesn't check for multiple lists
- **No "In X lists" badge:** No indication if item is in multiple lists

**No Lists:**

- **Same display:** Shows "My List +" even if item is not in any list

#### TabCard:

**File:** `apps/web/src/components/cards/TabCard.tsx`

**Visual Elements for Membership:**

- **MyListToggle button (line 661):**
  - Same as CardV2 - always shows "My List +"
  - **❌ Does NOT indicate current list**

**How Component Decides:**

- **No membership check:** TabCard does NOT check `Library.getCurrentList()`
- **Implicit assumption:** Item is in the list corresponding to the tab

**Multiple Lists:**

- **Not handled:** No indication of multiple list membership

**No Lists:**

- **Same display:** Shows "My List +" regardless

#### MyListToggle:

**File:** `apps/web/src/components/MyListToggle.tsx`

**Visual Elements:**

- **Button text (line 27):** Always `"My List +"` (hardcoded)
- **No current list indication:** Button doesn't show which list item is in
- **No conditional display:** Always shows same text

**Critical Finding:** `MyListToggle` component does NOT check or display current list membership.

---

### 7. Differences Between Surfaces

#### Text Differences:

| Surface                   | Membership Indicator | Text Shown           |
| ------------------------- | -------------------- | -------------------- |
| Search Results            | ❌ None              | N/A                  |
| Rails (HomeYourShowsRail) | ❌ None              | N/A                  |
| Rails (HomeUpNextRail)    | ❌ None              | N/A                  |
| Tab Pages (Watching)      | ❌ None              | N/A                  |
| Tab Pages (Want)          | ❌ None              | N/A                  |
| Tab Pages (Watched)       | ❌ None              | N/A                  |
| CardV2                    | ⚠️ MyListToggle      | "My List +" (always) |
| TabCard                   | ⚠️ MyListToggle      | "My List +" (always) |

**Finding:** **NO surface shows actual list membership text** ("Watching", "Want to Watch", etc.)

#### Missing Indicators:

**All surfaces are missing:**

- ❌ Pill/badge showing current list name
- ❌ Text indicating "In Watching" or "In Want to Watch"
- ❌ Visual distinction between "in list" vs "not in list"
- ❌ Multiple list indicators ("In 2 lists")

#### Conflicting Logic:

**No conflicts found** - because **no logic exists** to display membership consistently.

**The only "logic" is:**

- SearchResults computes `currentList` but doesn't use it for display
- All cards show "My List +" regardless of membership
- Tab pages assume items are in the correct list (implicit)

---

## PART D – EDGE CASES & FAILURE MODES

### 8. Edge Cases

#### Case 1: Title in List but No Visual Indicator

**Scenario:**

- User adds "The Office" to "Watching" list
- User searches for "The Office"
- Search result shows "The Office" with "My List +" button
- **Problem:** No indication that it's already in "Watching" list
- User might try to add it again, thinking it's not in any list

**Files Involved:**

- `SearchResults.tsx:271` - Computes `currentList` but doesn't display it
- `CardV2.tsx:80-82` - Shows `MyListToggle` with no membership info
- `MyListToggle.tsx:27` - Always shows "My List +" regardless of membership

**Why Mismatch Happens:**

- `MyListToggle` component doesn't check `Library.getCurrentList()`
- No prop passed to indicate current list
- Button text is hardcoded to "My List +"

**Impact:** User confusion - can't tell if item is already in a list

---

#### Case 2: Title in Multiple Lists (Impossible but Would Fail)

**Scenario:**

- **Note:** Current architecture prevents this (item can only be in one list)
- But if it were possible:
- Item is in both "Watching" and custom list "Favorites"
- Card shows "My List +" button
- **Problem:** No indication of multiple list membership
- User can't see it's in multiple lists

**Files Involved:**

- `storage.ts:258-345` - `upsert()` only allows one list per item
- Architecture prevents multiple lists, but if it didn't, UI wouldn't show it

**Why Mismatch Would Happen:**

- No logic to check multiple lists
- No UI to display multiple list membership
- Single `list` field in `LibraryEntry`

**Impact:** N/A (prevented by architecture, but UI wouldn't handle it)

---

#### Case 3: Title on Wrong Tab (Data Corruption Edge Case)

**Scenario:**

- Data corruption: Item has `list: "wishlist"` but appears on "Watching" tab
- TabCard shows "My List +" button
- **Problem:** No visual indicator showing it's actually in "Want to Watch" list
- User sees it on "Watching" tab but it's actually in "Want to Watch"

**Files Involved:**

- `ListPage.tsx:50` - Receives pre-filtered items (assumes correct list)
- `TabCard.tsx:661` - Shows `MyListToggle` with no list check
- No validation that item's `list` field matches the tab

**Why Mismatch Happens:**

- TabCard doesn't verify `item.list === tabType`
- No visual indicator of actual list membership
- Implicit assumption that items on tab are in correct list

**Impact:** User confusion if data gets out of sync

---

#### Case 4: Title in Custom List but Shows Generic "My List +"

**Scenario:**

- User adds "Breaking Bad" to custom list "Favorites"
- Item appears in search results
- Card shows "My List +" button
- **Problem:** No indication it's in "Favorites" list (not generic "My List")
- User can't tell which custom list it's in

**Files Involved:**

- `MyListToggle.tsx:27` - Hardcoded "My List +" text
- `ListSelectorModal.tsx:31` - Checks `currentList` but doesn't pass to MyListToggle
- No prop to pass list name to MyListToggle

**Why Mismatch Happens:**

- `MyListToggle` doesn't accept `currentList` prop
- No logic to fetch and display custom list name
- Generic "My List +" text doesn't indicate specific list

**Impact:** User can't identify which custom list item is in

---

## PART E – SYNTHESIZED FINDINGS

### A) Source of Truth

#### Where Membership is Really Defined:

**✅ Centralized Storage:**

- `Library` in `storage.ts` is the single source of truth
- `LibraryEntry.list` field stores which list item belongs to
- `Library.getCurrentList()` is the canonical way to read membership

**✅ Consistent Functions:**

- `Library.upsert()` - standard way to add items
- `Library.move()` - standard way to move items
- `Library.getCurrentList()` - standard way to check membership

**⚠️ Display Logic Not Centralized:**

- No unified component for displaying list membership
- Each component (CardV2, TabCard) handles display independently
- `MyListToggle` doesn't check or display current list

**❌ Not Centralized Enough:**

- No helper function that returns "membership info object" (list name + display name)
- Components must call `Library.getCurrentList()` + `getListDisplayName()` separately
- No unified "membership badge" component

---

### B) UI Surfacing

#### Which Areas are Consistent:

**✅ Consistent (All Missing Indicators):**

- Search results: No membership indicator
- Rails: No membership indicator
- Tab pages: No membership indicator
- Cards: Show "My List +" but no list name

**Finding:** All areas are consistently **missing** proper membership indicators.

#### Which Areas are Out of Sync:

**❌ All Areas Out of Sync with Backend:**

- Backend knows which list each item is in (`Library.getCurrentList()`)
- UI never displays this information
- "My List +" button doesn't reflect actual membership status

**Specific Issues:**

1. **Search Results:** Computes `currentList` but doesn't display it
2. **Rails:** Show items from specific lists but don't indicate which list
3. **Tab Pages:** Implicitly show membership (items on correct tab) but no explicit indicator
4. **Cards:** Show generic "My List +" regardless of actual membership

---

### C) Fix Targets

#### 1. Create Unified Membership Display Component

**Target:** Create `ListMembershipBadge` component

- **File:** `apps/web/src/components/ListMembershipBadge.tsx` (new)
- **Purpose:** Single component to display list membership
- **Props:** `item: MediaItem`
- **Logic:**
  - Calls `Library.getCurrentList(item.id, item.mediaType)`
  - Calls `getListDisplayName(currentList)` if in list
  - Displays pill/badge with list name
  - Shows "Not in any list" or nothing if not in library
- **Usage:** Replace `MyListToggle` or use alongside it

**Impact:** Centralizes membership display logic

---

#### 2. Update MyListToggle to Show Current List

**Target:** Modify `MyListToggle` to display current list

- **File:** `apps/web/src/components/MyListToggle.tsx`
- **Changes:**
  - Add logic to check `Library.getCurrentList(item.id, item.mediaType)`
  - If in list: Show list name (e.g., "Watching", "Want to Watch", "Favorites")
  - If not in list: Show "My List +"
  - Update button text dynamically
- **Lines to modify:** 26-28 (getButtonText function)

**Impact:** Makes button reflect actual membership status

---

#### 3. Add Membership Indicator to Search Results

**Target:** Display membership in search result cards

- **File:** `apps/web/src/search/SearchResults.tsx`
- **Changes:**
  - Line 271: `currentList` is already computed
  - Add `ListMembershipBadge` component to SearchResultCard
  - Display badge showing which list item is in (or "Not in any list")
- **Lines to modify:** Around line 271-274, add badge rendering

**Impact:** Users can see if search results are already in their library

---

#### 4. Add Membership Indicator to CardV2

**Target:** Show membership badge on CardV2

- **File:** `apps/web/src/components/cards/CardV2.tsx`
- **Changes:**
  - Import `ListMembershipBadge` component
  - Add badge rendering (maybe below poster or in meta area)
  - Show list name for items in library
- **Lines to modify:** Around line 80-82 (near MyListToggle)

**Impact:** All rails using CardV2 will show membership

---

#### 5. Add Membership Indicator to TabCard

**Target:** Show membership badge on TabCard (for validation)

- **File:** `apps/web/src/components/cards/TabCard.tsx`
- **Changes:**
  - Import `ListMembershipBadge` component
  - Add badge rendering in header area
  - Validate that `item.list` matches `tabType` (for data integrity)
- **Lines to modify:** Around line 667 (in header section)

**Impact:** Tab pages show explicit membership (validates data integrity)

---

#### 6. Create Helper Function for Membership Info

**Target:** Centralize membership info retrieval

- **File:** `apps/web/src/lib/storage.ts` or new `apps/web/src/lib/membership.ts`
- **Function:** `getMembershipInfo(item: MediaItem): { list: ListName | null, displayName: string | null }`
- **Logic:**
  - Calls `Library.getCurrentList()`
  - Calls `getListDisplayName()` if in list
  - Returns both values together
- **Usage:** All components can use this instead of calling both functions

**Impact:** Reduces code duplication, centralizes logic

---

## SUMMARY

### Current State:

- ✅ **Backend is centralized:** `Library` is single source of truth
- ✅ **Functions are consistent:** `getCurrentList()`, `upsert()`, `move()` used everywhere
- ❌ **UI never displays membership:** No visual indicators anywhere
- ❌ **MyListToggle is misleading:** Shows "My List +" even when item is already in a list
- ❌ **No validation:** Cards don't verify membership matches context

### Key Issues:

1. **No visual indicators** - Users can't see which list items are in
2. **Misleading button text** - "My List +" doesn't reflect actual membership
3. **No centralized display component** - Each area would need custom logic
4. **Search results compute but don't display** - Wasted computation

### Recommended Fix Strategy:

1. **Create `ListMembershipBadge` component** - Single source for membership display
2. **Update `MyListToggle`** - Show actual list name when item is in a list
3. **Add badges to all surfaces** - Search, Rails, Tabs
4. **Create helper function** - Centralize membership info retrieval

### Files Requiring Changes (in order of impact):

1. `apps/web/src/components/ListMembershipBadge.tsx` - **NEW** - Core display component
2. `apps/web/src/components/MyListToggle.tsx` - Update to show current list
3. `apps/web/src/search/SearchResults.tsx` - Add badge display
4. `apps/web/src/components/cards/CardV2.tsx` - Add badge display
5. `apps/web/src/components/cards/TabCard.tsx` - Add badge display
6. `apps/web/src/lib/storage.ts` or new `membership.ts` - Helper function (optional)

---

**Report Complete** - Ready for implementation phase
