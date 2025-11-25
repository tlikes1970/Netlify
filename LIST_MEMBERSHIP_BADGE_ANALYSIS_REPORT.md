# List Membership Badge & MyListToggle - Complete Analysis Report

**Date:** 2025-01-XX  
**Scope:** READ-ONLY inspection of where `ListMembershipBadge` and `MyListToggle` are rendered across mobile and desktop surfaces  
**Goal:** Understand exact wiring to control badge/toggle appearance based on context

---

## EXECUTIVE SUMMARY

### Current State
- **ListMembershipBadge**: Shows "In list: [DisplayName]" badge
- **MyListToggle**: Shows "My List +" button OR "In list: [DisplayName]" text (depending on context)

### Key Finding
**Mobile cards are showing redundant badges** because:
1. Mobile card components (`TvCardMobile`, `MovieCardMobile`) render `MyListToggle` WITHOUT `currentListContext` prop
2. `MyListToggle` shows "In list: Currently Watching" when `currentListContext` is undefined, even on list-specific pages
3. `ListMembershipBadge` is NOT rendered in mobile card components, but `MyListToggle` button text acts as a badge

**Desktop cards behave correctly** because:
1. `TabCard` passes `currentListContext` to `MyListToggle`, so button shows "My List +" on list pages
2. `CardV2` has logic to hide `ListMembershipBadge` on list-specific contexts

---

## 1. WHERE `ListMembershipBadge` IS RENDERED

### 1.1 Search Results (`apps/web/src/search/SearchResults.tsx`)

**Location:** Line 620  
**Card Component:** Custom `SearchResultCard` (not CardV2 or TabCard)  
**Surface:** Both mobile and desktop (same component, responsive styling)

```620:620:apps/web/src/search/SearchResults.tsx
          <ListMembershipBadge item={item} />
```

**Context:**
- Always rendered when item is in a list
- Shows in meta section alongside genre/mediaType
- **No conditional logic** - always shows if item has membership

**Mobile vs Desktop:**
- Same component, same behavior
- No differentiation

---

### 1.2 Home Rails

#### HomeYourShowsRail (`apps/web/src/components/rails/HomeYourShowsRail.tsx`)

**Location:** Uses `CardV2` component (line 19)  
**Card Component:** `CardV2`  
**Context Passed:** `context="tab-watching"` (line 21)  
**Surface:** Both mobile and desktop (CardV2 handles both)

**Badge Rendering:**
- `CardV2` line 172-176: `ListMembershipBadge` is conditionally rendered
- Logic: `shouldShowMembershipBadge(context)` function (line 43-53)
- For `context="tab-watching"`: Returns `false` (not in mixed contexts list)
- **Result:** Badge is HIDDEN on HomeYourShowsRail

**Mobile vs Desktop:**
- Same behavior - badge is hidden on both

---

#### HomeUpNextRail (`apps/web/src/components/rails/HomeUpNextRail.tsx`)

**Location:** Uses `UpNextCard` component (line 88)  
**Card Component:** `UpNextCard` (not CardV2 or TabCard)  
**Surface:** Both mobile and desktop

**Badge Rendering:**
- `UpNextCard` does NOT render `ListMembershipBadge`
- No membership indicator shown

---

### 1.3 Tab Pages (ListPage.tsx)

**Location:** `apps/web/src/pages/ListPage.tsx`  
**Card Component:** `TabCard` (line 1090)  
**Surface:** Both mobile and desktop (TabCard handles both)

**Badge Rendering:**
- `TabCard` does NOT render `ListMembershipBadge` at all
- Comment at line 46: "TabCard does NOT render ListMembershipBadge (list-specific contexts)"
- **Result:** Badge is never shown on tab pages

**Mobile vs Desktop:**
- Same behavior - no badge on either

**Tab Types:**
- `mode="watching"` → `tabType="watching"` → No badge
- `mode="want"` → `tabType="want"` → No badge  
- `mode="watched"` → `tabType="watched"` → No badge
- `mode="returning"` → Uses `UpNextCard` → No badge
- `mode="discovery"` → `tabType="discovery"` → No badge

