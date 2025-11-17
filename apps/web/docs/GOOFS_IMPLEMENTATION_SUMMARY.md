# Goofs Feature Implementation Summary

**Branch:** `goofs-and-extras`  
**Date:** 2024-12-19  
**Status:** ✅ Complete - Plumbing + UI Only

---

## Overview

This implementation replaces the old Bloopers feature (which depended on TMDB/YouTube APIs) with a new "Goofs" feature that uses only local data storage. The feature is fully plumbed and ready for manual data seeding or future admin tools.

---

## New Files Added

### 1. `apps/web/src/lib/goofs/goofsStore.ts`
- **Purpose:** Data model and storage layer for goofs
- **Key Features:**
  - TypeScript interfaces: `GoofItem`, `GoofSet`
  - Local storage using `localStorage` (key: `flicklet.goofs.v1`)
  - Functions: `getGoofsForTitle()`, `subscribeToGoofs()`
  - Seed data for development (The Office, Breaking Bad examples)
  - TODO comments for future Firestore sync

### 2. `apps/web/src/components/extras/GoofsModal.tsx`
- **Purpose:** Modal component to display goofs for a title
- **Key Features:**
  - Pro-gated access
  - Loading, loaded, and empty states
  - Keyboard navigation (ESC, Tab focus trap)
  - Type badges (Continuity, Prop, Crew, Logic, Other)
  - Subtlety indicators (blink/obvious)
  - Matches existing modal styling

---

## Existing Files Changed

### 1. `apps/web/src/components/cards/TabCard.tsx`
- **Change:** Updated "Bloopers" button to "Goofs"
- **Line:** ~783-810
- **Details:**
  - Button label changed from "Bloopers" to "Goofs"
  - Tooltip updated to "View goofs and slip-ups"
  - Handler changed from `onBloopersOpen` to `onGoofsOpen`
  - Pro gating remains intact

### 2. `apps/web/src/components/cards/card.types.ts`
- **Change:** Added `onGoofsOpen` to `CardActionHandlers` interface
- **Line:** ~49
- **Details:**
  - Added `onGoofsOpen?: (item: MediaItem) => void`
  - Marked `onBloopersOpen` as deprecated with comment

### 3. `apps/web/src/App.tsx`
- **Changes:**
  - Added import for `GoofsModal`
  - Added state: `goofsModalItem`, `showGoofsModal`
  - Added handler: `handleGoofsOpen()`
  - Updated all `ListPage` calls to include `onGoofsOpen={handleGoofsOpen}`
  - Added `<GoofsModal>` render near other modals
- **Lines:** Multiple locations

### 4. `apps/web/src/pages/ListPage.tsx`
- **Change:** Added `onGoofsOpen` prop and passed to actions map
- **Lines:** ~46, 57, 767

### 5. `apps/web/src/features/compact/CompactOverflowMenu.tsx`
- **Change:** Updated overflow menu to use `onGoofsOpen` instead of `onBloopersOpen`
- **Lines:** ~153, 164, 175
- **Details:** Changed label from "Bloopers" to "Goofs"

---

## How to Add a New Goof Set Manually

### Method 1: Direct localStorage (Quick Testing)

1. Open browser DevTools Console
2. Run:
```javascript
const goofs = {
  "2316": {  // TMDB ID as string key
    tmdbId: 2316,
    source: "manual",
    lastUpdated: new Date().toISOString(),
    items: [
      {
        id: "goof-1",
        type: "continuity",
        text: "Your goof description here",
        subtlety: "obvious"  // or "blink"
      }
    ]
  }
};
localStorage.setItem('flicklet.goofs.v1', JSON.stringify(goofs));
```

### Method 2: Edit Seed Data (Development)

