# Flicker Root Cause Analysis - Comprehensive Report

## Diagnostic Data Summary
- **Total Events**: 200 (log limit reached)
- **By Component**: 
  - `useCustomLists`: 164 STATE_CHANGE events (82% of all events!)
  - `useAuth`: 14 events (7 SUBSCRIPTION + 7 STATE_CHANGE)
  - `useUsername`: 8 events
  - `SnarkDisplay`: 8 STATE_CHANGE events
  - `CustomListManager`: 2 SUBSCRIPTION events
  - Others: 4 events

- **By Event Type**:
  - `STATE_CHANGE`: 181 events (90.5%)
  - `SUBSCRIPTION`: 14 events (7%)
  - `LOAD_SUCCESS`: 2 events
  - `LOAD_START`: 1 event
  - `RENDER`: 1 event
  - `library:updated`: 1 event

## Critical Problems Identified

### 🔴 PROBLEM #1: useCustomLists Massive State Change Cascade
**Severity**: CRITICAL  
**Impact**: 164 state change events in ~6ms (1762620359515-1762620359521)

**Root Cause**:
1. **Location**: `apps/web/src/lib/customLists.ts:242`
2. **Issue**: State change logging happens INSIDE the subscription callback, which means:
   - It logs for EVERY component that uses `useCustomLists` hook
   - It logs even when the value hasn't actually changed (uses stale closure value)
   - 5 components use this hook: SettingsPage, MobileTabs, Tabs, MyListsPage, ListSelectorModal
   - Each `CustomListManager.emitChange()` triggers 5 subscription callbacks
   - Each callback logs a state change, even if `userLists.customLists.length` hasn't changed

**Evidence**:
- All 164 events are `useCustomLists` STATE_CHANGE events
- All within 6ms window
- Pattern: Multiple rapid state changes with same timestamp (within 1ms)

**Code Issue**:
```typescript
// Line 238-244: Logs on EVERY subscription callback, not just when value changes
const unsubscribe = customListManager.subscribe(() => {
  const newLists = customListManager.getUserLists();
  // ⚠️ PROBLEM: userLists is from closure, might be stale
  // ⚠️ PROBLEM: Logs even if length hasn't changed
  flickerDiagnostics.logStateChange('useCustomLists', 'userLists', 
    userLists.customLists.length, newLists.customLists.length);
  setUserLists(newLists);
});
```

**Why 164 events?**
- If `syncCountsFromLibrary()` is called, it triggers `emitChange()`
- `emitChange()` notifies all 5 components
- Each component logs a state change
- But 164 suggests either:
  - Multiple `emitChange()` calls in rapid succession
  - OR the hook is being called more times than expected
  - OR there's a loop where state changes trigger more state changes

---

### 🔴 PROBLEM #2: useAuth Double Logging Per Component
**Severity**: HIGH  
**Impact**: 14 events (7 SUBSCRIPTION + 7 STATE_CHANGE) in 2ms (1762620359993-1762620359995)

**Root Cause**:
1. **Location**: `apps/web/src/hooks/useAuth.ts:30-45`
2. **Issue**: Logs BOTH subscription callback AND state change for every component
3. **Components using useAuth**: ~7 components (App, SnarkDisplay, AvatarMenu, AccountButton, AuthModal, PostCard, CommentComposer, etc.)

**Evidence**:
- Pattern: SUBSCRIPTION → STATE_CHANGE → SUBSCRIPTION → STATE_CHANGE (alternating)
- All within 2ms window
- 7 pairs = 14 total events

**Code Issue**:
```typescript
// Line 30-45: Logs subscription callback
authManager.subscribe((authUser) => {
  flickerDiagnostics.logSubscription('useAuth', 'auth', {...}); // ⚠️ Log #1
  
  const oldUser = user; // ⚠️ PROBLEM: user is from closure, always stale!
  setUser(authUser);
  
  flickerDiagnostics.logStateChange('useAuth', 'user', oldUser?.uid, authUser?.uid); // ⚠️ Log #2
});
```

