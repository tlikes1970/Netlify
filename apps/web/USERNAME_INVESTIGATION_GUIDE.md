# Username Prompt Investigation Guide

This guide walks through investigating the 5 potential issues identified in the auth system review.

## Prerequisites

1. Open browser console (F12 or Cmd+Option+I)
2. Ensure you're logged in
3. Have access to Firebase Console (for Firestore inspection)

---

## Investigation 1: Check if `usernamePrompted` is being set correctly in Firestore after redirect

### Step 1: Add Diagnostic Tool

The diagnostic utility is already available. Import it in `main.tsx`:

```typescript
// Add to main.tsx imports
import "./utils/usernameDiagnostics";
```

### Step 2: Run Diagnostic

In browser console after signing in (especially after a redirect):

```javascript
// Run comprehensive diagnostic
await window.debugUsername();
```

This will show:

- Current auth state
- Firestore document state
- Whether `usernamePrompted` field exists and its value
- Any issues detected

### Step 3: Manual Firestore Check

1. Go to Firebase Console → Firestore Database
2. Navigate to `users/{your-uid}`
3. Check `settings.usernamePrompted` field:
   - Should be `true` if you've skipped
   - Should be `false` if you haven't been prompted yet
   - Should be `true` if you've set a username

### Step 4: Test After Redirect

1. Sign out
2. Sign in with Google (will redirect in production)
3. Immediately after redirect, run:
   ```javascript
   await window.debugUsername();
   ```
4. Check the `firestoreState.usernamePrompted` value
5. Wait 2 seconds, run again, compare values

### Expected Results

- `usernamePrompted` should be `false` for new users
- `usernamePrompted` should be `true` after skip or username set
- Value should persist across redirects

### Red Flags

- `usernamePrompted` is `null` or `undefined` (field missing)
- Value changes unexpectedly after redirect
- Value is `false` but you've already been prompted

---

## Investigation 2: Verify Firestore read timing on production networks

### Step 1: Check Current Timing

Run diagnostic to see baseline:

```javascript
const result = await window.debugUsername();
console.log("Timing:", result.timing);
```

### Step 2: Monitor State Changes

Watch username state over time:

```javascript
// Monitor for 10 seconds
window.monitorUsernameState(10000);
```

This logs state changes every 500ms so you can see when Firestore data arrives.

### Step 3: Simulate Slow Network

In Chrome DevTools:

1. Open Network tab
2. Throttle to "Slow 3G" or "Fast 3G"
3. Sign in again
4. Run diagnostic immediately after redirect
5. Check `timing.firestoreReadTime` - should be higher

### Step 4: Check Logs

Check localStorage for timing logs:

```javascript
// View all username load logs
JSON.parse(localStorage.getItem("flicklet.username.logs") || "[]");
```

Look for:

- `loadTimeMs` values > 1000ms (slow)
- Patterns where reads take longer after redirects
- Differences between localhost and production

### Step 5: Compare Environments

1. Test on localhost (should be fast)
2. Test on production (may be slower)
3. Compare `loadTimeMs` values in logs

### Expected Results

- Localhost: < 200ms typically
- Production: < 1000ms typically
- Slow network: may be 2000-5000ms

### Red Flags

- Reads consistently > 2000ms on production
- Reads fail after redirect
- Timing varies wildly between attempts

---

## Investigation 3: Test skip functionality on slow networks

### Step 1: Enable Network Throttling

1. Chrome DevTools → Network tab
2. Set throttling to "Slow 3G"

### Step 2: Test Skip Flow

1. Sign in (or refresh if already signed in)
2. When username prompt appears, click "Skip"
3. Immediately check console for timing logs
4. Look for: `"✅ Username prompt skipped (persisted)"` with `writeTimeMs`

### Step 3: Check Skip Flag Timing

After clicking skip, watch console for:

- `"✅ Username prompt skipped (optimistic)"` (immediate)
- `"✅ Username prompt skipped (persisted)"` (after Firestore write)
- `"🔓 Skip flag cleared after X ms"` (flag cleared)

### Step 4: Verify State Persistence

1. Click skip
2. Wait 1 second
3. Refresh page
4. Run diagnostic:
   ```javascript
   await window.debugUsername();
   ```
5. Check `firestoreState.usernamePrompted` should be `true`

### Step 5: Test Write Timing

Run the write timing test:

```javascript
await window.testFirestoreWriteTiming();
```

This will:

- Write a test value
- Measure write time
- Read it back
- Measure read time
- Clean up

### Expected Results

- Skip should work even on slow networks
- Write should complete within 2000ms even on slow 3G
- State should persist after refresh

### Red Flags

- Write takes > 2000ms consistently
- State doesn't persist after refresh
- Skip flag clears before write completes (check console warnings)

---

## Investigation 4: Add production logging for username prompt decisions

### Step 1: Check Existing Logs

The enhanced logging is already added. Check logs:

```javascript
// Prompt decisions
JSON.parse(localStorage.getItem("flicklet.username.prompt.decisions") || "[]");

// Username load logs
JSON.parse(localStorage.getItem("flicklet.username.logs") || "[]");

// Errors
JSON.parse(localStorage.getItem("flicklet.username.errors") || "[]");
```

