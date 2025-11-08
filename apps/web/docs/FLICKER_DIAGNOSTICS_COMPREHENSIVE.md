# Comprehensive Flicker Diagnostics

## Overview
This document describes the **holistic** flicker diagnostics system that tracks ALL potential sources of re-renders and state changes.

## What We Track

### 1. State Managers (All Subscription Patterns)
- ✅ **Library** - `Library.subscribe()` calls and `library:updated`/`library:changed` events
- ✅ **UsernameStateManager** - `loadUsername()` calls, auth subscription callbacks, username state changes
- ✅ **AuthManager** - `authManager.subscribe()` callbacks and listener notifications
- ✅ **SettingsManager** - `settingsManager.subscribe()` calls and state changes
- ✅ **CustomListManager** - `customListManager.subscribe()` calls and state changes
- ✅ **LanguageManager** - `languageManager.subscribe()` calls and state changes

### 2. React Hooks (All State-Using Hooks)
- ✅ **useLibrary** - Subscription triggers and state changes
- ✅ **useUsername** - Auth subscriptions, loadUsername calls, username state changes
- ✅ **useAuth** - Auth subscription callbacks and user state changes
- ✅ **useSettings** - Settings subscription callbacks and state changes
- ✅ **useLanguage** - Language subscription callbacks and state changes
- ✅ **useTranslations** - Translation subscription callbacks
- ✅ **useCustomLists** - Custom list subscription callbacks and state changes
- ✅ **useForYouContent** - Library subscription triggers

### 3. Custom Events (All Window Events)
- ✅ `library:updated`
- ✅ `library:changed`
- ✅ `auth:changed`
- ✅ `auth:ready`
- ✅ `customLists:updated`
- ✅ `force-refresh`
- ✅ `pushstate`
- ✅ `cards:changed`
- ✅ `library:reloaded`
- ✅ `history:pushstate` (via history.pushState interception)

### 4. Components (Key UI Components)
- ✅ **CommunityPanel** - Renders, state changes, effects
- ✅ **SnarkDisplay** - Username and auth state changes

## How to Use

### Step 1: Enable Diagnostics

**Option A: URL Parameter (Easiest)**
1. Go to your production site: `https://flicklet.netlify.app`
2. Add `?diagnostics=flicker` to the URL: `https://flicklet.netlify.app/?diagnostics=flicker`
3. Press Enter to reload the page
4. Diagnostics are now active

**Option B: LocalStorage (Persists across refreshes)**
1. Open browser console (F12)
2. Run: `localStorage.setItem('flicker-diagnostics', 'enabled')`
3. Refresh the page
4. Diagnostics will stay enabled until you clear localStorage

### Step 2: Reproduce the Flicker
- Navigate around the app
- Let the page load completely
- Watch for any flickering behavior
- The diagnostics are automatically logging everything in the background

### Step 3: View the Report

**Quick Report (In Console)**
```javascript
// Open browser console (F12) and run:
flickerDiagnostics.printReport()
```

This will show:
- Total number of events logged
- Events grouped by component
- Events grouped by type
- Timeline of events
- Full detailed logs

**Export Data (For Analysis)**
```javascript
// In browser console:
const data = flickerDiagnostics.exportLogs();
console.log(JSON.stringify(data, null, 2));

// Copy the output and save it to a file for analysis
```

**Check if Diagnostics are Enabled**
```javascript
// In browser console:
flickerDiagnostics.enabled
// Should return: true
```

### Step 4: Analyze the Data

**Find Rapid Re-renders**
```javascript
const report = flickerDiagnostics.exportLogs();
const renders = report.logs.filter(l => l.event === 'RENDER');
renders.forEach((r, i) => {
  if (i > 0) {
    const timeDiff = r.timestamp - renders[i-1].timestamp;
    if (timeDiff < 50) {
      console.log(`⚠️ Rapid render: ${r.component} - ${timeDiff}ms apart`);
    }
  }
});
```

**Find Subscription Cascades**
```javascript
const report = flickerDiagnostics.exportLogs();
const subscriptions = report.logs.filter(l => l.event === 'SUBSCRIPTION');
subscriptions.forEach((s, i) => {
  if (i > 0) {
    const timeDiff = s.timestamp - subscriptions[i-1].timestamp;
    if (timeDiff < 100) {
      console.log(`⚠️ Subscription cascade: ${s.component} - ${timeDiff}ms apart`);
    }
  }
});
```

