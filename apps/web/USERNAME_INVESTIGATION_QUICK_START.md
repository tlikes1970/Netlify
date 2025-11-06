# Username Investigation - Quick Start

## 🚀 Immediate Actions

### 1. Open Browser Console
Press `F12` or `Cmd+Option+I` to open developer tools.

### 2. Run Full Diagnostic
After signing in (especially after a redirect), run:

```javascript
await window.debugUsername()
```

This shows:
- ✅ Current auth state
- ✅ Firestore document state  
- ✅ Timing information
- ✅ Whether prompt should show
- ✅ Any issues detected

### 3. Check Logs
View all investigation logs:

```javascript
// Prompt decisions
JSON.parse(localStorage.getItem('flicklet.username.prompt.decisions') || '[]')

// Username load timing
JSON.parse(localStorage.getItem('flicklet.username.logs') || '[]')

// Errors
JSON.parse(localStorage.getItem('flicklet.username.errors') || '[]')
```

### 4. Test Write Timing
Check how long Firestore writes take:

```javascript
await window.testFirestoreWriteTiming()
```

### 5. Monitor State Changes
Watch username state over 10 seconds:

```javascript
window.monitorUsernameState(10000)
```

---

## 🔍 What to Look For

### After Redirect (Production)
1. **Run diagnostic immediately** - Check if `usernamePrompted` field exists
2. **Check timing** - Firestore read should be < 1000ms
3. **Verify state** - `shouldShowPrompt.result` should match actual behavior

### When Prompt Doesn't Show
1. **Check decisions log** - Look for `shouldShow: true` entries
2. **Check loading state** - Was `loading: true` when check ran?
3. **Check Firestore** - Is `usernamePrompted` incorrectly set to `true`?

### When Skip Doesn't Persist
1. **Check write timing** - Look for warnings about slow writes
2. **Check flag clearing** - Does flag clear before write completes?
3. **Verify Firestore** - After skip, check document in Firebase Console

---

## 📊 Investigation Checklist

After each sign-in (especially redirect flow):

- [ ] Run `await window.debugUsername()`
- [ ] Check console for timing warnings
- [ ] Verify Firestore document in Firebase Console
- [ ] Export logs if issues found
- [ ] Compare localhost vs production behavior

---

## 🐛 Common Issues

### Issue: "Prompt doesn't show after redirect"
**Quick Check:**
```javascript
const diag = await window.debugUsername();
console.log('Should show:', diag.shouldShowPrompt.result);
console.log('Firestore state:', diag.firestoreState);
```

### Issue: "Skip doesn't work"
**Quick Check:**
```javascript
// After clicking skip, check console for:
// - Write timing warnings
// - Flag clearing messages
// Then verify in Firestore
```

### Issue: "Prompt shows multiple times"
**Quick Check:**
```javascript
// Check decisions log for multiple "shouldShow: true" entries
JSON.parse(localStorage.getItem('flicklet.username.prompt.decisions') || '[]')
```

---

## 📝 Export Logs for Analysis

```javascript
function exportUsernameLogs() {
  const logs = {
    decisions: JSON.parse(localStorage.getItem('flicklet.username.prompt.decisions') || '[]'),
    loads: JSON.parse(localStorage.getItem('flicklet.username.logs') || '[]'),
    errors: JSON.parse(localStorage.getItem('flicklet.username.errors') || '[]'),
    timestamp: new Date().toISOString(),
    environment: window.location.hostname,
  };
  
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `username-logs-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  return logs;
}

// Run it
exportUsernameLogs()
```

---

## 📖 Full Guide

See `USERNAME_INVESTIGATION_GUIDE.md` for detailed step-by-step instructions for each investigation.

