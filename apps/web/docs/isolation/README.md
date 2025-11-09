# Runtime Subsystem Kill Switch Harness

## Purpose

Binary isolation system to identify which subsystem causes UI flicker. Each subsystem can be disabled at runtime via localStorage switches without rebuilding.

## Kill Switch Keys

All switches use localStorage keys in format: `<key>:off` (set to `'1'` or `'true'` to disable)

| Key | Subsystem | Description |
|-----|-----------|-------------|
| `isw:off` | Service Worker | Registration, update, message handler |
| `iauth:off` | Firebase Auth | Init, `onAuthStateChanged`, token refresh |
| `ifire:off` | Firestore/RTDB | `onSnapshot` listeners, live queries |
| `iapiclient:off` | External API | TMDB proxy, backend fetch layer |
| `imsg:off` | FCM/Messaging | FCM registration, foreground handlers |
| `ircfg:off` | Remote Config | Feature flag polling, remote config |
| `ianalytics:off` | Analytics/Perf | Sentry initialization, performance beacons |
| `iprefetch:off` | Router Prefetch | Page prefetch on hover/viewport |
| `ifonts:off` | Fonts/Assets | Webfont swap, aggressive preloads |

## Usage

### Toggle Switches (Browser Console)

```javascript
// Disable a subsystem
localStorage.setItem('isw:off', '1');

// Enable a subsystem (remove the key)
localStorage.removeItem('isw:off');

// Disable all subsystems
['isw', 'iauth', 'ifire', 'iapiclient', 'imsg', 'ircfg', 'ianalytics', 'iprefetch', 'ifonts'].forEach(k => {
  localStorage.setItem(`${k}:off`, '1');
});

// Enable all subsystems
['isw', 'iauth', 'ifire', 'iapiclient', 'imsg', 'ircfg', 'ianalytics', 'iprefetch', 'ifonts'].forEach(k => {
  localStorage.removeItem(`${k}:off`);
});
```

### Test Order (Binary Search)

1. **Baseline**: Turn all switches OFF, confirm page renders without flicker
   ```javascript
   ['isw', 'iauth', 'ifire', 'iapiclient', 'imsg', 'ircfg', 'ianalytics', 'iprefetch', 'ifonts'].forEach(k => {
     localStorage.setItem(`${k}:off`, '1');
   });
   ```
   Reload page. If flicker persists, it's not these subsystems.

2. **Enable one at a time** (60 seconds each), in this order:
   - `iprefetch` → `ifonts` → `ianalytics` → `isw` → `iapiclient` → `ircfg` → `imsg` → `ifire` → `iauth`

3. **After each toggle**:
   - Observe screen for flicker during known steps
   - Save i18n diagnostics JSON (existing flow)
   - Note: "ON caused flicker?" Yes/No

4. **When flicker returns**: You've found the culprit subsystem.

5. **If none cause flicker alone**: Enable pairs (e.g., `isw` + `iapiclient`) to catch interaction effects.

### Visual Overlay (Dev Only)

In development mode, a fixed overlay at top-right shows all switch states:
- ✅ ON = subsystem active
- ❌ OFF = subsystem disabled

The overlay updates automatically when switches change.

## Implementation Details

### Wire Points

- **Service Worker**: `sw-register.ts`, `useServiceWorker.ts`
- **Firebase Auth**: `firebaseBootstrap.ts`, `lib/auth.ts`
- **Firestore**: Components using `onSnapshot` (e.g., `CommentList.tsx`)
- **API Client**: `lib/tmdb.ts`, search files
- **Messaging**: `firebase-messaging.ts`
- **Feature Flags**: `lib/flags.tsx`
- **Analytics**: `main.tsx` (Sentry init)

### Behavior When OFF

- **Service Worker**: No registration, no cache interception
- **Firebase Auth**: No `onAuthStateChanged`, stable "signed out" state
- **Firestore**: `onSnapshot` returns no-op unsubscribe, never emits
- **API Client**: Returns empty `{ results: [] }` without network calls
- **Messaging**: No FCM registration, no message handlers
- **Feature Flags**: All flags return `false` (default disabled)
- **Analytics**: Sentry not initialized, no beacons sent

### Files

- `apps/web/src/runtime/switches.ts` - Core switch checking utility
- `apps/web/src/runtime/overlay.ts` - Dev-only visual overlay
- `apps/web/src/runtime/firestoreWrapper.ts` - Firestore listener wrapper (helper)

## Notes

- Switches are checked at runtime, no rebuild required
- Default behavior: all subsystems enabled (switches not set)
- Kill switches don't mock data - they no-op to find the culprit, not replace it
- When a subsystem is OFF, dependent code should handle gracefully (app still renders)

## Example: Finding the Culprit

```javascript
// 1. Start with all OFF
['isw', 'iauth', 'ifire', 'iapiclient', 'imsg', 'ircfg', 'ianalytics', 'iprefetch', 'ifonts'].forEach(k => {
  localStorage.setItem(`${k}:off`, '1');
});
// Reload - no flicker ✓

// 2. Enable Auth
localStorage.removeItem('iauth:off');
// Reload - flicker appears ✗
// → Auth is the culprit!

// 3. Confirm by disabling again
localStorage.setItem('iauth:off', '1');
// Reload - no flicker ✓
// → Confirmed: Auth causes flicker
```

## Cleanup

After identifying the culprit, remove the kill switch harness:
- Delete `apps/web/src/runtime/switches.ts`
- Delete `apps/web/src/runtime/overlay.ts`
- Delete `apps/web/src/runtime/firestoreWrapper.ts`
- Remove kill switch checks from wire points
- Delete this README