**Problems**:
1. Logs subscription callback (unnecessary - we already track this at AuthManager level)
2. Logs state change with STALE `oldUser` value (closure captures initial value, not previous)
3. With 7 components, each auth notification = 14 logs

---

### 🔴 PROBLEM #3: SnarkDisplay Logging on Every Render
**Severity**: MEDIUM  
**Impact**: 8 STATE_CHANGE events

**Root Cause**:
1. **Location**: `apps/web/src/components/SnarkDisplay.tsx:14-15`
2. **Issue**: Logs state changes on EVERY render, not just when values change

**Evidence**:
- 8 STATE_CHANGE events from SnarkDisplay
- Component renders whenever username or isAuthenticated changes
- But logs even when values are the same

**Code Issue**:
```typescript
// Line 14-15: Logs on EVERY render, even if values haven't changed
flickerDiagnostics.logStateChange('SnarkDisplay', 'username', username || '', username || '');
flickerDiagnostics.logStateChange('SnarkDisplay', 'isAuthenticated', isAuthenticated, isAuthenticated);
```

**Problem**:
- Logs `username` change with same oldValue and newValue (always empty string)
- Logs `isAuthenticated` change with same oldValue and newValue
- This is noise, not actual state changes

---

### 🔴 PROBLEM #4: useUsername Multiple Auth Subscription Logs
**Severity**: MEDIUM  
**Impact**: 3 SUBSCRIPTION events in 1ms (1762620359995-1762620359996)

**Root Cause**:
1. **Location**: `apps/web/src/hooks/useUsername.ts:249-254`
2. **Issue**: Logs every auth subscription callback, even though debouncing prevents multiple `loadUsername()` calls
3. **Components using useUsername**: ~3 components (SnarkDisplay, UsernamePromptModal, FlickletHeader)

**Evidence**:
- 3 SUBSCRIPTION events within 1ms
- Then LOAD_START 307ms later (debounce working)
- But we're still logging the 3 rapid subscription callbacks

**Code Issue**:
```typescript
// Line 249-254: Logs every auth subscription, even if debounced
authManager.subscribe((user) => {
  getDiagnostics()?.logSubscription('useUsername', 'auth', {...}); // ⚠️ Logs 3 times
  // ... debounce logic prevents loadUsername() from running 3 times
});
```

**Problem**:
- Debouncing prevents the actual problem (multiple loadUsername calls)
- But we're still logging the subscription callbacks, creating noise
- Should only log when `loadUsername()` actually starts, not on every subscription

---

### 🔴 PROBLEM #5: useAuth Stale Closure in State Change Logging
**Severity**: MEDIUM  
**Impact**: Incorrect "oldValue" in state change logs

**Root Cause**:
1. **Location**: `apps/web/src/hooks/useAuth.ts:39-44`
2. **Issue**: Uses `user` from closure, which is always the initial value, not the previous value

**Code Issue**:
```typescript
const oldUser = user; // ⚠️ PROBLEM: user is from useState initial value, not previous value
setUser(authUser);
flickerDiagnostics.logStateChange('useAuth', 'user', oldUser?.uid, authUser?.uid);
```

**Problem**:
- `user` in closure is the initial state value
- After first `setUser()`, the closure still has the old value
- So we're logging incorrect "oldValue" → "newValue" transitions
- Makes diagnostics misleading

---

### 🔴 PROBLEM #6: useCustomLists Stale Closure in State Change Logging
**Severity**: MEDIUM  
**Impact**: Incorrect "oldValue" in state change logs

**Root Cause**:
1. **Location**: `apps/web/src/lib/customLists.ts:242`
2. **Issue**: Uses `userLists` from closure, which might be stale

**Code Issue**:
```typescript
const unsubscribe = customListManager.subscribe(() => {
  const newLists = customListManager.getUserLists();
  // ⚠️ PROBLEM: userLists is from closure, might be stale
  flickerDiagnostics.logStateChange('useCustomLists', 'userLists', 
    userLists.customLists.length, newLists.customLists.length);
  setUserLists(newLists);
});
```

**Problem**:
- `userLists` in closure might not reflect the current state
- If multiple `emitChange()` calls happen rapidly, the closure value is stale
- Logs incorrect "oldValue" → "newValue" transitions

