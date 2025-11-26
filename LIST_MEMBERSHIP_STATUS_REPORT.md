# List Membership & Visual Indicators - Status Report

**Date:** Generated from codebase analysis  
**Mode:** READ-ONLY / DIAGNOSTIC ONLY  
**Purpose:** Clear, accurate status report of how "in list" indicators and My List behavior currently work across ALL surfaces (desktop + mobile)

---

## Section A: Data Model & Constraints

### 1. Single vs Multiple Lists

**Answer: The model is STRICTLY "one list per item" (single membership only).**

**Evidence:**
- `LibraryEntry` interface (storage.ts:39-43) has a single `list: ListName` property
- `Library.upsert()` (storage.ts:258-344) sets a single `list` value per item
- `Library.move()` (storage.ts:346-382) updates the single `list` property
- `Library.getCurrentList()` (storage.ts:529-532) returns `ListName | null` (single value)

**Where multiple membership is prevented:**
- `addToListWithConfirmation()` (storage.ts:210-252): If item is already in a list, shows confirmation dialog asking to "move" it (not "also add")
- `ListSelectorModal` (ListSelectorModal.tsx:27-41): Checks if item exists in any list, shows confirmation dialog with text "Do you want to move it to the selected list?" (line 258)
- When adding to a custom list via `ListSelectorModal`, the `addToList()` function (line 43-54) calls `Library.upsert(item, listName)` which REPLACES the existing list value

**Conclusion:** An item can be in exactly ONE list at a time. Adding to a new list MOVES it from the old list (with user confirmation if already in a list).

### 2. Source of Truth

**Canonical source of membership:**
- `LibraryEntry.list` (storage.ts:40) - the stored value
- `Library.getCurrentList(id, mediaType)` (storage.ts:529-532) - the query method that reads from `LibraryEntry.list`

**No parallel tracking:**
- `customLists.ts` only tracks list metadata (name, description, color, itemCount) - NOT membership
- `customListManager.syncCountsFromLibrary()` (customLists.ts:239-282) reads from Library storage to count items, confirming Library is the single source of truth
- No other structures track membership in parallel

---

## Section B: Membership Helper & Badge

### 3. `getMembershipInfo` (membership.ts)

**What it returns:**

- **Not in any list:** `{ list: null, displayName: null }`
- **In a status list (watching/wishlist/watched/not):** 
  - `list`: the ListName (e.g., "watching", "wishlist", "watched", "not")
  - `displayName`: human-readable name from `getListDisplayName()` (e.g., "Currently Watching", "Want to Watch", "Watched", "Not Interested")
- **In a custom list (`custom:<id>`):**
  - `list`: the ListName (e.g., "custom:list_123")
  - `displayName`: the custom list's name from `customListManager.getListById()` (e.g., "Horror Movies")

**Returns only ONE list:**
- Always returns a single `list` value (or null)
- Uses `Library.getCurrentList()` which returns a single value
- Never returns multiple lists

### 4. `ListMembershipBadge`

**Render conditions:**
- Returns `null` if `list === null` or `displayName === null` (ListMembershipBadge.tsx:31-33)
- Renders badge if item is in any list

**Exact label text:**
- Shows: `"In list: ${displayName}"` (line 35)
- Examples:
  - Item in `watching` → "In list: Currently Watching"
  - Item in `wishlist` → "In list: Want to Watch"
  - Item in `watched` → "In list: Watched"
  - Item in `not` → "In list: Not Interested"
  - Item in custom list "Horror" → "In list: Horror"

**Context awareness:**
- Badge is BLIND to where it's rendered
- No props for current tab/surface context
- Always shows the same text regardless of location

---

## Section C: MyListToggle Behavior

### 5. `MyListToggle`

**How it determines current membership:**
- Uses `getMembershipInfo(item)` (MyListToggle.tsx:44, 49)
- Subscribes to `Library.subscribe()` to update when library changes (line 56)
- Reactive state updates when membership changes

**Exact text rules:**

- **When NOT in any list:**
  - Button text: `"My List +"` (line 85)
  - Title/tooltip: `"Add to one of your lists"` (line 95)

- **When already in a list:**
  - **If `currentListContext` prop is provided** (e.g., on Watching tab):
    - Button text: `"My List +"` (line 80)
    - Title/tooltip: `"Click to change lists"` (line 100)
  - **If NO `currentListContext`** (e.g., on search/home):
    - Button text: `"In list: ${displayName}"` (line 89)
    - Title/tooltip: `"Currently in list: ${displayName}. Click to change lists."` (line 104)