---

### 1.4 Other Surfaces

**CardV2 Usage (when context allows badge):**
- Discovery page (`context="tab-foryou"`) → Badge SHOWS
- Search (if using CardV2) → Badge SHOWS
- Home page mixed contexts → Badge SHOWS
- Holiday page → Badge SHOWS

---

## 2. WHERE `MyListToggle` IS RENDERED

### 2.1 CardV2 (`apps/web/src/components/cards/CardV2.tsx`)

**Location:** Line 105-119  
**Surface:** Both mobile and desktop (shared cardContent)

```105:119:apps/web/src/components/cards/CardV2.tsx
          {/* My List + */}
          {showMyListBtn && (
            <MyListToggle 
              item={item} 
              currentListContext={
                // Use prop if provided (for custom lists), otherwise derive from context
                propCurrentListContext !== undefined
                  ? propCurrentListContext
                  : context === 'tab-watching' ? 'watching' :
                    context === 'tab-want' ? 'wishlist' :
                    context === 'tab-watched' ? 'watched' :
                    context === 'tab-not' ? 'not' :
                    undefined
              }
            />
          )}
```

**When Rendered:**
- `showMyListBtn` is true when: `context === 'tab-foryou' || context === 'search' || context === 'home' || context === 'tab-watching' || context === 'holiday'` (line 61)

**currentListContext Logic:**
- If `propCurrentListContext` provided → use it
- Otherwise derive from `context`:
  - `'tab-watching'` → `'watching'`
  - `'tab-want'` → `'wishlist'`
  - `'tab-watched'` → `'watched'`
  - `'tab-not'` → `'not'`
  - Otherwise → `undefined`

**Mobile vs Desktop:**
- Same behavior - both use same cardContent
- Mobile wraps in `SwipeableCard` (line 216-223)
- Desktop returns cardContent directly (line 211-212)

---

### 2.2 TabCard (`apps/web/src/components/cards/TabCard.tsx`)

**Location:** Line 665-674  
**Surface:** Desktop only (mobile uses TvCardMobile/MovieCardMobile)

```665:674:apps/web/src/components/cards/TabCard.tsx
        {/* My List + button */}
        <MyListToggle 
          item={item} 
          currentListContext={
            tabType === "watching" ? "watching" :
            tabType === "want" ? "wishlist" :
            tabType === "watched" ? "watched" :
            undefined
          }
        />
```

**When Rendered:**
- Always rendered on desktop TabCard
- Only on desktop (mobile uses different components)

**currentListContext Logic:**
- `tabType="watching"` → `"watching"`
- `tabType="want"` → `"wishlist"`
- `tabType="watched"` → `"watched"`
- Otherwise → `undefined`

**Mobile vs Desktop:**
- **Desktop:** Uses TabCard → `MyListToggle` with `currentListContext` → Shows "My List +"
- **Mobile:** Uses `TvCardMobile`/`MovieCardMobile` → `MyListToggle` WITHOUT `currentListContext` → Shows "In list: Currently Watching"

---

### 2.3 Mobile Card Components

#### TvCardMobile (`apps/web/src/components/cards/mobile/TvCardMobile.tsx`)

**Location:** Line 149  
**Surface:** Mobile only

```149:149:apps/web/src/components/cards/mobile/TvCardMobile.tsx
          <MyListToggle item={item} />
```

**When Rendered:**
- Always rendered on mobile TV cards
- **NO `currentListContext` prop passed**

**Result:**
- `MyListToggle.getButtonText()` (line 76-90 in MyListToggle.tsx):
  - Checks `currentListContext` first → `undefined` on mobile
  - Falls through to check `membershipInfo.displayName`
  - If item is in "watching" list → Returns `"In list: Currently Watching"`

**This is the bug:** Mobile cards show "In list: Currently Watching" even on the "Currently Watching" tab page.

---

#### MovieCardMobile (`apps/web/src/components/cards/mobile/MovieCardMobile.tsx`)

