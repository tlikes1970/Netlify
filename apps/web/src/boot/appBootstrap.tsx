/**
 * Application bootstrap — load styles + App, render React, finish Firebase in background.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/query';
import { FlagsProvider } from '../lib/flags';
import { releaseFirstPaintGate } from './firstPaint';
import { initCapacitorNativeShell } from '../lib/capacitorSafeArea';
import {
  firebaseReady,
  getFirebaseReadyTimestamp,
} from '../lib/firebaseBootstrap';
import { logger } from '../lib/logger';
import { authLogManager } from '../lib/authLog';
import { runDeferredBootInit } from './deferredInit';
import { requiresAccountDeletionPage } from '../lib/accountDeletionState';

import '../styles/tokens.css';
import '../styles/global.css';
import '../styles/header-marquee.css';
import '../styles/tokens-compact-mobile.css';
import '../styles/compact-home.css';
import '../styles/settings-sheet.css';
import '../styles/compact-actions.css';
import '../styles/compact-lists.css';
import '../styles/library-segment-bar.css';
import '../styles/compact-a11y-perf.css';
import '../styles/compact-cleanup.css';
import '../styles/cards-mobile.css';
import '../styles/cards.css';
import '../components/cards/button-pro.css';
import '../utils/scrollFeatureFlags';
import '../utils/scrollLogger';

async function finishFirebaseBoot(): Promise<void> {
  try {
    await Promise.race([
      firebaseReady,
      new Promise((resolve) => setTimeout(resolve, 4000)),
    ]);
    const readyTimestamp = getFirebaseReadyTimestamp();

    if (readyTimestamp) {
      authLogManager.log('firebaseReady_resolved_at', {
        timestamp: readyTimestamp,
        iso: readyTimestamp,
      });
      authLogManager.log('app_render_after_firebaseReady', {
        firebaseReadyTimestamp: readyTimestamp,
      });
    }

    logger.log('[Boot] Initializing auth flow...');
    const { initAuthOnLoad } = await import('../lib/authFlow');
    initAuthOnLoad();

    logger.log('[Boot] Initializing Firebase auth manager...');
    await import('../lib/auth');
  } catch (error) {
    logger.error('[Boot] Firebase background boot failed', error);
  }
}

export async function renderApplication(): Promise<void> {
  initCapacitorNativeShell();

  const deletionPage = requiresAccountDeletionPage(window.location.pathname);
  const { default: App } = deletionPage ? await import('../pages/DeleteAccountPage') : await import('../App');

  const AppWrapper = (
    <QueryClientProvider client={queryClient}>
      <FlagsProvider>
        <App />
      </FlagsProvider>
    </QueryClientProvider>
  );

  ReactDOM.createRoot(document.getElementById('root')!).render(
    import.meta.env.DEV ? (
      <React.StrictMode>{AppWrapper}</React.StrictMode>
    ) : (
      AppWrapper
    )
  );

  releaseFirstPaintGate();

  void finishFirebaseBoot();
  void import('../lib/auth');

  queueMicrotask(() => {
    if (!deletionPage) runDeferredBootInit();
  });
}
