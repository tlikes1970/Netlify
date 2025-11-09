# Forensic Audit: Production vs Localhost Code Paths

## Header

- **Repository root:** `C:\Users\likes\Side Projects\TV Tracker\Netlify`
- **Audit timestamp:** 2025-01-11T00:00:00.000Z
- **Method:** Static code/config scan only. No history, no runtime, no inference.

## Summary Counts

- **Total environment-dependent sites found:** 47
- **By category:**
  - Build-time defines: 3
  - Hostname/URL gates: 12
  - Service Worker/PWA gates: 5
  - Analytics/monitoring toggles: 1
  - Security/CSP/cookie differences: 0
  - Storage (localStorage/IDB) differences: 0
  - OAuth/redirect/origin differences: 8
  - Scheduling/timing differences: 0
  - CSS/Tailwind/PostCSS purge differences: 0
  - API URL/proxy differences: 3
  - Debug/logging differences: 15
  - Other: 0

## Findings

#### Finding #1

- WHO: `sw-register.ts` - `registerServiceWorker` function
- WHAT: Disables service worker registration in development mode
- WHEN: `if (import.meta.env.DEV)`
- WHERE: `apps/web/src/sw-register.ts:55-58`
- WHY: Comment states "Vite truth: only register in production builds."
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
// Vite truth: only register in production builds.
if (import.meta.env.DEV) {
  console.info('[SW] Disabled in dev via import.meta.env.DEV');
  return;
}
```

#### Finding #2

- WHO: `sw-dev-kill.ts` - module-level code
- WHAT: Continuously unregisters all service workers every 2 seconds in development
- WHEN: `if (import.meta.env.DEV && 'serviceWorker' in navigator)`
- WHERE: `apps/web/src/sw-dev-kill.ts:2-8`
- WHY: Comment states "Nuclear safety net: unregister any SW that appears during dev"
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
// Nuclear safety net: unregister any SW that appears during dev
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  setInterval(() => {
    navigator.serviceWorker.getRegistrations()
      .then(regs => Promise.all(regs.map(r => r.unregister())))
      .catch(() => {});
  }, 2000);
}
```

#### Finding #3

- WHO: `main.tsx` - bootstrap code
- WHAT: Unregisters all service workers in development mode at app boot
- WHEN: `if (import.meta.env.DEV)`
- WHERE: `apps/web/src/main.tsx:360-363`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
// Kill any leftover SWs during dev, before app boot.
if (import.meta.env.DEV) {
  devUnregisterAllSW().catch(() => {});
  // Nuclear safety net: kill any SW that appears (side-effect import)
  import('./sw-dev-kill').catch(() => {});
}
```

#### Finding #4

- WHO: `useServiceWorker.ts` - `useServiceWorker` hook
- WHAT: Skips service worker registration in development mode
- WHEN: `if (import.meta.env.DEV) return;`
- WHERE: `apps/web/src/hooks/useServiceWorker.ts:160`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
// Auto-register on mount (disabled in dev)
useEffect(() => {
  // Don't register in dev mode
  if (import.meta.env.DEV) return;
  
  if (state.isSupported && !state.isRegistered && !state.error) {
    register();
  }
}, []);
```

#### Finding #5

- WHO: `main.tsx` - Sentry initialization
- WHAT: Initializes Sentry error tracking only in production builds when DSN is present
- WHEN: `if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN)`
- WHERE: `apps/web/src/main.tsx:6-22`
- WHY: Comment states "Initialize Sentry for error tracking (only in production with DSN)"
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
// Initialize Sentry for error tracking (only in production with DSN)
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE || 'production',
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }).catch(() => {
    // Sentry not available, continue without it
  });
}
```

#### Finding #6

- WHO: `main.tsx` - compact gate diagnostics
- WHAT: Loads compact gate diagnostics module only in development
- WHEN: `if (import.meta.env.DEV)`
- WHERE: `apps/web/src/main.tsx:157-161`
- WHY: Comment states "Install dev diagnostics"
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
// Install dev diagnostics
if (import.meta.env.DEV) {
  import('./debug/compactGateDiagnostics')
    .then(m => m.installDiagnostics?.())
    .catch(() => {});
}
```

#### Finding #7

