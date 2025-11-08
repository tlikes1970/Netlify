# Auth Debug Diagnostics

This document describes the auth debugging and diagnostic tools added to help diagnose production login loop issues.

## Overview

The auth debug system provides:

- A diagnostic page at `/debug/auth` showing environment, config, storage, cookies, and SW status
- Verbose auth logging guarded by `?debug=auth` or `FLK_AUTH_DEBUG=1`
- Hardened redirect handling with origin verification
- Query param overrides for testing different auth flows
- Service Worker skip capability for cache interference testing

## Usage

### Accessing the Debug Page

Navigate to `/debug/auth` in your browser. The page shows:

- **Environment**: Current origin, referrer, protocol, iframe status
- **Firebase Config**: Masked config values (apiKey, appId show first/last 3 chars)
- **Cookies**: All cookies for current domain with SameSite test
- **Storage Availability**: Tests for localStorage, sessionStorage, IndexedDB
- **Service Worker**: SW registration status, script URL, state
- **Recent Auth Logs**: Live feed of auth events (when `?debug=auth` is enabled)

### Enabling Debug Logging

Debug logging is enabled via:

1. **URL Parameter**: Add `?debug=auth` to any URL

   ```
   https://flicklet.netlify.app/?debug=auth
   ```

2. **Build-time Environment Variable**: Set `FLK_AUTH_DEBUG=1` in your build environment
   ```bash
   FLK_AUTH_DEBUG=1 npm run build
   ```

When enabled, console logs will include structured `[AuthDebug]` events with timestamps and sanitized payloads (tokens/emails are masked).

### Query Parameters

#### `?debug=auth`

Enables verbose auth logging. All auth events are logged to console with `[AuthDebug]` prefix and added to the log buffer visible on `/debug/auth`.

#### `?authMode=popup`

Forces popup flow for this session only. Overrides normal flow selection logic.

#### `?authMode=redirect`

Forces redirect flow for this session only. Overrides normal flow selection logic.

#### `?sw=skip`

Unregisters all service workers and clears caches. Useful for eliminating cache interference during testing. Only works in debug mode.

### Example URLs

```
# Enable debug logging
https://flicklet.netlify.app/?debug=auth

# Force popup mode with debug
https://flicklet.netlify.app/?debug=auth&authMode=popup

# Skip service worker
https://flicklet.netlify.app/?sw=skip

# Debug page
https://flicklet.netlify.app/debug/auth
```

## Diagnostic Information

### Origin Mismatch Detection

The system now verifies that redirect returns match the expected origin. If a mismatch is detected:

1. A non-blocking red banner appears at the top of the page
2. The banner shows: "Auth return origin mismatch: got X expected Y"
3. A "Retry with Popup" button is provided
4. The app stops looping and sets status to `unauthenticated`

### Common Issues Diagnosed

The debug logger automatically diagnoses common errors:

- **`auth/network-request-failed`**: Network/CORS issue
- **`auth/unauthorized-domain`**: Domain not in Firebase authorized domains
- **`postMessage` mismatch**: OAuth redirect URI configuration issue

Diagnoses appear in the auth logs with `diagnosis` event type.

## What to Capture for Support

When reporting auth issues, capture:

1. **Screenshot of `/debug/auth` page** showing:
   - Environment section (origin, protocol)
   - Firebase Config (authDomain, projectId)
   - Storage Availability results
   - Service Worker status

2. **Console logs** with `?debug=auth` enabled:
   - Copy all `[AuthDebug]` log entries
   - Include browser console errors

3. **Network HAR file** (if possible):
   - Capture during the auth flow
   - Shows redirect sequence and any failed requests

4. **Browser/Device Info**:
   - Browser name and version
   - Device type (mobile/desktop)
   - OS version
   - Whether in PWA/standalone mode

## Testing

### Playwright E2E Test

A lightweight Playwright test is included at `apps/web/tests/auth.spec.ts` that:

- Tests redirect result parsing (one-shot guard)
- Verifies origin mismatch banner appears
- Tests `authMode` query param overrides
- Ensures no redirect loops

Run with:

```bash
npx playwright test apps/web/tests/auth.spec.ts
```

### Manual Testing Checklist

1. **Normal Flow**:
   - [ ] Visit production URL
   - [ ] Click "Sign in with Google"
   - [ ] Complete OAuth flow
   - [ ] Verify successful login without loop

2. **Debug Mode**:
   - [ ] Visit `/?debug=auth`
   - [ ] Check console for `[AuthDebug]` logs
   - [ ] Visit `/debug/auth` and verify all sections render
   - [ ] Trigger login and verify logs appear

3. **Origin Mismatch**:
   - [ ] Simulate mismatch (requires manual URL manipulation)
   - [ ] Verify banner appears
   - [ ] Click "Retry with Popup" and verify popup flow works

4. **Query Overrides**:
   - [ ] Test `?authMode=popup` forces popup
   - [ ] Test `?authMode=redirect` forces redirect (on supported domains)
   - [ ] Verify override is logged in debug mode

5. **Service Worker**:
   - [ ] Visit `/?sw=skip`
   - [ ] Verify SW is unregistered
   - [ ] Test auth flow without SW interference

## Rollback

All changes are feature-flagged and reversible:

1. **Disable Debug Logging**: Remove `?debug=auth` from URL or unset `FLK_AUTH_DEBUG`
2. **Remove Debug Page**: Comment out `/debug/auth` route in `App.tsx`
3. **Disable Hardening**: The origin check can be bypassed by removing the verification in `auth.ts`

The debug system is designed to have zero impact on production UX when debug flags are off.

## Implementation Details

### Files Modified

- `apps/web/src/lib/authDebug.ts` - Debug utilities
- `apps/web/src/debug/AuthDebugPage.tsx` - Diagnostic page
- `apps/web/src/lib/firebaseBootstrap.ts` - Added debug logging
- `apps/web/src/lib/auth.ts` - Added origin verification and debug logging
- `apps/web/src/lib/authLogin.ts` - Added authMode override and debug logging
- `apps/web/src/components/AuthConfigError.tsx` - Added origin mismatch banner
- `apps/web/src/sw-register.ts` - Added `?sw=skip` handling
- `apps/web/src/App.tsx` - Added `/debug/auth` route
- `apps/web/tests/auth.spec.ts` - E2E test

### Security Notes

- All secrets are masked in logs (show first/last 3 chars only)
- No PII (emails, tokens) is logged in plain text
- Debug page is accessible in production but requires manual navigation
- Query params are sanitized before redirects

## Troubleshooting

### Debug Page Not Loading

- Check browser console for errors
- Verify route is registered in `App.tsx`
- Check that `AuthDebugPage` component imports correctly

### Logs Not Appearing

- Verify `?debug=auth` is in URL
- Check browser console filter (may be filtering `[AuthDebug]`)
- Ensure `isAuthDebug()` returns true (check in console)

### Origin Mismatch Banner Not Showing

- Verify event is dispatched: `window.dispatchEvent(new CustomEvent('auth:origin-mismatch', ...))`
- Check that `AuthConfigError` component is rendered in `App.tsx`
- Verify event listener is registered

### Service Worker Not Skipping

- Ensure `?sw=skip` is in URL before page load
- Check browser console for SW unregister messages
- Verify SW registration happens after param check

## Future Enhancements

Potential improvements:

- Export logs to file/download
- Real-time log streaming via WebSocket
- Integration with error tracking (Sentry)
- Automated origin mismatch detection and reporting
- Performance metrics for auth flow



