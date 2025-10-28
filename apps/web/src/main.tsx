import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
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

// Log auth origin for OAuth verification
logAuthOriginHint();

// Set density to compact (required for compact mobile gate)
document.documentElement.dataset.density = 'compact';

// Initialize mobile flags with defaults
initFlags({
  'compact-mobile-v1': false,
  'actions-split': false,
  'debug-logging': false
});

// Install compact mobile gate
installCompactMobileGate();

// Install actions split gate
installActionsSplitGate();

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
    console.log('📋 Auth Debug Logs:', logs);
    return logs;
  } catch (e) {
    console.error('Failed to retrieve auth debug logs:', e);
    return [];
  }
};

// Import and expose Firebase auth debug utility
import('./utils/debug-auth').then(m => {
  (window as any).debugFirebaseAuth = m.debugFirebaseAuth;
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <FlagsProvider>
        <App />
      </FlagsProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

// Kill any leftover SWs during dev, before app boot.
if (import.meta.env.DEV) {
  devUnregisterAllSW().catch(() => {});
  // Nuclear safety net: kill any SW that appears (side-effect import)
  import('./sw-dev-kill').catch(() => {});
}

registerServiceWorker();
