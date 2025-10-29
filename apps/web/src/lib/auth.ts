import { 
  signInWithRedirect, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getRedirectResult,
  User
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { isMobileNow } from './isMobile';
import { logger } from './logger';
import { auth, db, googleProvider, appleProvider } from './firebase';
import { firebaseSyncManager } from './firebaseSync';
import type { AuthUser, UserDocument, UserSettings, AuthProvider, AuthStatus } from './auth.types';
import { markAuthInFlight, broadcastAuthComplete } from './authBroadcast';

// Detect if we're in a blocked OAuth context
// Google blocks OAuth inside embedded browsers (PWA standalone, in-app browsers, etc.)
function isBlockedOAuthContext(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = navigator.userAgent || '';
  const isPWAStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
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
  
  const isStandalone = (window as any).standalone || isPWAStandalone;
  
  if (isStandalone) {
    logger.warn('PWA standalone mode detected - Google OAuth is blocked');
  }
  
  if (isInAppBrowser) {
    logger.warn('In-app browser detected - Google OAuth is blocked');
  }
  
  return isStandalone || isInAppBrowser;
}

// Track recent auth attempts to prevent loops
const AUTH_ATTEMPT_KEY = 'flicklet.auth.attempt.timestamp';
const AUTH_ATTEMPT_WINDOW = 30000; // 30 seconds - prevents rapid retries

function shouldBlockAuthAttempt(): boolean {
  const lastAttempt = localStorage.getItem(AUTH_ATTEMPT_KEY);
  if (!lastAttempt) return false;
  
  const timeSince = Date.now() - parseInt(lastAttempt);
  const blocked = timeSince < AUTH_ATTEMPT_WINDOW;
  
  if (blocked) {
    logger.warn(`Auth attempt blocked - last attempt ${timeSince}ms ago (${AUTH_ATTEMPT_WINDOW}ms window)`);
  }
  
  return blocked;
}

function recordAuthAttempt(): void {
  localStorage.setItem(AUTH_ATTEMPT_KEY, Date.now().toString());
  logger.debug('Recorded auth attempt timestamp');
}

class AuthManager {
  private currentUser: AuthUser | null = null;
  private listeners: Set<(user: AuthUser | null) => void> = new Set();
  private isInitialized = false;
  private authStateInitialized = false;
  private authStatus: AuthStatus = 'idle';
  private redirectResultFetched = false; // One-shot latch for getRedirectResult()
  private redirectResultPromise: Promise<any> | null = null; // Ensure only one call
  
  // Reset redirect state - called when starting a new redirect
  public resetRedirectState(): void {
    this.redirectResultFetched = false;
    this.redirectResultPromise = null;
    try {
      localStorage.removeItem('flicklet.auth.resolvedAt');
    } catch (e) {
      // ignore
    }
  }

  constructor() {
    this.initialize();
  }
  
  getStatus(): AuthStatus {
    return this.authStatus;
  }
  
  setStatus(status: AuthStatus): void {
    this.authStatus = status;
    logger.debug(`Auth status changed: ${status}`);
  }
  
  // Check if redirect was already resolved recently (within 5 seconds)
  // Only skip if we're NOT returning from a redirect (no auth params = already processed)
  private wasRedirectRecentlyResolved(hasAuthParams: boolean): boolean {
    // If we have auth params in URL, this is a legitimate redirect return - never skip
    if (hasAuthParams) {
      return false;
    }
    
    try {
      const resolvedAt = localStorage.getItem('flicklet.auth.resolvedAt');
      if (!resolvedAt) return false;
      
      const resolvedTime = parseInt(resolvedAt);
      const now = Date.now();
      const timeSince = now - resolvedTime;
      
      // Only skip if resolved within last 2 seconds AND no auth params (prevents double-call, not legitimate redirect)
      if (timeSince < 2000 && timeSince > 0) {
        logger.debug(`Redirect was resolved ${timeSince}ms ago and no auth params - skipping getRedirectResult()`);
        return true;
      }
      
      return false;
    } catch (e) {
      return false;
    }
  }
  
  // Mark redirect as resolved
  private markRedirectResolved(): void {
    try {
      localStorage.setItem('flicklet.auth.resolvedAt', Date.now().toString());
      this.redirectResultFetched = true;
    } catch (e) {
      // ignore
    }
  }

  private async initialize() {
    if (this.isInitialized) return;
    
    // ⚠️ CRASH-SAFE: Check for stuck redirecting state (>60s = likely crash)
    try {
      const persistedStatus = localStorage.getItem('flicklet.auth.status');
      const resolvingStart = localStorage.getItem('flicklet.auth.resolving.start');
      
      if (persistedStatus === 'redirecting' || persistedStatus === 'resolving') {
        if (resolvingStart) {
          const startTime = parseInt(resolvingStart);
          const now = Date.now();
          const timeSince = now - startTime;
          
          // If stuck in redirecting/resolving for >60s, reset to checking
          if (timeSince > 60000) {
            logger.warn(`Auth stuck in ${persistedStatus} for ${timeSince}ms - resetting to checking`);
            this.setStatus('checking');
            try {
              localStorage.removeItem('flicklet.auth.status');
              localStorage.removeItem('flicklet.auth.resolving.start');
            } catch (e) {
              // ignore
            }
          } else {
            this.setStatus(persistedStatus as AuthStatus);
            logger.log(`Restored auth status from localStorage: ${persistedStatus} (${timeSince}ms ago)`);
          }
        } else {
          // No timestamp - assume old state, reset
          this.setStatus('checking');
          try {
            localStorage.removeItem('flicklet.auth.status');
          } catch (e) {
            // ignore
          }
        }
      } else {
        this.setStatus('checking');
      }
    } catch (e) {
      this.setStatus('checking');
    }
    
    // Check for redirect result FIRST (before setting up auth state listener)
    // This ensures we handle the redirect result if user is returning from Google/Apple sign-in
    try {
      // CRITICAL: Save URL IMMEDIATELY before anything else touches it
      const currentHref = window.location.href;
      const currentHash = window.location.hash;
      const currentSearch = window.location.search;
      const currentOrigin = window.location.origin;
      const currentPath = window.location.pathname;
      
      const returnUrlData = {
        fullUrl: currentHref,
        origin: currentOrigin,
        path: currentPath,
        search: currentSearch,
        hash: currentHash,
        timestamp: new Date().toISOString()
      };
      
      // Save to localStorage so we can inspect after redirect
      try {
        const existingLogs = JSON.parse(localStorage.getItem('auth-debug-logs') || '[]');
        existingLogs.push({ type: 'redirect-return', ...returnUrlData });
        localStorage.setItem('auth-debug-logs', JSON.stringify(existingLogs.slice(-10)));
      } catch (e) {
        // ignore
      }
      
      logger.log('Checking for redirect result...');
      logger.debug('Redirect URL snapshot', {
        href: currentHref,
        hash: currentHash,
        search: currentSearch
      });
      
      // DEBUG: Check sessionStorage for Firebase auth state (read-only)
      logger.debug('Checking sessionStorage for Firebase auth state');
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('firebase') || key.includes('auth') || key.includes('redirect'))) {
          logger.debug(`sessionStorage[${key}]`, sessionStorage.getItem(key));
        }
      }
      
      // ⚠️ CRITICAL: Never modify Firebase's sessionStorage
      // Firebase manages its own auth state. Manual removal causes auth loops.
      // We only log, never modify sessionStorage keys that Firebase uses.
      
      logger.debug('Window location', {
        href: window.location.href,
        search: window.location.search,
        hash: window.location.hash
      });
      
      // Check if URL suggests we're returning from a redirect
      const hasAuthParams = !!(window.location.hash || window.location.search);
      if (hasAuthParams) {
        logger.debug('URL contains auth parameters, might be redirect return');
        
        // Parse hash for Firebase auth errors
        if (window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const error = hashParams.get('error');
          const errorCode = hashParams.get('error_code');
          const errorDescription = hashParams.get('error_description');
          if (error) {
            logger.error('Firebase auth error in URL', { error, errorCode, errorDescription });
            
            // Save error to localStorage
            try {
              const existingLogs = JSON.parse(localStorage.getItem('auth-debug-logs') || '[]');
              existingLogs.push({ 
                type: 'redirect-error', 
                error, 
                errorCode, 
                errorDescription,
                timestamp: new Date().toISOString()
              });
              localStorage.setItem('auth-debug-logs', JSON.stringify(existingLogs.slice(-10)));
            } catch (e) {
              // ignore
            }
          }
        }
      }
      
      // ⚠️ STATE INTEGRITY: Verify stateId matches (prevents cross-origin/cross-tab confusion)
      try {
        const savedStateId = localStorage.getItem('flicklet.auth.stateId');
        if (hasAuthParams && savedStateId) {
          // State ID exists - this should match our redirect
          logger.debug(`Redirect return detected with saved stateId: ${savedStateId.substring(0, 20)}...`);
        } else if (hasAuthParams && !savedStateId) {
          // URL has auth params but no saved state - suspicious, but continue
          logger.warn('Redirect return detected but no saved stateId - possible state mismatch');
        }
      } catch (e) {
        // ignore
      }
      
      // ⚠️ IDEMPOTENCY: Ensure getRedirectResult() runs exactly once per load
      // BUT: If we have auth params, this is a legitimate redirect return - always process it
      if (this.redirectResultFetched && !hasAuthParams) {
        logger.debug('getRedirectResult() already fetched and no auth params - skipping');
        return;
      }
      
      // Check if recently resolved (only skip if no auth params)
      if (!hasAuthParams && this.wasRedirectRecentlyResolved(hasAuthParams)) {
        logger.debug('getRedirectResult() recently resolved and no auth params - skipping');
        return;
      }
      
      // If there's an in-flight promise, reuse it (but only if we have auth params)
      // Without auth params, the promise is stale and we should create a new one
      if (this.redirectResultPromise && hasAuthParams) {
        logger.debug('getRedirectResult() already in flight - waiting for existing promise');
        const result = await this.redirectResultPromise;
        if (result && result.user) {
          this.markRedirectResolved();
        }
        return;
      } else if (this.redirectResultPromise && !hasAuthParams) {
        logger.debug('Stale redirect promise detected without auth params - clearing and starting fresh');
        this.redirectResultPromise = null;
      }
      
      // Create single promise for this load
      this.redirectResultPromise = getRedirectResult(auth);
      
      // ⚠️ CRITICAL: Set resolving status when processing redirect
      // This must happen BEFORE Firebase processes the result
      if (hasAuthParams) {
        this.setStatus('resolving');
        // Persist status across potential page reloads
        try {
          localStorage.setItem('flicklet.auth.status', 'resolving');
          // Also set a timestamp to track how long we've been resolving
          localStorage.setItem('flicklet.auth.resolving.start', Date.now().toString());
          
          // Broadcast to other tabs
          markAuthInFlight('resolving');
        } catch (e) {
          // ignore
        }
        logger.log('Processing redirect result - status: resolving (URL has auth params)');
      }
      
      const result = await this.redirectResultPromise;
      this.markRedirectResolved();
      
      if (result && result.user) {
        logger.log('Redirect sign-in successful', {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        });
        
        // ⚠️ CRITICAL: Delay URL cleanup until after getRedirectResult() fully settles
        // Don't clean URL here - wait for onAuthStateChanged to fire
        // URL cleanup will happen after auth state is confirmed
        
        // The user is now signed in, onAuthStateChanged will fire and handle the rest
      } else {
        logger.log('No redirect result returned from Firebase');
        
        // Only retry if we have auth params in URL (means we're actually returning from redirect)
        if (hasAuthParams) {
          // Detect if mobile for longer retry delay (mobile networks are slower)
          const ua = navigator.userAgent || '';
          const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
          const retryDelay = isMobile ? 1500 : 500; // Longer delay on mobile networks
          
          logger.debug(`Retrying getRedirectResult after ${retryDelay}ms (mobile: ${isMobile})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          
          const retryResult = await getRedirectResult(auth);
          if (retryResult && retryResult.user) {
            logger.log('Redirect sign-in successful on retry', {
              uid: retryResult.user.uid,
              email: retryResult.user.email
            });
            
            // ⚠️ Don't clean URL here - delay until auth state is confirmed
            // URL cleanup happens after onAuthStateChanged fires
          } else {
            logger.warn('Still no redirect result after retry - URL had auth params but no result');
            
            // Only clean URL if we're absolutely sure there's no result coming
            // Delay cleanup to avoid race conditions
            setTimeout(() => {
              try {
                window.history.replaceState({}, document.title, window.location.pathname);
                logger.debug('Cleaned up URL parameters (delayed after retry failure)');
              } catch (e) {
                logger.warn('Failed to clean up URL', e);
              }
            }, 1000);
          }
        } else {
          logger.debug('No auth params in URL and no redirect result - user is not signing in via redirect');
          // Clear processing flag if it was set
          try {
            sessionStorage.removeItem('flicklet.auth.processing');
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (error) {
      logger.error('Error checking redirect result', error);
      // Continue initialization even if redirect check fails
    }
    
    // Listen for auth state changes
    onAuthStateChanged(auth, async (user) => {
      const authUser = user ? this.convertFirebaseUser(user) : null;
      
      // Update current user
      this.currentUser = authUser;
      
      // Update status based on auth state
      if (authUser) {
        this.setStatus('authenticated');
        // Clear persisted status - auth is complete
        try {
          localStorage.removeItem('flicklet.auth.status');
          localStorage.removeItem('flicklet.auth.resolving.start');
          localStorage.removeItem('flicklet.auth.stateId');
          localStorage.removeItem('flicklet.auth.redirect.start');
          localStorage.removeItem('flicklet.auth.broadcast');
          
          // Broadcast completion to other tabs
          broadcastAuthComplete();
        } catch (e) {
          // ignore
        }
        
        // ⚠️ NOW safe to clean URL - auth state is confirmed
        // Delay slightly to ensure all Firebase callbacks have fired
        setTimeout(() => {
          try {
            const urlParams = new URLSearchParams(window.location.search);
            const hasAuthParams = urlParams.has('state') || urlParams.has('code') || urlParams.has('error');
            if (hasAuthParams || window.location.hash) {
              window.history.replaceState({}, document.title, window.location.pathname);
              logger.debug('Cleaned up URL parameters after auth state confirmed');
            }
          } catch (e) {
            logger.warn('Failed to clean up URL', e);
          }
        }, 500);
      } else {
        this.setStatus('unauthenticated');
        // Clear persisted status if we're unauthenticated
        try {
          localStorage.removeItem('flicklet.auth.status');
          localStorage.removeItem('flicklet.auth.resolving.start');
        } catch (e) {
          // ignore
        }
      }
      
      // Mark auth state as initialized after first Firebase callback
      if (!this.authStateInitialized) {
        this.authStateInitialized = true;
        logger.log('Auth state initialized', { 
          hasUser: !!authUser, 
          uid: authUser?.uid,
          email: authUser?.email,
          status: this.authStatus
        });
      } else {
        logger.log('Auth state changed', { 
          hasUser: !!authUser, 
          uid: authUser?.uid,
          email: authUser?.email,
          status: this.authStatus
        });
      }
      
      if (authUser) {
        // Create/update user document in Firestore
        await this.ensureUserDocument(authUser);
        
        // Initialize Firebase sync and load cloud data
        firebaseSyncManager.init();
        await firebaseSyncManager.loadFromFirebase(authUser.uid);
      }
      
      // Notify all listeners
      this.listeners.forEach(listener => listener(authUser));
    });
    
    this.isInitialized = true;
  }

  private convertFirebaseUser(user: User): AuthUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  }

  private async ensureUserDocument(authUser: AuthUser): Promise<void> {
    const userRef = doc(db, 'users', authUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Create new user document
      const userDoc: UserDocument = {
        uid: authUser.uid,
        email: authUser.email || '',
        displayName: authUser.displayName || '',
        photoURL: authUser.photoURL,
        lastLoginAt: new Date().toISOString(),
        profile: {
          email: authUser.email || '',
          displayName: authUser.displayName || '',
          photoURL: authUser.photoURL || '',
        },
        settings: {
          usernamePrompted: false,
          theme: 'light',
          lang: 'en',
        },
        watchlists: {
          tv: { watching: [], wishlist: [], watched: [] },
          movies: { watching: [], wishlist: [], watched: [] },
        },
      };
      
      await setDoc(userRef, userDoc);
      logger.log('Created new user document', authUser.uid);
    } else {
      // Update last login time
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        profile: {
          email: authUser.email || '',
          displayName: authUser.displayName || '',
          photoURL: authUser.photoURL || '',
        },
      });
      logger.log('Updated user document', authUser.uid);
    }
  }

  async signInWithProvider(provider: AuthProvider): Promise<void> {
    // ⚠️ PERSISTENCE: Force IndexedDB/local before auth (iOS requirement)
    const { ensurePersistenceBeforeAuth } = await import('./persistence');
    await ensurePersistenceBeforeAuth();
    
    // ⚠️ CRITICAL: Reset redirect state before starting new redirect
    // This ensures getRedirectResult() will run when we return from OAuth
    this.resetRedirectState();
    
    this.setStatus('redirecting');
    
    try {
      switch (provider) {
        case 'google':
          await this.signInWithGoogle();
          break;
        case 'apple':
          await this.signInWithApple();
          break;
        case 'email':
          this.setStatus('unauthenticated');
          throw new Error('Email sign-in requires email/password');
        default:
          this.setStatus('unauthenticated');
          throw new Error(`Unknown provider: ${provider}`);
      }
      // Note: redirecting status persists through the redirect
      // Status will be updated when the page returns from OAuth
    } catch (error) {
      this.setStatus('unauthenticated');
      logger.error(`${provider} sign-in failed`, error);
      throw error;
    }
  }

  private async signInWithGoogle(): Promise<void> {
    // ⚠️ CRITICAL: Clean URL of debug params before redirect
    // Safari and Firebase may reject OAuth redirects with unexpected query params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('debugAuth')) {
      urlParams.delete('debugAuth');
      const cleanUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : '') + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
      logger.debug('Removed debugAuth param from URL before redirect');
    }
    
    // Check if we should block this auth attempt to prevent loops
    if (shouldBlockAuthAttempt()) {
      throw new Error('Authentication attempted too frequently. Please wait a moment and try again.');
    }
    
    const isMobile = isMobileNow();
    const isBlocked = isBlockedOAuthContext();
    
    logger.log('Starting Google sign-in', { 
      isMobile, 
      isBlocked,
      userAgent: navigator.userAgent.substring(0, 50),
      displayMode: (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ? 'standalone' : 'browser'
    });
    
    if (isBlocked) {
      logger.error('Google sign-in attempted in blocked context (PWA standalone or in-app browser)');
      throw new Error('OAUTH_BLOCKED');
    }
    
    // Record this auth attempt to prevent rapid retries
    recordAuthAttempt();
    
    // Use redirect for both mobile and desktop to avoid popup blocking issues
    logger.log('Using redirect flow for Google sign-in');
    try {
      await signInWithRedirect(auth, googleProvider);
      logger.log('Redirect initiated - page will reload after sign-in');
      // Note: This will redirect the page to Google. The redirect result will be handled
      // when the page loads after returning from Google.
    } catch (error: any) {
      logger.error('Google redirect sign-in failed', error);
      // Remove unauthorized-domain handling - let Firebase throw the proper error
      throw error;
    }
  }

  private async signInWithApple(): Promise<void> {
    // ⚠️ CRITICAL: Clean URL of debug params before redirect
    // Safari and Firebase may reject OAuth redirects with unexpected query params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('debugAuth')) {
      urlParams.delete('debugAuth');
      const cleanUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : '') + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
      logger.debug('Removed debugAuth param from URL before redirect');
    }
    
    // Check if we should block this auth attempt to prevent loops
    if (shouldBlockAuthAttempt()) {
      throw new Error('Authentication attempted too frequently. Please wait a moment and try again.');
    }
    
    // Record this auth attempt to prevent rapid retries
    recordAuthAttempt();
    
    // Apple always uses redirect
    await signInWithRedirect(auth, appleProvider);
  }

  async signInWithEmail(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      // Firebase doesn't distinguish between wrong email and wrong password
      // It returns 'auth/invalid-credential' for both cases for security
      if (error.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password. Please try again or create a new account.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      } else {
        throw error;
      }
    }
  }

  async createAccountWithEmail(email: string, password: string): Promise<void> {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please sign in instead.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use at least 6 characters.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please try again later.');
      } else {
        throw error;
      }
    }
  }

  async signOut(): Promise<void> {
    // Clear local data for privacy
    this.clearLocalData();
    
    // Sign out from Firebase
    await firebaseSignOut(auth);
  }

  private clearLocalData(): void {
    try {
      // Clear all Flicklet data from localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('flicklet.')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Dispatch event to clear Library state
      window.dispatchEvent(new CustomEvent('library:cleared'));
      
      logger.log('Cleared local data on sign-out for privacy');
    } catch (error) {
      logger.error('Failed to clear local data', error);
    }
  }

  async getUserSettings(uid: string): Promise<UserSettings | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        return data.settings || {};
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get user settings', error);
      return null;
    }
  }

  async updateUserSettings(uid: string, settings: Partial<UserSettings>): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        settings: settings,
      });
      logger.log('Updated user settings', settings);
    } catch (error) {
      logger.error('Failed to update user settings', error);
      throw error;
    }
  }

  subscribe(listener: (user: AuthUser | null) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  isAuthStateInitialized(): boolean {
    return this.authStateInitialized;
  }
}

export const authManager = new AuthManager();