1. Open `apps/web/src/lib/goofs/goofsStore.ts`
2. Find the `getSeedGoofs()` function (around line 120)
3. Add a new entry to the returned object:
```typescript
'YOUR_TMDB_ID': {
  tmdbId: YOUR_TMDB_ID,
  source: 'manual',
  lastUpdated: new Date().toISOString(),
  items: [
    {
      id: 'goof-unique-id',
      type: 'continuity', // or 'prop', 'crew', 'logic', 'other'
      text: 'Your goof description',
      subtlety: 'obvious' // optional: 'blink' or 'obvious'
    }
  ]
}
```

### Method 3: Future Admin Tool (Not Implemented)

When ready, create an admin interface that:
- Allows searching for titles by TMDB ID
- Provides form to add/edit goofs
- Validates goof text and type
- Saves to Firestore collection: `users/{uid}/goofs/{tmdbId}` (future)

---

## Goof Types

- **`continuity`** - Continuity errors (props/characters changing between shots)
- **`prop`** - Prop mistakes (wrong props, anachronisms)
- **`crew`** - Crew visible in shot (cameras, microphones, etc.)
- **`logic`** - Logic errors (timeline inconsistencies, plot holes)
- **`other`** - Other types of mistakes

---

## Subtlety Levels

- **`blink`** - Easy to miss, requires careful watching
- **`obvious`** - Very noticeable, hard to miss

---

## Pro Gating

The Goofs feature respects existing Pro settings:
- Button is disabled/opacity reduced for non-Pro users
- Non-Pro users see upgrade prompt when clicking
- Pro users can access goofs (even if empty)

---

## Empty State Behavior

When no goofs exist for a title:
- Modal opens successfully (no errors)
- Shows friendly message: "We don't have any goofs for this one yet. They'll start appearing as we expand Flicklet Pro extras."
- No loading spinner stuck forever
- No API errors (because no APIs are called)

---

## Testing Checklist

### ✅ As Pro User with Seeded Goofs
- [ ] Open a show/movie card (e.g., The Office - TMDB ID 2316)
- [ ] Click "Goofs" button
- [ ] Modal opens and displays goofs
- [ ] Goofs show type badges and subtlety indicators
- [ ] Close modal works correctly

### ✅ As Pro User without Goofs
- [ ] Open a show/movie card without seeded goofs
- [ ] Click "Goofs" button
- [ ] Modal opens and shows empty state message
- [ ] No errors in console
- [ ] Close modal works correctly

### ✅ As Non-Pro User
- [ ] Open any show/movie card
- [ ] "Goofs" button is disabled/opacity reduced
- [ ] Clicking shows upgrade prompt (if implemented)
- [ ] No modal opens

---

## Confirmation: No External APIs Added

✅ **Confirmed:** This implementation adds ZERO external API calls:
- ❌ No TMDB API calls
- ❌ No YouTube API calls
- ❌ No IMDb API calls
- ❌ No Wikipedia API calls
- ❌ No AI/LLM calls
- ❌ No scraping

**Only local operations:**
- ✅ localStorage read/write
- ✅ In-memory cache
- ✅ React state management

---

## Future Enhancements (Not in This Branch)

1. **Firestore Sync** - Sync goofs to cloud for authenticated users
2. **Admin Tool** - UI for adding/editing goofs
3. **User Contributions** - Allow Pro users to submit goofs (with moderation)
4. **Bulk Import** - Import goofs from external sources (IMDb, etc.)
5. **Search/Filter** - Filter goofs by type or subtlety
6. **Voting** - Let users vote on goof accuracy

---

## Deprecated Components

- **`BloopersModal`** - Still exists but marked as deprecated
- **`onBloopersOpen`** - Still supported for backward compatibility but deprecated
- **`extrasProvider.fetchBloopers()`** - Not used by Goofs feature

These can be removed in a future cleanup pass once all references are migrated.

---

## Notes

- The seed data includes examples for The Office (2316) and Breaking Bad (1396)
- Storage key uses version `v1` to allow future migrations
- All goofs are keyed by TMDB ID (as string) for consistency
- The modal follows the same visual style as existing Bloopers/Extras modals

---

**Implementation Complete** ✅

