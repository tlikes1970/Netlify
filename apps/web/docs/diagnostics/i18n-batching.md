# I18N rAF Batching - Runtime Toggle Guide

## Overview

The i18n rAF (requestAnimationFrame) batching system eliminates flicker caused by translation update bursts by batching multiple notifications into a single dispatch per animation frame. This is controlled at runtime via localStorage, so no rebuilds are needed.

## Runtime Toggles

### Enable Containment (rAF Batching)

```javascript
localStorage.setItem('i18n:containment', 'on');
// Then refresh the page
```

### Disable Containment

```javascript
localStorage.setItem('i18n:containment', 'off');
// Then refresh the page
```

### Enable Diagnostics Auto-Run

```javascript
localStorage.setItem('i18n:diagnostics:autoRun', 'true');
// Then refresh the page
```

### Configure Diagnostics Duration

```javascript
localStorage.setItem('i18n:diagnostics:durationMs', '60000'); // 60 seconds (default)
// Then refresh the page
```

## How It Works

### Without Containment (Default)

- Translation updates are dispatched immediately
- Each `notify()` call triggers all listeners synchronously
- Multiple rapid updates can cause visible flicker

### With Containment Enabled

- Translation updates are queued via `requestAnimationFrame`
- Multiple `notify()` calls within the same frame are batched
- At most 1 emit per frame, regardless of queue size
- Updates are dispatched as an array to listeners
- `useTranslations` normalizes arrays by using the last (most recent) update

## Running Diagnostics

### Automatic (Recommended)

1. Enable diagnostics:
   ```javascript
   localStorage.setItem('i18n:diagnostics:autoRun', 'true');
   ```

2. Refresh the page

3. Use the app normally for 60 seconds (or configured duration)

4. Report auto-generates and downloads as JSON

5. Check console for completion message:
   ```
   [I18N] Diagnostics complete (containment=on|off). Report at localStorage["i18n:diagnosticsReport"].
   ```

### Manual Trigger

```javascript
generateI18NReport()
```

### Accessing the Report

**From localStorage:**
```javascript
JSON.parse(localStorage.getItem('i18n:diagnosticsReport'))
```

**Downloaded File:**
- Automatically downloads as `i18n-diagnostics-report-{timestamp}.json`
- Check your browser's download folder

## Identifying Noisy Callers (Leaderboard)

When containment is enabled but you still see rapid notifications, use the leaderboard to identify the top offenders:

### Step 1: Enable Containment and Diagnostics

```javascript
localStorage.setItem('i18n:containment', 'on');
localStorage.setItem('i18n:diagnostics:autoRun', 'true');
location.reload();
```

### Step 2: Use the App for ~60 Seconds

Interact with the app normally, especially the flow that causes flicker.

### Step 3: Dump the Leaderboard

In the browser console:

```javascript
window.__i18nDump && window.__i18nDump();
```

This displays a table with the top 10 caller stack signatures and their call counts. The top 1–3 entries identify the hot call sites that need fixing.

### Step 4: Fix Top Offenders

Common fixes:
- **Equality guard**: Drop repeats of the exact same payload
- **Throttle**: For noisy loops (intervals, observers, scroll)
- **Coalesce**: Last-write-wins within the same tick

After fixes, re-run the leaderboard to confirm counts drop.

## Pass Criteria for Diagnostics Report

After running diagnostics with containment ON, check the report at `/apps/web/public/diagnostics/i18n-diagnostics-report.json` or in localStorage.

### Pass Criteria

All of the following must be met:

- `containment.mode` = `"raf"` (confirms containment is active)
- `containment.stats.burstsDetected` < **200** (sharp reduction from baseline)
- `containment.stats.maxEventsIn50ms` < **50** (low double digits)
- `containment.stats.totalEventsInBursts` sharply down vs last run
- `subscriberSummary.rendersPerSubscription` same or lower than before
- **Visual flicker is not observable** in the same flow

### If Metrics Miss

1. Dump the leaderboard again: `window.__i18nDump && window.__i18nDump()`
2. Fix the next top offender
3. Re-run diagnostics for ~60 seconds
4. Two loops should be sufficient to meet all criteria