- WHO: `PostDetail.tsx` - API URL selection
- WHAT: Uses relative URL (Vite proxy) in dev, environment variable in production
- WHEN: `import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:4000')`
- WHERE: `apps/web/src/components/PostDetail.tsx:52-54`
- WHY: Comment states "Use relative URL in dev (goes through Vite proxy) or env var in production"
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
// Use relative URL in dev (goes through Vite proxy) or env var in production
const apiUrl = import.meta.env.DEV 
  ? '' // Relative URL - Vite proxy will forward to backend
  : (import.meta.env.VITE_API_URL || 'http://localhost:4000');
```

#### Finding #8

- WHO: `CommunityPanel.tsx` - API URL selection and fetch skip
- WHAT: Uses relative URL in dev, environment variable in production; skips fetch if production URL is localhost
- WHEN: `import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:4000')` and `if (!import.meta.env.DEV && apiUrl.includes('localhost'))`
- WHERE: `apps/web/src/components/CommunityPanel.tsx:56-61`
- WHY: Comments state "In dev mode, use relative URL to go through Vite proxy to backend" and "Skip fetch in production if API URL is localhost (backend not available)"
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
// Determine API URL - use relative URL in dev (goes through Vite proxy) or env var
// In dev mode, use relative URL to go through Vite proxy to backend
// In production, use VITE_API_URL or skip if pointing to localhost
const apiUrl = import.meta.env.DEV 
  ? '' // Relative URL - Vite proxy will forward to backend
  : (import.meta.env.VITE_API_URL || 'http://localhost:4000');

// Skip fetch in production if API URL is localhost (backend not available)
if (!import.meta.env.DEV && apiUrl.includes('localhost')) {
  setPostsLoading(false);
  setPostsError('Community features require a backend server.');
  setPosts([]);
  return;
}
```

#### Finding #9

- WHO: `vite.config.ts` - HMR configuration
- WHAT: Configures HMR client port differently based on NETLIFY_DEV environment or port detection
- WHEN: `process.env.NETLIFY_DEV || process.argv.some(arg => arg.includes('4173'))`
- WHERE: `apps/web/vite.config.ts:52-54`
- WHY: Comment states "Configure HMR to work through Netlify dev proxy" and "When running through netlify dev (port 8888), HMR should connect through the proxy"
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
// Configure HMR to work through Netlify dev proxy
// When running through netlify dev (port 8888), HMR should connect through the proxy
// netlify dev sets NETLIFY_DEV=true, or we detect by checking if port 4173 is in args
hmr: process.env.NETLIFY_DEV || process.argv.some(arg => arg.includes('4173'))
  ? { clientPort: 8888 }
  : undefined,
```

#### Finding #10

- WHO: `vite.config.ts` - API proxy configuration
- WHAT: Configures proxy to backend server (localhost:4000) in dev mode only
- WHEN: Server proxy configuration (active in dev mode)
- WHERE: `apps/web/vite.config.ts:42-47`
- WHY: Comment states "Proxy API requests to backend server in dev mode"
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
// Proxy API requests to backend server in dev mode
proxy: {
  '/api/v1': {
    target: 'http://localhost:4000',
    changeOrigin: true,
    secure: false,
  }
},
```

#### Finding #11

- WHO: `authLogin.ts` - `googleLogin` function
- WHAT: Uses popup mode on localhost to avoid Firebase redirect issues
- WHEN: `if (isLocalhost)` where `isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost"`
- WHERE: `apps/web/src/lib/authLogin.ts:205-246`
- WHY: Comment states "LOCALHOST WORKAROUND: Use popup mode even if webview would use redirect. This avoids Firebase's redirect handler issues with localhost"
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
const isLocalhost =
  typeof window !== "undefined" && window.location.hostname === "localhost";

// LOCALHOST WORKAROUND: Use popup mode even if webview would use redirect
// This avoids Firebase's redirect handler issues with localhost
if (isLocalhost) {
  logger.log(
    "Localhost detected - using popup mode to avoid Firebase redirect issues"
  );
  const result = await firebaseSignInWithPopup(auth, googleProvider);
  // ... rest of popup handling
  return;
}
```

#### Finding #12

- WHO: `authLogin.ts` - `googleLogin` function
- WHAT: Logs different auth method based on localhost detection
- WHEN: `isLocalhost ? "popup" : "redirect"`
- WHERE: `apps/web/src/lib/authLogin.ts:210-221`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
const logData = {
  method: isLocalhost ? "popup" : "redirect",
  origin: window.location.origin,
  fullUrl: window.location.href,
  timestamp: new Date().toISOString(),
  isIOS: false,
  isLocalhost,
};

logger.log(
  "Google sign-in method",
  isLocalhost ? "popup (localhost)" : "redirect (desktop/Android)"
);
```

