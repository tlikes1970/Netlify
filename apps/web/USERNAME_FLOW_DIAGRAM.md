# Username Prompt Flow - Complete Process

## Expected Flow (Step-by-Step)

### Phase 1: User Signs In

#### Step 1: Authentication Initiated
- User clicks "Sign in with Google"
- `googleLogin()` is called
- **Localhost**: Opens popup, completes immediately
- **Production**: Redirects to Google, then back to app

#### Step 2: Page Loads (After Redirect in Production)
- `main.tsx` bootstraps Firebase
- `firebaseReady` promise resolves
- `authManager` initializes
- `getRedirectResult()` processes OAuth redirect (if applicable)

#### Step 3: Firebase Auth State Changes
- `onAuthStateChanged` fires in `auth.ts:205`
- User is authenticated
- `authManager.setStatus('authenticated')`
- `authManager.currentUser` is set

#### Step 4: User Document Created/Updated
- `authManager.ensureUserDocument()` is called (line 319)
- If new user: Creates Firestore document with default `settings.usernamePrompted: false`
- If existing user: Updates `lastLoginAt` timestamp
- **Critical**: Default for new users is `usernamePrompted: false`

#### Step 5: Auth Manager Notifies Listeners
- `authManager.listeners.forEach(listener => listener(authUser))` (line 327)
- All subscribed components receive auth state change

---

### Phase 2: Username State Loading

#### Step 6: useUsername Hook Subscribes
- `FlickletHeader` renders and calls `useUsername()`
- `useUsername` hook subscribes to `authManager` (line 149)
- When auth state changes, subscription callback fires

#### Step 7: loadUsername() is Called
- Subscription callback calls `loadUsername()` (line 157)
- **Timing**: This happens AFTER auth state is confirmed
- **Critical Point**: Firestore read happens here

#### Step 8: Firestore Read
- `authManager.getUserSettings(currentUser.uid)` is called (line 89)
- Reads from `users/{uid}/settings` in Firestore
- Gets `username` and `usernamePrompted` values
- **Timing Issue**: This read can be slow (especially on production networks)

#### Step 9: State Manager Updated
- `usernameStateManager.setUsername(usernameValue)` (line 99)
- `usernameStateManager.setUsernamePrompted(promptedValue)` (line 98)
- `usernameStateManager.setLoading(false)` (line 142)
- **Critical**: State is now available to components

---

### Phase 3: Prompt Display Decision

#### Step 10: FlickletHeader Checks Conditions
- `FlickletHeader` useEffect runs (line 67)
- Checks: `if (loading) return;` - **Blocks if still loading**
- Checks: `if (hasShownRef.current) return;` - **Blocks if already shown**
- Calculates: `shouldShow = !!(user?.uid && !username && !usernamePrompted)` (line 78)

#### Step 11: Modal Display Decision
- If `shouldShow === true` AND `!showUsernamePrompt`:
  - `setShowUsernamePrompt(true)` (line 111)
  - `hasShownRef.current = true` (line 112)
  - Modal appears

#### Step 12: User Interaction
- **Option A: User Enters Username**
  - `updateUsername()` is called
  - Updates Firebase Auth `displayName`
  - Updates Firestore `settings.username` and `settings.usernamePrompted: true`
  - Modal closes

- **Option B: User Clicks Skip**
  - `skipUsernamePrompt()` is called
  - Sets `skipInProgress = true` (optimistic update)
  - Updates Firestore `settings.usernamePrompted: true`
  - Waits for write to complete
  - Clears `skipInProgress` flag after delay
  - Modal closes

---

## Critical Timing Points

### ⚠️ Race Condition #1: Loading State
**Location**: `FlickletHeader.tsx:69`
```typescript
if (loading) {
  return; // Blocks prompt check
}
```

**Issue**: If `loading` is still `true` when prompt check runs, modal won't show even if it should.

**When This Happens**:
- Firestore read is slow (> 500ms)
- Prompt check runs before read completes
- `loading` is `true`, so check is blocked
- Read completes, `loading` becomes `false`
- But `hasShownRef.current` might already be set, preventing re-check

### ⚠️ Race Condition #2: Multiple Loads
**Location**: `useUsername.ts:146-165`

**Issue**: `loadUsername()` is called:
1. Once on mount (line 146)
2. Every time auth state changes (line 157)
3. Potentially multiple times if auth state fires multiple times

**Evidence from Your Logs**: You see `🔄 Loading username for user` 6+ times

**Impact**: 
- Multiple Firestore reads (performance)
- State updates multiple times
- Potential race conditions

### ⚠️ Race Condition #3: Skip Flag Timing
**Location**: `useUsername.ts:240-243`

**Issue**: `skipInProgress` flag clears after timeout, but:
- If Firestore write takes > timeout, flag clears too early
- `loadUsername()` might overwrite optimistic state
- Current timeout: `Math.max(500, writeTime * 1.5)`

