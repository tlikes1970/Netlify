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
import { logger } from './logger';
import { auth, db, appleProvider, firebaseReady, firebaseConfig } from './firebaseBootstrap';
import { firebaseSyncManager } from './firebaseSync';
import type { AuthUser, UserDocument, UserSettings, AuthProvider, AuthStatus } from './auth.types';
import { broadcastAuthComplete } from './authBroadcast';
import { authLogManager } from './authLog';
import { isAuthDebug, logAuth, safeOrigin, getAuthMode } from './authDebug';

// Removed: isBlockedOAuthContext function (unused after removing signInWithGoogle method)

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
    // ⚠️ CRITICAL: Don't initialize until Firebase is ready
    // This prevents getRedirectResult() from being called before Firebase bootstrap completes
    firebaseReady.then(() => {
      this.initialize();
    }).catch((e) => {
      logger.error('[AuthManager] Failed to wait for Firebase ready', e);
      // Initialize anyway after timeout to prevent app from hanging
      setTimeout(() => {
        this.initialize();
      }, 5000);
    });
  }
  
  getStatus(): AuthStatus {
    return this.authStatus;
  }
  
  setStatus(status: AuthStatus): void {
    const prevStatus = this.authStatus;
    this.authStatus = status;
    logger.debug(`Auth status changed: ${status}`);
    
    // Log status transition
    authLogManager.log(status, {
      previousStatus: prevStatus,
      transition: `${prevStatus} → ${status}`,
    });
  }
  
  // No redirect recency latches; redirect processing is gated by a session flag

  private async initialize() {
    if (this.isInitialized) return;
    
    // Create trace ID for this auth session
    authLogManager.createTraceId();
    authLogManager.log('init', {
      origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    });
    
    // Opportunistic boot scrub of obsolete storage keys (no side effects)
    try {
      const keys = [
        'flicklet.auth.resolvedAt',
        'flicklet.auth.redirect.start',
        'flicklet.auth.broadcast',
        'flicklet.auth.resolving.start',
      ];
      for (const k of keys) localStorage.removeItem(k);
      // Trim legacy auth debug logs formats if ever present
      const logs = localStorage.getItem('auth-debug-logs');
      if (logs && logs.length > 200000) {
        localStorage.removeItem('auth-debug-logs');
      }
    } catch (e) { void e; }
    
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
    
    // Check for redirect result FIRST (only if we initiated it)
    // One-shot guard: prevent loop by checking sessionStorage flag
    try {
      const onceKey = 'flk.auth.redirect.once';
      const didRedirect = sessionStorage.getItem('flk:didRedirect') === '1';
      const alreadyProcessed = sessionStorage.getItem(onceKey) === '1';
      
      if (didRedirect && !alreadyProcessed) {
        // Mark as processed immediately to prevent retry
        sessionStorage.setItem(onceKey, '1');
        sessionStorage.removeItem('flk:didRedirect');
        this.setStatus('resolving');
        
        // Debug logging: redirect return
        if (isAuthDebug()) {
          const currentOrigin = safeOrigin();
          const expectedOrigin = currentOrigin;
          const authDomainOrigin = `https://${firebaseConfig.authDomain}`;
          const originMatches = currentOrigin === expectedOrigin;
          
          logAuth('redirect_return', {
            locationHref: typeof window !== 'undefined' ? window.location.href : 'unknown',
            documentReferrer: typeof document !== 'undefined' ? document.referrer : 'unknown',
            currentOrigin,
            expectedOrigin,
            authDomain: firebaseConfig.authDomain,
            authDomainOrigin,
            originMatches,
            windowTopEqualsWindow: typeof window !== 'undefined' ? window.top === window : false,
          });
        }
        
        // Harden redirect: verify origin before processing
        if (typeof window !== 'undefined') {
          const currentOrigin = safeOrigin();
          const expectedOrigin = currentOrigin; // Should match current origin
          const urlOrigin = new URL(window.location.href).origin;
          
          if (urlOrigin !== expectedOrigin) {
            const errorMsg = `Auth return origin mismatch: got ${urlOrigin} expected ${expectedOrigin}. Check OAuth Authorized domains and Firebase authDomain.`;
            logger.error('[AuthManager]', errorMsg);
            
            if (isAuthDebug()) {
              logAuth('redirect_origin_mismatch', {
                got: urlOrigin,
                expected: expectedOrigin,
                locationHref: window.location.href,
              });
            }
            
            // Show non-blocking banner
            window.dispatchEvent(new CustomEvent('auth:origin-mismatch', {
              detail: {
                got: urlOrigin,
                expected: expectedOrigin,
                message: errorMsg,
              }
            }));
            
            // Abort looping - don't process redirect
            this.setStatus('unauthenticated');
            return;
          }
        }
        
        try {
          const result = await getRedirectResult(auth as any);
          if (result && result.user) {
            authLogManager.log('redirect_result_success', {
              providerId: (result as any).providerId,
              operationType: (result as any).operationType,
            });
            
            if (isAuthDebug()) {
              logAuth('redirect_result_success', {
                providerId: (result as any).providerId,
                operationType: (result as any).operationType,
                hasUser: !!result.user,
              });
            }
          } else {
            authLogManager.log('redirect_result_empty', {});
            
            if (isAuthDebug()) {
              logAuth('redirect_result_empty', {});
            }
          }
        } catch (e: any) {
          logger.error('Error checking redirect result', e);
          authLogManager.log('getRedirectResult_error', {
            error: e?.message || String(e),
            code: e?.code || 'unknown',
          });
          
          if (isAuthDebug()) {
            logAuth('getRedirectResult_error', {
              error: e?.message || String(e),
              code: e?.code || 'unknown',
            });
            
            // Diagnose common errors
            if (e?.code === 'auth/network-request-failed') {
              logAuth('diagnosis', { issue: 'Network request failed - check connectivity or CORS' });
            } else if (e?.code === 'auth/unauthorized-domain') {
              logAuth('diagnosis', { issue: 'Unauthorized domain - add to Firebase authorized domains' });
            } else if (e?.message?.includes('postMessage')) {
              logAuth('diagnosis', { issue: 'postMessage target origin mismatch - check OAuth redirect URI' });
            }
          }
          
          // Show error UI instead of retrying
          this.handleAuthConfigError(e);
        }
      } else if (alreadyProcessed) {
        logger.debug('Redirect result already processed - skipping getRedirectResult');
        if (isAuthDebug()) {
          logAuth('redirect_already_processed', {});
        }
      } else {
        logger.debug('No redirect flag present - skipping getRedirectResult');
        if (isAuthDebug()) {
          logAuth('no_redirect_flag', {});
        }
      }
    } catch (e) {
      // ignore
    }
    
    // Log Firebase init complete (auth manager initialized)
    // Note: firebaseReady_resolved_at is logged separately in main.tsx
    authLogManager.log('firebase_init_complete', {
      timestamp: new Date().toISOString(),
    });
    
    // Listen for auth state changes
    // Note: This is the ONLY onAuthStateChanged listener in the app
    // All other code must use authManager.subscribe() instead
    onAuthStateChanged(auth as any, async (user) => {
      const authUser = user ? this.convertFirebaseUser(user) : null;
      
      // Log auth listener fired with hasUser boolean
      authLogManager.log('auth_listener_fired', {
        hasUser: !!authUser,
        uid: authUser?.uid || null,
      });
      
      // Update current user
      this.currentUser = authUser;
      
      // Update status based on auth state
      if (authUser && user) {
        this.setStatus('authenticated');
        
        // Log auth state change (get provider info from Firebase User)
        const providerData = user.providerData?.[0];
        authLogManager.log('auth_state_authenticated', {
          uid: authUser.uid,
          provider: providerData?.providerId || 'unknown',
          emailVerified: user.emailVerified || false,
        });
        
        // Duplicate log removed - already logged at the start of onAuthStateChanged
        
        // One-liner: final_status
        authLogManager.log('final_status', {
          status: 'authenticated',
          reason: 'success',
        });
        
        // Mark auth flow as complete
        authLogManager.markComplete('authenticated', true);
        
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
              authLogManager.log('url_cleaned', {
                reason: 'auth_confirmed',
                hadAuthParams: hasAuthParams,
                hadHash: !!window.location.hash,
              });
            }
          } catch (e) {
            logger.warn('Failed to clean up URL', e);
          }
        }, 500);
      } else if (!authUser) {
        this.setStatus('unauthenticated');
        
        // Log auth state change
        authLogManager.log('auth_state_unauthenticated', {});
        
        // Duplicate log removed - already logged at the start of onAuthStateChanged
        
        // One-liner: final_status
        authLogManager.log('final_status', {
          status: 'unauthenticated',
          reason: 'no_user',
        });
        
        // Mark auth flow as complete (failed/unauthenticated)
        authLogManager.markComplete('unauthenticated', false);
        
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
    // Create new trace ID for this sign-in attempt
    const traceId = authLogManager.createTraceId();
    authLogManager.log('signin_start', {
      provider,
      traceId,
      origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
    });
    
    // Debug logging
    if (isAuthDebug()) {
      const authMode = getAuthMode();
      logAuth('signin_start', {
        provider,
        traceId,
        origin: safeOrigin(),
        authModeOverride: authMode,
      });
    }
    
    // ⚠️ PERSISTENCE: Firebase persistence is already set by bootstrap
    // ⚠️ PERSISTENCE: Force IndexedDB/local before auth (iOS requirement)
    const { ensurePersistenceBeforeAuth } = await import('./persistence');
    const persistenceResult = await ensurePersistenceBeforeAuth();
    authLogManager.log('persistence_ensured', {
      method: persistenceResult,
      firebasePersistenceSet: true,
    });
    
    this.setStatus('redirecting');
    
    try {
      switch (provider) {
        case 'google': {
          const { googleLogin } = await import('./authLogin');
          await googleLogin();
          return;
        }
        case 'apple': {
          // ⚠️ TODO: Create appleLogin() helper similar to googleLogin()
          // For now, using basic redirect (no iOS popup fallback yet)
          logger.warn('Apple sign-in via signInWithProvider is deprecated - will be migrated to appleLogin() helper');
          
          // Ensure persistence before sign-in
          const { setPersistence, browserLocalPersistence } = await import('firebase/auth');
          await setPersistence(auth, browserLocalPersistence);
          
          // Clean URL of debug params before redirect
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
          
          await signInWithRedirect(auth, appleProvider);
          break;
        }
        case 'email':
          this.setStatus('unauthenticated');
          authLogManager.log('signin_error', {
            provider,
            error: 'Email sign-in requires email/password',
          });
          throw new Error('Email sign-in requires email/password');
        default:
          this.setStatus('unauthenticated');
          authLogManager.log('signin_error', {
            provider,
            error: `Unknown provider: ${provider}`,
          });
          throw new Error(`Unknown provider: ${provider}`);
      }
      // Note: redirecting status persists through the redirect
      // Status will be updated when the page returns from OAuth
    } catch (error) {
      this.setStatus('unauthenticated');
      logger.error(`${provider} sign-in failed`, error);
      authLogManager.log('signin_error', {
        provider,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ⚠️ REMOVED: signInWithGoogle() and signInWithApple() private methods
  // These legacy methods have been removed - Google uses googleLogin() from authLogin.ts
  // Apple sign-in is now inline in signInWithProvider() (will be migrated to appleLogin() helper)

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
      
      // Read existing settings first to preserve other fields
      const userSnap = await getDoc(userRef);
      const existingData = userSnap.exists() ? userSnap.data() : {};
      const existingSettings = existingData.settings || {};
      
      // Merge new settings with existing settings
      const mergedSettings = {
        ...existingSettings,
        ...settings,
      };
      
      // Update with merged settings
      await updateDoc(userRef, {
        settings: mergedSettings,
      });
      logger.log('Updated user settings', { 
        updated: settings, 
        merged: mergedSettings 
      });
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

  /**
   * Handle auth configuration errors (e.g., domain mismatch, unauthorized redirect)
   * Shows error UI instead of retrying
   */
  private handleAuthConfigError(error: any): void {
    logger.error('[AuthManager] Auth config error:', error);
    
    // Dispatch event to show error UI
    window.dispatchEvent(new CustomEvent('auth:config-error', {
      detail: {
        error: error?.message || String(error),
        code: error?.code || 'unknown',
        timestamp: new Date().toISOString(),
      }
    }));
    
    // Set status to unauthenticated to prevent retry loops
    this.setStatus('unauthenticated');
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  isAuthStateInitialized(): boolean {
    return this.authStateInitialized;
  }
}

export const authManager = new AuthManager();