#### Finding #13

- WHO: `authLogin.ts` - `validateOAuthOrigin` function
- WHAT: Validates origin against hardcoded list including localhost variants
- WHEN: Function called during auth flow
- WHERE: `apps/web/src/lib/authLogin.ts:393-435`
- WHY: Comment states "Validates the current origin against allowed OAuth origins"
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
// Known allowed origins (canonical form, no www)
const allowedOrigins = new Set([
  "http://localhost",
  "http://localhost:8888",
  "http://127.0.0.1:8888",
  "http://192.168.50.56:8888",
  "https://flicklet.netlify.app",
  "https://flicklet-71dff.web.app",
  "https://flicklet-71dff.firebaseapp.com",
]);
```

#### Finding #14

- WHO: `authLogin.ts` - `validateOAuthOrigin` function
- WHAT: Allows any netlify.app subdomain for preview deployments
- WHEN: Function called during auth flow
- WHERE: `apps/web/src/lib/authLogin.ts:410-416`
- WHY: Comment states "Also allow any netlify.app subdomain (for preview deployments)"
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
// Also allow any netlify.app subdomain (for preview deployments)
const isNetlifyApp =
  normalized.includes(".netlify.app") || normalized.includes(".netlify.com");

// Normalize and check
const normalizedAllowed = Array.from(allowedOrigins).map(normalizeOrigin);
const isAllowed = normalizedAllowed.includes(normalized) || isNetlifyApp;
```

#### Finding #15

- WHO: `firebaseBootstrap.ts` - `verifyAuthEnvironment` function
- WHAT: Recommends popup flow when not on canonical production/staging origin
- WHEN: Function called during auth flow
- WHERE: `apps/web/src/lib/firebaseBootstrap.ts:91-119`
- WHY: Comment states "If we're not on the canonical prod/staging origin, recommend popup flow" and "Redirect requires the return origin to be authorized; we can't guarantee that on previews"
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
const here = window.location.origin;
const authDomain = firebaseConfig.authDomain;
const prod = BASE_URL;

// If we're not on the canonical prod/staging origin, recommend popup flow
const recommendPopup = !!prod && here !== prod;

// Redirect requires the return origin to be authorized; we can't guarantee that on previews
if (recommendPopup) {
  return { ok: true, recommendPopup: true }; // ok, but popup flow only
}
```

#### Finding #16

- WHO: `authFlow.ts` - `initAuthOnLoad` function
- WHAT: Prefers popup mode in production when VITE_AUTH_DEFAULT_POPUP is set
- WHEN: `import.meta.env.PROD && import.meta.env.VITE_AUTH_DEFAULT_POPUP === '1'`
- WHERE: `apps/web/src/lib/authFlow.ts:30`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
const preferPopup = import.meta.env.PROD && import.meta.env.VITE_AUTH_DEFAULT_POPUP === '1';
```

#### Finding #17

- WHO: `useUsername.ts` - username logging
- WHAT: Sets environment field to 'localhost' or 'production' based on hostname
- WHEN: `window.location.hostname === 'localhost' ? 'localhost' : 'production'`
- WHERE: `apps/web/src/hooks/useUsername.ts:189` and `apps/web/src/hooks/useUsername.ts:222`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
environment: window.location.hostname === 'localhost' ? 'localhost' : 'production',
```

#### Finding #18

- WHO: `usernameDiagnostics.ts` - environment detection
- WHAT: Detects localhost environment based on hostname patterns
- WHEN: Function called during diagnostics
- WHERE: `apps/web/src/utils/usernameDiagnostics.ts:48-52`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname.startsWith('192.168.');
const environment = isLocalhost ? 'localhost' : 
                    window.location.hostname.includes('netlify') ? 'production' : 'unknown';
```