**When This Fails**:
- Slow network (write takes 2000ms)
- Timeout is 3000ms (2000 * 1.5)
- But if another `loadUsername()` runs during this time, it's blocked by flag
- Flag clears, but if write isn't complete, next read gets stale data

---

## Expected Behavior by Scenario

### Scenario A: New User (First Sign-In)
1. User signs in → Auth state changes
2. `ensureUserDocument()` creates document with `usernamePrompted: false`
3. `loadUsername()` reads Firestore → Gets `usernamePrompted: false`
4. `FlickletHeader` checks → `shouldShow = true` (no username, not prompted)
5. **Modal appears** ✅

### Scenario B: Returning User (Already Prompted)
1. User signs in → Auth state changes
2. `loadUsername()` reads Firestore → Gets `usernamePrompted: true`
3. `FlickletHeader` checks → `shouldShow = false` (already prompted)
4. **Modal does NOT appear** ✅

### Scenario C: User Has Username
1. User signs in → Auth state changes
2. `loadUsername()` reads Firestore → Gets `username: "Travis"`, `usernamePrompted: true`
3. `FlickletHeader` checks → `shouldShow = false` (has username)
4. **Modal does NOT appear** ✅

### Scenario D: User Skipped (No Username, But Prompted)
1. User signs in → Auth state changes
2. `loadUsername()` reads Firestore → Gets `username: ""`, `usernamePrompted: true`
3. `FlickletHeader` checks → `shouldShow = false` (already prompted)
4. **Modal does NOT appear** ✅

---

## What Can Go Wrong

### Problem 1: Prompt Doesn't Show (Should Show)
**Symptoms**:
- New user signs in
- `usernamePrompted: false` in Firestore
- But modal doesn't appear

**Possible Causes**:
1. **Loading state blocks check**: Firestore read is slow, check runs while `loading: true`
2. **hasShownRef prevents re-check**: Check runs before data loads, sets `hasShownRef = true`, then data loads but check doesn't run again
3. **Firestore read fails**: Error in `getUserSettings()`, state never updates
4. **Auth state fires multiple times**: First fire sets `hasShownRef`, subsequent fires don't trigger check

### Problem 2: Prompt Shows Multiple Times
**Symptoms**:
- Modal appears, user closes it
- Modal appears again

**Possible Causes**:
1. **hasShownRef resets**: User UID changes (shouldn't happen)
2. **State resets**: `usernamePrompted` gets reset to `false` somehow
3. **Multiple components**: Multiple `FlickletHeader` instances (shouldn't happen)

### Problem 3: Skip Doesn't Persist
**Symptoms**:
- User clicks skip
- Modal closes
- User refreshes page
- Modal appears again

**Possible Causes**:
1. **Firestore write fails**: Write doesn't complete, `usernamePrompted` stays `false`
2. **Timeout too short**: `skipInProgress` flag clears before write completes, `loadUsername()` overwrites state
3. **Race condition**: `loadUsername()` runs during skip, overwrites optimistic state

---

## Key Dependencies

### Dependency Chain
```
Auth State Change
  ↓
authManager.notifyListeners()
  ↓
useUsername subscription fires
  ↓
loadUsername() called
  ↓
Firestore read (can be slow)
  ↓
State manager updated
  ↓
FlickletHeader re-renders
  ↓
Prompt check runs
  ↓
Modal shows (if conditions met)
```

### Critical Timing
- **Auth state change** → **Firestore read** → **State update** → **Prompt check**
- If any step is slow, the chain breaks
- **Production**: Redirect adds page reload, making timing more critical

---

## Investigation Points

### Point 1: When Does loadUsername() Run?
Check logs for:
- `🔄 Loading username for user:` - Should appear after auth state changes
- Count how many times it appears (you're seeing 6+)

### Point 2: How Long Does Firestore Read Take?
Check logs for:
- `✅ Username loaded:` with `loadTimeMs` value
- Should be < 1000ms typically
- > 2000ms indicates slow network

### Point 3: When Does Prompt Check Run?
Check logs for:
- `🎯 Username prompt check:` - Shows decision logic
- Check `loading` value - should be `false` when check runs
- Check `shouldShow` value - should match actual behavior

### Point 4: Does State Update Correctly?
Check Firestore directly:
- After sign-in, check `users/{uid}/settings`
- Verify `usernamePrompted` value matches what code expects
- Check if field exists (not missing)

---

## Summary

The flow is:
1. **Sign in** → Auth state changes
2. **User document** → Created/updated in Firestore
3. **Username state** → Loaded from Firestore
4. **Prompt check** → Runs when state is ready
5. **Modal shows** → If conditions met

**Critical timing**: The gap between auth state change and Firestore read completion is where issues occur, especially on slow networks or after redirects.