**Location:** Line 124  
**Surface:** Mobile only

```124:124:apps/web/src/components/cards/mobile/MovieCardMobile.tsx
          <MyListToggle item={item} />
```

**When Rendered:**
- Always rendered on mobile movie cards
- **NO `currentListContext` prop passed**

**Same bug as TvCardMobile:** Shows "In list: [DisplayName]" instead of "My List +"

---

### 2.4 Search Results (`apps/web/src/search/SearchResults.tsx`)

**Location:** 
- Desktop: Line 902
- Mobile: Line 874 (inside More menu)

**Surface:** Both mobile and desktop (different placement)

**Desktop:**
```902:902:apps/web/src/search/SearchResults.tsx
              <MyListToggle item={item} />
```

**Mobile:**
```874:874:apps/web/src/search/SearchResults.tsx
                        <MyListToggle item={item} />
```

**When Rendered:**
- Desktop: Always visible in action buttons area
- Mobile: Inside "More" menu dropdown

**currentListContext:**
- **NOT passed** → `undefined`
- This is correct for search (mixed context)

**Result:**
- If item is in a list → Shows "In list: [DisplayName]"
- If item not in list → Shows "My List +"

---

## 3. MOBILE VS DESKTOP DIFFERENTIATION

### 3.1 Search Results

**Differentiation Method:**
- `isMobileNow()` hook (line 154, 264)
- Conditional rendering based on `isMobile` state
- Same component, different JSX structure

**Card Component:**
- Custom `SearchResultCard` (not CardV2 or TabCard)
- Same component for both, responsive styling

**Badge Behavior:**
- **Desktop:** `ListMembershipBadge` shown (line 620)
- **Mobile:** `ListMembershipBadge` shown (line 620) - same
- **Both:** `MyListToggle` shown (different placement)

---

### 3.2 Home Rails

**Differentiation Method:**
- `CardV2` uses `useIsDesktop()` hook (line 59)
- Mobile: Wraps in `SwipeableCard` (line 216-223)
- Desktop: Returns cardContent directly (line 211-212)

**Card Component:**
- `CardV2` for both mobile and desktop
- Same component, conditional wrapper

**Badge Behavior:**
- **Both:** `ListMembershipBadge` hidden (context="tab-watching" is not in mixed contexts)
- **Both:** `MyListToggle` shown with `currentListContext="watching"` → Shows "My List +"

---

### 3.3 List/Tabs (ListPage.tsx)

**Differentiation Method:**
- `TabCard` uses multiple detection methods:
  - `useIsDesktop()` hook (line 103)
  - `isMobileNow()` (line 451)
  - `isCompactMobileV1()` and `isActionsSplit()` flags (line 449-450)

**Card Component Selection:**
- **Mobile:** Uses `TvCardMobile` or `MovieCardMobile` (line 499-564, 568-585)
- **Desktop:** Uses `TabCard` (line 588-947)

**Badge Behavior:**
- **Desktop TabCard:** 
  - `ListMembershipBadge` → NOT rendered
  - `MyListToggle` → Rendered with `currentListContext` → Shows "My List +"
  
- **Mobile TvCardMobile/MovieCardMobile:**
  - `ListMembershipBadge` → NOT rendered
  - `MyListToggle` → Rendered WITHOUT `currentListContext` → Shows "In list: Currently Watching" ❌

---

## 4. CURRENT BEHAVIOR BY SURFACE

### 4.1 Search

**DESKTOP:**
- ✅ Shows "In list: ..." badge (`ListMembershipBadge`) when item is in a list
- ✅ Shows "My List +" button (`MyListToggle`) - shows "In list: X" if in list, "My List +" if not

**MOBILE:**
- ✅ Shows "In list: ..." badge (`ListMembershipBadge`) when item is in a list
- ✅ Shows "My List +" button (`MyListToggle`) in More menu - shows "In list: X" if in list, "My List +" if not

**Status:** ✅ Working correctly (search is mixed context, badge is appropriate)

