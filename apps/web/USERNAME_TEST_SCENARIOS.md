# Username Prompt Test Scenarios

## Test Setup: Clear Username in Firestore

### Option 1: Clear via Firebase Console (Recommended)

1. Go to Firebase Console → Firestore Database
2. Navigate to `users/{your-uid}`
3. Edit the document
4. In the `settings` object, change:
   - `username`: Delete the value or set to `""`
   - `usernamePrompted`: Set to `false`

### Option 2: Clear via Browser Console

After the diagnostic function is available, you can also clear it programmatically:

```javascript
// First, run diagnostic to see current state
const diag = await window.debugUsername();
console.log("Current state:", diag.firestoreState);

// Then clear username (requires authManager)
// Note: This will be available after rebuild
```

---

## Test Scenarios

### Scenario 1: New User (No username, not prompted)

**Firestore State:**

- `settings.username`: `""` or missing
- `settings.usernamePrompted`: `false` or missing

**Expected Behavior:**

- ✅ Username prompt modal should appear
- ✅ User can enter username or skip
- ✅ After skip, `usernamePrompted` should be set to `true`
- ✅ After entering username, both `username` and `usernamePrompted` should be set

**What to Check:**

1. Run `await window.debugUsername()` immediately after sign-in
2. Check `shouldShowPrompt.result` - should be `true`
3. Check console for `🎯 Username prompt check:` logs
4. Verify modal appears

---

### Scenario 2: User Skipped Before (No username, but prompted)

**Firestore State:**

- `settings.username`: `""` or missing
- `settings.usernamePrompted`: `true`

**Expected Behavior:**

- ❌ Username prompt modal should NOT appear
- ✅ User already skipped, so no prompt

**What to Check:**

1. Run `await window.debugUsername()`
2. Check `shouldShowPrompt.result` - should be `false`
3. Check console - no prompt check logs should show modal opening

---

### Scenario 3: User Has Username

**Firestore State:**

- `settings.username`: `"Travis"` (or any value)
- `settings.usernamePrompted`: `true`

**Expected Behavior:**

- ❌ Username prompt modal should NOT appear
- ✅ Username is already set

**What to Check:**

1. This is your current state - prompt shouldn't show
2. Verify username displays correctly in UI

---

## Step-by-Step Test Process

### 1. Prepare Test Environment

```javascript
// In browser console, check current state
await window.debugUsername();
```

### 2. Clear Username in Firestore

- Go to Firebase Console
- Set `settings.usernamePrompted` to `false`
- Clear or empty `settings.username`

### 3. Sign Out and Sign Back In

- Sign out from the app
- Sign in again (this will trigger redirect in production)
- Watch console logs carefully

### 4. Immediately After Sign-In

```javascript
// Run diagnostic
const result = await window.debugUsername();
console.log("Should show prompt:", result.shouldShowPrompt.result);
console.log("Firestore state:", result.firestoreState);
console.log("Issues found:", result.issues);
```

### 5. Check Logs

```javascript
// Check all investigation logs
const decisions = JSON.parse(
  localStorage.getItem("flicklet.username.prompt.decisions") || "[]"
);
const loads = JSON.parse(
  localStorage.getItem("flicklet.username.logs") || "[]"
);
const errors = JSON.parse(
  localStorage.getItem("flicklet.username.errors") || "[]"
);

console.log("Prompt decisions:", decisions);
console.log("Username loads:", loads);
console.log("Errors:", errors);
```

### 6. Test Skip Functionality

If prompt appears:

1. Click "Skip"
2. Watch console for timing logs
3. Check Firestore - `usernamePrompted` should be `true`
4. Refresh page - prompt should NOT appear again

### 7. Test Username Entry

If prompt appears:

1. Enter a username
2. Click "Save"
3. Check Firestore - both `username` and `usernamePrompted` should be set
4. Refresh page - username should persist

---

## What to Look For

### ✅ Success Indicators

- Prompt appears when `usernamePrompted: false` and no username
- Prompt doesn't appear when `usernamePrompted: true`
- Skip sets `usernamePrompted: true` in Firestore
- Username entry saves both `username` and `usernamePrompted: true`
- State persists after page refresh

### ⚠️ Warning Signs

- Prompt doesn't appear when it should (`usernamePrompted: false`, no username)
- Prompt appears multiple times
- Skip doesn't persist (check Firestore after skip)
- Username doesn't save
- Multiple Firestore reads (performance issue)

### 🔴 Red Flags

- `usernamePrompted` field missing entirely
- Firestore read fails
- Write timing > 2000ms consistently
- State doesn't persist after refresh
- Multiple duplicate loads (6+ times like in your logs)

---

## Quick Test Checklist

After clearing username and signing in:

- [ ] Run `await window.debugUsername()` - check `shouldShowPrompt.result`
- [ ] Check console for `🎯 Username prompt check:` logs
- [ ] Verify modal appears (if `usernamePrompted: false`)
- [ ] Test skip - check Firestore after
- [ ] Test username entry - check Firestore after
- [ ] Refresh page - verify state persists
- [ ] Check logs for timing issues
- [ ] Check logs for multiple loads

---

## Expected Console Output

### When Prompt Should Show:

```
🔄 Loading username for user: [uid]
✅ Username loaded: {username: '', prompted: false, loadTimeMs: X}
🎯 Username prompt check: {shouldShow: true, hasUser: true, hasUsername: false, usernamePrompted: false}
✅ Username prompt modal opened
```

### When Prompt Should NOT Show:

```
🔄 Loading username for user: [uid]
✅ Username loaded: {username: 'Travis', prompted: true, loadTimeMs: X}
🎯 Username prompt check: {shouldShow: false, hasUser: true, hasUsername: true, usernamePrompted: true}
```

---

## After Testing

Export all logs for analysis:

```javascript
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
  a.download = `username-test-logs-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  return logs;
}

exportUsernameLogs();
```
