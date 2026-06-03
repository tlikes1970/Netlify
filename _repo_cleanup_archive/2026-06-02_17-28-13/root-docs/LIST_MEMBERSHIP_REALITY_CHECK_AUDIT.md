# List Membership Reality Check Audit

**Date:** Generated from codebase inspection  
**Mode:** READ-ONLY / DIAGNOSTIC ONLY  
**Goal:** Precise, reality-checked status report of "in list" behavior across all surfaces and platforms

---

## 1. Data Model & Membership

### A) Can an item belong to MORE THAN ONE list at the same time?

**Answer: NO**

**Evidence:**
- **`apps/web/src/lib/storage.ts:39-40`**: `LibraryEntry` interface shows `list: ListName` (singular, not array)
- **`apps/web/src/lib/storage.ts:258-299`**: `Library.upsert()` method overwrites the `list` property - line 297: `list,` (single assignment)
- **`apps/web/src/lib/storage.ts:346-356`**: `Library.move()` method changes `list` property (single value)
- **`apps/web/src/lib/storage.ts:529-532`**: `Library.getCurrentList()` returns `ListName | null` (single value, not array)
- **`apps/web/src/lib/membership.ts:23-35`**: `getMembershipInfo()` calls `Library.getCurrentList()` which returns a single list or null

**Constraint Enforcement:**
- **`apps/web/src/lib/storage.ts:210-252`**: `addToListWithConfirmation()` function checks if item is already in a list (line 215) and shows confirmation dialog asking to "move" (line 224-225), not "add to both"
- **`apps/web/src/components/ListSelectorModal.tsx:31-36`**: When adding to custom list, checks `Library.getCurrentList()` and shows "move" confirmation (line 255-258)

### B) Single Source of Truth for Membership

**Storage Location:**
- **`apps/web/src/lib/storage.ts:8`**: `const KEY = "flicklet.library.v2"` (localStorage key)
- **`apps/web/src/lib/storage.ts:80-89`**: State stored in `state: State` object (in-memory) and persisted to localStorage
- **`apps/web/src/lib/storage.ts:39-43`**: Each `LibraryEntry` has `list: ListName` property

**Canonical Reader:**
- **`apps/web/src/lib/storage.ts:529-532`**: `Library.getCurrentList(id, mediaType)` is the canonical function
- **`apps/web/src/lib/membership.ts:27`**: `getMembershipInfo()` uses `Library.getCurrentList()` as source of truth

### C) `getMembershipInfo()` Return Values

**Function Location:** `apps/web/src/lib/membership.ts:23-35`

**Return Structure:**
```typescript
interface MembershipInfo {
  list: ListName | null;
  displayName: string | null;
}
```

**Return Values:**

1. **Item is NOT in any list:**
   - **`apps/web/src/lib/membership.ts:29-31`**: Returns `{ list: null, displayName: null }`

2. **Item is in `watching`:**
   - **`apps/web/src/lib/membership.ts:27`**: Calls `Library.getCurrentList()` → returns `"watching"`
   - **`apps/web/src/lib/membership.ts:33`**: Calls `getListDisplayName("watching")`
   - **`apps/web/src/lib/storage.ts:191-192`**: Returns `"Currently Watching"`
   - Final: `{ list: "watching", displayName: "Currently Watching" }`

3. **Item is in `wishlist`:**
   - **`apps/web/src/lib/storage.ts:193-194`**: `getListDisplayName("wishlist")` returns `"Want to Watch"`
   - Final: `{ list: "wishlist", displayName: "Want to Watch" }`

4. **Item is in custom list like `custom:horror123`:**
   - **`apps/web/src/lib/storage.ts:200-203`**: Extracts listId, calls `customListManager.getListById(listId)`, returns list name or `"Custom List"`
   - Final: `{ list: "custom:horror123", displayName: "<List Name>" }`

**Confirmation:** Always returns exactly ONE list or `null` (never multiple lists)

---

## 2. Badge Behavior (All Surfaces)

### ListMembershipBadge Component

**Location:** `apps/web/src/components/ListMembershipBadge.tsx`

**Render Conditions:**
- **`apps/web/src/components/ListMembershipBadge.tsx:28-33`**: Returns `null` if `list === null || displayName === null`
- **`apps/web/src/components/ListMembershipBadge.tsx:35`**: Exact text content: `"In list: ${displayName}"`
- **`apps/web/src/components/ListMembershipBadge.tsx:12-18`**: Props interface shows it receives only `item` and optional `className` - NO context prop

**Context Awareness:**
- **`apps/web/src/components/ListMembershipBadge.tsx:24-50`**: Component is pure - it does NOT know where it's being rendered
- It only checks membership via `getMembershipInfo(item)` and displays if membership exists

