# Settings Cross-Device Sync Audit Report

## Executive Summary

**Critical Finding:** Settings are currently stored **only in localStorage** and are **NOT synchronized** to Firebase. This means settings changed on one device (e.g., PC browser) will **NOT** appear on another device (e.g., mobile phone) for the same logged-in account.

---

## Current State Analysis

### How Settings Are Currently Stored

**Location:** `apps/web/src/lib/settings.ts`

**Storage Mechanism:**
- Settings are stored in browser localStorage with key: `flicklet.settings.v2`
- Settings are **NOT** written to Firebase/Firestore
- Settings are **NOT** loaded from Firebase on login

**Settings Structure:**
```typescript
interface Settings {
  displayName: string;
  personalityLevel: PersonalityLevel;
  notifications: {
    upcomingEpisodes: boolean;
    weeklyDiscover: boolean;
    monthlyStats: boolean;
    alertConfig?: { leadTimeHours: number; targetList: TargetList; };
  };
  layout: {
    condensedView: boolean;
    theme: Theme;
    homePageLists: string[];
    forYouGenres: string[];
    episodeTracking: boolean;
    themePack?: string;
    discoveryLimit: 25 | 50 | 75 | 100;
  };
  pro: {
    isPro: boolean;
    features: { ... };
  };
  community: {
    followedTopics: string[];
  };
}
```

### Current Settings Update Flow

**When settings change:**
1. User changes a setting (e.g., theme, personality level)
2. `settingsManager.update*()` method is called
3. Settings are saved to localStorage only (`saveSettings()` method)
4. **NO Firebase sync occurs**

**Files that update settings:**
- `apps/web/src/components/settingsSections.tsx` - Main settings UI
- `apps/web/src/components/CommunityPanel.tsx` - Community topic follows
- `apps/web/src/App.tsx` - Theme changes
- `apps/web/src/pages/AdminExtrasPage.tsx` - Admin settings

### Firebase Methods Available (But Not Used for Settings)

**Location:** `apps/web/src/lib/auth.ts`

**Methods exist but are NOT called for settings:**
- `getUserSettings(uid)` - Reads settings from `users/{uid}/settings` in Firestore
- `updateUserSettings(uid, settings)` - Writes settings to `users/{uid}/settings` in Firestore

**Current usage:** These methods are **only** used for username-related settings in `useUsername.ts`, not for the main settings object.

### Login Flow Analysis

**Location:** `apps/web/src/lib/auth.ts` (lines 497-519)

**What happens on login:**
1. User authenticates
2. `firebaseSyncManager.loadFromFirebase(uid)` is called
3. **Only watchlists and game stats are loaded** from Firebase
4. **Settings are NOT loaded** from Firebase
5. Settings remain device-specific (localStorage only)

**Location:** `apps/web/src/lib/firebaseSync.ts` (lines 196-234)

**What `loadFromFirebase` does:**
- Loads `watchlists` from Firebase
- Loads `gameStats` from Firebase
- **Does NOT load `settings`** from Firebase

---

## Gap Analysis

### Missing Functionality

1. **Settings Sync to Firebase**
   - ❌ No code calls `updateUserSettings()` when settings change
   - ❌ Settings changes only write to localStorage

2. **Settings Load from Firebase**
   - ❌ No code calls `getUserSettings()` on login
   - ❌ `loadFromFirebase()` does not load settings
   - ❌ Settings remain device-specific

3. **Settings Merge Logic**
   - ❌ No conflict resolution (what if settings differ between devices?)
   - ❌ No "last write wins" or timestamp-based merging

### What Works (For Reference)

**Watchlists sync correctly:**
- ✅ Watchlists are saved to Firebase when changed
- ✅ Watchlists are loaded from Firebase on login
- ✅ Cross-device sync works for watchlists

**Game stats sync correctly:**
- ✅ Game stats are saved to Firebase
- ✅ Game stats are loaded from Firebase on login
- ✅ Cross-device sync works for game stats

---

## Impact Assessment

### User Experience Impact

**High Impact:** Users expect settings to sync across devices. Current behavior:
- User changes theme on PC → Theme does NOT appear on mobile
- User changes personality level on mobile → Personality level does NOT appear on PC
- User enables episode tracking on one device → Setting does NOT appear on other device

### Affected Settings

