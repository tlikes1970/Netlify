# Sign-On Process Issues Found

## Critical Issues

### 1. ⚠️ TRIPLE `getRedirectResult()` CALLS - Race Condition Risk

**Location:**
- `main.tsx:327` - Called with 3-second timeout
- `authFlow.ts:34` - Called in `initAuthOnLoad()`
- `auth.ts:220` - Called as fallback (guarded by `isInitDone()` check)

**Problem:**
Firebase's `getRedirectResult()` can only be called **once** per redirect. Calling it multiple times can:
- Consume the redirect result in the wrong place
- Cause the second/third call to return `null` even though auth succeeded
- Lead to inconsistent auth state

**Current Guard:**
- `auth.ts` checks `isInitDone()` before calling, but there's a race window
- `main.tsx` has no guard - it just calls it with a timeout

**Impact:**
- User might authenticate successfully but app doesn't recognize it
- Auth state might be inconsistent
- Could cause sign-in loops

**Recommendation:**
- Remove `getRedirectResult()` from `main.tsx` (line 327) - it's redundant
- Ensure `authFlow.ts` is called FIRST and completes before `auth.ts` initializes
- Add explicit coordination between the two handlers

---

### 2. ⚠️ RACE CONDITION: Username Loading vs Document Creation

**Location:**
- `auth.ts:432` - `ensureUserDocument()` is called
- `auth.ts:439` - Listeners are notified AFTER document creation
- `useUsername.ts:103` - `loadUsername()` is triggered by listener

**Problem:**
Even though listeners are notified after `ensureUserDocument()` completes, there's a timing window:

1. `ensureUserDocument()` writes to Firestore (async)
2. Listeners are notified
3. `loadUsername()` reads from Firestore
4. **BUT:** Firestore write might not be fully propagated yet
5. `loadUsername()` reads document that doesn't exist or has stale data

**Evidence:**
- New users get `usernamePrompted: false` by default
- If `loadUsername()` runs before document is readable, it might get `null`
- This could cause the prompt to not show even though it should

**Impact:**
- Username prompt might not appear for new users
- Inconsistent username state
- User might be stuck without username

**Recommendation:**
- Add retry logic in `loadUsername()` if document doesn't exist
- Or: Wait for `ensureUserDocument()` to complete before notifying listeners
- Or: Read document in `ensureUserDocument()` and pass data to listeners

---

### 3. ⚠️ MISSING CLOSING BRACE in `usernameFlow.ts`

**Location:** `apps/web/src/features/username/usernameFlow.ts:42-43`

**Code:**
```typescript
if (isAuthDebug()) {
  logAuth('username_has_existing', { username: existing });
}
return { status: 'has', username: existing };  // ⚠️ Missing closing brace above
```

**Problem:**
The `if` statement at line 40-42 is missing a closing brace. The `return` statement should be inside the `if` block, but the brace structure is wrong.

**Current Structure:**
```typescript
if (existing) {
  if (isAuthDebug()) {
    logAuth('username_has_existing', { username: existing });
  }  // ⚠️ This closes the isAuthDebug() if, but...
  return { status: 'has', username: existing };  // This is outside the if (existing) block?
}
```

Wait, let me re-check... Actually looking at the code, it seems correct. The structure is:
```typescript
if (existing) {
  if (isAuthDebug()) {
    logAuth(...);
  }
  return { status: 'has', username: existing };
}
```

This is actually correct. The issue I thought I saw isn't there. Let me verify by reading the actual file structure.

---

### 4. ⚠️ TIMING: Firebase Sync vs Username Loading

**Location:**
- `auth.ts:436` - `loadFromFirebase()` is called
- `auth.ts:439` - Listeners notified after sync completes
- `useUsername.ts` - Username loading happens in parallel

**Problem:**
Both `loadFromFirebase()` and `loadUsername()` read from the same Firestore document, but:
- They're not coordinated
- They could read at different times
- If document is being written/updated, they might get inconsistent data

**Impact:**
- Low - both operations are reads, so no data corruption
- But could cause unnecessary Firestore reads
- Performance impact on slow networks

**Recommendation:**
- Consider batching reads if both need the same document
- Or: Load username as part of the initial user document read

---

### 5. ⚠️ POTENTIAL: Username Prompt Not Showing for New Users

**Location:** `useUsername.ts:240` - `needsUsernamePrompt()` check

**Problem:**
The check is:
```typescript
const result = !!(currentUser?.uid && !username && !usernamePrompted);
```

