/**
 * Process: Auth Flow Handler
 * Purpose: Centralized auth initialization that calls getRedirectResult exactly once, never auto-restarts
 * Data Source: Firebase Auth, sessionStorage guards
 * Update Path: Called once at app boot, respects attempt budget
 * Dependencies: firebaseApp, authGuard, authDebug
 */

import { browserLocalPersistence, setPersistence, getRedirectResult, signInWithRedirect, signInWithPopup } from 'firebase/auth';
import { markRedirectStarted, clearRedirectFlag, hasRedirectStarted, canAttemptRedirect, bumpAttempt, markInitDone } from './authGuard';
import { isAuthDebug, logAuth, getQueryFlag } from './authDebug';
import { auth, googleProvider } from './firebaseBootstrap';

let bootOnce = false;

export async function initAuthOnLoad(): Promise<void> {
  if (bootOnce) return;
  bootOnce = true;

  await setPersistence(auth, browserLocalPersistence).catch(() => {
    // Ignore persistence errors
  });

  const forcePopup = getQueryFlag('authMode') === 'popup';
  const forceRedirect = getQueryFlag('authMode') === 'redirect';
  const preferPopup = import.meta.env.PROD && import.meta.env.VITE_AUTH_DEFAULT_POPUP === '1';

  // 1) Always try to consume redirect result once
  try {
    const res = await getRedirectResult(auth);
    if (res?.user) {
      if (isAuthDebug()) {
        logAuth('redirect_result_success', { providerId: res.providerId });
      }
      clearRedirectFlag();
      markInitDone();
      return;
    }
    
    if (isAuthDebug()) {
      logAuth('redirect_result_empty', { hadGuard: hasRedirectStarted() });
    }
    clearRedirectFlag(); // stop any pending loop
  } catch (e: any) {
    if (isAuthDebug()) {
      logAuth('redirect_result_error', { 
        code: e?.code, 
        msg: e?.message?.slice?.(0, 160) 
      });
    }
    clearRedirectFlag();
  }

  // 2) If already signed in, we're done
  if (auth.currentUser) {
    markInitDone();
    return;
  }

  // 3) Decide mode without causing loops
  if (forcePopup || preferPopup) {
    await startPopup();
    markInitDone();
    return;
  }

  if (forceRedirect || shouldUseRedirect()) {
    if (!canAttemptRedirect()) {
      if (isAuthDebug()) {
        logAuth('redirect_blocked_budget', {});
      }
      markInitDone();
      return;
    }
    
    markRedirectStarted();
    bumpAttempt();
    await startRedirect();
    // navigation happens; function returns only if provider blocks
    markInitDone();
    return;
  }

  markInitDone();
}

function shouldUseRedirect(): boolean {
  // Keep existing heuristic - for now, allow redirect on non-iOS/Safari
  if (typeof window === 'undefined') return false;
  
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|Android/i.test(ua);
  
  // Don't use redirect on iOS/Safari
  if (isIOS || isSafari) return false;
  
  // Check if we're in a webview
  const isInAppBrowser = ua.includes('wv') || 
                         ua.includes('FBAN') || 
                         ua.includes('FBAV') || 
                         ua.includes('Instagram') ||
                         (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  
  return isInAppBrowser;
}

async function startRedirect(): Promise<void> {
  try {
    const provider = googleProvider; // Use Google provider by default
    if (isAuthDebug()) {
      logAuth('redirect_start', { origin: typeof window !== 'undefined' ? window.location.origin : 'unknown' });
    }
    await signInWithRedirect(auth, provider);
  } catch (e: any) {
    if (isAuthDebug()) {
      logAuth('redirect_start_error', { 
        code: e?.code, 
        msg: e?.message?.slice?.(0, 160) 
      });
    }
    clearRedirectFlag();
  }
}

async function startPopup(): Promise<void> {
  try {
    const provider = googleProvider; // Use Google provider by default
    if (isAuthDebug()) {
      logAuth('popup_start', {});
    }
    await signInWithPopup(auth, provider);
    if (isAuthDebug()) {
      logAuth('popup_success', {});
    }
  } catch (e: any) {
    if (isAuthDebug()) {
      logAuth('popup_error', { 
        code: e?.code, 
        msg: e?.message?.slice?.(0, 160) 
      });
    }
  }
}

