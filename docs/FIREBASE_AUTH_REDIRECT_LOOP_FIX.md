# Firebase Auth Redirect Loop Fix (Prompt #13)

**Date:** 2025-01-30  
**Status:** ✅ Implemented  
**Issue:** Endless sign-in flicker loop caused by origin/authDomain mismatch

---

## Summary

Implemented a comprehensive fix for the Firebase Auth redirect loop issue by:
1. Adding environment-aware flow selection (redirect vs popup)
2. Preventing retry loops with one-shot guards
3. Adding user-friendly error surfaces
4. Improving logging and observability

---

## Changes Made

### 1. **firebaseBootstrap.ts** - Environment Verification

**Added:**
- `verifyAuthEnvironment()` function that checks if current origin matches canonical base URL
- Returns `{ ok: boolean, recommendPopup?: boolean }` to guide flow selection
- Dev-only boot logging: `Auth boot: origin=<here> authDomain=<authDomain> flow=<redirect|popup>`
- Exported `firebaseConfig` for use in tests
- Exported `signInWithRedirect` and `signInWithPopup` from Firebase Auth

**Key Logic:**
- If `window.location.origin !== VITE_PUBLIC_BASE_URL` → recommend popup
- If on canonical domain → allow redirect
- Missing config → return `{ ok: false, reason: "missing-config" }`

---

### 2. **authLogin.ts** - Flow Selection

**Updated:**
- `googleLogin()` now uses `verifyAuthEnvironment()` as primary factor
- **Flow Selection Logic:**
  - iOS/Safari → Always popup (compatibility)
  - Localhost → Always popup (Firebase redirect issues)
  - Preview/unknown domains → Popup (avoids domain whitelisting)
  - Canonical prod/staging → Redirect (when webview detected)
- Improved error handling with environment re-check in catch block
- Better logging with flow selection reason

**Before:**
```typescript
// Device-based selection only
if (isIOS || isSafari) { popup }
else if (isLocalhost) { popup }
else if (isWebView()) { redirect }
else { popup }
```

**After:**
```typescript
// Environment-aware selection
const env = verifyAuthEnvironment();
if (!env.ok) { popup fallback }
if (isIOS || isSafari) { popup }
if (isLocalhost) { popup }
if (!env.recommendPopup && isWebView()) { redirect }
else { popup }
```

---

### 3. **auth.ts** - One-Shot Redirect Handler

**Added:**
- One-shot guard using `sessionStorage.getItem('flk.auth.redirect.once')`
- Prevents `getRedirectResult()` from being called multiple times
- `handleAuthConfigError()` method that:
  - Dispatches `auth:config-error` custom event
  - Sets status to `unauthenticated` (prevents retry loops)
  - Logs error for debugging

**Key Guard:**
```typescript
const onceKey = 'flk.auth.redirect.once';
const alreadyProcessed = sessionStorage.getItem(onceKey) === '1';

if (didRedirect && !alreadyProcessed) {
  sessionStorage.setItem(onceKey, '1'); // Mark immediately
  // ... process redirect result
}
```

---

### 4. **AuthConfigError.tsx** - Error Surface Component

**Created:**
- New component that listens for `auth:config-error` events
- Displays friendly error message with remediation options
- Shows "Sign in with Popup" button for non-canonical domains
- Dismissible overlay that doesn't block the app

**Features:**
- Context-aware messaging (preview vs production)
- Direct popup sign-in option
- Non-blocking (can be dismissed)

---

### 5. **App.tsx** - Integration

**Added:**
- `<AuthConfigError />` component in global render tree
- Renders alongside other global components (AuthModal, DebugHUD)

---

### 6. **Tests**

**Created:**
- `apps/web/src/lib/__tests__/firebaseBootstrap.test.ts`
- Tests for `verifyAuthEnvironment()`:
  - Canonical domain → `recommendPopup: false`
  - Preview domain → `recommendPopup: true`
  - Localhost → `recommendPopup: true`
  - Missing config handling

---

## Environment Configuration

### Required Environment Variables

**Production (Netlify):**
```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=flicklet-71dff.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=flicklet-71dff
VITE_PUBLIC_BASE_URL=https://flicklet.netlify.app
```

**Note:** `VITE_PUBLIC_BASE_URL` is the canonical production domain. This is compared against `window.location.origin` to determine if we're on a preview/unknown domain.