---

### 🔴 PROBLEM #7: CustomListManager.emitChange() Triggered by library:updated
**Severity**: HIGH  
**Impact**: Causes cascade of useCustomLists state changes

**Root Cause**:
1. **Location**: `apps/web/src/lib/customLists.ts:34-36`
2. **Issue**: `library:updated` event triggers `syncCountsFromLibrary()`, which calls `emitChange()`
3. **Chain**: `Library.notifyUpdate()` → `library:updated` event → `syncCountsFromLibrary()` → `emitChange()` → 5 component subscriptions → 5 state changes

**Evidence**:
- Timeline shows `library:updated` EVENT at 1762620359521
- Immediately followed by 164 useCustomLists STATE_CHANGE events
- This is the trigger for the cascade

**Code Issue**:
```typescript
// Line 34-36: Listens to library:updated and syncs counts
window.addEventListener('library:updated', () => {
  this.syncCountsFromLibrary(); // Calls emitChange() at line 198
});
```

**Problem**:
- Every `library:updated` event triggers a full count sync
- This happens even if custom list counts haven't changed
- Should only sync if counts actually changed
- Should batch/debounce to prevent rapid cascades

---

### 🔴 PROBLEM #8: Multiple useAuth Components Causing Cascade
**Severity**: MEDIUM  
**Impact**: 7 components × 2 logs = 14 events per auth notification

**Root Cause**:
1. **Location**: Multiple components using `useAuth` hook
2. **Issue**: Every component that uses `useAuth` logs both subscription and state change
3. **Components**: App, SnarkDisplay, AvatarMenu, AccountButton, AuthModal, PostCard, CommentComposer, etc.

**Problem**:
- AuthManager notifies all listeners once
- But each component logs twice (subscription + state change)
- With 7 components, that's 14 logs per auth notification
- Should only log once at the AuthManager level, not per component

---

## Additional Problems Discovered

### 🔴 PROBLEM #9: Massive Library Subscription Cascade
**Severity**: CRITICAL  
**Impact**: ~20 Library subscriptions triggered per `library:updated` event

**Root Cause**:
1. **Location**: Multiple components using `useLibrary`, `useReturningShows`, `useForYouContent`
2. **Components using Library subscriptions**:
   - **useLibrary**: ~16 instances across:
     - App.tsx: 3 (watching, wishlist, watched)
     - SettingsPage.tsx: 4 (watching, wishlist, watched, not)
     - MobileTabs.tsx: 3 (watching, wishlist, watched)
     - Tabs.tsx: 3 (watching, wishlist, watched)
     - HomeUpNextRail.tsx: 1 (watching)
     - HomeYourShowsRail.tsx: 1 (watching)
     - NotInterestedModal.tsx: 1 (not)
   - **useReturningShows**: 3 instances (App, MobileTabs, Tabs)
   - **useForYouContent**: 1 instance (App, but internally uses multiple useGenreContent)
   - **Total**: ~20 Library subscriptions

3. **Event Chain**:
   ```
   Firebase data loads
   → mergeCloudData()
   → Library.reloadFromStorage(true)
   → Library.notifyUpdate()
   → requestAnimationFrame
   → emit() [triggers ~20 Library subscriptions]
   → window.dispatchEvent('library:updated')
   → CustomListManager.syncCountsFromLibrary()
   → emitChange() [triggers 5 useCustomLists subscriptions]
   → 164 useCustomLists STATE_CHANGE events
   ```

**Problem**:
- Every `library:updated` event triggers ~20 Library subscription callbacks
- Each callback checks if items changed (good), but still causes potential re-renders
- With React 18 batching, these should be batched, but the rapid succession still causes flicker
- The cascade multiplies: 20 Library subscriptions → 1 library:updated event → 5 useCustomLists subscriptions → 164 state changes

---

### 🔴 PROBLEM #10: useLibrary Logs on Every Render
**Severity**: MEDIUM  
**Impact**: Console noise, but also indicates unnecessary renders

**Root Cause**:
1. **Location**: `apps/web/src/lib/storage.ts:568`
2. **Issue**: `useLibrary` logs "returning" on EVERY render, not just when items change