But if `loadUsername()` hasn't completed yet:
- `username` might be `""` (empty string, falsy)
- `usernamePrompted` might be `false` (default for new users)
- Check returns `true` → prompt should show

**However:** If `loading` is still `true`, the check is blocked:
```typescript
if (loading) return false;  // Blocks prompt
```

**Race Scenario:**
1. User signs in
2. `loadUsername()` starts (loading = true)
3. `needsUsernamePrompt()` called (loading = true) → returns false
4. `loadUsername()` completes (loading = false, usernamePrompted = false)
5. But `needsUsernamePrompt()` might not be called again
6. Prompt never shows

**Impact:**
- New users might not see username prompt
- User stuck without username

**Recommendation:**
- Ensure `needsUsernamePrompt()` is re-checked after `loading` becomes false
- Or: Show prompt optimistically if user is new (check `ensureUserDocument` completion)

---

## Medium Priority Issues

### 6. ⚠️ Multiple Firestore Reads for Same Data

**Location:**
- `auth.ts:432` - `ensureUserDocument()` reads document to check existence
- `auth.ts:436` - `loadFromFirebase()` reads entire document
- `useUsername.ts:135` - `getUserSettings()` reads document again

**Problem:**
Same document is read 3 times in quick succession:
1. Check if exists (in `ensureUserDocument`)
2. Load watchlists (in `loadFromFirebase`)
3. Load settings/username (in `getUserSettings`)

**Impact:**
- 3x Firestore read operations
- Slower load time
- Higher Firebase costs
- Network overhead

**Recommendation:**
- Batch reads into single operation
- Cache document after first read
- Pass data between functions instead of re-reading

---

### 7. ⚠️ No Error Recovery for Failed Document Creation

**Location:** `auth.ts:464` - `ensureUserDocument()`

**Problem:**
If `setDoc()` or `updateDoc()` fails:
- Error is logged but not handled
- User might be authenticated but have no Firestore document
- Subsequent operations (username, sync) will fail
- No retry mechanism

**Impact:**
- User authenticated but can't use app features
- Username prompt won't work
- Data sync won't work
- Silent failure

**Recommendation:**
- Add retry logic with exponential backoff
- Show user-friendly error message
- Fallback to local-only mode if Firestore fails

---

## Low Priority / Code Quality Issues

### 8. Inconsistent Persistence Settings

**Location:**
- `firebaseBootstrap.ts:69` - Sets `indexedDBLocalPersistence`
- `authFlow.ts:24` - Sets `browserLocalPersistence`
- `auth.ts:567` - Sets `browserLocalPersistence` (Apple sign-in)

**Problem:**
Different persistence modes are set in different places:
- `indexedDBLocalPersistence` - More reliable, survives browser restarts
- `browserLocalPersistence` - Less reliable, might not survive restarts

**Impact:**
- Inconsistent behavior across auth methods
- Users might get logged out unexpectedly
- Confusing for debugging

**Recommendation:**
- Standardize on one persistence mode
- Set it once in bootstrap, don't override later

---

### 9. Missing Error Handling in Username Transaction

**Location:** `usernameFlow.ts:53` - `runTransaction()`

**Problem:**
Transaction errors are thrown but not specifically handled:
- `USERNAME_TAKEN` - Handled (thrown)
- Network errors - Not specifically handled
- Timeout - Handled via Promise.race
- But no retry logic for transient failures

**Impact:**
- Username claim might fail on network hiccup
- User has to retry manually
- No automatic recovery

**Recommendation:**
- Add retry logic for network errors
- Distinguish between permanent (USERNAME_TAKEN) and transient errors

---

## Summary

### Critical (Fix Immediately):
1. **Triple `getRedirectResult()` calls** - Could break authentication
2. **Race condition: Username loading vs document creation** - Could prevent username prompt

### High Priority:
3. **Username prompt timing** - New users might not see prompt
4. **Multiple Firestore reads** - Performance and cost issue

### Medium Priority:
5. **No error recovery for document creation** - Silent failures
6. **Inconsistent persistence settings** - Reliability issues

### Low Priority:
7. **Missing error handling in transactions** - User experience

---

## Recommended Fix Order

1. **Fix `getRedirectResult()` triple call** - Remove from `main.tsx`, ensure proper sequencing
2. **Fix race condition** - Add retry logic or coordinate document creation with username loading
3. **Optimize Firestore reads** - Batch or cache document reads
4. **Add error recovery** - Retry logic for document operations
5. **Standardize persistence** - Use one persistence mode consistently