## Expected Metrics

### Before Containment (OFF)

Typical values when flicker is present:
- `containment.stats.burstsDetected`: 400-500+
- `containment.stats.maxEventsIn50ms`: 200-500+
- `batchingSummary.burstsDetected`: 400-500+
- `batchingSummary.maxEventsIn50ms`: 200-500+

### After Containment (ON) with Fixes

Expected improvements (after silencing top offenders):
- `containment.stats.burstsDetected`: <200 (pass criteria: <200)
- `containment.stats.maxEventsIn50ms`: <50 (pass criteria: <50)
- `batchingSummary.burstsDetected`: <200
- `batchingSummary.maxEventsIn50ms`: <50
- `subscriberSummary.totalRenders`: Equal or lower (no increase)
- `subscriberSummary.rendersPerSubscription`: Same or lower than before

### Report Structure

```json
{
  "containment": {
    "enabled": true,
    "mode": "raf",
    "stats": {
      "burstsDetected": 12,
      "maxEventsIn50ms": 8,
      "totalEventsInBursts": 45
    }
  },
  "batchingSummary": {
    "burstsDetected": 12,
    "maxEventsIn50ms": 8,
    "totalEventsInBursts": 45
  }
}
```

## Testing Workflow

### 1. Baseline (Containment OFF)

```javascript
// Clear any existing flags
localStorage.removeItem('i18n:containment');
localStorage.setItem('i18n:diagnostics:autoRun', 'true');

// Refresh and use app for 60 seconds
// Note the flicker and save the report
```

### 2. With Containment (ON)

```javascript
localStorage.setItem('i18n:containment', 'on');
localStorage.setItem('i18n:diagnostics:autoRun', 'true');

// Refresh and use the same path for 60 seconds
// Verify flicker is gone and compare metrics
```

### 3. Toggle Test

```javascript
// Toggle OFF
localStorage.setItem('i18n:containment', 'off');
// Refresh - should see flicker return

// Toggle ON
localStorage.setItem('i18n:containment', 'on');
// Refresh - flicker should disappear
```

## Troubleshooting

### Containment Not Working

1. Verify flag is set:
   ```javascript
   localStorage.getItem('i18n:containment') // Should be 'on'
   ```

2. Check console for errors

3. Verify translation bus is initialized:
   ```javascript
   // In console, check if translationBus exists
   ```

### Diagnostics Not Running

1. Verify flag is set:
   ```javascript
   localStorage.getItem('i18n:diagnostics:autoRun') // Should be 'true'
   ```

2. Check console for initialization messages

3. Manually trigger:
   ```javascript
   generateI18NReport()
   ```

### Report Not Downloading

- Check browser download settings
- Check if popup blocker is interfering
- Access report from localStorage instead:
  ```javascript
  JSON.parse(localStorage.getItem('i18n:diagnosticsReport'))
  ```

## Rollback

To completely disable containment:

```javascript
localStorage.setItem('i18n:containment', 'off');
// Or remove the flag entirely
localStorage.removeItem('i18n:containment');
```

The code defaults to OFF, so removing the flag restores default behavior.

## Technical Details

### Files

- `apps/web/src/i18n/featureFlags.ts` - Runtime flag management
- `apps/web/src/i18n/rafBatcher.ts` - rAF batching utility
- `apps/web/src/i18n/translationBus.ts` - Centralized translation bus
- `apps/web/src/lib/language.ts` - Updated to use translation bus
- `apps/web/src/lib/i18nDiagnostics.ts` - Enhanced diagnostics

### Architecture

```
LanguageManager
  └─> emitChange()
      └─> translationBus.notify()
          └─> [if containment ON] rAF batcher
              └─> Batched emit (array)
          └─> [if containment OFF] Immediate emit (single)
      └─> useTranslations
          └─> Normalize (array → last item, or single → direct)
          └─> setState (only if changed)
```

### Guarantees

- At most 1 emit per frame when containment is ON
- Zero extra renders when nothing changes
- Backward compatible (legacy subscribers still work)
- No user-visible behavior changes (only internal batching)

