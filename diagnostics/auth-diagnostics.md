# Auth Diagnostics Bundle

**Generated:** *(will be populated at runtime)*  
**App Version:** 0.3.3

---

## Phase A - Inventory & Evidence

### A1. Runtime Configuration

#### Firebase Config (from environment)
- **authDomain:** `flicklet.netlify.app` (default, can be overridden via `VITE_FIREBASE_AUTH_DOMAIN`)
- **projectId:** `flicklet-71dff` (default, can be overridden via `VITE_FIREBASE_PROJECT_ID`)
- **apiKey (last 6):** `...M6zAXM` (masked, from default fallback)

**⚠️ VERIFY:** Ensure `VITE_FIREBASE_AUTH_DOMAIN` env var in Netlify Dashboard matches actual domain (`flicklet.netlify.app`)

#### Persistence
- **Method:** *(populated at runtime)*
- **Set before sign-in:** *(populated at runtime)*

#### Service Worker
- **Active:** *(populated at runtime)*
- **Version:** `v4` (from `apps/web/public/sw.js`)

#### Page State at Boot
- **href:** *(populated at runtime)*
- **search:** *(populated at runtime)*
- **hash:** *(populated at runtime)*
- **visibilityState:** *(populated at runtime)*
- **bootTime:** *(populated at runtime)*

---

### A2. Relevant Files Inventory

| File | Status | Notes |
|------|--------|-------|
| `apps/web/src/main.tsx` | ✅ Present | Entry point - boots Firebase before React |
| `apps/web/src/lib/firebaseBootstrap.ts` | ✅ Present | Single source of truth for Firebase init |
| `apps/web/src/lib/auth.ts` | ✅ Present | AuthManager - handles getRedirectResult |
| `apps/web/src/lib/authLogin.ts` | ✅ Present | Google sign-in flow |
| `apps/web/src/hooks/useAuth.ts` | ✅ Present | React hook for auth state |
| `apps/web/public/sw.js` | ✅ Present | Service Worker v4 with auth bypass |
| `netlify.toml` | ✅ Present | Redirect rules and headers |
| `apps/web/src/version.ts` | ✅ Present | App version tracking |

---

### A3. Netlify Effective Rules

**Order matters** - `/__/auth/*` rule MUST come BEFORE catch-all:

1. `/api/tmdb-proxy` → `/.netlify/functions/tmdb-proxy` (200)
2. `/api/dict/entries` → `/.netlify/functions/dict-proxy` (200)
3. `/emails` → `/404.html` (404, force)
4. **`/__/auth/*` → `/__/auth/:splat` (200)** ⚠️ CRITICAL - preserves Firebase handler
5. `/*` → `/index.html` (200) - SPA fallback (must be last)

**Headers:**
- `/sw.js` → `Cache-Control: no-cache, no-store, must-revalidate`
- `/__/auth/*` → `Cache-Control: no-cache, no-store, must-revalidate`

✅ **VERIFIED:** `/__/auth/*` rule is positioned BEFORE catch-all (`/*`)

---

### A4. Service Worker Bypass Verification

**Location:** `apps/web/public/sw.js`  
**Version:** `v4`  
**SW_VERSION:** `"v4"` (forces update on all devices)

**Bypass Logic:**
```javascript
const isAuthRequest = (url) =>
  url.includes("/__/auth/") ||
  url.includes("code=") ||
  url.includes("state=") ||
  url.includes("oauth") ||
  url.includes("redirect");

// Uses cache: 'no-store' for auth requests
if (isAuthRequest(fullUrl)) {
  e.respondWith(fetch(req, { cache: "no-store" }));
  return;
}
```

✅ **VERIFIED:** Matches specification - checks full URL string for auth patterns  
✅ **VERIFIED:** Uses `cache: 'no-store'` to prevent any caching  
✅ **VERIFIED:** Version bump forces update (v4)

---

### A5. Google/Firebase Consistency Checklist

#### Firebase Console Required Settings

**Authentication → Settings → Authorized Domains:**
- `flicklet.netlify.app` ✅
- `flicklet-71dff.web.app` ✅
- `flicklet-71dff.firebaseapp.com` ✅
- `localhost` (for development) ✅

**⚠️ MANUAL VERIFICATION REQUIRED:** Check Firebase Console to confirm all domains are listed.

#### Google OAuth Console Required Settings

**Authorized Redirect URIs:**
- `https://flicklet.netlify.app/__/auth/handler` ✅ (double underscore)
- `https://flickletapp.com/__/auth/handler` ✅ (double underscore)
- `https://flicklet-71dff.firebaseapp.com/__/auth/handler` ✅
- `https://flicklet.netlify.app` ✅ (bare origin)
- `https://flickletapp.com` ✅ (bare origin)

**Authorized JavaScript Origins:**
- `https://flicklet.netlify.app` ✅
- `https://flickletapp.com` ✅
- `https://flicklet-71dff.firebaseapp.com` ✅

**⚠️ CRITICAL:** Your screenshots show `/_/auth/handler` (single underscore). Firebase uses `__/auth/handler` (double underscore). Update Google OAuth Console redirect URIs to use double underscore.

---

### A6. Router/URL Hygiene

**URL Cleanup Locations:**