#### Finding #19

- WHO: `translationBus.ts` - dev-only warnings
- WHAT: Logs warnings and rapid-notify detection only in development
- WHEN: `if (import.meta.env.DEV)`
- WHERE: `apps/web/src/i18n/translationBus.ts:29, 96, 103, 118`
- WHY: Comment states "Optional: dev warn (but don't break in production)" and "Dev-only rapid-notify detector"
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
// Optional: dev warn (but don't break in production)
if (import.meta.env.DEV) {
  console.warn('[i18n] notify() called before subscribe()');
}

// Dev-only rapid-notify detector: track rapid notify() calls when containment is ON
if (import.meta.env.DEV && isI18nContainmentEnabled() && now - __lastNotifyTs < 5) {
  // ... warning logic
}

// Dev-only: aggregate and rank callers (tally caller site on every notify)
if (import.meta.env.DEV) {
  // ... aggregation logic
}

// Dev sanity log to confirm active path
if (import.meta.env.DEV) {
  console.log('[i18n] notify mode=', currentMode, performance.now());
}
```

#### Finding #20

- WHO: `translationBus.ts` - leaderboard function
- WHAT: Restricts leaderboard dumper to development mode only
- WHEN: `if (!import.meta.env.DEV)`
- WHERE: `apps/web/src/i18n/translationBus.ts:159-161`
- WHY: Comment states "Dev-only: Dump the top 10 callers of notify() for debugging"
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
// Dev-only: Dump the top 10 callers of notify() for debugging
if (!import.meta.env.DEV) {
  console.warn('[i18n] Leaderboard only available in dev mode');
  return;
}
```

#### Finding #21

- WHO: `translationBus.ts` - window attachment
- WHAT: Attaches leaderboard dumper to window object only in development
- WHEN: `if (import.meta.env.DEV && typeof window !== 'undefined')`
- WHERE: `apps/web/src/i18n/translationBus.ts:185`
- WHY: Comment states "Dev-only: Attach leaderboard dumper to window for easy access"
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
// Dev-only: Attach leaderboard dumper to window for easy access
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).__dumpI18nNotifyLeaderboard = dumpLeaderboard;
}
```

#### Finding #22

- WHO: `storage.ts` - reorder logging
- WHAT: Logs reorder operations only in development
- WHEN: `if (import.meta.env.DEV)`
- WHERE: `apps/web/src/lib/storage.ts:127, 153, 358`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
if (import.meta.env.DEV) {
  console.info('[reorder] skip: save already in progress');
}

if (import.meta.env.DEV) {
  console.info('[reorder] flushed: save + emit + localStorage');
}

if (import.meta.env.DEV) {
  // ... logging
}
```

#### Finding #23

- WHO: `PersonalityErrorBoundary.tsx` - error details
- WHAT: Shows error details only in development
- WHEN: `import.meta.env.DEV && this.state.error`
- WHERE: `apps/web/src/components/PersonalityErrorBoundary.tsx:46`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
const errorDetails = import.meta.env.DEV && this.state.error 
  ? this.state.error.toString() 
  : null;
```

#### Finding #24

- WHO: `authDebug.ts` - debug mode check
- WHAT: Checks for auth debug mode via environment variable
- WHEN: `import.meta.env.FLK_AUTH_DEBUG === '1'`
- WHERE: `apps/web/src/lib/authDebug.ts:21, 31`
- WHY: Comment states "Enabled via: URL param: ?debug=auth, Build-time env: FLK_AUTH_DEBUG=1"
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
// Check build-time env
return import.meta.env.FLK_AUTH_DEBUG === '1';
```

#### Finding #25

- WHO: `authDebug.ts` - authorized domains
- WHAT: Gets authorized domains from environment variable with fallback
- WHEN: Function called
- WHERE: `apps/web/src/lib/authDebug.ts:139`
- WHY: Comment states "Checks build env first, falls back to hardcoded list"
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
// Check build-time env
const envDomains = import.meta.env.VITE_AUTHORIZED_DOMAINS;
if (envDomains) {
  return envDomains.split(',').map((d: string) => d.trim());
}
```

#### Finding #26

- WHO: `scrollFeatureFlags.ts` - scroll logger
- WHAT: Enables scroll logger only in development
- WHEN: `if (import.meta.env.DEV)`
- WHERE: `apps/web/src/utils/scrollFeatureFlags.ts:63, 152`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
if (import.meta.env.DEV) {
  // ... scroll logger setup
}

if (import.meta.env.DEV) {
  // ... scroll logger exposure
}
```

