import { signInWithRedirect, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { logger } from './logger';
import { authManager } from './auth';

/**
 * Detects if we're in a WebView or standalone PWA
 */
function isWebView(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = navigator.userAgent;
  const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(ua);
  const isInAppBrowser = 
    ua.includes('wv') ||          // Android WebView
    ua.includes('FBAN') ||         // Facebook App Browser
    ua.includes('FBAV') ||         // Facebook App Browser
    ua.includes('Instagram') ||    // Instagram in-app
    ua.includes('Line/') ||        // Line in-app
    ua.includes('Twitter') ||      // Twitter in-app
    ua.includes('TikTok') ||       // TikTok in-app
    ua.includes('GSA/') ||         // Google Search App
    ua.includes('EdgA') ||         // Edge Android WebView
    (ua.includes('Electron') && !ua.includes('Chrome/91')); // Electron without modern Chrome
  
  const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  
  return isMobileDevice || isInAppBrowser || isStandalone;
}

/**
 * Google sign-in helper that uses redirect on mobile/webview and popup on desktop
 */
export async function googleLogin() {
  // Set redirecting status BEFORE starting redirect
  authManager.setStatus('redirecting');
  
  // Persist status to localStorage so it survives redirect
  try {
    localStorage.setItem('flicklet.auth.status', 'redirecting');
    logger.debug('Set status to redirecting and persisted to localStorage');
  } catch (e) {
    logger.warn('Failed to persist auth status', e);
  }
  
  // Validate origin before proceeding
  // Note: Safari may show security warnings during OAuth - this is normal
  try {
    validateOAuthOrigin();
  } catch (error: any) {
    // Log but don't fail on Safari - Safari handles security differently
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      logger.warn('[AUTH] Safari detected - origin validation warning (may be normal)', error.message);
      // Continue anyway - Safari's security model is different
    } else {
      authManager.setStatus('unauthenticated');
      localStorage.removeItem('flicklet.auth.status');
      logger.error('Origin validation failed before Google sign-in', error);
      throw error;
    }
  }
  
  const useRedirect = isWebView();
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  
  // Log and save to localStorage before redirect
  const logData = {
    method: useRedirect ? 'redirect' : 'popup',
    origin: window.location.origin,
    fullUrl: window.location.href,
    timestamp: new Date().toISOString()
  };
  
  logger.log('Google sign-in method', useRedirect ? 'redirect (mobile/webview)' : 'popup (desktop)');
  logger.debug('Current origin', window.location.origin);
  logger.debug('Is localhost', isLocalhost);
  
  try {
    // LOCALHOST WORKAROUND: Use popup mode even if webview would use redirect
    // This avoids Firebase's redirect handler issues with localhost
    if (isLocalhost) {
      logger.log('Localhost detected - using popup mode to avoid Firebase redirect issues');
      await signInWithPopup(auth, googleProvider);
      logger.log('Popup sign-in successful');
    } else if (useRedirect) {
      logger.log('Starting redirect sign-in');
      
      // Save to localStorage before redirect so we can see it after page reload
      try {
        const existingLogs = JSON.parse(localStorage.getItem('auth-debug-logs') || '[]');
        existingLogs.push({ type: 'redirect-start', ...logData });
        localStorage.setItem('auth-debug-logs', JSON.stringify(existingLogs.slice(-10))); // Keep last 10 entries
        logger.debug('Saved debug log to localStorage');
      } catch (e) {
        logger.error('Failed to save debug log', e);
      }
      
      await signInWithRedirect(auth, googleProvider);
      logger.log('Redirect initiated - user will be redirected to Google');
      // Note: Page will reload after Google auth
    } else {
      logger.log('Starting popup sign-in');
      await signInWithPopup(auth, googleProvider);
      logger.log('Popup sign-in successful');
    }
  } catch (error: any) {
    logger.error('Google sign-in failed', error);
    logger.debug('Error code', error.code);
    logger.debug('Error message', error.message);
    
    // Save error to localStorage
    try {
      const existingLogs = JSON.parse(localStorage.getItem('auth-debug-logs') || '[]');
      existingLogs.push({ 
        type: 'error', 
        errorCode: error.code,
        errorMessage: error.message,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('auth-debug-logs', JSON.stringify(existingLogs.slice(-10)));
    } catch (e) {
      // ignore
    }
    
    // If popup fails with blocked error, fallback to redirect
    if (!useRedirect && !isLocalhost && (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user')) {
      logger.warn('Popup blocked, falling back to redirect');
      return signInWithRedirect(auth, googleProvider);
    }
    
    throw error;
  }
}

/**
 * Validates the current origin against allowed OAuth origins
 * @returns true if origin is valid, throws error if invalid
 * @throws Error if origin is not authorized
 */
export function validateOAuthOrigin(): boolean {
  if (typeof window === 'undefined') return true;
  
  const origin = window.location.origin;
  
  // Known allowed origins for OAuth JavaScript origins
  // Note: Netlify may add query params or fragments that don't affect origin
  const allowedOrigins = new Set([
    'http://localhost',
    'http://localhost:8888',
    'http://127.0.0.1:8888',
    'http://192.168.50.56:8888',
    'https://flicklet.netlify.app',
    'https://flicklet-71dff.web.app',
    'https://flicklet-71dff.firebaseapp.com'
  ]);
  
  // Also allow any netlify.app subdomain (for preview deployments)
  const isNetlifyApp = origin.includes('.netlify.app') || origin.includes('.netlify.com');
  
  // Allow Netlify preview deployments
  if (!allowedOrigins.has(origin) && !isNetlifyApp) {
    const errorMsg = `Unauthorized origin: ${origin}. Please configure this origin in Firebase Console.`;
    logger.error('[AUTH] Origin validation failed', origin);
    logger.warn('[AUTH] If this is a Netlify preview deployment, add it to Firebase authorized domains');
    throw new Error(errorMsg);
  }
  
  if (isNetlifyApp && !allowedOrigins.has(origin)) {
    logger.warn(`[AUTH] Netlify preview domain detected: ${origin}. Consider adding to Firebase authorized domains.`);
  }
  
  logger.log('[AUTH] Origin validated', origin);
  return true;
}

/**
 * Logs the current origin to help verify OAuth configuration
 * @deprecated Use validateOAuthOrigin() instead
 */
export function logAuthOriginHint() {
  try {
    validateOAuthOrigin();
  } catch (error) {
    // Silently fail for logging purposes
    logger.warn('Origin validation warning', error);
  }
}