---

### 4.2 Home Rails (HomeYourShowsRail)

**DESKTOP:**
- ✅ Does NOT show "In list: ..." badge (context="tab-watching" hides it)
- ✅ Shows "My List +" button with `currentListContext="watching"` → Shows "My List +"

**MOBILE:**
- ✅ Does NOT show "In list: ..." badge (context="tab-watching" hides it)
- ✅ Shows "My List +" button with `currentListContext="watching"` → Shows "My List +"

**Status:** ✅ Working correctly

---

### 4.3 Tab Pages (Watching/Want/Watched)

**DESKTOP:**
- ✅ Does NOT show "In list: ..." badge (TabCard doesn't render it)
- ✅ Shows "My List +" button with `currentListContext` → Shows "My List +"

**MOBILE:**
- ✅ Does NOT show "In list: ..." badge (mobile cards don't render it)
- ❌ Shows "In list: Currently Watching" button text (MyListToggle without currentListContext) → **BUG**

**Status:** ❌ **MOBILE BUG IDENTIFIED**

---

## 5. ROOT CAUSES OF CURRENT BUGS

### 5.1 Why Mobile Cards Show Redundant Badge Text

**Root Cause:**
- `TvCardMobile.tsx` line 149: `<MyListToggle item={item} />`
- `MovieCardMobile.tsx` line 124: `<MyListToggle item={item} />`
- **Missing `currentListContext` prop**

**Flow:**
1. User on "Currently Watching" tab (mobile)
2. `ListPage.tsx` renders `TvCardMobile` or `MovieCardMobile` (line 499-564)
3. Mobile card renders `MyListToggle` without `currentListContext`
4. `MyListToggle.getButtonText()` (line 76):
   - `currentListContext` is `undefined` → skip first check
   - Item is in "watching" list → `membershipInfo.displayName === "Currently Watching"`
   - Returns `"In list: Currently Watching"` (line 89)

**Expected Behavior:**
- Should pass `currentListContext` based on `tabKey` prop
- `tabKey` is available: `'watching' | 'watched' | 'want'` (line 41, 94-101)
- Should map to: `'watching' | 'watched' | 'wishlist'`

---

### 5.2 Why Desktop Cards Work Correctly

**Root Cause:**
- `TabCard.tsx` line 665-674: Passes `currentListContext` based on `tabType`
- `MyListToggle.getButtonText()` (line 79): Checks `currentListContext` first
- If `currentListContext` exists → Returns `"My List +"` immediately (line 80)

**Flow:**
1. User on "Currently Watching" tab (desktop)
2. `ListPage.tsx` renders `TabCard` (line 1090)
3. `TabCard` renders `MyListToggle` with `currentListContext="watching"` (line 669)
4. `MyListToggle.getButtonText()`:
   - `currentListContext === "watching"` → Returns `"My List +"` (line 80)

---

## 6. SPECIFIC FILE + LINE REFERENCES

### ListMembershipBadge Rendering

| Surface | File | Line | Component | Mobile/Desktop | Shows Badge? |
|---------|------|------|-----------|----------------|--------------|
| Search | `apps/web/src/search/SearchResults.tsx` | 620 | SearchResultCard | Both | ✅ Yes (if in list) |
| HomeYourShowsRail | `apps/web/src/components/cards/CardV2.tsx` | 172-176 | CardV2 | Both | ❌ No (context="tab-watching") |
| Tab Pages | `apps/web/src/components/cards/TabCard.tsx` | N/A | TabCard | Desktop | ❌ No (not rendered) |
| Tab Pages Mobile | `apps/web/src/components/cards/mobile/TvCardMobile.tsx` | N/A | TvCardMobile | Mobile | ❌ No (not rendered) |
| Tab Pages Mobile | `apps/web/src/components/cards/mobile/MovieCardMobile.tsx` | N/A | MovieCardMobile | Mobile | ❌ No (not rendered) |

### MyListToggle Rendering

| Surface | File | Line | Component | Mobile/Desktop | currentListContext | Button Text |
|---------|------|------|-----------|----------------|-------------------|-------------|
| Search Desktop | `apps/web/src/search/SearchResults.tsx` | 902 | SearchResultCard | Desktop | ❌ Not passed | "In list: X" or "My List +" |
| Search Mobile | `apps/web/src/search/SearchResults.tsx` | 874 | SearchResultCard | Mobile | ❌ Not passed | "In list: X" or "My List +" |
| HomeYourShowsRail | `apps/web/src/components/cards/CardV2.tsx` | 106-118 | CardV2 | Both | ✅ "watching" | "My List +" |
| Tab Pages Desktop | `apps/web/src/components/cards/TabCard.tsx` | 666-674 | TabCard | Desktop | ✅ Based on tabType | "My List +" |
| Tab Pages Mobile | `apps/web/src/components/cards/mobile/TvCardMobile.tsx` | 149 | TvCardMobile | Mobile | ❌ **NOT PASSED** | **"In list: Currently Watching"** ❌ |
| Tab Pages Mobile | `apps/web/src/components/cards/mobile/MovieCardMobile.tsx` | 124 | MovieCardMobile | Mobile | ❌ **NOT PASSED** | **"In list: Currently Watching"** ❌ |

---

## 7. DESIGN RECOMMENDATIONS

### Rule to Implement

**Always show badge on search if item is in *any* list:**
- ✅ Already working - `SearchResults.tsx` line 620 always renders `ListMembershipBadge`
- ✅ `MyListToggle` also shows "In list: X" when not in list-specific context

**On tabs/home, show badge only when appropriate:**
- ✅ Desktop working - `TabCard` doesn't render badge, `MyListToggle` shows "My List +"
- ✅ `CardV2` has `shouldShowMembershipBadge()` logic that hides badge on list-specific contexts
- ❌ **Mobile needs fix** - `TvCardMobile`/`MovieCardMobile` need to pass `currentListContext` to `MyListToggle`

### Fix Required

**File:** `apps/web/src/components/cards/mobile/TvCardMobile.tsx`  
**Line:** 149  
**Change:**
```typescript
// Current:
<MyListToggle item={item} />

// Should be:
<MyListToggle 
  item={item} 
  currentListContext={
    tabKey === "watching" ? "watching" :
    tabKey === "watched" ? "watched" :
    tabKey === "want" ? "wishlist" :
    undefined
  }
/>
```

**File:** `apps/web/src/components/cards/mobile/MovieCardMobile.tsx`  
**Line:** 124  
**Same change as above**

---

## 8. SUMMARY

### Where Badge Shows Today

1. **Search** - ✅ Always (both mobile/desktop)
2. **HomeYourShowsRail** - ❌ Never (correct - context hides it)
3. **Tab Pages** - ❌ Never (correct - list-specific context)

### Where MyListToggle Shows Today

1. **Search** - ✅ Always (shows "In list: X" if in list, "My List +" if not)
2. **HomeYourShowsRail** - ✅ Always (shows "My List +" - correct)
3. **Tab Pages Desktop** - ✅ Always (shows "My List +" - correct)
4. **Tab Pages Mobile** - ❌ Shows "In list: Currently Watching" (BUG - should show "My List +")

### Mobile vs Desktop Differentiation

- **Search:** Same component, responsive styling
- **Home Rails:** Same CardV2 component, conditional SwipeableCard wrapper
- **Tab Pages:** Different components (TabCard vs TvCardMobile/MovieCardMobile)

### Bug Cause

**Mobile tab pages show redundant "In list: Currently Watching" because:**
- `TvCardMobile` and `MovieCardMobile` render `MyListToggle` without `currentListContext` prop
- `MyListToggle` falls back to showing "In list: [DisplayName]" when `currentListContext` is undefined
- Desktop `TabCard` correctly passes `currentListContext`, so it shows "My List +"

**Fix:** Pass `currentListContext` to `MyListToggle` in mobile card components, mapping `tabKey` to list name.



