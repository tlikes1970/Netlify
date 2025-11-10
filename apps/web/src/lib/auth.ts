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
import { clearRedirectGuard, hasRedirectStarted } from './authGuard';

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
    let initCalled = false;
    
    const tryInit = () => {
      if (initCalled) return;
      initCalled = true;
      this.initialize().catch((e) => {
        logger.error('[AuthManager] Error during initialize:', e);
        // Even if initialize fails, mark as initialized to prevent infinite loading
        if (!this.authStateInitialized) {
          this.authStateInitialized = true;
          this.setStatus('unauthenticated');
          this.listeners.forEach(listener => listener(null));
        }
      });
    };
    
    // Try to wait for firebaseReady, but with aggressive timeout
    Promise.race([
      firebaseReady,
      new Promise(resolve => setTimeout(resolve, 3000)) // 3 second timeout
    ]).then(() => {
      tryInit();
    }).catch((e) => {
      logger.error('[AuthManager] Failed to wait for Firebase ready', e);
      // Initialize anyway after short delay
      setTimeout(tryInit, 1000);
    });
    
    // Safety net: force initialization after 6 seconds no matter what
    setTimeout(() => {
      if (!this.isInitialized) {
        logger.warn('[AuthManager] Force initializing after timeout');
        tryInit();
      }
    }, 6000);
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
    // Kill switch: Firebase Auth disabled
    const { isOff } = await import('../runtime/switches');
    if (isOff('iauth')) {
      logger.info('[AuthManager] Disabled via kill switch (iauth:off)');
      // Provide stable "signed out" state to dependents
      this.currentUser = null;
      this.setStatus('unauthenticated');
      this.isInitialized = true;
      this.listeners.forEach(listener => listener(null));
      return;
    }
    
    if (this.isInitialized) {
      logger.debug('[AuthManager] Already initialized, skipping');
      return;
    }
    
    logger.log('[AuthManager] Starting initialization...');
    console.log('[AuthManager] Starting initialization - isInitialized:', this.isInitialized, 'authStateInitialized:', this.authStateInitialized);
    
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
          
          // ⚠️ FIXED: Reduced timeout from 60s to 10s to clear stuck redirecting state faster
          // If stuck in redirecting/resolving for >10s, reset to checking
          // This prevents users from being stuck on "redirecting to sign in" message
          if (timeSince > 10000) {
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
    // NOTE: authFlow.ts now handles getRedirectResult - this is a fallback for existing code
    // Use session guard to prevent loops
    try {
      const forcePopup = getAuthMode() === 'popup';
      
      // Only process if authFlow hasn't already handled it (check init done flag)
      const { isInitDone } = await import('./authGuard');
      if (isInitDone()) {
        // authFlow already processed redirect result, skip here
        logger.debug('Auth init already done - skipping redirect result check');
        // ⚠️ CRITICAL: Don't return early - we still need to set up onAuthStateChanged listener
        // Just skip the redirect result check and continue
      } else {
      
      // Handle redirect result exactly once
      if (hasRedirectStarted() && !forcePopup) {
        this.setStatus('resolving');
        
        // Debug logging: redirect return
        if (isAuthDebug()) {
          logAuth('redirect_return', {
            locationHref: typeof window !== 'undefined' ? window.location.href : 'unknown',
            documentReferrer: typeof document !== 'undefined' ? document.referrer : 'unknown',
            currentOrigin: safeOrigin(),
            authDomain: firebaseConfig.authDomain,
            windowTopEqualsWindow: typeof window !== 'undefined' ? window.top === window : false,
          });
        }
        
        try {
          const result = await getRedirectResult(auth as any);
          if (result?.user) {
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
            
            clearRedirectGuard();
            return;
          }
          
          // Empty result - redirect didn't complete
          authLogManager.log('redirect_result_empty', { hadGuard: hasRedirectStarted() });
          
          if (isAuthDebug()) {
            logAuth('redirect_result_empty', { hadGuard: hasRedirectStarted() });
          }
          
          // Show banner for failed redirect attempt
          window.dispatchEvent(new CustomEvent('auth:redirect-empty', {
            detail: {
              message: 'Login didn\'t complete. Try popup sign-in.',
            }
          }));
          
          clearRedirectGuard(); // Reset guard to avoid loops
        } catch (e: any) {
          logger.error('Error checking redirect result', e);
          authLogManager.log('getRedirectResult_error', {
            error: e?.message || String(e),
            code: e?.code || 'unknown',
          });
          
          if (isAuthDebug()) {
            logAuth('redirect_result_error', {
              code: e?.code,
              message: e?.message?.slice?.(0, 140),
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
          clearRedirectGuard();
        }
      } else if (!hasRedirectStarted()) {
        logger.debug('No redirect guard present - skipping getRedirectResult');
        if (isAuthDebug()) {
          logAuth('no_redirect_guard', {});
        }
      }
      }
    } catch (e) {
      // ignore
      clearRedirectGuard();
    }
    
    // Log Firebase init complete (auth manager initialized)
    // Note: firebaseReady_resolved_at is logged separately in main.tsx
    authLogManager.log('firebase_init_complete', {
      timestamp: new Date().toISOString(),
    });
    
    // Listen for auth state changes
    // Note: This is the ONLY onAuthStateChanged listener in the app
    // All other code must use authManager.subscribe() instead
    let listenerFired = false;
    
    // ⚠️ CRITICAL FIX: Check current user immediately to avoid waiting for onAuthStateChanged
    // onAuthStateChanged should fire immediately, but if it doesn't, we check manually
    const currentFirebaseUser = auth.currentUser;
    if (currentFirebaseUser) {
      logger.log('[AuthManager] Found existing Firebase Auth user on init:', currentFirebaseUser.uid);
      // Manually trigger the callback logic
      setTimeout(() => {
        if (!listenerFired) {
          logger.log('[AuthManager] Manually triggering auth state check for existing user');
          // This will be handled by onAuthStateChanged, but we ensure it fires
        }
      }, 100);
    }
    
    // Safety timeout: if onAuthStateChanged never fires, force initialization after 3 seconds (reduced from 5)
    const initTimeout = setTimeout(() => {
      if (!this.authStateInitialized) {
        logger.warn('[AuthManager] onAuthStateChanged timeout - forcing initialization after 3s');
        this.authStateInitialized = true;
        this.setStatus('unauthenticated');
        // Notify listeners with null user
        this.listeners.forEach(listener => listener(null));
      }
    }, 3000); // Reduced from 5000 to 3000
    
    // ⚠️ CRITICAL: onAuthStateChanged should fire immediately with current state
    // If it doesn't fire within 500ms, manually initialize (no user = unauthenticated)
    // This fixes the 10-second timeout by initializing immediately
    const immediateCheck = setTimeout(() => {
      logger.log('[AuthManager] immediateCheck timeout fired - listenerFired:', listenerFired, 'authStateInitialized:', this.authStateInitialized);
      if (!listenerFired && !this.authStateInitialized) {
        logger.warn('[AuthManager] onAuthStateChanged did not fire immediately - initializing manually');
        const user = auth.currentUser;
        if (user) {
          logger.log('[AuthManager] Found user but onAuthStateChanged did not fire - manually processing');
          // Manually process the user
          const authUser = this.convertFirebaseUser(user);
          this.currentUser = authUser;
          this.setStatus('authenticated');
          this.authStateInitialized = true;
          this.listeners.forEach(listener => listener(authUser));
        } else {
          // No user - initialize as unauthenticated immediately
          logger.log('[AuthManager] No user found - initializing as unauthenticated');
          this.authStateInitialized = true;
          this.setStatus('unauthenticated');
          this.listeners.forEach(listener => listener(null));
        }
      }
    }, 500); // Reduced from 1000ms to 500ms for faster initialization
    
    logger.log('[AuthManager] Setting up onAuthStateChanged listener...');
    onAuthStateChanged(auth as any, async (user) => {
      logger.log('[AuthManager] onAuthStateChanged CALLBACK FIRED - user:', user ? user.uid : 'null');
      try {
        listenerFired = true;
        clearTimeout(initTimeout);
        clearTimeout(immediateCheck);
        
        // ⚠️ DEBUG: Log Firebase Auth user object BEFORE conversion
        if (user) {
          logger.log('[onAuthStateChanged] Firebase Auth User object:', {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            providerData: user.providerData?.map((p: any) => ({ providerId: p.providerId, displayName: p.displayName }))
          });
        }
        
        const authUser = user ? this.convertFirebaseUser(user) : null;
        
        // ⚠️ DEBUG: Log converted AuthUser
        if (authUser) {
          logger.log('[onAuthStateChanged] Converted AuthUser:', {
            uid: authUser.uid,
            email: authUser.email,
            displayName: authUser.displayName
          });
        }
        
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
        
        // ⚠️ CRITICAL FIX: Mark as initialized IMMEDIATELY to unblock UI
        // Don't wait for Firestore operations - they can happen in background
        const isFirstInit = !this.authStateInitialized;
        if (isFirstInit) {
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
        
        // ⚠️ CRITICAL: Notify listeners IMMEDIATELY so UI can render
        // This fixes the 10-second timeout issue
        this.listeners.forEach(listener => listener(authUser));
        
        // ⚠️ FIXED: Do Firestore operations in background (non-blocking)
        // This prevents slow initialization - UI can render while data loads
        // ⚠️ FIXED: Only notify once after all operations complete to prevent triple notification cascade
        if (authUser) {
          // Fire and forget - don't block on these operations
          Promise.all([
            this.ensureUserDocument(authUser),
            Promise.resolve().then(() => {
              firebaseSyncManager.init();
              return firebaseSyncManager.loadFromFirebase(authUser.uid);
            })
          ]).then(() => {
            // Small delay to ensure Firestore write is readable
            return new Promise(resolve => setTimeout(resolve, 100));
          }).then(() => {
            // ⚠️ FIXED: Only notify once after all operations complete
            // Removed duplicate notification - debouncing in useUsername handles retries
            // This prevents triple notification cascade (immediate + after doc + on error)
            logger.log('[AuthManager] Firestore operations completed - notifying listeners once');
            this.listeners.forEach(listener => listener(authUser));
          }).catch((error) => {
            logger.error('[AuthManager] Error in background Firestore operations:', error);
            // ⚠️ FIXED: Don't notify on error - let retry logic handle it
            // The immediate notification above is sufficient for UI rendering
            // useUsername debouncing will retry if needed
          });
        }
      } catch (error) {
        logger.error('[AuthManager] Error in onAuthStateChanged callback:', error);
        // Even on error, mark as initialized to prevent infinite loading
        if (!this.authStateInitialized) {
          this.authStateInitialized = true;
          this.setStatus('unauthenticated');
          this.listeners.forEach(listener => listener(null));
        }
      }
    });
    
    this.isInitialized = true;
  }

  private convertFirebaseUser(user: User): AuthUser {
    // ⚠️ CRITICAL FIX: Check providerData for fresh displayName
    // Firebase Auth user.displayName can be stale - providerData has fresh data from Google
    const googleProvider = user.providerData?.find((p: any) => p.providerId === 'google.com');
    const freshDisplayName = googleProvider?.displayName || user.displayName;
    
    logger.log('[convertFirebaseUser] displayName sources:', {
      userDisplayName: user.displayName,
      providerDisplayName: googleProvider?.displayName,
      using: freshDisplayName
    });
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: freshDisplayName, // Use fresh data from provider, not stale cache
      photoURL: user.photoURL,
    };
  }

  private async ensureUserDocument(authUser: AuthUser): Promise<void> {
    const userRef = doc(db, 'users', authUser.uid);
    const userSnap = await getDoc(userRef);
    
    // ⚠️ CRITICAL FIX: Reload user from Firebase Auth to get fresh data from Google
    // Firebase Auth caches displayName - we need to force reload from provider
    let freshAuthUser = authUser;
    try {
      const { reload } = await import('firebase/auth');
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        await reload(firebaseUser);
        // Get fresh data after reload
        const freshDisplayName = firebaseUser.providerData?.find((p: any) => p.providerId === 'google.com')?.displayName || firebaseUser.displayName;
        if (freshDisplayName && freshDisplayName !== authUser.displayName) {
          logger.log('[ensureUserDocument] Reloaded user - displayName changed:', {
            old: authUser.displayName,
            new: freshDisplayName
          });
          freshAuthUser = {
            ...authUser,
            displayName: freshDisplayName
          };
        }
      }
    } catch (error) {
      logger.warn('[ensureUserDocument] Failed to reload user (non-critical):', error);
      // Continue with existing data if reload fails
    }
    
    // ⚠️ DEBUG: Log what we're getting from Firebase Auth
    logger.log('[ensureUserDocument] Firebase Auth displayName:', freshAuthUser.displayName);
    logger.log('[ensureUserDocument] Firebase Auth user:', { 
      uid: freshAuthUser.uid, 
      email: freshAuthUser.email, 
      displayName: freshAuthUser.displayName 
    });
    
    if (!userSnap.exists()) {
      // Create new user document
      const userDoc: UserDocument = {
        uid: freshAuthUser.uid,
        email: freshAuthUser.email || '',
        displayName: freshAuthUser.displayName || '', // Top-level - always from Firebase Auth (reloaded)
        photoURL: freshAuthUser.photoURL,
        lastLoginAt: new Date().toISOString(),
        profile: {
          email: freshAuthUser.email || '',
          displayName: freshAuthUser.displayName || '', // Profile - always from Firebase Auth (reloaded)
          photoURL: freshAuthUser.photoURL || '',
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
      logger.log('Created new user document', freshAuthUser.uid, { displayName: userDoc.displayName });
    } else {
      // ⚠️ CRITICAL FIX: displayName ALWAYS comes from Firebase Auth (Google/Apple)
      // NEVER preserve existing displayName - it might be stale or wrong (like "sivarT")
      // Username is separate and stored in settings.username
      // displayName is shown on sign-in button, username is used in greetings
      
      const existingData = userSnap.data();
      logger.log('[ensureUserDocument] Existing Firestore data:', {
        topLevelDisplayName: existingData?.displayName,
        profileDisplayName: existingData?.profile?.displayName,
        settingsUsername: existingData?.settings?.username
      });
      
      // ALWAYS use Firebase Auth displayName (reloaded) - NEVER from Firestore
      const displayNameToUse = freshAuthUser.displayName || '';
      
      logger.log('[ensureUserDocument] Using displayName from Firebase Auth (reloaded):', displayNameToUse);
      
      // ⚠️ CRITICAL: Update BOTH top-level AND profile.displayName
      // Use setDoc with merge to ensure we overwrite stale data
      await setDoc(userRef, {
        uid: freshAuthUser.uid,
        email: freshAuthUser.email || '',
        displayName: displayNameToUse, // Top-level - ALWAYS from Firebase Auth (reloaded)
        photoURL: freshAuthUser.photoURL,
        lastLoginAt: serverTimestamp(),
        profile: {
          email: freshAuthUser.email || '',
          displayName: displayNameToUse, // Profile - ALWAYS from Firebase Auth (reloaded)
          photoURL: freshAuthUser.photoURL || '',
        },
      }, { merge: true }); // Merge preserves settings and watchlists
      
      logger.log('Updated user document', freshAuthUser.uid, { 
        displayName: displayNameToUse,
        source: 'Firebase Auth (Google/Apple) - reloaded',
        note: 'displayName ALWAYS from Firebase Auth (reloaded), username stored separately in settings.username'
      });
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
   * Manually check and update auth state
   * Useful when onAuthStateChanged doesn't fire (e.g., after popup login)
   * This replicates the logic from onAuthStateChanged callback
   */
  async checkAuthState(): Promise<void> {
    try {
      const { auth } = await import('./firebaseBootstrap');
      const firebaseUser = auth.currentUser;
      
      if (firebaseUser) {
        const authUser = this.convertFirebaseUser(firebaseUser);
        const wasAuthenticated = !!this.currentUser;
        
        // Only update if state changed
        if (!wasAuthenticated || this.currentUser?.uid !== authUser.uid) {
          logger.log('[AuthManager] Manual auth state check: user found', { 
            uid: authUser.uid, 
            email: authUser.email 
          });
          
          this.currentUser = authUser;
          this.setStatus('authenticated');
          
          // Mark as initialized if not already
          if (!this.authStateInitialized) {
            this.authStateInitialized = true;
            logger.log('[AuthManager] Auth state initialized via manual check');
          }
          
          // Create/update user document (same as onAuthStateChanged)
          try {
            await this.ensureUserDocument(authUser);
          } catch (e) {
            logger.warn('[AuthManager] Failed to ensure user document in manual check:', e);
          }
          
          // Notify listeners
          this.listeners.forEach(listener => listener(authUser));
        }
      } else if (this.currentUser) {
        // User was logged out
        logger.log('[AuthManager] Manual auth state check: no user');
        this.currentUser = null;
        this.setStatus('unauthenticated');
        
        if (!this.authStateInitialized) {
          this.authStateInitialized = true;
        }
        
        this.listeners.forEach(listener => listener(null));
      }
    } catch (error) {
      logger.error('[AuthManager] Error in manual auth state check:', error);
    }
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