### Badge Usage by Surface

#### Search Results
- **`apps/web/src/search/SearchResults.tsx:620`**: Badge IS rendered: `<ListMembershipBadge item={item} />`
- **Location:** Inline with meta information (line 616-621)
- **Context:** `context` prop not passed to badge (badge doesn't use it anyway)

#### Home - Your Shows Rail
- **`apps/web/src/components/rails/HomeYourShowsRail.tsx:19-30`**: Uses `CardV2` with `context="tab-watching"`
- **`apps/web/src/components/cards/CardV2.tsx:44-54`**: `shouldShowMembershipBadge()` function checks context
- **`apps/web/src/components/cards/CardV2.tsx:44-54`**: `"tab-watching"` is NOT in `mixedContexts` array
- **`apps/web/src/components/cards/CardV2.tsx:184-188`**: Badge only renders if `shouldShowMembershipBadge(context)` returns true
- **Result:** Badge is NOT rendered on HomeYourShowsRail (context is `"tab-watching"` which is excluded)

#### Home - Up Next Rail
- **`apps/web/src/components/rails/HomeUpNextRail.tsx:88`**: Uses `UpNextCard` component (not CardV2)
- **`apps/web/src/components/cards/UpNextCard.tsx`**: Need to check if UpNextCard renders badge
- **Note:** UpNextCard is a special card type - need to verify

#### Watching Tab
- **`apps/web/src/pages/ListPage.tsx:1`**: Uses `TabCard` component
- **`apps/web/src/components/cards/TabCard.tsx:39-49`**: TabCard documentation states "TabCard does NOT render ListMembershipBadge"
- **Result:** Badge is NOT rendered on Watching tab

#### Want Tab
- **Same as Watching Tab** - uses `TabCard`, badge NOT rendered

#### Watched Tab
- **Same as Watching Tab** - uses `TabCard`, badge NOT rendered

#### Custom Lists Page
- **`apps/web/src/pages/MyListsPage.tsx:297-303`**: Uses `CardV2` with `context="tab-watching"` and `currentListContext={listName}`
- **`apps/web/src/components/cards/CardV2.tsx:44-54`**: `"tab-watching"` is NOT in `mixedContexts` array
- **Result:** Badge is NOT rendered on Custom Lists page

#### Discovery / For You Page
- **`apps/web/src/pages/DiscoveryPage.tsx:247-251`**: Uses `CardV2` with `context="tab-foryou"`
- **`apps/web/src/components/cards/CardV2.tsx:44-54`**: `"tab-foryou"` IS in `mixedContexts` array (line 49)
- **`apps/web/src/components/cards/CardV2.tsx:184-188`**: Badge renders when `shouldShowMembershipBadge(context)` is true
- **Result:** Badge IS rendered on Discovery/For You page

---

## 3. MyListToggle Behavior (Text + Title)

### MyListToggle Component

**Location:** `apps/web/src/components/MyListToggle.tsx`

### How It Determines Membership

- **`apps/web/src/components/MyListToggle.tsx:44`**: Uses `getMembershipInfo(item)` on mount
- **`apps/web/src/components/MyListToggle.tsx:47-61`**: Subscribes to `Library.subscribe()` to update membership reactively
- **`apps/web/src/components/MyListToggle.tsx:24-36`**: Receives optional `currentListContext?: ListName` prop

### Exact Button Text by Scenario

#### Case 1: Item is NOT in any list
- **`apps/web/src/components/MyListToggle.tsx:84-86`**: Returns `"My List +"`
- **`apps/web/src/components/MyListToggle.tsx:94-96`**: Title/tooltip: `"Add to one of your lists"`

#### Case 2: Item IS in a list AND `currentListContext` is provided
- **`apps/web/src/components/MyListToggle.tsx:79-81`**: Returns `"My List +"` (context already implies membership)
- **`apps/web/src/components/MyListToggle.tsx:99-101`**: Title/tooltip: `"Click to change lists"`

#### Case 3: Item IS in a list AND `currentListContext` is NOT provided
- **`apps/web/src/components/MyListToggle.tsx:88-89`**: Returns `"In list: ${membershipInfo.displayName}"`
- **`apps/web/src/components/MyListToggle.tsx:104`**: Title/tooltip: `"Currently in list: ${membershipInfo.displayName}. Click to change lists."`

### Status Lists vs Custom Lists

- **`apps/web/src/components/MyListToggle.tsx:88-89`**: Uses `membershipInfo.displayName` regardless of list type
- **`apps/web/src/lib/storage.ts:189-207`**: `getListDisplayName()` handles both status lists and custom lists uniformly
- **Result:** No difference in text treatment - both use `displayName`

### ListSelectorModal Behavior

**Location:** `apps/web/src/components/ListSelectorModal.tsx`

**When Adding to Custom List:**
- **`apps/web/src/components/ListSelectorModal.tsx:31-36`**: Checks if item is already in a list (line 31)
- **`apps/web/src/components/ListSelectorModal.tsx:33-35`**: If in existing list, shows confirmation dialog
- **`apps/web/src/components/ListSelectorModal.tsx:254-258`**: Confirmation text: `"<item.title> is already in <existingListName>. Do you want to move it to the selected list?"`
- **`apps/web/src/components/ListSelectorModal.tsx:43-54`**: `addToList()` calls `Library.upsert(item, listName)` which MOVES the item (single list model)
- **Result:** It MOVES the item (single list), not adds to multiple lists

---

## 4. Surface × Platform Matrix

| Surface              | Platform | Card Component(s)       | Badge rendered? (yes/no + when)                    | Toggle text when IN a list                | Toggle text when NOT in a list | Notes (incl. any context props & weirdness) |
|----------------------|----------|--------------------------|----------------------------------------------------|-------------------------------------------|--------------------------------|----------------------------------------------|
| Search Results       | Desktop  | SearchResultCard (custom) | **YES** - Always if item in list (line 620)       | `"In list: <DisplayName>"` (no context)  | `"My List +"`                  | Badge shown inline with meta. MyListToggle in action area (line 902) |
| Search Results       | Mobile   | SearchResultCard (custom) | **YES** - Always if item in list (line 620)       | `"In list: <DisplayName>"` (no context)  | `"My List +"`                  | Badge shown inline with meta. MyListToggle in More menu (line 874) |
| Home – Your Shows    | Desktop  | CardV2                   | **NO** - Context `"tab-watching"` excluded (line 44-54) | `"My List +"` (context="tab-watching" → currentListContext="watching") | `"My List +"`                  | Context implies membership, so badge hidden, toggle shows "My List +" |
| Home – Your Shows    | Mobile   | CardV2                   | **NO** - Context `"tab-watching"` excluded (line 44-54) | `"My List +"` (context="tab-watching" → currentListContext="watching") | `"My List +"`                  | Same as desktop |
| Home – Up Next       | Desktop  | UpNextCard               | **NO** - UpNextCard is display-only (no badge, no toggle) | N/A (no toggle button)                  | N/A                            | Special card type - display only, shows "Up Next: [date]" instead of actions |
| Home – Up Next       | Mobile   | UpNextCard               | **NO** - UpNextCard is display-only (no badge, no toggle) | N/A (no toggle button)                  | N/A                            | Special card type - display only, shows "Up Next: [date]" instead of actions |
| Watching Tab         | Desktop  | TabCard                   | **NO** - TabCard docs state it doesn't render badge | `"My List +"` (currentListContext="watching" line 669) | `"My List +"`                  | TabCard never renders badge (line 46 comment) |
| Watching Tab         | Mobile   | TvCardMobile / MovieCardMobile | **NO** - Mobile cards don't render badge | `"My List +"` (currentListContext="watching" line 161) | `"My List +"`                  | Mobile cards use MyListToggle but no badge |
| Want Tab             | Desktop  | TabCard                   | **NO** - TabCard docs state it doesn't render badge | `"My List +"` (currentListContext="wishlist" line 670) | `"My List +"`                  | Same as Watching tab |
| Want Tab             | Mobile   | TvCardMobile / MovieCardMobile | **NO** - Mobile cards don't render badge | `"My List +"` (currentListContext="wishlist" line 107) | `"My List +"`                  | Same as Watching tab |
| Watched Tab          | Desktop  | TabCard                   | **NO** - TabCard docs state it doesn't render badge | `"My List +"` (currentListContext="watched" line 671) | `"My List +"`                  | Same as Watching tab |
| Watched Tab          | Mobile   | TvCardMobile / MovieCardMobile | **NO** - Mobile cards don't render badge | `"My List +"` (currentListContext="watched" line 108) | `"My List +"`                  | Same as Watching tab |
| Custom Lists Page    | Desktop  | CardV2                    | **NO** - Context `"tab-watching"` excluded (line 44-54) | `"My List +"` (currentListContext={listName} line 302) | `"My List +"`                  | Custom list name passed as currentListContext |
| Custom Lists Page    | Mobile   | CardV2                    | **NO** - Context `"tab-watching"` excluded (line 44-54) | `"My List +"` (currentListContext={listName} line 302) | `"My List +"`                  | Same as desktop |
| Discovery / For You  | Desktop  | CardV2                    | **YES** - Context `"tab-foryou"` included (line 49) | `"In list: <DisplayName>"` (no currentListContext) | `"My List +"`                  | Mixed context, badge shows membership |
| Discovery / For You  | Mobile   | CardV2                    | **YES** - Context `"tab-foryou"` included (line 49) | `"In list: <DisplayName>"` (no currentListContext) | `"My List +"`                  | Same as desktop |

---

## 5. CURRENT BEHAVIOR ISSUES (FACTS ONLY)

### Issue 1: Badge Redundancy on List-Specific Tabs
- **Description:** Badge does NOT show on list-specific tabs (Watching, Want, Watched) because context is excluded from `mixedContexts` array
- **File References:**
  - `apps/web/src/components/cards/CardV2.tsx:44-54` - `shouldShowMembershipBadge()` excludes `"tab-watching"`, `"tab-want"`, `"tab-watched"`, `"tab-not"`
  - `apps/web/src/components/cards/TabCard.tsx:46` - Comment states "TabCard does NOT render ListMembershipBadge"
- **Status:** This appears to be INTENTIONAL (not a bug) - badge hidden because tab context already implies membership

### Issue 2: MyListToggle Always Shows "My List +" on List Tabs
- **Description:** On list-specific tabs (Watching, Want, Watched), MyListToggle always shows `"My List +"` even when item IS in the list, because `currentListContext` is provided
- **File References:**
  - `apps/web/src/components/MyListToggle.tsx:79-81` - When `currentListContext` exists, always returns `"My List +"`
  - `apps/web/src/components/cards/TabCard.tsx:666-674` - Passes `currentListContext` based on `tabType`
  - `apps/web/src/components/cards/mobile/TvCardMobile.tsx:159-162` - Mobile cards also pass `currentListContext`
- **Status:** INTENTIONAL - prevents redundant "In list: Currently Watching" text on Watching tab

### Issue 3: HomeYourShowsRail Uses "tab-watching" Context But Is On Home Page
- **Description:** HomeYourShowsRail uses `context="tab-watching"` which suppresses badge, but it's on the home page (mixed context)
- **File References:**
  - `apps/web/src/components/rails/HomeYourShowsRail.tsx:21` - Sets `context="tab-watching"`
  - `apps/web/src/components/cards/CardV2.tsx:44-54` - `"tab-watching"` is excluded from badge display
- **Status:** INTENTIONAL - rail shows items from "watching" list, so badge would be redundant

### Issue 4: Search Results Show Badge But Also Have MyListToggle
- **Description:** Search results show both badge (line 620) and MyListToggle (line 902 desktop, line 874 mobile), creating potential redundancy
- **File References:**
  - `apps/web/src/search/SearchResults.tsx:620` - Badge rendered inline
  - `apps/web/src/search/SearchResults.tsx:902` - MyListToggle in desktop actions
  - `apps/web/src/search/SearchResults.tsx:874` - MyListToggle in mobile More menu
- **Status:** Both show membership info - badge shows "In list: X", toggle shows "In list: X" when in list (no context)

### Issue 5: Single List Model Conflicts with "Add to List" Modal Language
- **Description:** ListSelectorModal uses language like "Add to List" but actually MOVES items (single list model)
- **File References:**
  - `apps/web/src/components/ListSelectorModal.tsx:109` - Modal title: "Add to List"
  - `apps/web/src/components/ListSelectorModal.tsx:254-258` - Confirmation says "move it to the selected list"
  - `apps/web/src/components/ListSelectorModal.tsx:43-54` - Actually calls `Library.upsert()` which MOVES (overwrites list property)
- **Status:** Language inconsistency - says "add" but does "move"

### Issue 6: Mobile Cards Don't Render Badge
- **Description:** Mobile card components (TvCardMobile, MovieCardMobile) don't render ListMembershipBadge at all
- **File References:**
  - `apps/web/src/components/cards/mobile/TvCardMobile.tsx:1-206` - No ListMembershipBadge import or usage
  - `apps/web/src/components/cards/mobile/MovieCardMobile.tsx:1-181` - No ListMembershipBadge import or usage
- **Status:** Mobile cards rely solely on MyListToggle button text for membership indication

---

## Summary

**Data Model:** Single list per item (enforced by `LibraryEntry.list` being singular, `Library.upsert()` overwrites list property)

**Badge Display:** Only shows in mixed contexts (search, discovery) - hidden in list-specific contexts (tabs, rails) where context already implies membership

**Toggle Text:** Shows `"My List +"` when context implies membership OR when not in list; shows `"In list: <DisplayName>"` only in mixed contexts when item is in a list

**Platform Differences:** Desktop and mobile use same logic, but mobile cards don't render badge at all (only toggle button)