#### Finding #27

- WHO: `scrollLogger.ts` - logger initialization
- WHAT: Initializes scroll logger only in development
- WHEN: `if (typeof window !== 'undefined' && import.meta.env.DEV)`
- WHERE: `apps/web/src/utils/scrollLogger.ts:26, 131`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  // ... logger setup
}

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  // ... logger exposure
}
```

#### Finding #28

- WHO: `touchEventGuidelines.ts` - touch event logging
- WHAT: Logs touch event guidelines only in development
- WHEN: `if (import.meta.env.DEV)`
- WHERE: `apps/web/src/utils/touchEventGuidelines.ts:79`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
if (import.meta.env.DEV) {
  // ... touch event logging
}
```

#### Finding #29

- WHO: `touchEventAudit.ts` - touch event audit
- WHAT: Performs touch event audit only in development
- WHEN: `if (import.meta.env.DEV)`
- WHERE: `apps/web/src/utils/touchEventAudit.ts:213`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
if (import.meta.env.DEV) {
  // ... touch event audit
}
```

#### Finding #30

- WHO: `ProviderBadge.tsx` - provider badge logging
- WHAT: Logs provider badge information only in development
- WHEN: `if (import.meta.env.DEV)`
- WHERE: `apps/web/src/components/cards/ProviderBadge.tsx:114, 124`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
if (import.meta.env.DEV) {
  // ... logging
}

if (import.meta.env.DEV) {
  // ... logging
}
```

#### Finding #31

- WHO: `ListPage.tsx` - list page logging
- WHAT: Logs list page operations only in development
- WHEN: `if (import.meta.env.DEV)`
- WHERE: `apps/web/src/pages/ListPage.tsx:402`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
if (import.meta.env.DEV) {
  // ... logging
}
```

#### Finding #32

- WHO: `usePullToRefresh.ts` - pull to refresh logging
- WHAT: Logs pull to refresh events only in development
- WHEN: `if (import.meta.env.DEV && pullRefreshEnabled)`
- WHERE: `apps/web/src/hooks/usePullToRefresh.ts:171, 183`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
if (import.meta.env.DEV && pullRefreshEnabled) {
  // ... logging
}

if (import.meta.env.DEV && pullRefreshEnabled) {
  // ... logging
}
```

#### Finding #33

- WHO: `compactGateDiagnostics.ts` - diagnostics
- WHAT: Returns early if not in development mode
- WHEN: `if (!import.meta.env.DEV) return;`
- WHERE: `apps/web/src/debug/compactGateDiagnostics.ts:150`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
if (!import.meta.env.DEV) return;
```

#### Finding #34

- WHO: `AuthDebugPage.tsx` - production check
- WHAT: Checks if environment is production
- WHEN: `const isProd = import.meta.env.PROD;`
- WHERE: `apps/web/src/debug/AuthDebugPage.tsx:233`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
const isProd = import.meta.env.PROD;
```

#### Finding #35

- WHO: `featureFlags.ts` - i18n diagnostics
- WHAT: Checks environment variable for i18n diagnostics flag
- WHEN: Function called
- WHERE: `apps/web/src/i18n/featureFlags.ts:24`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
const env = (import.meta as any)?.env?.VITE_I18N_DIAGNOSTICS;
```

#### Finding #36

- WHO: `featureFlags.ts` - i18n containment
- WHAT: Checks environment variable for i18n containment flag
- WHEN: Function called
- WHERE: `apps/web/src/i18n/featureFlags.ts:45`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
const env = (import.meta as any)?.env?.VITE_I18N_CONTAINMENT;
```

#### Finding #37

- WHO: `vite.config.ts` - TMDB key define
- WHAT: Defines VITE_TMDB_KEY at build time
- WHEN: Build-time define
- WHERE: `apps/web/vite.config.ts:31`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
define: {
  'import.meta.env.VITE_TMDB_KEY': JSON.stringify((env.VITE_TMDB_KEY || '').trim())
}
```

#### Finding #38

- WHO: `tmdb-proxy.cjs` - production check
- WHAT: Checks if environment is production for error response details
- WHEN: `const isProd = process.env.NODE_ENV === 'production';`
- WHERE: `apps/web/netlify/functions/tmdb-proxy.cjs:14`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
const isProd = process.env.NODE_ENV === 'production';
```

