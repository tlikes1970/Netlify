# Flicker Diagnostics Guide

## Problem
The community section (and possibly other areas) flickers in production but not on localhost. We need to identify the root cause.

## Solution
A diagnostic system has been added to track re-renders, state changes, and event triggers.

## How to Enable

### Option 1: URL Parameter (Easiest)
Add `?diagnostics=flicker` to your production URL:
```
https://flicklet.netlify.app/?diagnostics=flicker
```

### Option 2: LocalStorage
Open browser console in production and run:
```javascript
localStorage.setItem('flicker-diagnostics', 'enabled');
// Then refresh the page
```

## How to Use

### 1. Enable Diagnostics
Use one of the methods above to enable diagnostics.

### 2. Reproduce the Flicker
Let the page load and observe the flicker. The diagnostics will automatically track:
- Component renders
- State changes
- Effect triggers
- Library subscription triggers
- Event dispatches

### 3. View the Report
Open browser console and run:
```javascript
flickerDiagnostics.printReport()
```

This will show:
- Total number of events
- Events grouped by component
- Events grouped by type
- Timeline of events
- Full detailed logs

### 4. Export Data
To get the full data for analysis:
```javascript
const data = flickerDiagnostics.exportLogs();
console.log(data);
// Copy this data and share it
```

### 5. Clear Logs
To start fresh:
```javascript
flickerDiagnostics.clearLogs();
```

## What Gets Tracked

### Components
- `CommunityPanel` - Renders, state changes, effects
- `App` - Parent component renders
- `Section` - Wrapper component renders

### Events
- `library:updated` - When Library state is reloaded
- `library:changed` - When Library items are added/removed/updated

### State Changes
- `posts` - CommunityPanel posts array changes
- `postsLoading` - Loading state changes
- `postsError` - Error state changes

### Effects
- Component mount/unmount
- useEffect triggers

## Analyzing the Data

Look for patterns:
1. **Rapid re-renders**: If `CommunityPanel` renders many times in quick succession
2. **State change loops**: If state changes trigger more state changes
3. **Event cascades**: If `library:updated` events trigger component re-renders
4. **Timing**: Check the timeline to see what happens right before the flicker

## Example Analysis

```javascript
// Get the report
const report = flickerDiagnostics.exportLogs();

// Find rapid re-renders
const communityRenders = report.logs.filter(l => 
  l.component === 'CommunityPanel' && l.event === 'RENDER'
);

// Check timing between renders
communityRenders.forEach((render, i) => {
  if (i > 0) {
    const timeDiff = render.timestamp - communityRenders[i-1].timestamp;
    if (timeDiff < 100) {
      console.log('Rapid re-render detected:', timeDiff, 'ms apart');
    }
  }
});

// Find what triggers re-renders
const beforeRender = (timestamp) => {
  return report.logs.filter(l => 
    l.timestamp < timestamp && 
    l.timestamp > timestamp - 50
  );
};

communityRenders.forEach(render => {
  const triggers = beforeRender(render.timestamp);
  console.log('Events before render:', triggers);
});
```

## Disable Diagnostics

To disable diagnostics:
```javascript
localStorage.removeItem('flicker-diagnostics');
// Or remove ?diagnostics=flicker from URL and refresh
```

## Next Steps

1. Enable diagnostics in production
2. Reproduce the flicker
3. Export the diagnostic data
4. Share the data for analysis
5. Use the data to identify the root cause



