import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

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
import { FlagsProvider } from './lib/flags';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query';
import { debugTmdbSource } from './lib/tmdb';
import { HOME_RAILS, TABS } from './config/structure';
import { registerServiceWorker, devUnregisterAllSW } from './sw-register';
import './styles/global.css';
import './styles/header-marquee.css';
import './styles/tokens-compact-mobile.css';
import './styles/compact-home.css';
import './styles/settings-sheet.css';
import './styles/compact-actions.css';
import './styles/compact-lists.css';
import './styles/compact-a11y-perf.css';
import './styles/compact-cleanup.css';
import './styles/cards-mobile.css';
import './styles/cards.css';
import './components/cards/button-pro.css';
import { installCompactMobileGate, installActionsSplitGate } from './lib/flags';
import { initFlags } from './lib/mobileFlags';
import { logAuthOriginHint } from './lib/authLogin';
import { runFirstFrameBoot } from './boot/bootCoordinator';
// Import scroll feature flags and logger to ensure window exposure
import './utils/scrollFeatureFlags';
import './utils/scrollLogger';
// ⚠️ CRITICAL: Don't import authManager here - it triggers constructor
// Import it AFTER firebaseReady resolves to prevent race condition
// import { authManager } from './lib/auth'; // Moved to after firebaseReady
import { logger } from './lib/logger';
import { authLogManager } from './lib/authLog';
import { bootstrapFirebase, firebaseReady, getFirebaseReadyTimestamp } from './lib/firebaseBootstrap';

// Install auth debug bridge globally when ?debug=auth is present.
// This avoids route/lazy-load/treeshake issues.
(function installAuthBridgeGlobally() {
  const params = new URLSearchParams(location.search);
  if (params.get('debug') !== 'auth') return;
  
  import('./debug/authDebugBridge')
    .then(m => m.installAuthDebugBridge && m.installAuthDebugBridge())
    .catch(() => { /* ignore */ });
})();