#### Finding #39

- WHO: `tmdb-proxy.cjs` - error response
- WHAT: Includes proxied URL in error response only in non-production
- WHEN: `...(isProd ? {} : { proxied_url: url.toString() })`
- WHERE: `apps/web/netlify/functions/tmdb-proxy.cjs:94`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
const payload = {
  error: 'TMDB error',
  status: tmdbRes.status,
  statusText: tmdbRes.statusText,
  details: details.status_message || details.message || bodyText.slice(0, 300),
  ...(isProd ? {} : { proxied_url: url.toString() }),
};
```

#### Finding #40

- WHO: `send-email.cjs` - context logging
- WHAT: Logs Netlify context environment variable
- WHEN: Function called
- WHERE: `apps/web/netlify/functions/send-email.cjs:11`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
console.log('📧 SendGrid email function called:', {
  method: event.httpMethod,
  hasBody: !!event.body,
  hasApiKey: !!process.env.SENDGRID_API_KEY,
  ctx: process.env.CONTEXT
});
```

#### Finding #41

- WHO: `firebaseBootstrap.ts` - Firebase config
- WHAT: Uses environment variables for Firebase configuration with fallback defaults
- WHEN: Module initialization
- WHERE: `apps/web/src/lib/firebaseBootstrap.ts:24-42`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "flicklet-71dff.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "flicklet-71dff",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "flicklet-71dff.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1034923556763",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1034923556763:web:bba5489cd1d9412c9c2b3e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-YL4TJ4FHJC",
};
```

#### Finding #42

- WHO: `firebaseBootstrap.ts` - base URL
- WHAT: Gets base URL from environment variable
- WHEN: Module initialization
- WHERE: `apps/web/src/lib/firebaseBootstrap.ts:49-50`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
const BASE_URL = import.meta.env.VITE_PUBLIC_BASE_URL?.replace(/\/$/, "") || null;
```

#### Finding #43

- WHO: `firebase-messaging.ts` - VAPID key
- WHAT: Gets VAPID key from environment variable
- WHEN: Module initialization
- WHERE: `apps/web/src/firebase-messaging.ts:14`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY || '';
```

#### Finding #44

- WHO: `config.ts` - API keys
- WHAT: Gets YouTube and TMDB API keys from environment variables
- WHEN: Module initialization
- WHERE: `apps/web/src/lib/extras/config.ts:16, 21`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
youtube: {
  apiKey: import.meta.env.VITE_YOUTUBE_API_KEY || '',
},
tmdb: {
  apiKey: import.meta.env.VITE_TMDB_KEY || '',
},
```

#### Finding #45

- WHO: `authDiagnostics.ts` - Firebase config fallbacks
- WHAT: Uses environment variables with hardcoded fallback values for diagnostics
- WHEN: Function called
- WHERE: `apps/web/src/lib/authDiagnostics.ts:52-54`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM';
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'flicklet.netlify.app';
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'flicklet-71dff';
```

#### Finding #46

- WHO: `playwright.config.ts` - base URL
- WHAT: Uses environment variable for E2E base URL with localhost fallback
- WHEN: Test configuration
- WHERE: `apps/web/playwright.config.ts:5`
- WHY: not stated
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
baseURL: process.env.E2E_BASE_URL || 'http://localhost:8888',
```

#### Finding #47

- WHO: `vite.config.js` - sourcemap configuration
- WHAT: Sets sourcemap to 'hidden' in production, true in development
- WHEN: Build configuration
- WHERE: `vite.config.js:34`
- WHY: Comment states "Source maps for debugging - enabled for development and staging"
- ISSUE IDENTIFIED: none stated
- CODE:
```typescript
// Source maps for debugging - enabled for development and staging
sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : true,
```

## Appendix A — Environment Keys Observed

List of all env keys referenced with file path and lines:

