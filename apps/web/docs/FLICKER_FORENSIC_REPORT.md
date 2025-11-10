# Production Flicker Forensic Report
## Deep Line-by-Line Analysis

**Issue**: Entire page flickers continuously in production (milliseconds, repeating) until hard refresh. No errors. Happens even when not on that page.

**Date**: 2024-01-XX
**Scope**: Complete codebase audit

---

## 🔴 CRITICAL ISSUE #1: Service Worker Aggressive Activation Loop

### Location: `apps/web/public/sw.js` lines 3-9

```3:9:apps/web/public/sw.js
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
```

**Problem**: 
- `skipWaiting()` forces immediate activation without waiting for existing clients to close
- `clients.claim()` immediately takes control of ALL pages, including ones already loaded
- This causes the page to be "claimed" by the SW mid-render, triggering a reload/flicker cycle

**Why it flickers**:
1. Page loads → React renders
2. SW activates → `clients.claim()` fires
3. Browser reloads page to apply SW control
4. Page loads again → React renders
5. SW detects update → calls `reg.update()` (see Issue #2)
6. Loop repeats

**Evidence**: Hard refresh bypasses SW cache, breaking the loop.

---

## 🔴 CRITICAL ISSUE #2: Service Worker Update Loop

### Location: `apps/web/src/sw-register.ts` lines 76-80, 93-96

```76:80:apps/web/src/sw-register.ts
if (reg.installing) {
  reg.installing.addEventListener('statechange', () => {
    if (reg.installing?.state === 'activated') {
      reg.update();
    }
  });
}
```

**Problem**: 
- When SW activates, it immediately calls `reg.update()`
- This checks for a new SW version
- If a new version exists (even if it's the same), it triggers another install cycle
- Creates infinite update loop: activate → update → install → activate → update...

**Why it flickers**:
- Each SW update cycle can cause the page to reload or re-render
- Combined with `clients.claim()`, this creates a continuous flicker

---

## 🔴 CRITICAL ISSUE #3: First-Paint Gate Race Condition

### Location: `apps/web/index.html` lines 26-32, `apps/web/src/main.tsx` lines 45-63

```26:32:apps/web/index.html
<script>
  try {
    if (localStorage.getItem('app:primed') !== '1') {
      document.documentElement.classList.add('fp-gate');
    }
  } catch {}
</script>
```

```45:63:apps/web/src/main.tsx
async function releaseFirstPaintGate(timeoutMs = 1200) {
  const deadline = new Promise(res => setTimeout(res, timeoutMs));
  await Promise.race([
    (async () => {
      if (document.readyState === 'loading') {
        await new Promise<void>(r => document.addEventListener('DOMContentLoaded', () => r(), { once: true }));
      }
      await allStylesLoaded();
      await fontsReadyOrTimeout(800);
      await i18nFirstSnapshotOrTimeout(400);
    })(),
    deadline
  ]);

  try { localStorage.setItem('app:primed', '1'); } catch {}
  document.documentElement.classList.remove('fp-gate');
  const gateCss = document.getElementById('fp-gate-css');
  if (gateCss && gateCss.parentNode) gateCss.parentNode.removeChild(gateCss);
}
```

**Problem**:
- Gate CSS sets `body { visibility: hidden; }` when `fp-gate` class is present
- If SW serves stale HTML, the gate check might run multiple times
- If `releaseFirstPaintGate()` is called multiple times (see Issue #4), the gate toggles visibility
- Each toggle causes a visible flicker

**Why it flickers**:
1. Page loads with `fp-gate` → body hidden
2. `releaseFirstPaintGate()` removes `fp-gate` → body visible
3. SW update triggers → page reloads
4. Gate check runs again → might add `fp-gate` back
5. `releaseFirstPaintGate()` called again → removes `fp-gate`
6. Loop repeats

---

## 🔴 CRITICAL ISSUE #4: React App Rendered Multiple Times

### Location: `apps/web/src/main.tsx` lines 421-432, 436-448

```421:432:apps/web/src/main.tsx
// Now render React app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <FlagsProvider>
        <App />
      </FlagsProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

// Release first-paint gate after React mount
releaseFirstPaintGate();
```

```436:448:apps/web/src/main.tsx
// Still render app even if Firebase bootstrap fails (graceful degradation)
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <FlagsProvider>
        <App />
      </FlagsProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
console.log('[Boot] Emergency render finished');

// Release first-paint gate even in error path
releaseFirstPaintGate();
```

**Problem**:
- `ReactDOM.createRoot().render()` is called in both success and error paths
- If `bootstrapApp()` is called multiple times (e.g., by SW reload), React tries to render multiple times
- Each render calls `releaseFirstPaintGate()`, toggling the gate
- React 18's `createRoot` can handle multiple renders, but combined with gate toggling, causes flicker

**Why it flickers**:
- Multiple renders = multiple gate releases = visibility toggles = flicker

---

## 🔴 CRITICAL ISSUE #5: Service Worker Registration Timing

### Location: `apps/web/src/main.tsx` line 459

```459:459:apps/web/src/main.tsx
registerServiceWorker();
```

**Problem**:
- SW registration happens AFTER React render (line 421) but BEFORE gate release (line 432)
- If an existing SW is already active, `clients.claim()` might fire during the render
- This can cause the page to reload mid-initialization

**Why it flickers**:
- SW takes control during React render → page reloads → render starts again → SW takes control → loop

---

## 🔴 CRITICAL ISSUE #6: Service Worker Controller Change Not Handled

### Location: `apps/web/src/sw-register.ts` lines 68-101

**Problem**:
- No listener for `controllerchange` event
- When SW activates and claims clients, the `navigator.serviceWorker.controller` changes
- This can cause the page to reload, but the code doesn't handle this gracefully
- The `useServiceWorker` hook (line 58) reloads on update, but registration code doesn't

**Why it flickers**:
- Controller changes → page might reload → SW registration runs again → controller changes → loop

---

## 🔴 CRITICAL ISSUE #7: React StrictMode in Production

### Location: `apps/web/src/main.tsx` line 422

```422:422:apps/web/src/main.tsx
<React.StrictMode>
```

**Problem**:
- React StrictMode is enabled in production
- StrictMode intentionally double-invokes effects and renders in development
- While it shouldn't double-invoke in production, having it enabled can cause issues with:
  - Service Worker updates (double renders during SW activation)
  - First-paint gate (gate might be released twice)
  - Component lifecycle (mount/unmount cycles)

**Why it flickers**:
- Combined with SW updates, StrictMode can cause additional render cycles
- Each render cycle can trigger gate toggles

---

## 🔴 CRITICAL ISSUE #8: CSS Loading Race with Service Worker Cache

### Location: `apps/web/src/main.tsx` lines 11-18

```11:18:apps/web/src/main.tsx
function allStylesLoaded(): Promise<void> {
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"][href]')) as HTMLLinkElement[];
  const waits = links.map(l => l.sheet ? Promise.resolve() : new Promise<void>(res => {
    l.addEventListener('load', () => res(), { once: true });
    l.addEventListener('error', () => res(), { once: true });
  }));
  return Promise.all(waits).then(() => {});
}
```

**Problem**:
- `allStylesLoaded()` waits for all stylesheets to load
- If SW serves cached CSS that conflicts with new CSS, styles might load in wrong order
- If CSS loads from cache (instant) but then SW updates and serves different CSS, styles toggle
- This causes visual flicker as styles change

**Why it flickers**:
1. Page loads → CSS loads from SW cache (old version)
2. SW updates → serves new CSS
3. Browser applies new CSS → styles change → flicker
4. Loop repeats

---

## 🔴 CRITICAL ISSUE #9: Service Worker Navigate Mode Handling

### Location: `apps/web/public/sw.js` lines 87-94

```87:94:apps/web/public/sw.js
if (req.mode === "navigate") {
  // Offline fallback page
  e.respondWith(
    fetch(req).catch(() => {
      return caches.match("/offline.html") || new Response("Offline", { status: 503 });
    })
  );
  return;
}
```

**Problem**:
- SW intercepts ALL navigation requests
- If SW is updating, it might serve stale HTML from cache
- This causes the page to load old HTML, then new HTML, causing flicker

**Why it flickers**:
- Navigate request → SW serves cached HTML → page renders
- SW updates → serves new HTML → page re-renders → flicker

---

## 🔴 CRITICAL ISSUE #10: Duplicate Service Worker Registration

### Location: `apps/web/src/sw-register.ts` (called from main.tsx) + `apps/web/src/hooks/useServiceWorker.ts` line 173

**Problem**:
- SW is registered in `main.tsx` line 459
- `useServiceWorker` hook also registers SW in `App.tsx` (if used)
- Two registrations can cause conflicts:
  - First registration activates SW
  - Second registration detects update → triggers reload
  - Loop repeats

**Why it flickers**:
- Multiple registrations → multiple update checks → multiple reloads → flicker

---

## Summary of Root Causes

1. **Service Worker aggressive activation** (`skipWaiting` + `clients.claim`) causes immediate page takeover
2. **Update loop** (activate → update → install → activate) creates infinite cycle
3. **First-paint gate race condition** toggles visibility during SW updates
4. **Multiple React renders** combined with gate toggles
5. **SW registration timing** happens during render, causing mid-render reloads
6. **No controller change handling** causes unexpected reloads
7. **React StrictMode in production** adds extra render cycles
8. **CSS loading race** with SW cache causes style toggles
9. **Navigate mode handling** serves stale HTML during updates
10. **Duplicate SW registration** causes conflicting update checks

---

## Recommended Fixes (Priority Order)

### 1. Remove `clients.claim()` or make it conditional
- Only claim clients if no existing controller
- Prevents immediate takeover of loaded pages

### 2. Remove automatic `reg.update()` on activation
- Let browser handle updates naturally
- Prevents update loop

### 3. Add controller change listener
- Handle SW controller changes gracefully
- Prevent unexpected reloads

### 4. Guard `releaseFirstPaintGate()` to run only once
- Use a flag to prevent multiple calls
- Prevents gate toggling

### 5. Register SW before React render
- Move registration earlier in bootstrap
- Prevents mid-render takeover

### 6. Remove React StrictMode in production
- Use environment check to disable in prod
- Reduces render cycles

### 7. Add CSS versioning/cache busting
- Ensure CSS loads in correct order
- Prevents style toggles

### 8. Consolidate SW registration
- Remove duplicate registrations
- Single source of truth

### 9. Add SW update debouncing
- Prevent rapid update checks
- Break update loop

### 10. Handle navigate requests more carefully
- Don't serve stale HTML during updates
- Use network-first for HTML

---

## Testing Recommendations

1. Test with SW disabled (`?sw=skip`)
2. Test with hard refresh (bypasses SW)
3. Test with SW update simulation
4. Monitor `controllerchange` events
5. Monitor `releaseFirstPaintGate()` calls
6. Monitor React render counts
7. Monitor CSS load order

---

## Files Requiring Changes

1. `apps/web/public/sw.js` - Remove/modify `clients.claim()` and `skipWaiting()`
2. `apps/web/src/sw-register.ts` - Remove automatic `reg.update()`, add controller change handling
3. `apps/web/src/main.tsx` - Guard `releaseFirstPaintGate()`, move SW registration, remove StrictMode in prod
4. `apps/web/src/hooks/useServiceWorker.ts` - Remove duplicate registration
5. `apps/web/index.html` - Consider removing inline gate script if SW handles it

---

**End of Report**

