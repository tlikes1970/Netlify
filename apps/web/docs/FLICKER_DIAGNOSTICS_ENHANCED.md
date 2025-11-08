# Enhanced Flicker Diagnostics - Mount/Unmount & Render Tracking

## What's New

### Version 0.1.139 Enhancements

The diagnostics system has been enhanced to track **actual component lifecycle events** to determine the root cause of flicker without assumptions.

## New Tracking Capabilities

### 1. Mount/Unmount Tracking
- **`logMount(component, data)`** - Logs when a component/hook first renders (mount)
- **`logUnmount(component, data)`** - Logs when a component/hook cleanup runs (unmount)
- **Unique `mountId`** - Each hook instance gets a unique ID to track across mount/unmount cycles

### 2. Enhanced Render Tracking
- **Every render is logged** - Not just initial mounts
- **Render count** - Tracks how many times a component has rendered
- **Distinguishes first render from re-renders** - `MOUNT` vs `RENDER` events

### 3. Effect Lifecycle Tracking
- **`EFFECT` events** - Track when effects run (`effect-mount`, `effect-unmount`)
- **Correlates with mount/unmount** - Can distinguish StrictMode double-invocation from actual unmount

## What This Answers

### Question 1: Are components mounting/unmounting or just re-rendering?
**Answer**: Look for `MOUNT` and `UNMOUNT` events in the logs. If you see:
- `MOUNT` → `RENDER` → `RENDER` → `UNMOUNT` = Component mounted, re-rendered twice, then unmounted
- `MOUNT` → `EFFECT` → `EFFECT_CLEANUP` → `EFFECT` = StrictMode double-invocation (component still mounted)

### Question 2: Are these subscription events causing re-renders?
**Answer**: Look for correlation between:
- `SUBSCRIPTION` events (when hooks subscribe)
- `RENDER` events (when components actually render)
- If `SUBSCRIPTION` events don't have corresponding `RENDER` events, they're not causing flicker

### Question 3: Is the flicker timing correlated with these events?
**Answer**: Compare timestamps:
- When you see flicker visually
- When `MOUNT`/`UNMOUNT`/`RENDER` events occur in the logs
- If they match, these events are the cause

## Enhanced useTranslations Tracking

The `useTranslations` hook now tracks:
- **MOUNT** - First render (with unique `mountId`)
- **RENDER** - Subsequent renders (with render count and `mountId`)
- **EFFECT** - When effect runs (`effect-mount`)
- **SUBSCRIPTION** - When subscription is created (with render count and `mountId`)
- **EFFECT_CLEANUP** - When cleanup runs (`effect-unmount`)
- **UNMOUNT** - When component unmounts (with render count and `mountId`)

## Example Diagnostic Output

```javascript
{
  timestamp: 1762626756811,
  component: "useTranslations",
  event: "MOUNT",
  data: {
    renderCount: 1,
    mountId: "useTranslations-1762626756811-abc123"
  }
}

{
  timestamp: 1762626756812,
  component: "useTranslations",
  event: "EFFECT",
  data: {
    effectName: "effect-mount",
    deps: []
  }
}

{
  timestamp: 1762626756813,
  component: "useTranslations",
  event: "SUBSCRIPTION",
  data: {
    subscriptionName: "subscribe",
    renderCount: 1,
    mountId: "useTranslations-1762626756811-abc123"
  }
}

{
  timestamp: 1762626756814,
  component: "useTranslations",
  event: "RENDER",
  data: {
    renderCount: 2,
    isReRender: true,
    mountId: "useTranslations-1762626756811-abc123"
  }
}

{
  timestamp: 1762626756815,
  component: "useTranslations",
  event: "EFFECT",
  data: {
    effectName: "effect-unmount",
    deps: []
  }
}

{
  timestamp: 1762626756816,
  component: "useTranslations",
  event: "UNMOUNT",
  data: {
    renderCount: 2,
    mountId: "useTranslations-1762626756811-abc123"
  }
}
```

## How to Analyze

### 1. Check for Mount/Unmount Cycles
```javascript
const report = flickerDiagnostics.exportLogs();
const mounts = report.logs.filter(l => l.event === 'MOUNT');
const unmounts = report.logs.filter(l => l.event === 'UNMOUNT');

console.log(`Mounts: ${mounts.length}, Unmounts: ${unmounts.length}`);

// If mounts === unmounts, components are mounting/unmounting
// If mounts > unmounts, components are mounting but not unmounting (or still mounted)
// If mounts < unmounts, something's wrong (unmounting without mounting)
```

### 2. Check for Rapid Mount/Unmount Cycles
```javascript
const report = flickerDiagnostics.exportLogs();
const lifecycle = report.logs.filter(l => 
  l.event === 'MOUNT' || l.event === 'UNMOUNT'
);

lifecycle.forEach((event, i) => {
  if (i > 0) {
    const timeDiff = event.timestamp - lifecycle[i-1].timestamp;
    if (timeDiff < 100 && event.event !== lifecycle[i-1].event) {
      console.log(`⚠️ Rapid mount/unmount: ${event.component} - ${timeDiff}ms`);
    }
  }
});
```

### 3. Correlate Subscriptions with Renders
```javascript
const report = flickerDiagnostics.exportLogs();
const subscriptions = report.logs.filter(l => 
  l.event === 'SUBSCRIPTION' && l.component === 'useTranslations'
);
const renders = report.logs.filter(l => 
  l.event === 'RENDER' && l.component === 'useTranslations'
);

console.log(`Subscriptions: ${subscriptions.length}, Renders: ${renders.length}`);

// If renders > subscriptions, components are re-rendering without new subscriptions
// If renders < subscriptions, subscriptions aren't causing re-renders (good!)
```

### 4. Track Individual Hook Instances
```javascript
const report = flickerDiagnostics.exportLogs();
const byMountId = {};

report.logs.forEach(log => {
  if (log.data?.mountId) {
    if (!byMountId[log.data.mountId]) {
      byMountId[log.data.mountId] = [];
    }
    byMountId[log.data.mountId].push(log);
  }
});

Object.entries(byMountId).forEach(([mountId, events]) => {
  const mountEvents = events.filter(e => e.event === 'MOUNT');
  const unmountEvents = events.filter(e => e.event === 'UNMOUNT');
  const renderEvents = events.filter(e => e.event === 'RENDER');
  
  console.log(`${mountId}: ${mountEvents.length} mounts, ${unmountEvents.length} unmounts, ${renderEvents.length} renders`);
});
```

## Next Steps

1. **Enable diagnostics** with `?diagnostics=flicker` or `localStorage.setItem('flicker-diagnostics', 'enabled')`
2. **Reproduce the flicker** and let the page load
3. **Export the logs** with `flickerDiagnostics.exportLogs()`
4. **Analyze the data** using the patterns above to determine:
   - Are components mounting/unmounting?
   - Are subscriptions causing re-renders?
   - Is the flicker timing correlated with these events?

This will give us **definitive answers** without assumptions.