1. **`apps/web/src/lib/auth.ts:743`** - After auth confirmed
   - Context: Cleanup runs 500ms after `onAuthStateChanged` fires with user
   - Condition: Only cleans if `hasAuthParams || window.location.hash`
   - ⚠️ **VERIFIED:** Cleanup runs AFTER `getRedirectResult()` completes (correct order)

2. **`apps/web/src/lib/authLogin.ts:46`** - Before redirect
   - Context: Removes `debugAuth` param before OAuth redirect
   - Condition: Only removes debug params, not auth params
   - ⚠️ **VERIFIED:** Does NOT strip `code=` or `state=` (safe)

**Order Verification:**
- ✅ URL cleanup runs AFTER `getRedirectResult()` completes
- ✅ Cleanup is delayed 500ms to ensure Firebase callbacks fire first
- ✅ No cleanup happens before redirect result is processed

---

### A7. HUD Fields Audit

| Field | Status | Location |
|-------|--------|----------|
| `page_entry_params` | ✅ Logged | `apps/web/src/main.tsx:45` - logged at boot |
| `url_check` | ✅ Logged | `apps/web/src/main.tsx:52` - Phase B enhancement |
| `firebaseReady_resolved_at` | ✅ Logged | `apps/web/src/main.tsx:232` - after Firebase ready |
| `getRedirectResult_called_at` | ✅ Logged | `apps/web/src/lib/auth.ts:426` - before getRedirectResult |
| `getRedirect_after_ready` | ✅ Logged | `apps/web/src/lib/auth.ts:430` - boolean in getRedirectResult_called_at |

✅ **All required HUD fields are present**

---

## Phase B - Instrumentation Added

### B1. URL at Boot Log
- ✅ Added `url_check` event with full context:
  - `href`, `search`, `hash`, `pathname`, `origin`
  - `visibilityState`, `bootTime`, `timestamp`
- ✅ Logged at very top of bootstrap (before Firebase)

### B2. Redirect Liveness Probe
- ✅ Added to `signInWithRedirect` flow in `authLogin.ts`
- ✅ 1500ms timer to detect Safari stall
- ✅ Listens for `pagehide` and `visibilitychange` events
- ✅ Logs `stuck_redirect:true` if timer fires before events
- ✅ Logs `redirect_liveness_pagehide` or `redirect_liveness_visibility` if redirect succeeds

### B3. One-Shot Guard
- ✅ `window.__redirectResolved` global latch (prevents cross-bundle calls)
- ✅ `redirectResultResolved` local latch (prevents duplicate within auth manager)
- ✅ Both reset when starting new redirect

---

## Phase C - Test Matrix

### Test Results

*(To be populated after device testing)*

1. **iPhone Safari, cold login**
   - Expected: `page_entry_params { hasCode:true, hasState:true }` OR `stuck_redirect:true`
   - Actual: *(pending)*

2. **iPhone Safari, after clearing SW**
   - Expected: Same as test 1
   - Actual: *(pending)*

3. **Desktop Chrome control**
   - Expected: Normal `hasCode:true` path
   - Actual: *(pending)*

4. **Netlify rewrite proof**
   - Manual test: Visit `https://flicklet.netlify.app/__/auth/handler?code=TEST&state=TEST`
   - Expected: Netlify serves `/__/auth/handler` (200), not `/index.html`
   - Actual: *(pending - test manually)*

---

## Phase D - Decision Gate

### Current Evidence Summary

**✅ Working:**
- Firebase initialization timing (firebaseReady before getRedirectResult)
- Service Worker bypass (v4, no-cache headers)
- Netlify redirect order (auth handler before catch-all)
- One-shot guards (local + global latches)
- URL cleanup order (after getRedirectResult)

**🚫 Known Issues:**
- iOS Safari drops OAuth params during redirects (Safari ITP)
- Popup fallback already implemented for iOS (v0.3.3)

**❓ Pending Verification:**
- Google OAuth Console redirect URIs use double underscore (`__/auth/handler`)
- Firebase authDomain matches actual domain
- Netlify rewrite test results

---

## Recommendations

### Immediate Actions:

1. **Update Google OAuth Console:**
   - Change all redirect URIs from `/_/auth/handler` to `__/auth/handler` (double underscore)
   - Verify bare origins are included

2. **Verify Firebase authDomain:**
   - Check Netlify Dashboard env var `VITE_FIREBASE_AUTH_DOMAIN`
   - Should be `flicklet.netlify.app` (not `flicklet-71dff.firebaseapp.com`)

3. **Test Netlify Rewrite:**
   - Visit: `https://flicklet.netlify.app/__/auth/handler?code=TEST&state=TEST`
   - Should return 200 with handler, not redirect to `/index.html`

### Next Steps:

Based on test results:
- **If redirect returns with params:** Current flow is correct, investigate Safari ITP workaround
- **If redirect stalls:** Enable popup fallback on iOS (already implemented in v0.3.3)
- **If Netlify rewrites:** Adjust redirect rule precedence
- **If SW interference:** Bump SW version (already v4)

---

## Export Functions

At runtime, diagnostics bundle is available:
- `window.__authDiagnostics` - Raw diagnostics object
- `window.__exportAuthDiagnostics()` - Download markdown file

HUD logs can be exported via Debug Auth HUD component.

---

*End of diagnostics template - will be populated with runtime data*