**Distinguishes between list types:**
- Does NOT distinguish between "base status list" vs "custom list" in button text
- Uses `displayName` raw from `getMembershipInfo()`
- Both status lists and custom lists show the same format: "In list: {displayName}"

### 6. `ListSelectorModal`

**When adding to a custom list:**

- **If item is NOT already in any list:**
  - Proceeds directly with `addToList()` (line 40)
  - No confirmation needed

- **If item IS already in a list:**
  - Shows confirmation dialog (line 32-36, 236-278)
  - Dialog text: `"{item.title} is already in {existingListName}. Do you want to move it to the selected list?"` (line 255)
  - User must confirm to proceed

**Actual behavior:**
- **"Custom list REPLACES existing status list"** (not in addition to)
- When confirmed, calls `Library.upsert(item, listName)` which sets the new list value
- The old list value is overwritten (single list model)

---

## Section D: Surface-by-Surface Behavior (Desktop + Mobile)

### Surface-by-Surface Table

| Surface              | Platform | Card Component(s)       | Badge shown? (When?)                | Toggle text when in list          | Toggle text when not in list | Notes / Weirdness |
|----------------------|----------|--------------------------|-------------------------------------|-----------------------------------|------------------------------|-------------------|
| Search Results       | Desktop  | Custom card (SearchResults.tsx) | Yes - in meta area (line 620) | "In list: {displayName}" (via MyListToggle, line 902) | "My List +" (via MyListToggle, line 902) | Badge shows even if item is in list; toggle shows full "In list: X" text |
| Search Results       | Mobile   | Custom card (SearchResults.tsx) | Yes - in meta area (line 620) | Status pill OR "In list: {displayName}" in More menu (line 732-745, 874) | "Currently Watching" button OR "My List +" in More menu (line 693-720, 874) | Mobile shows status pill if in list, primary button if not; toggle in More menu |
| Home Rails (Your Shows) | Desktop  | CardV2 (HomeYourShowsRail.tsx:19) | No - context="tab-watching" hides badge (CardV2.tsx:44-54) | "My List +" (currentListContext="watching" via getListContextFromCardContext, CardV2.tsx:128) | "My List +" | Badge hidden because context is list-specific |
| Home Rails (Your Shows) | Mobile   | CardV2 (same) | No - context="tab-watching" hides badge | "My List +" (same) | "My List +" | Same as desktop |
| Home Rails (Up Next) | Desktop  | UpNextCard (HomeUpNextRail.tsx:88) | N/A - UpNextCard doesn't render badge | N/A - UpNextCard doesn't have toggle | N/A | UpNextCard is display-only, no actions |
| Home Rails (Up Next) | Mobile   | UpNextCard (same) | N/A | N/A | N/A | Same as desktop |
| Watching Tab         | Desktop  | TabCard (ListPage.tsx:1090) | No - TabCard doesn't render ListMembershipBadge | "My List +" (currentListContext="watching", TabCard.tsx:669) | "My List +" | TabCard never shows badge |
| Watching Tab         | Mobile   | TvCardMobile / MovieCardMobile (TabCard.tsx:506-564) | No - mobile cards don't render badge | "My List +" (currentListContext derived from tabKey, TvCardMobile.tsx:161, MovieCardMobile.tsx:136) | "My List +" | Mobile cards match desktop behavior |
| Want Tab             | Desktop  | TabCard (ListPage.tsx:1090) | No - TabCard doesn't render badge | "My List +" (currentListContext="wishlist", TabCard.tsx:670) | "My List +" | Same as Watching tab |
| Want Tab              | Mobile   | TvCardMobile / MovieCardMobile (TabCard.tsx:506-564) | No - mobile cards don't render badge | "My List +" (currentListContext="wishlist", TvCardMobile.tsx:107, MovieCardMobile.tsx:82) | "My List +" | Same as Watching tab |
| Watched Tab           | Desktop  | TabCard (ListPage.tsx:1090) | No - TabCard doesn't render badge | "My List +" (currentListContext="watched", TabCard.tsx:671) | "My List +" | Same as Watching tab |
| Watched Tab           | Mobile   | TvCardMobile / MovieCardMobile (TabCard.tsx:506-564) | No - mobile cards don't render badge | "My List +" (currentListContext="watched", TvCardMobile.tsx:108, MovieCardMobile.tsx:83) | "My List +" | Same as Watching tab |
| My Lists (Custom)     | Desktop  | CardV2 (MyListsPage.tsx:297) | No - context="tab-watching" hides badge (CardV2.tsx:44-54) | "My List +" (currentListContext={listName}, MyListsPage.tsx:302) | "My List +" | Badge hidden even though items are in custom lists (context="tab-watching" overrides) |
| My Lists (Custom)     | Mobile   | CardV2 (same) | No - same as desktop | "My List +" (same) | "My List +" | Same as desktop |
| Discovery Page        | Desktop  | CardV2 (DiscoveryPage.tsx:247) | Yes - context="tab-foryou" shows badge (CardV2.tsx:44-54) | "In list: {displayName}" (no currentListContext, MyListToggle.tsx:89) | "My List +" | Badge shows in mixed context |
| Discovery Page        | Mobile   | CardV2 (same) | Yes - same as desktop | "In list: {displayName}" (same) | "My List +" | Same as desktop |