### Step 2: Export Logs for Analysis

Create a helper function in console:

```javascript
// Export all username-related logs
function exportUsernameLogs() {
  const logs = {
    decisions: JSON.parse(
      localStorage.getItem("flicklet.username.prompt.decisions") || "[]"
    ),
    loads: JSON.parse(localStorage.getItem("flicklet.username.logs") || "[]"),
    errors: JSON.parse(
      localStorage.getItem("flicklet.username.errors") || "[]"
    ),
    timestamp: new Date().toISOString(),
    environment: window.location.hostname,
  };

  const blob = new Blob([JSON.stringify(logs, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `username-logs-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  return logs;
}

// Run it
exportUsernameLogs();
```

### Step 3: Analyze Logs

Look for patterns:

- Decisions where `shouldShow: true` but modal didn't appear
- Load times that correlate with missing prompts
- Errors that occur during critical moments

### Step 4: Monitor in Production

1. Deploy to production
2. Test sign-in flow
3. Export logs after each test
4. Compare with localhost logs

### Expected Results

- Logs capture all prompt decisions
- Timing data helps identify slow operations
- Errors are captured for debugging

### Red Flags

- Missing log entries (logging failed)
- Decisions show `shouldShow: true` but no modal
- Errors during Firestore operations

---

## Investigation 5: Consider increasing skip timeout or using Firestore write completion callback

### Step 1: Check Current Timeout Behavior

After clicking skip, watch console for the timeout warning:

```javascript
// Look for this in console after skip:
// "⚠️ Firestore write took Xms (longer than expected)"
```

### Step 2: Test Write Completion

The code now uses dynamic timeout based on actual write time:

```javascript
// Current logic: Math.max(500, writeTime * 1.5)
// This means:
// - Fast write (100ms) → 500ms timeout (safe buffer)
// - Slow write (800ms) → 1200ms timeout (1.5x buffer)
```

### Step 3: Verify Flag Clearing

After skip, check console for:

- `"🔓 Skip flag cleared after X ms"`
- This should happen AFTER write completes + buffer

### Step 4: Test Edge Cases

1. **Very slow network**: Throttle to "Slow 3G", skip, check if state persists
2. **Network interruption**: Skip, then disconnect network briefly, reconnect, check state
3. **Rapid skip**: Click skip multiple times quickly, check final state

### Step 5: Consider Alternative Approach

If timeouts are unreliable, consider using Firestore's `onSnapshot` to detect write completion:

```typescript
// Alternative: Wait for write to appear in Firestore
const userRef = doc(db, "users", uid);
const unsubscribe = onSnapshot(
  userRef,
  (snap) => {
    const data = snap.data();
    if (data?.settings?.usernamePrompted === true) {
      // Write confirmed
      usernameStateManager.skipInProgress = false;
      unsubscribe();
    }
  },
  { includeMetadataChanges: false }
);
```

### Expected Results

- Timeout adapts to network speed
- State persists reliably
- No race conditions

### Red Flags

- Timeout warnings appear frequently
- State doesn't persist after slow writes
- Flag clears before write completes

---

## Quick Investigation Checklist

Run these in order after signing in (especially after redirect):

```javascript
// 1. Full diagnostic
await window.debugUsername();

// 2. Check logs
console.log(
  "Decisions:",
  JSON.parse(localStorage.getItem("flicklet.username.prompt.decisions") || "[]")
);
console.log(
  "Loads:",
  JSON.parse(localStorage.getItem("flicklet.username.logs") || "[]")
);
console.log(
  "Errors:",
  JSON.parse(localStorage.getItem("flicklet.username.errors") || "[]")
);

// 3. Test write timing
await window.testFirestoreWriteTiming();

// 4. Monitor state (10 seconds)
window.monitorUsernameState(10000);
```

---

## Common Issues and Solutions

### Issue: Prompt doesn't show after redirect

**Check:**

1. Run `await window.debugUsername()` - check `shouldShowPrompt.result`
2. Check `firestoreState.usernamePrompted` - should be `false` for new users
3. Check timing - if Firestore read is slow, prompt may be delayed

**Solution:** If read is slow, consider showing prompt optimistically, then hiding if data loads and shows `usernamePrompted: true`

### Issue: Skip doesn't persist

**Check:**

1. Check console for write timing warnings
2. Run `window.testFirestoreWriteTiming()` - check if writes are slow
3. Verify Firestore document after skip

**Solution:** Increase timeout or use `onSnapshot` to detect write completion

### Issue: Prompt shows multiple times

**Check:**

1. Check `hasShownRef` logic in FlickletHeader
2. Check if user UID changes between renders
3. Check if `usernamePrompted` is being reset

**Solution:** Ensure `hasShownRef` resets only when user changes, not on every render

---

## Next Steps

After completing investigations 1-5:

1. Document findings in a report
2. Identify root causes
3. Propose fixes based on evidence
4. Test fixes in both localhost and production
5. Monitor logs after deployment