**Find State Change Loops**
```javascript
const report = flickerDiagnostics.exportLogs();
const stateChanges = report.logs.filter(l => l.event === 'STATE_CHANGE');
const byComponent = {};
stateChanges.forEach(change => {
  if (!byComponent[change.component]) {
    byComponent[change.component] = [];
  }
  byComponent[change.component].push(change);
});

Object.entries(byComponent).forEach(([component, changes]) => {
  if (changes.length > 5) {
    console.log(`⚠️ ${component} has ${changes.length} state changes`);
  }
});
```

### Step 5: Disable Diagnostics

**Option A: Remove URL Parameter**
- Just remove `?diagnostics=flicker` from the URL and refresh

**Option B: Clear LocalStorage**
```javascript
// In browser console:
localStorage.removeItem('flicker-diagnostics');
// Then refresh
```

### What You'll See in Console

When diagnostics are enabled, you'll see logs like:
```
[FlickerDiag] CommunityPanel - RENDER {props: Array(1)}
[FlickerDiag] useLibrary(watching) - SUBSCRIPTION {subscriptionName: "subscribe", data: {count: 5}}
[FlickerDiag] useUsername - LOAD_START {timestamp: 1234567890}
[FlickerDiag] EVENT - library:updated {}
[FlickerDiag] SnarkDisplay - STATE_CHANGE {stateName: "username", oldValue: "", newValue: "Ed"}
```

These logs help you see exactly what's happening when flicker occurs.

## What Gets Logged

### Subscription Events
- When any state manager's `subscribe()` is called
- When any state manager's `notifySubscribers()`/`emitChange()` is called
- Subscriber count at time of notification

### State Changes
- Component name
- State property name
- Old value → New value

### Component Renders
- Component name
- Props (keys only, for privacy)

### Effects
- Component name
- Effect name
- Dependencies

### Events
- Event name
- Event detail (if any)

## Analysis Patterns

### Find Rapid Re-renders
```javascript
const report = flickerDiagnostics.exportLogs();
const renders = report.logs.filter(l => l.event === 'RENDER');
renders.forEach((r, i) => {
  if (i > 0) {
    const timeDiff = r.timestamp - renders[i-1].timestamp;
    if (timeDiff < 50) {
      console.log(`Rapid render: ${r.component} - ${timeDiff}ms apart`);
    }
  }
});
```

### Find Subscription Cascades
```javascript
const report = flickerDiagnostics.exportLogs();
const subscriptions = report.logs.filter(l => l.event === 'SUBSCRIPTION');
subscriptions.forEach((s, i) => {
  if (i > 0) {
    const timeDiff = s.timestamp - subscriptions[i-1].timestamp;
    if (timeDiff < 100) {
      console.log(`Subscription cascade: ${s.component} - ${timeDiff}ms apart`);
    }
  }
});
```

### Find State Change Loops
```javascript
const report = flickerDiagnostics.exportLogs();
const stateChanges = report.logs.filter(l => l.event === 'STATE_CHANGE');
// Group by component and check for rapid changes
const byComponent = {};
stateChanges.forEach(change => {
  if (!byComponent[change.component]) {
    byComponent[change.component] = [];
  }
  byComponent[change.component].push(change);
});

Object.entries(byComponent).forEach(([component, changes]) => {
  if (changes.length > 5) {
    console.log(`${component} has ${changes.length} state changes`);
  }
});
```

## Why This Is Comprehensive

### Before (Limited Scope)
- Only tracked Library-related events
- Only tracked CommunityPanel renders
- Missed auth, settings, language, custom lists
- Missed username state changes
- Missed many custom events

### After (Holistic)
- ✅ All state managers tracked
- ✅ All hooks tracked
- ✅ All custom events tracked
- ✅ All subscription patterns tracked
- ✅ All state changes tracked
- ✅ History API changes tracked

## Next Steps

1. Enable diagnostics in production
2. Reproduce flicker
3. Export diagnostic data
4. Analyze patterns:
   - Rapid re-renders
   - Subscription cascades
   - State change loops
   - Event cascades
5. Fix root causes
6. Verify fixes

## Files Modified

- `apps/web/src/lib/flickerDiagnostics.ts` - Added comprehensive event tracking
- `apps/web/src/lib/settings.ts` - Added subscription tracking
- `apps/web/src/lib/customLists.ts` - Added subscription tracking
- `apps/web/src/lib/language.ts` - Added subscription tracking
- `apps/web/src/lib/auth.ts` - Added listener notification tracking
- `apps/web/src/hooks/useAuth.ts` - Added subscription and state change tracking
- `apps/web/src/hooks/useUsername.ts` - Added comprehensive tracking
- `apps/web/src/components/SnarkDisplay.tsx` - Added state change tracking
- `apps/web/src/components/CommunityPanel.tsx` - Already had tracking