**All settings are affected:**
- Display name
- Personality level
- Theme (light/dark)
- Notification preferences
- Layout preferences (condensed view, episode tracking, discovery limit)
- Home page list configuration
- For You genres
- Pro status (though this may be managed separately)
- Community followed topics

---

## Recommended Solution

### Phase 1: Add Settings Sync on Change

**Modify:** `apps/web/src/lib/settings.ts`

**Add to `saveSettings()` method:**
1. After saving to localStorage, check if user is logged in
2. If logged in, call `authManager.updateUserSettings()` to sync to Firebase
3. Handle errors gracefully (don't block UI if sync fails)

### Phase 2: Add Settings Load on Login

**Modify:** `apps/web/src/lib/firebaseSync.ts`

**Add to `loadFromFirebase()` method:**
1. Load settings from Firebase using `authManager.getUserSettings()`
2. Merge Firebase settings with localStorage settings
3. Apply merged settings to `settingsManager`
4. Handle conflicts (prefer Firebase if both exist, or use timestamp)

**Alternative approach:** Load settings in `auth.ts` during login flow, similar to how watchlists are loaded.

### Phase 3: Conflict Resolution

**Strategy options:**
1. **Last write wins** - Use timestamp to determine which settings are newer
2. **Firebase wins** - Always prefer Firebase settings over localStorage
3. **Merge intelligently** - Combine non-conflicting settings, use Firebase for conflicts

**Recommended:** Start with "Firebase wins" for simplicity, add timestamp-based merging later if needed.

---

## Implementation Checklist

### Step 1: Settings Sync on Change
- [ ] Import `authManager` in `settings.ts`
- [ ] Add `syncSettingsToFirebase()` method to `SettingsManager`
- [ ] Call sync method from `saveSettings()` when user is logged in
- [ ] Add error handling (don't block UI on sync failure)
- [ ] Test: Change setting on device A, verify it appears in Firebase

### Step 2: Settings Load on Login
- [ ] Modify `loadFromFirebase()` to load settings
- [ ] OR add settings load to `auth.ts` login flow
- [ ] Merge Firebase settings with localStorage
- [ ] Apply merged settings to `settingsManager`
- [ ] Test: Change setting on device A, login on device B, verify setting appears

### Step 3: Conflict Resolution
- [ ] Implement conflict resolution strategy
- [ ] Add timestamp tracking for settings changes
- [ ] Test: Change same setting on two devices, verify correct resolution

### Step 4: Testing
- [ ] Test theme sync across devices
- [ ] Test personality level sync
- [ ] Test notification preferences sync
- [ ] Test layout preferences sync
- [ ] Test offline behavior (settings should still work locally)
- [ ] Test error scenarios (Firebase unavailable)

---

## Files That Need Modification

1. **`apps/web/src/lib/settings.ts`**
   - Add Firebase sync to `saveSettings()`
   - Add method to load settings from Firebase

2. **`apps/web/src/lib/firebaseSync.ts`**
   - Add settings loading to `loadFromFirebase()`
   - OR add separate `loadSettingsFromFirebase()` method

3. **`apps/web/src/lib/auth.ts`**
   - May need to ensure settings are loaded during login flow
   - Verify `getUserSettings()` and `updateUserSettings()` handle all settings fields

---

## Plain Language Summary (For Non-Technical Stakeholders)

**The Problem:**
- Settings are stored in a "local box" (localStorage) on each device
- When you change a setting on your PC, it stays in that PC's box
- When you log in on your phone, it looks in the phone's box, not the PC's box
- Result: Settings don't travel between devices

**The Solution:**
- When settings change, also save them to a "cloud box" (Firebase)
- When you log in, check the cloud box first and use those settings
- Result: Settings travel with your account, not your device

**The Fix:**
- Add code to copy settings to the cloud box when they change
- Add code to check the cloud box when you log in
- Handle conflicts (what if settings differ between devices)

---

## Next Steps

1. **Review this audit** - Confirm findings and approach
2. **Approve implementation plan** - Decide on conflict resolution strategy
3. **Implement Phase 1** - Add settings sync on change
4. **Implement Phase 2** - Add settings load on login
5. **Test thoroughly** - Verify cross-device sync works
6. **Deploy** - Roll out to users

---

**Audit Date:** 2024-12-19  
**Auditor:** AI Assistant  
**Status:** Ready for Review

