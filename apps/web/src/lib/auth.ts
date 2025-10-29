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

  private async initialize() {
    if (this.isInitialized) return;
    
    this.setStatus('checking');
    
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
      const hasAuthParams = window.location.hash || window.location.search;
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
      
      const result = await getRedirectResult(auth);
      
      // ⚠️ CRITICAL: Set resolving status when processing redirect
      if (hasAuthParams) {
        this.setStatus('resolving');
        logger.debug('Processing redirect result - status: resolving');
      }
      
      if (result && result.user) {
        logger.log('Redirect sign-in successful', {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        });
        
        // Clean up the URL by removing auth parameters to prevent loops
        try {
          window.history.replaceState({}, document.title, window.location.pathname);
          logger.debug('Cleaned up URL parameters');
        } catch (e) {
          logger.warn('Failed to clean up URL', e);
        }
        
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
            
            // Clean up the URL on successful retry
            try {
              window.history.replaceState({}, document.title, window.location.pathname);
              logger.debug('Cleaned up URL parameters');
            } catch (e) {
              logger.warn('Failed to clean up URL', e);
            }
          } else {
            logger.warn('Still no redirect result after retry - URL had auth params but no result');
            
            // Clean up URL to prevent loop - auth params suggest redirect happened but no result
            try {
              window.history.replaceState({}, document.title, window.location.pathname);
              logger.debug('Cleaned up URL parameters to prevent redirect loop');
              // Clear processing flag since auth failed
              sessionStorage.removeItem('flicklet.auth.processing');
            } catch (e) {
              logger.warn('Failed to clean up URL', e);
            }
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
      } else {
        this.setStatus('unauthenticated');
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