// ⚠️ CRITICAL: Log page entry params BEFORE Firebase runs
// This captures the URL state at the earliest possible moment
// Phase B: One-time "URL at boot" log with full context
(function logPageEntryParams() {
  try {
    // ⚠️ CRITICAL: Check URL params at the very top of bootstrap
    // This must run before ANY Firebase code or router logic
    const params = new URLSearchParams(window.location.search);
    const hasCode = params.has('code');
    const hasState = params.has('state');
    
    // Also check hash params (Firebase sometimes uses hash fragments)
    let hasCodeInHash = false;
    let hasStateInHash = false;
    if (window.location.hash) {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        hasCodeInHash = hashParams.has('code');
        hasStateInHash = hashParams.has('state');
      } catch (e) {
        // ignore
      }
    }
    
    const finalHasCode = hasCode || hasCodeInHash;
    const finalHasState = hasState || hasStateInHash;
    
    const bootTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    
    // Log to HUD
    authLogManager.log('page_entry_params', {
      hasCode: finalHasCode,
      hasState: finalHasState,
      hasCodeInSearch: hasCode,
      hasStateInSearch: hasState,
      hasCodeInHash: hasCodeInHash,
      hasStateInHash: hasStateInHash,
      search: window.location.search,
      hash: window.location.hash,
      href: window.location.href,
    });
    
    // Phase B: Enhanced boot URL log
    authLogManager.log('url_check', {
      href: window.location.href,
      search: window.location.search,
      hash: window.location.hash,
      pathname: window.location.pathname,
      origin: window.location.origin,
      visibilityState: typeof document !== 'undefined' ? document.visibilityState : 'unknown',
      bootTime: bootTime,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    // ignore - logging should never break startup
    // Ignore logging errors
  }
})();

// ⚠️ CRITICAL: Bootstrap Firebase BEFORE anything else
// This ensures persistence is set and auth state is initialized before any auth operations
// Note: Bootstrap happens asynchronously - firebaseReady promise blocks render
logger.log('[Boot] Starting Firebase bootstrap...');
bootstrapFirebase().then(() => {
  const readyTimestamp = getFirebaseReadyTimestamp();
  logger.log('[Boot] Firebase bootstrap complete', readyTimestamp ? `at ${readyTimestamp}` : '');
  
  // Log firebaseReady resolution (this happens in bootstrapApp after await)
}).catch((e) => {
  logger.error('[Boot] Firebase bootstrap failed', e);
});

// Log auth origin for OAuth verification
logAuthOriginHint();

// Set density to compact (required for compact mobile gate)
document.documentElement.dataset.density = 'compact';

// Group boot initializers into single frame to prevent initialization burst
runFirstFrameBoot([
  () => {
    // Initialize mobile flags with defaults
    initFlags({
      'compact-mobile-v1': false,
      'actions-split': false,
      'debug-logging': false
    });
  },
  () => {
    // Install compact mobile gate
    installCompactMobileGate();
  },
  () => {
    // Install actions split gate
    installActionsSplitGate();
  },
  () => {
    // Log auth origin hint (lightweight, affects text/layout)
    logAuthOriginHint();
  }
]);

// Install dev diagnostics
if (import.meta.env.DEV) {
  import('./debug/compactGateDiagnostics')
    .then(m => m.installDiagnostics?.())
    .catch(() => {});
}

declare global {
  interface Window {
    debugRails: () => any;
    debugCards: () => any;
  }
}

function attachDebug() {
  window.debugRails = () => {
    const rails = Array.from(document.querySelectorAll('[data-rail]'));
    return rails.map(el => {
      const id = el.getAttribute('data-rail') || '';
      const title = el.getAttribute('aria-label') || '';
      const cardsWrap = el.querySelector('[data-cards]') as HTMLElement | null;
      const csWrap = cardsWrap ? getComputedStyle(cardsWrap) : null;
      return {
        id,
        title,
        enabled: getComputedStyle(el).display !== 'none',
        scrollX: csWrap?.overflowX || 'n/a'
      };
    });
  };

  window.debugCards = () => {
    const cards = Array.from(document.querySelectorAll('[data-card]')).slice(0, 24);
    return cards.map((c, i) => {
      const rail = c.closest('[data-rail]') as HTMLElement | null;
      const railId = rail?.getAttribute('data-rail') || '';
      const poster = c.querySelector('[data-poster]') as HTMLElement | null;
      const actions = c.querySelector('[data-actions]') as HTMLElement | null;
      const csP = poster ? getComputedStyle(poster) : null;
      const csA = actions ? getComputedStyle(actions) : null;
      return {
        i,
        railId,
        posterAR: csP?.aspectRatio || 'n/a',
        actionsDisplay: csA?.display || 'n/a',
        actionsCols: csA?.gridTemplateColumns || 'n/a'
      };
    });
  };
}

// Attach debug functions after DOM is ready
if (typeof window !== 'undefined') {
  attachDebug();
}

// Debug env + react-query state + raw TMDB fetch
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).debugEnv = () => ({
  hasViteTmdbKey: Boolean(import.meta.env.VITE_TMDB_KEY)
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).debugQueries = () =>
  Array.from((queryClient as any).getQueryCache().getAll()).map((q: any) => ({
    key: q.queryKey?.join('/') ?? 'unknown',
    status: q.state.status,
    error: q.state.error?.message ?? null,
    dataLen:
      Array.isArray(q.state.data) ? q.state.data.length :
      (q.state.data ? 1 : 0)
  }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).debugTmdbSource = () => debugTmdbSource();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).debugStructure = () => ({ rails: HOME_RAILS, tabs: TABS });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).debugLists = () => {
  try {
    // Check new Library system
    const newData = JSON.parse(localStorage.getItem('flicklet.library.v2') || '{}');
    const newCounts = Object.values(newData).reduce((m: any, x: any) => ((m[x.list] = (m[x.list]||0)+1), m), {});
    
    // Check old system for comparison
    const oldData = JSON.parse(localStorage.getItem('flicklet:v2:saved') || '[]');
    const oldCounts = oldData.reduce((m: any, x: any) => ((m[x.status] = (m[x.status]||0)+1), m), {});
    
    return { 
      new: { total: Object.keys(newData).length, ...(newCounts as Record<string, number>) },
      old: { total: oldData.length, ...oldCounts }
    };
  } catch { return { new: { total: 0 }, old: { total: 0 } }; }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).debugTabs = () => [...document.querySelectorAll('header button,[role="tab"]')].map(x=>x.textContent?.trim()).filter(Boolean);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).debugCardButtons = (railId: string) => {
  const rail = document.querySelector(`[data-rail="${railId}"]`);
  const first = rail?.querySelector('[data-card]');
  return [...(first?.querySelectorAll('[data-actions] button')||[])].map(b=>b.textContent?.trim());
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).debugLibrary = () => {
  try {
    // const { Library } = require('./lib/storage'); // Commented out - require not available in browser
    return {
      // watching: Library.getByList('watching').length,
      // wishlist: Library.getByList('wishlist').length,
      // watched: Library.getByList('watched').length,
      // not: Library.getByList('not').length,
      message: 'Library debug function disabled in browser environment'
    };
  } catch { return { watching: 0, wishlist: 0, watched: 0, not: 0 }; }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).debugAuthLogs = () => {
  try {
    const logs = JSON.parse(localStorage.getItem('auth-debug-logs') || '[]');
    // Return logs without console output
    return logs;
  } catch (e) {
    // Ignore errors
    return [];
  }
};