---

## Section E: CURRENT BEHAVIOR MISMATCHES / REDUNDANCIES (NO FIXES, JUST FACTS)

### 1. Redundant Badge Display

**Issue:** `ListMembershipBadge` shows "In list: Currently Watching" on the Watching tab where the user is obviously already in that list.

**Where it happens:**
- This is actually PREVENTED in the code: `CardV2` uses `shouldShowMembershipBadge()` which returns `false` for `'tab-watching'`, `'tab-want'`, `'tab-watched'`, `'tab-not'` contexts (CardV2.tsx:44-54)
- However, badge WOULD show redundantly if rendered in a list-specific context without this check

**Current state:** Badge is correctly hidden on list-specific tabs via context check.

### 2. Mobile vs Desktop Divergence in Search Results

**Issue:** Search results show different UI patterns on mobile vs desktop:
- **Desktop:** Badge in meta area + toggle button with full "In list: X" text
- **Mobile:** Status pill (if in list) OR primary "Currently Watching" button (if not) + toggle in More menu

**Where:** SearchResults.tsx - different rendering logic for mobile (line 689-887) vs desktop (line 888-905)

**Current state:** Intentional divergence for mobile UX (compact actions).

### 3. My Lists Page Context Mismatch

**Issue:** My Lists page uses `context="tab-watching"` (MyListsPage.tsx:300) which hides badges, even though items are in custom lists (not "watching" list).

**Where:** MyListsPage.tsx:300 - passes `context="tab-watching"` to CardV2, which triggers badge hiding logic

**Current state:** Badge is hidden on custom list pages even though it might be useful information (user might want to see which custom list an item belongs to when viewing a different custom list).

### 4. Badge Blindness to Context

**Issue:** `ListMembershipBadge` has no awareness of where it's rendered. It always shows "In list: X" even if the user is already viewing that list.

**Where:** ListMembershipBadge.tsx - no props for current context

**Current state:** Badge is context-blind, but `CardV2` prevents redundant display by conditionally rendering the badge based on context.

### 5. Toggle Text Inconsistency

**Issue:** `MyListToggle` shows different text patterns:
- On list-specific pages: Always "My List +" (even if item is in a different list)
- On mixed pages: "In list: X" if in list, "My List +" if not

**Where:** MyListToggle.tsx:76-90 - logic prioritizes `currentListContext` over actual membership

**Current state:** When `currentListContext` is provided, toggle always shows "My List +" regardless of whether item is actually in that list or a different list. This could be confusing if an item is in "wishlist" but user is viewing "watching" tab.

### 6. Single List Model vs "In list" Language

**Issue:** Button text says "In list: X" which could imply multiple lists, but the model only supports one list.

**Where:** MyListToggle.tsx:89 - uses "In list:" prefix

**Current state:** Language is technically accurate (item IS in a list), but could be clearer that it's a single list membership.

---

## Summary

**Data Model:** Single list per item (strictly enforced)

**Badge Behavior:** Shows "In list: {displayName}" when item is in any list, hidden in list-specific contexts via CardV2 logic

**Toggle Behavior:** Context-aware text - shows "My List +" on list-specific pages, "In list: X" on mixed pages

**Key Finding:** The system correctly prevents redundant badge display on list-specific tabs, but My Lists page uses a generic context that hides badges even when they might be useful.