**Code Issue**:
```typescript
// Line 568: Logs on EVERY render
console.log(`🔍 useLibrary(${list}) returning:`, items.length, 'items');
return items;
```

**Problem**:
- This log happens on every component render
- With ~16 useLibrary instances, that's 16 logs per App render
- Indicates components are re-rendering more than necessary

---

### 🔴 PROBLEM #11: AuthManager Triple Notification Pattern
**Severity**: HIGH  
**Impact**: 3 auth notifications per auth state change

**Root Cause**:
1. **Location**: `apps/web/src/lib/auth.ts:499-522`
2. **Issue**: AuthManager notifies listeners 3 times:
   - Immediate notification (line 499)
   - After Firestore operations complete (line 517)
   - On error (line 521)

**Code Issue**:
```typescript
// Line 499: Immediate notification
this.listeners.forEach(listener => listener(authUser));

// Line 517: Notification after Firestore operations
this.listeners.forEach(listener => listener(authUser));

// Line 521: Notification on error
this.listeners.forEach(listener => listener(authUser));
```

**Problem**:
- Each notification triggers all useAuth hooks (~7 components)
- Each useAuth hook logs subscription + state change = 14 logs per notification
- 3 notifications = 42 logs total
- This is why we see 3 useUsername subscription logs in rapid succession

---

### 🔴 PROBLEM #12: useForYouContent Library Subscription
**Severity**: MEDIUM  
**Impact**: Additional Library subscription that may not be necessary

**Root Cause**:
1. **Location**: `apps/web/src/hooks/useGenreContent.ts:37`
2. **Issue**: useForYouContent subscribes to Library changes, but only updates when library SIZE changes
3. **Problem**: This subscription is triggered on every Library update, even if size hasn't changed

**Code Issue**:
```typescript
// Line 37-46: Subscribes to Library, but only updates on size change
useEffect(() => {
  const unsubscribe = Library.subscribe(() => {
    const currentSize = Library.getAll().length;
    if (currentSize !== prevLibrarySizeRef.current) {
      setLibraryVersion(prev => prev + 1);
    }
  });
  return unsubscribe;
}, []);
```

**Problem**:
- Subscription callback runs on every Library update
- Even though it checks size, the callback itself is still executed
- With ~20 Library subscriptions, this adds to the cascade

---

### 🔴 PROBLEM #13: useReturningShows Library Subscription
**Severity**: MEDIUM  
**Impact**: Additional Library subscription

**Root Cause**:
1. **Location**: `apps/web/src/state/selectors/useReturningShows.ts:19`
2. **Issue**: useReturningShows subscribes to Library and updates version on every change
3. **Problem**: Updates version even if returning shows haven't changed

**Code Issue**:
```typescript
// Line 19: Updates version on every Library change
const unsub = Library.subscribe(() => setVersion(v => v + 1));
```

**Problem**:
- Updates version on EVERY Library change, not just when returning shows change
- This triggers useMemo recalculation even if result is the same
- 3 instances = 3 subscriptions that all update on every Library change

---

### 🔴 PROBLEM #14: CommunityPanel Not Directly Related to Library
**Severity**: LOW  
**Impact**: CommunityPanel flicker is separate from Library cascade

**Root Cause**:
1. **Location**: `apps/web/src/components/CommunityPanel.tsx`
2. **Issue**: CommunityPanel flicker is likely caused by:
   - Parent component (App) re-rendering due to Library/auth state changes
   - CommunityPanel re-renders when App re-renders
   - Even though CommunityPanel doesn't use Library directly

**Problem**:
- CommunityPanel flicker is a symptom, not a cause
- The real issue is the Library/auth cascade causing App to re-render
- CommunityPanel re-renders as a side effect of parent re-renders

---

## Summary of All Problems