// Import and expose Firebase auth debug utility
import('./utils/debug-auth').then(m => {
  (window as any).debugFirebaseAuth = m.debugFirebaseAuth;
});


// ⚠️ CRITICAL: Don't block UI on auth - wait for first auth tick or timeout
// This ensures app renders even if auth state takes time to initialize
(async function bootstrapApp() {
  try {
    // Wait for Firebase bootstrap to complete (with timeout)
    await Promise.race([
      firebaseReady,
      new Promise(resolve => setTimeout(resolve, 4000))
    ]);
    const readyTimestamp = getFirebaseReadyTimestamp();
    
    // Log firebaseReady resolution
    if (readyTimestamp) {
      authLogManager.log('firebaseReady_resolved_at', {
        timestamp: readyTimestamp,
        iso: readyTimestamp,
      });
      
      authLogManager.log('app_render_after_firebaseReady', {
        firebaseReadyTimestamp: readyTimestamp,
      });
    }
    
    // Initialize auth flow in background - don't block render
    // ⚠️ FIXED: Removed duplicate getRedirectResult() call - authFlow.ts handles it
    // This was causing triple calls and consuming redirect result incorrectly
    logger.log('[Boot] Initializing auth flow...');
    const { initAuthOnLoad } = await import('./lib/authFlow');
    
    // Initialize auth flow (non-blocking)
    // authFlow.ts will call getRedirectResult() exactly once
    initAuthOnLoad(); // call once at boot; ensure no other calls elsewhere
    
    // Also initialize auth manager for existing hooks
    logger.log('[Boot] Initializing Firebase auth manager...');
    const { authManager } = await import('./lib/auth');
    void authManager; // Force module load and initialization
    
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
  } catch (error) {
    console.error('[Boot] bootstrapApp threw - still rendering', error);
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
  }
})();

// Kill any leftover SWs during dev, before app boot.
if (import.meta.env.DEV) {
  devUnregisterAllSW().catch(() => {});
  // Nuclear safety net: kill any SW that appears (side-effect import)
  import('./sw-dev-kill').catch(() => {});
}

registerServiceWorker();
