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

## Expected Metrics

### Before Containment (OFF)

Typical values when flicker is present:
- `containment.stats.burstsDetected`: 400-500+
- `containment.stats.maxEventsIn50ms`: 200-500+
- `batchingSummary.burstsDetected`: 400-500+
- `batchingSummary.maxEventsIn50ms`: 200-500+

### After Containment (ON)

Expected improvements:
- `containment.stats.burstsDetected`: <50 (order of magnitude reduction)
- `containment.stats.maxEventsIn50ms`: <20 (low double digits)
- `batchingSummary.burstsDetected`: <50
- `batchingSummary.maxEventsIn50ms`: <20
- `subscriberSummary.totalRenders`: Equal or lower (no increase)

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

