# I18N Diagnostics Guide

## Overview

The I18N diagnostics system collects all translation-related metrics into a single structured JSON report. This helps identify the root cause of flicker and excessive re-renders caused by `useTranslations`.

## How to Enable

### Option 1: URL Parameter (Easiest)
Add `?i18n-diagnostics=true` to your URL:
```
https://flicklet.netlify.app/?i18n-diagnostics=true
```

### Option 2: LocalStorage
Open browser console and run:
```javascript
localStorage.setItem('i18n-diagnostics', 'enabled');
// Then refresh the page
```

## How to Use

1. **Enable Diagnostics** - Use one of the methods above
2. **Use the App** - Navigate around, let it run for ~60 seconds
3. **Generate Report** - The report will auto-generate after 60 seconds, or manually trigger:
   ```javascript
   generateI18NReport()
   ```

## Report Output

The report is:
- **Saved to localStorage** as `i18n:diagnosticsReport`
- **Downloaded as JSON file** automatically when generated
- **Accessible in console** via `localStorage.getItem('i18n:diagnosticsReport')`

## Report Structure

```json
{
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "0.1.142",
    "strictMode": true,
    "duration": 60
  },
  "strictModeSummary": {
    "mounts": 0,
    "unmounts": 36,
    "mountUnmountPairs": 0
  },
  "providerIdentitySummary": {
    "changesWhileIdle": 0,
    "languageChanges": 0,
    "identityChanges": 0,
    "lastProviderRef": "..."
  },
  "subscriberSummary": {
    "totalSubscriptions": 160,
    "totalRenders": 3600,
    "rendersPerSubscription": 22.5,
    "uniqueMountIds": 37,
    "subscriptionToRenderPairs": 3600,
    "averageTimeBetweenSubscriptionAndRender": 16
  },
  "multipleProviders": {
    "count": 0,
    "locations": []
  },
  "keyViolations": [],
  "batchingSummary": {
    "burstsDetected": 491,
    "maxEventsIn50ms": 488,
    "totalEventsInBursts": 25000
  },
  "containmentResults": {
    "flagEnabled": false,
    "impact": "not_tested",
    "rendersBefore": 0,
    "rendersAfter": 0,
    "improvement": 0
  }
}
```

## What Each Section Means

### `strictModeSummary`
- **mounts**: Number of unique component mounts detected
- **unmounts**: Number of unique component unmounts detected
- **mountUnmountPairs**: Pairs of mount→unmount (indicates Strict Mode double-invocation)

### `providerIdentitySummary`
- **changesWhileIdle**: Provider identity changed without language change (problem!)
- **languageChanges**: Actual language changes (user-initiated)
- **identityChanges**: Total provider reference changes
- **lastProviderRef**: Last provider reference value

### `subscriberSummary`
- **totalSubscriptions**: Number of `useTranslations` hook subscriptions
- **totalRenders**: Total render count across all subscribers
- **rendersPerSubscription**: Average renders per subscription (high = cascade problem)
- **uniqueMountIds**: Number of unique hook instances
- **subscriptionToRenderPairs**: Subscription notifications that triggered renders
- **averageTimeBetweenSubscriptionAndRender**: Average delay in ms

### `multipleProviders`
- **count**: Number of translation providers detected (should be 0 or 1)
- **locations**: Component stack traces where providers were found

### `keyViolations`
- Array of components using translation output as React keys (causes remounts)

### `batchingSummary`
- **burstsDetected**: Number of rapid event sequences (5+ events in 50ms)
- **maxEventsIn50ms**: Maximum events in a single 50ms window
- **totalEventsInBursts**: Total events that occurred during bursts

### `containmentResults`
- Results when containment feature flag is enabled (future optimization)

## Interpreting Results

### High `rendersPerSubscription` (>10)
- Indicates subscription cascades
- Each subscription notification is triggering multiple renders
- **Fix**: Add conditional state updates, memoization, or debouncing

### High `mountUnmountPairs`
- Indicates React Strict Mode double-invocation
- Normal in development, but check if mounts are happening unnecessarily
- **Fix**: Ensure components aren't remounting due to key changes

### High `changesWhileIdle` (>0)
- Provider identity changing without language change
- **Fix**: Memoize provider value, ensure stable references

### High `burstsDetected` (>100)
- Rapid event cascades causing visible flicker
- **Fix**: Batch updates, debounce notifications, use `requestAnimationFrame`

## Manual Report Generation

To generate a report immediately:
```javascript
generateI18NReport()
```

To view the report from localStorage:
```javascript
JSON.parse(localStorage.getItem('i18n:diagnosticsReport'))
```

## Disabling Diagnostics

Remove the flag:
```javascript
localStorage.removeItem('i18n-diagnostics');
// Then refresh the page
```

Or remove the URL parameter and refresh.

