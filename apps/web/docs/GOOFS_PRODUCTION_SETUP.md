# Goofs Feature - Production Setup Guide

**Status:** ✅ Feature is fully implemented and wired  
**Last Updated:** 2024-12-19

---

## Current State

The Goofs feature is **fully functional** and ready for production. Here's what's already working:

✅ **UI Components:**
- `GoofsModal.tsx` - Modal component that displays goofs
- Button wired in `TabCard.tsx` 
- Pro gating implemented
- Empty state handling

✅ **Data Layer:**
- `goofsStore.ts` - Local storage with seed data
- Seed data for: The Office (2316), Breaking Bad (1396)
- localStorage persistence

✅ **Integration:**
- `App.tsx` - Handler and modal rendering
- `ListPage.tsx` - Props wired through
- All card types support Goofs button

---

## How It Works

### When User Clicks "Goofs" Button:

1. **Button Click** → `TabCard.tsx` calls `actions?.onGoofsOpen?.(item)`
2. **Handler** → `App.tsx` `handleGoofsOpen()` sets modal state
3. **Modal Opens** → `GoofsModal.tsx` renders
4. **Data Load** → `useEffect` calls `subscribeToGoofs(tmdbId, callback)`
5. **Store Lookup** → `goofsStore.ts` checks:
   - In-memory cache
   - localStorage (`flicklet.goofs.v1`)
   - Seed data (if cache/localStorage empty)
6. **Display** → Modal shows goofs or empty state

### Data Flow:

```
User Click → App Handler → Modal Opens → goofsStore.getGoofsForTitle() 
  → Check Cache → Check localStorage → Check Seed Data → Return GoofSet | null
```

---

## Production Setup Options

### Option 1: Build-Time Seed Data (Recommended for MVP)

**Use Case:** You have a curated list of goofs you want to ship with the app.

**Steps:**

1. **Add more seed data** to `apps/web/src/lib/goofs/goofsStore.ts`:
   ```typescript
   function getSeedGoofs(): Record<string, GoofSet> {
     return {
       "2316": { /* The Office */ },
       "1396": { /* Breaking Bad */ },
       "1399": { /* Game of Thrones - ADD THIS */ },
       // Add more popular titles
     };
   }
   ```

2. **Seed data auto-loads** on first page load (via `initializeCache()`)

3. **Users get goofs** immediately without any backend

**Pros:**
- ✅ No backend required
- ✅ Works offline
- ✅ Fast (localStorage)
- ✅ Simple to maintain

**Cons:**
- ❌ Limited to what's in the bundle
- ❌ Requires app update to add new goofs

---

### Option 2: Firestore Cloud Sync (Recommended for Scale)

**Use Case:** You want to add/update goofs without deploying new app versions.

**Implementation Steps:**

1. **Create Firestore Collection Structure:**
   ```
   goofs/{tmdbId}
     - tmdbId: number
     - source: "manual" | "user" | "internal"
     - lastUpdated: timestamp
     - items: array of GoofItem
   ```

2. **Update `goofsStore.ts`** to add Firestore sync:
   ```typescript
   import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
   import { db } from '../firebase'; // Your Firebase config
   
   export async function getGoofsForTitle(tmdbId: number | string): Promise<GoofSet | null> {
     // 1. Check cache/localStorage first (fast)
     const cached = getFromCache(tmdbId);
     if (cached) return cached;
     
     // 2. Try Firestore (if authenticated)
     if (isAuthenticated()) {
       const goofsRef = doc(db, 'goofs', String(tmdbId));
       const snapshot = await getDoc(goofsRef);
       if (snapshot.exists()) {
         const data = snapshot.data() as GoofSet;
         updateCache(data);
         return data;
       }
     }
     
     // 3. Fallback to seed data
     return getSeedGoofs()[String(tmdbId)] || null;
   }
   ```

3. **Add Real-Time Updates:**
   ```typescript
   export function subscribeToGoofs(
     tmdbId: number | string,
     callback: (goofs: GoofSet | null) => void
   ): UnsubscribeFn {
     // ... existing localStorage subscription ...
     
     // Add Firestore subscription if authenticated
     if (isAuthenticated()) {
       const goofsRef = doc(db, 'goofs', String(tmdbId));
       return onSnapshot(goofsRef, (snapshot) => {
         if (snapshot.exists()) {
           const data = snapshot.data() as GoofSet;
           updateCache(data);
           callback(data);
         } else {
           callback(null);
         }
       });
     }
     
     // ... return localStorage unsubscribe ...
   }
   ```

4. **Create Admin Tool** (separate page/component):
   - Search titles by TMDB ID
   - Add/edit/delete goofs
   - Save to Firestore
   - Only accessible to admins