1. ✅ **useCustomLists**: 164 state change events - logs on every subscription callback, uses stale closure
2. ✅ **useAuth**: 14 events - double logging (subscription + state change), stale closure
3. ✅ **SnarkDisplay**: 8 events - logs on every render, not just when values change
4. ✅ **useUsername**: 3 subscription logs - logs even when debounced
5. ✅ **useAuth stale closure**: Incorrect oldValue in logs
6. ✅ **useCustomLists stale closure**: Incorrect oldValue in logs
7. ✅ **CustomListManager cascade**: library:updated triggers unnecessary syncCountsFromLibrary()
8. ✅ **Multiple useAuth components**: Each component logs separately, causing duplication
9. ✅ **Massive Library subscription cascade**: ~20 Library subscriptions triggered per update
10. ✅ **useLibrary logs on every render**: Console noise, indicates unnecessary renders
11. ✅ **AuthManager triple notification**: 3 notifications per auth state change = 42 logs
12. ✅ **useForYouContent Library subscription**: Additional subscription in cascade
13. ✅ **useReturningShows Library subscription**: Updates version on every Library change
14. ✅ **CommunityPanel indirect re-renders**: Re-renders due to parent (App) re-renders from cascade

## Recommendations

### Immediate Fixes Needed (Priority Order):

#### Critical (Causes Most Flicker):
1. **Fix useCustomLists logging**: Only log when value actually changes, use ref to track previous value
2. **Fix CustomListManager cascade**: Only sync counts if they actually changed, debounce syncCountsFromLibrary()
3. **Fix Library subscription cascade**: Optimize all ~20 Library subscriptions to prevent unnecessary callbacks
4. **Fix AuthManager triple notification**: Consolidate to single notification after all operations complete

#### High Priority (Significant Impact):
5. **Fix useAuth logging**: Remove subscription logging (already tracked at AuthManager), fix stale closure
6. **Fix useReturningShows**: Only update version when returning shows actually change
7. **Fix useForYouContent**: Optimize Library subscription to prevent unnecessary callbacks

#### Medium Priority (Reduces Noise):
8. **Fix SnarkDisplay logging**: Only log when values actually change, use ref to track previous values
9. **Fix useUsername logging**: Only log when loadUsername() actually starts, not on every subscription
10. **Fix useLibrary render logging**: Remove or conditionally log "returning" messages
11. **Fix stale closures**: Use refs to track previous values for accurate logging in all hooks

#### Low Priority (Cleanup):
12. **Fix CommunityPanel indirect re-renders**: Memoize CommunityPanel to prevent re-renders from parent
13. **Review all Library subscriptions**: Audit all ~20 subscriptions for optimization opportunities

### Complete Event Chain Analysis:

**Current Flow (Causes Cascade)**:
```
Firebase data loads
→ mergeCloudData()
→ Library.reloadFromStorage(true)
→ Library.notifyUpdate()
→ requestAnimationFrame
→ emit() [~20 Library subscriptions fire]
→ window.dispatchEvent('library:updated')
→ CustomListManager.syncCountsFromLibrary() [always runs]
→ emitChange() [5 useCustomLists subscriptions fire]
→ 164 STATE_CHANGE events logged
```

**Optimized Flow (Should Be)**:
```
Firebase data loads
→ mergeCloudData()
→ Library.reloadFromStorage(true)
→ Library.notifyUpdate()
→ requestAnimationFrame
→ emit() [~20 Library subscriptions fire, but only update if changed]
→ window.dispatchEvent('library:updated')
→ CustomListManager.syncCountsFromLibrary() [only if counts changed]
→ emitChange() [only if counts changed, 5 useCustomLists subscriptions fire]
→ Minimal STATE_CHANGE events (only when actually changed)
```

### Performance Impact:
- **164 useCustomLists events** in 6ms = potential 164 re-renders (if not batched)
- **14 useAuth events** in 2ms = potential 14 re-renders (if not batched)
- **~20 Library subscriptions** = potential 20 subscription callbacks per update
- **3 AuthManager notifications** = 3 × 14 = 42 potential logs per auth change
- **Total**: 181+ state change events in ~500ms window

### Visual Impact:
- These cascades likely cause the flicker you're seeing
- Each state change can trigger component re-renders
- Even if React batches them, the rapid succession causes visual flicker
- CommunityPanel flicker is a symptom of App re-rendering due to Library/auth cascades