- `VITE_TMDB_KEY` — `apps/web/vite.config.ts` L31, `apps/web/src/lib/extras/config.ts` L21, `apps/web/src/main.tsx` L215
- `VITE_FIREBASE_API_KEY` — `apps/web/src/lib/firebaseBootstrap.ts` L25, `apps/web/src/lib/authDiagnostics.ts` L52
- `VITE_FIREBASE_AUTH_DOMAIN` — `apps/web/src/lib/firebaseBootstrap.ts` L31, `apps/web/src/lib/authDiagnostics.ts` L53
- `VITE_FIREBASE_PROJECT_ID` — `apps/web/src/lib/firebaseBootstrap.ts` L33, `apps/web/src/lib/authDiagnostics.ts` L54
- `VITE_FIREBASE_STORAGE_BUCKET` — `apps/web/src/lib/firebaseBootstrap.ts` L35
- `VITE_FIREBASE_MESSAGING_SENDER_ID` — `apps/web/src/lib/firebaseBootstrap.ts` L38
- `VITE_FIREBASE_APP_ID` — `apps/web/src/lib/firebaseBootstrap.ts` L40
- `VITE_FIREBASE_MEASUREMENT_ID` — `apps/web/src/lib/firebaseBootstrap.ts` L42
- `VITE_PUBLIC_BASE_URL` — `apps/web/src/lib/firebaseBootstrap.ts` L50
- `VITE_API_URL` — `apps/web/src/components/PostDetail.tsx` L54, `apps/web/src/components/CommunityPanel.tsx` L58
- `VITE_SENTRY_DSN` — `apps/web/src/main.tsx` L6, L9
- `VITE_AUTH_DEFAULT_POPUP` — `apps/web/src/lib/authFlow.ts` L30
- `VITE_AUTHORIZED_DOMAINS` — `apps/web/src/lib/authDebug.ts` L139
- `VITE_I18N_DIAGNOSTICS` — `apps/web/src/i18n/featureFlags.ts` L24
- `VITE_I18N_CONTAINMENT` — `apps/web/src/i18n/featureFlags.ts` L45
- `VITE_YOUTUBE_API_KEY` — `apps/web/src/lib/extras/config.ts` L16
- `VITE_FCM_VAPID_KEY` — `apps/web/src/firebase-messaging.ts` L14
- `FLK_AUTH_DEBUG` — `apps/web/src/lib/authDebug.ts` L21, L31
- `NETLIFY_DEV` — `apps/web/vite.config.ts` L52
- `NODE_ENV` — `apps/web/netlify/functions/tmdb-proxy.cjs` L14, `vite.config.js` L34
- `TMDB_TOKEN` — `apps/web/netlify/functions/tmdb-proxy.cjs` L25
- `SENDGRID_API_KEY` — `apps/web/netlify/functions/send-email.cjs` L10, L54, L78
- `SENDGRID_FROM` — `apps/web/netlify/functions/send-email.cjs` L65
- `SENDGRID_REPLY_TO` — `apps/web/netlify/functions/send-email.cjs` L76
- `CONTEXT` — `apps/web/netlify/functions/send-email.cjs` L11
- `E2E_BASE_URL` — `apps/web/playwright.config.ts` L5
- `WORDNIK_API_KEY` — `apps/web/netlify/functions/wordnik-proxy.cjs` L28

## Appendix B — Asset and Cache Behaviors Gated by Env

- `sw.js`: Service worker registration disabled in dev mode (see Finding #1, #2, #3, #4)
- Service worker cache: `CACHE_NAME = "app-assets-v2"`, `SW_VERSION = "v4"` (no env gating, but registration is env-gated)
- No prefetch/preload directives found gated by environment

## Appendix C — OAuth/Redirect/Origin Lists

- Authorized redirect URIs found in code:
  - `http://localhost`
  - `http://localhost:8888`
  - `http://127.0.0.1:8888`
  - `http://192.168.50.56:8888`
  - `https://flicklet.netlify.app`
  - `https://flicklet-71dff.web.app`
  - `https://flicklet-71dff.firebaseapp.com`
  - Any `.netlify.app` subdomain (dynamic check)
  - Any `.netlify.com` subdomain (dynamic check)
- Origin checks: `window.location.origin` used throughout auth flow
- `postMessage` calls: None found with explicit targetOrigin gating by environment