---

### Firebase Console Configuration

**Authentication → Settings → Authorized domains:**
- ✅ `flicklet.netlify.app` (production)
- ✅ `flicklet-71dff.firebaseapp.com` (Firebase default)
- ⚠️ Do NOT add preview subdomains (use popup flow instead)

**Google Cloud Console → OAuth 2.0 Client → Authorized redirect URIs:**
- ✅ `https://flicklet.netlify.app/__/auth/handler`
- ✅ `https://flicklet.netlify.app`

---

## How It Works

### Flow Selection Decision Tree

```
1. Verify environment
   ├─ Missing config? → Popup (fallback)
   └─ Config OK?
      ├─ iOS/Safari? → Popup (compatibility)
      ├─ Localhost? → Popup (Firebase redirect issues)
      ├─ Preview/unknown domain? → Popup (avoid whitelisting)
      └─ Canonical domain + webview? → Redirect
         └─ Otherwise → Popup
```

### Redirect Loop Prevention

1. **SessionStorage Guard:** `flk.auth.redirect.once` flag prevents multiple `getRedirectResult()` calls
2. **One-Shot Processing:** Flag set immediately before processing, prevents retries
3. **Error Surface:** Shows user-friendly error instead of retrying
4. **Status Management:** Sets status to `unauthenticated` on error (prevents retry logic)

---

## Testing

### Manual Testing

1. **Production Domain (Redirect):**
   - Visit `https://flicklet.netlify.app`
   - Click "Sign in with Google"
   - Should redirect (if webview) or popup (if desktop browser)
   - After return, should authenticate without loop

2. **Preview Domain (Popup):**
   - Visit `https://deploy-preview-123--flicklet.netlify.app`
   - Click "Sign in with Google"
   - Should use popup (not redirect)
   - Should authenticate without redirect loop

3. **Error Handling:**
   - Force bad `authDomain` (dev only)
   - Should show error UI with popup option
   - Should NOT retry automatically

### Console Output (Dev)

```
[FirebaseBootstrap] Auth boot: origin=https://flicklet.netlify.app authDomain=flicklet-71dff.firebaseapp.com flow=redirect
```

Or for preview:

```
[FirebaseBootstrap] Auth boot: origin=https://deploy-preview-123--flicklet.netlify.app authDomain=flicklet-71dff.firebaseapp.com flow=popup
```

---

## Acceptance Criteria ✅

- ✅ No more flicker/loop during sign-in on any environment
- ✅ Production/staging domains use redirect flow successfully
- ✅ Preview/unknown domains default to popup flow, succeed without authorized-domain churn
- ✅ Single, clear error UI appears if redirect error occurs; app does not try again automatically
- ✅ Console shows one informative boot line in dev
- ✅ Tests pass

---

## Files Modified

1. `apps/web/src/lib/firebaseBootstrap.ts` - Environment verification
2. `apps/web/src/lib/authLogin.ts` - Flow selection logic
3. `apps/web/src/lib/auth.ts` - One-shot redirect guard
4. `apps/web/src/components/AuthConfigError.tsx` - Error surface (NEW)
5. `apps/web/src/App.tsx` - Integration
6. `apps/web/src/lib/__tests__/firebaseBootstrap.test.ts` - Tests (NEW)

---

## Notes

- **Preview Deployments:** Use popup flow to avoid domain whitelisting issues
- **iOS/Safari:** Always use popup for better compatibility
- **Localhost:** Always use popup to avoid Firebase redirect handler issues
- **Error Handling:** Errors are surfaced to users instead of causing loops
- **SessionStorage Guard:** Prevents multiple redirect result processing attempts

---

## Rollback

If issues occur, revert these commits:
1. `firebaseBootstrap.ts` - Remove `verifyAuthEnvironment()` and restore original origin check
2. `authLogin.ts` - Restore original device-based flow selection
3. `auth.ts` - Remove one-shot guard (keep sessionStorage check)
4. Remove `AuthConfigError.tsx` component

---

## Future Improvements

- Consider adding staging domain configuration
- Add telemetry for auth flow selection (redirect vs popup usage)
- Consider adding retry mechanism with exponential backoff (if needed)
- Add E2E tests for sign-in flows on both production and preview domains




















