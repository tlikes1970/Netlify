/**
 * Non-critical boot work — runs after React first paint.
 */

import { registerServiceWorker, devUnregisterAllSW } from '../sw-register';
import { installCompactMobileGate, installActionsSplitGate } from '../lib/flags';
import { initFlags } from '../lib/mobileFlags';
import { logAuthOriginHint } from '../lib/authLogin';
import { runFirstFrameBoot } from './bootCoordinator';
import { installKillSwitchOverlay } from '../runtime/overlay';
import { debugTmdbSource } from '../lib/tmdb';
import { HOME_RAILS, TABS } from '../config/structure';
import { queryClient } from '../lib/query';
import { bootstrapFirebase } from '../lib/firebaseBootstrap';
import { logger } from '../lib/logger';
import { authLogManager } from '../lib/authLog';

export function runDeferredBootInit(): void {
  logger.log('[Boot] Starting Firebase bootstrap (deferred)...');
  bootstrapFirebase().catch((e) => {
    logger.error('[Boot] Firebase bootstrap failed', e);
  });

  logAuthOriginHint();

  document.documentElement.dataset.density = 'compact';

  runFirstFrameBoot([
    () => {
      initFlags({
        'compact-mobile-v1': false,
        'actions-split': false,
        'debug-logging': false,
      });
    },
    () => installCompactMobileGate(),
    () => installActionsSplitGate(),
    () => logAuthOriginHint(),
  ]);

  if (import.meta.env.DEV) {
    installKillSwitchOverlay();
  }

  registerServiceWorker();

  if (import.meta.env.DEV) {
    devUnregisterAllSW().catch(() => {});
    import('../sw-dev-kill').catch(() => {});
  }

  void import('../pwa/installSignal')
    .then(({ initInstallSignal }) => initInstallSignal())
    .catch(() => {});

  attachDebugHelpers();
  installAuthDebugBridgeIfNeeded();
  logPageEntryParams();
}

function installAuthDebugBridgeIfNeeded(): void {
  const params = new URLSearchParams(location.search);
  if (params.get('debug') !== 'auth') return;

  import('../debug/authDebugBridge')
    .then((m) => m.installAuthDebugBridge?.())
    .catch(() => {});
}

function logPageEntryParams(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const hasCode = params.has('code');
    const hasState = params.has('state');

    let hasCodeInHash = false;
    let hasStateInHash = false;
    if (window.location.hash) {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        hasCodeInHash = hashParams.has('code');
        hasStateInHash = hashParams.has('state');
      } catch {
        /* ignore */
      }
    }

    authLogManager.log('page_entry_params', {
      hasCode: hasCode || hasCodeInHash,
      hasState: hasState || hasStateInHash,
      hasCodeInSearch: hasCode,
      hasStateInSearch: hasState,
      hasCodeInHash,
      hasStateInHash,
      search: window.location.search,
      hash: window.location.hash,
      href: window.location.href,
    });

    authLogManager.log('url_check', {
      href: window.location.href,
      search: window.location.search,
      hash: window.location.hash,
      pathname: window.location.pathname,
      origin: window.location.origin,
      visibilityState: document.visibilityState,
      bootTime: performance.now(),
      timestamp: new Date().toISOString(),
    });
  } catch {
    /* ignore */
  }
}

function attachDebugHelpers(): void {
  if (typeof window === 'undefined') return;

  window.debugRails = () => {
    const rails = Array.from(document.querySelectorAll('[data-rail]'));
    return rails.map((el) => {
      const id = el.getAttribute('data-rail') || '';
      const title = el.getAttribute('aria-label') || '';
      const cardsWrap = el.querySelector('[data-cards]') as HTMLElement | null;
      const csWrap = cardsWrap ? getComputedStyle(cardsWrap) : null;
      return {
        id,
        title,
        enabled: getComputedStyle(el).display !== 'none',
        scrollX: csWrap?.overflowX || 'n/a',
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
        actionsCols: csA?.gridTemplateColumns || 'n/a',
      };
    });
  };

  (window as any).debugQueries = () =>
    Array.from((queryClient as any).getQueryCache().getAll()).map((q: any) => ({
      key: q.queryKey?.join('/') ?? 'unknown',
      status: q.state.status,
      error: q.state.error?.message ?? null,
      dataLen: Array.isArray(q.state.data)
        ? q.state.data.length
        : q.state.data
          ? 1
          : 0,
    }));

  (window as any).debugTmdbSource = () => debugTmdbSource();
  (window as any).debugStructure = () => ({ rails: HOME_RAILS, tabs: TABS });

  (window as any).debugLists = () => {
    try {
      const newData = JSON.parse(localStorage.getItem('flicklet.library.v2') || '{}');
      const newCounts = Object.values(newData).reduce(
        (m: any, x: any) => ((m[x.list] = (m[x.list] || 0) + 1), m),
        {}
      );
      const oldData = JSON.parse(localStorage.getItem('flicklet:v2:saved') || '[]');
      const oldCounts = oldData.reduce(
        (m: any, x: any) => ((m[x.status] = (m[x.status] || 0) + 1), m),
        {}
      );
      return {
        new: { total: Object.keys(newData).length, ...(newCounts as Record<string, number>) },
        old: { total: oldData.length, ...oldCounts },
      };
    } catch {
      return { new: { total: 0 }, old: { total: 0 } };
    }
  };

  (window as any).debugTabs = () =>
    [...document.querySelectorAll('header button,[role="tab"]')]
      .map((x) => x.textContent?.trim())
      .filter(Boolean);

  (window as any).debugCardButtons = (railId: string) => {
    const rail = document.querySelector(`[data-rail="${railId}"]`);
    const first = rail?.querySelector('[data-card]');
    return [...(first?.querySelectorAll('[data-actions] button') || [])].map((b) =>
      b.textContent?.trim()
    );
  };

  (window as any).debugLibrary = () => ({
    message: 'Library debug function disabled in browser environment',
  });

  (window as any).debugAuthLogs = () => {
    try {
      return JSON.parse(localStorage.getItem('auth-debug-logs') || '[]');
    } catch {
      return [];
    }
  };

  import('../utils/debug-auth').then((m) => {
    (window as any).debugFirebaseAuth = m.debugFirebaseAuth;
  });

  import('../lib/smartDiscovery').then((m) => {
    (window as any).refreshDiscovery = () => {
      m.clearRecommendationCache();
      window.dispatchEvent(
        new CustomEvent('library:changed', {
          detail: { operation: 'refresh', origin: 'console' },
        })
      );
      window.dispatchEvent(new CustomEvent('force-refresh'));
      return { success: true, message: 'Discovery refresh triggered', cacheCleared: true };
    };
  });
}

declare global {
  interface Window {
    debugRails: () => unknown;
    debugCards: () => unknown;
  }
}
