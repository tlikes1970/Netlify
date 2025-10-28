import { signInWithRedirect, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { logger } from './logger';

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
 * Logs the current origin to help verify OAuth configuration
 */
export function logAuthOriginHint() {
  if (typeof window === 'undefined') return;
  
  const origin = window.location.origin;
  
  // Known allowed origins for OAuth JavaScript origins
  const allowedOrigins = new Set([
    'http://localhost',
    'http://localhost:8888',
    'http://127.0.0.1:8888',
    'http://192.168.50.56:8888',
    'https://flicklet.netlify.app',
    'https://flicklet-71dff.web.app',
    'https://flicklet-71dff.firebaseapp.com'
  ]);
  
  if (!allowedOrigins.has(origin)) {
    logger.warn('[AUTH] Origin not in OAuth JavaScript origins', origin);
    logger.warn('To fix: Add this origin to Google Cloud Console → OAuth 2.0 Client IDs');
    logger.warn('Also add authorized redirect URIs', {
      origin,
      handler: `${origin}/__/auth/handler`
    });
  } else {
    logger.log('[AUTH] Origin OK', origin);
  }
}