**Pros:**
- ✅ Update goofs without app deployment
- ✅ Real-time updates
- ✅ Can scale to thousands of titles
- ✅ Supports user contributions (future)

**Cons:**
- ❌ Requires Firebase setup
- ❌ More complex implementation
- ❌ Requires internet connection

---

### Option 3: Hybrid Approach (Best of Both Worlds)

**Use Case:** Ship with seed data, but allow cloud updates.

**Implementation:**
- Use seed data as fallback
- Check Firestore first (if authenticated)
- Merge results (cloud data overrides seed data)

---

## Testing Checklist

### ✅ Verify Button Works:

1. **Open any show/movie card** (e.g., Breaking Bad - ID 1396)
2. **Click "Goofs" button**
3. **Expected:** Modal opens, shows goofs

### ✅ Verify Empty State:

1. **Open a show without goofs** (e.g., Game of Thrones - ID 1399)
2. **Click "Goofs" button**
3. **Expected:** Modal opens, shows "No goofs found" message

### ✅ Verify Pro Gating:

1. **As non-Pro user:** Button should be disabled/opacity reduced
2. **Click button:** Should show Pro upgrade prompt

### ✅ Verify Data Persistence:

1. **Add goofs via console** (see below)
2. **Refresh page**
3. **Expected:** Goofs still there (localStorage persists)

---

## Quick Test: Add Goofs via Browser Console

To test immediately, run this in browser console:

```javascript
// Get current goofs
const current = JSON.parse(localStorage.getItem('flicklet.goofs.v1') || '{}');

// Add Game of Thrones goofs
current['1399'] = {
  tmdbId: 1399,
  source: 'manual',
  lastUpdated: new Date().toISOString(),
  items: [
    {
      id: 'goof-got-1',
      type: 'continuity',
      text: 'In Season 1, Episode 1, Daenerys\'s hair length changes between scenes.',
      subtlety: 'blink'
    },
    {
      id: 'goof-got-2',
      type: 'prop',
      text: 'Starbucks cup visible in Season 8, Episode 4.',
      subtlety: 'obvious'
    }
  ]
};

// Save back to localStorage
localStorage.setItem('flicklet.goofs.v1', JSON.stringify(current));

// Refresh page and try Game of Thrones Goofs button
```

---

## Production Deployment Checklist

### Before Deploying:

- [ ] **Add seed data** for popular titles (Option 1) OR
- [ ] **Set up Firestore collection** and sync code (Option 2)
- [ ] **Test with real titles** in your library
- [ ] **Verify Pro gating** works correctly
- [ ] **Test empty state** for titles without goofs
- [ ] **Check console** for any errors

### After Deploying:

- [ ] **Monitor console logs** for any errors
- [ ] **Verify goofs load** for seeded titles
- [ ] **Test on different browsers** (localStorage compatibility)
- [ ] **Check Pro user experience** vs non-Pro

---

## Adding More Goofs (Production)

### Method 1: Update Seed Data (Requires Deployment)

Edit `apps/web/src/lib/goofs/goofsStore.ts` → `getSeedGoofs()` → Add new entries

### Method 2: Admin Tool (No Deployment Needed)

Create admin page that:
- Lists all titles with goofs
- Allows adding/editing goofs
- Saves to Firestore
- Updates appear in real-time

### Method 3: Bulk Import Script

Create a script that:
- Reads goofs from JSON/CSV file
- Validates data structure
- Imports to Firestore or updates seed data

---

## Troubleshooting

### Goofs Not Showing:

1. **Check console logs:** Look for `🎭 GoofsModal render:` logs
2. **Verify TMDB ID:** Make sure the ID matches what's in seed data
3. **Check localStorage:** Run `localStorage.getItem('flicklet.goofs.v1')` in console
4. **Verify Pro status:** Make sure user is Pro

### Modal Not Opening:

1. **Check button click:** Look for `🎭 App.tsx handleGoofsOpen called` in console
2. **Verify handler:** Check `App.tsx` has `handleGoofsOpen` function
3. **Check props:** Verify `onGoofsOpen` is passed to `ListPage`

### Data Not Persisting:

1. **Check localStorage:** Browser may block localStorage in private mode
2. **Check storage quota:** localStorage has size limits (~5-10MB)
3. **Verify save function:** Check `saveToStorage()` is being called

---

## Next Steps

1. **Choose setup option** (Option 1 for MVP, Option 2 for scale)
2. **Add seed data** for your most popular titles
3. **Test thoroughly** with real users
4. **Monitor usage** and gather feedback
5. **Plan admin tool** if you want to add goofs without deployments

---

**The feature is ready - you just need to populate the data!** 🎉

