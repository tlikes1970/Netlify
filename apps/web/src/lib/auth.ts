import { 
  signInWithRedirect, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getRedirectResult,
  User
} from 'firebase/auth';
import { isMobileNow } from './isMobile';

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
    console.log('🚫 PWA standalone mode detected - Google OAuth is blocked');
  }
  
  if (isInAppBrowser) {
    console.log('🚫 In-app browser detected - Google OAuth is blocked');
  }
  
  return isStandalone || isInAppBrowser;
}
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, googleProvider, appleProvider } from './firebase';
import { firebaseSyncManager } from './firebaseSync';
import type { AuthUser, UserDocument, UserSettings, AuthProvider } from './auth.types';

class AuthManager {
  private currentUser: AuthUser | null = null;
  private listeners: Set<(user: AuthUser | null) => void> = new Set();
  private isInitialized = false;
  private authStateInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (this.isInitialized) return;
    
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
      
      console.log('🔍 Checking for redirect result...');
      console.log('🔍 IMMEDIATE snapshot:', {
        href: currentHref,
        hash: currentHash,
        search: currentSearch
      });
      
      // DEBUG: Check sessionStorage for Firebase auth state
      console.log('🔍 Checking sessionStorage for Firebase auth state...');
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('firebase') || key.includes('auth') || key.includes('redirect'))) {
          console.log(`🔍 sessionStorage[${key}]:`, sessionStorage.getItem(key));
        }
      }
      
      // Check if there's a pending redirect (means redirect started but didn't complete)
      const pendingRedirectKeys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.includes('pendingRedirect')) {
          pendingRedirectKeys.push(key);
          console.error('🚨 FIREBASE HAS A PENDING REDIRECT!', key);
          console.error('  This means:');
          console.error('    1. Redirect started successfully');
          console.error('    2. Google authentication completed');
          console.error('    3. BUT Firebase handler did NOT redirect back to app with auth data');
          console.error('');
          console.error('  🔧 Clearing the pending redirect flag...');
          sessionStorage.removeItem(key);
          console.log('  ✅ Cleared. The flag will be set again on next sign-in attempt.');
        }
      }
      
      if (pendingRedirectKeys.length === 0) {
        console.log('✅ No pending redirect flags - app is in a clean state');
      }
      
      console.log('🔍 window.location.href:', window.location.href);
      console.log('🔍 window.location.search:', window.location.search);
      console.log('🔍 window.location.hash:', window.location.hash);
      
      // Check if URL suggests we're returning from a redirect
      const hasAuthParams = window.location.hash || window.location.search;
      if (hasAuthParams) {
        console.log('🔍 URL contains auth parameters, this might be a redirect return');
        
        // Parse hash for Firebase auth errors
        if (window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const error = hashParams.get('error');
          const errorCode = hashParams.get('error_code');
          const errorDescription = hashParams.get('error_description');
          if (error) {
            console.error('❌ Firebase auth error in URL:', { error, errorCode, errorDescription });
            
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
      
      if (result && result.user) {
        console.log('✅ Redirect sign-in successful:', {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        });
        // The user is now signed in, onAuthStateChanged will fire and handle the rest
      } else {
        console.log('ℹ️ No redirect result returned from Firebase');
        
        // DEBUG: Try one more time after a short delay in case there's a timing issue
        console.log('🔄 Retrying getRedirectResult after 500ms...');
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryResult = await getRedirectResult(auth);
        if (retryResult && retryResult.user) {
          console.log('✅ Redirect sign-in successful on retry:', {
            uid: retryResult.user.uid,
            email: retryResult.user.email
          });
        } else {
          console.log('❌ Still no redirect result after retry');
          
          if (hasAuthParams) {
            console.warn('⚠️ URL has auth parameters but getRedirectResult returned nothing - this might indicate a misconfiguration');
          }
        }
      }
    } catch (error) {
      console.error('❌ Error checking redirect result:', error);
      // Continue initialization even if redirect check fails
    }
    
    // Listen for auth state changes
    onAuthStateChanged(auth, async (user) => {
      const authUser = user ? this.convertFirebaseUser(user) : null;
      
      // Update current user
      this.currentUser = authUser;
      
      // Mark auth state as initialized after first Firebase callback
      if (!this.authStateInitialized) {
        this.authStateInitialized = true;
        console.log('🔐 Auth state initialized:', { 
          hasUser: !!authUser, 
          uid: authUser?.uid,
          email: authUser?.email
        });
      } else {
        console.log('🔐 Auth state changed:', { 
          hasUser: !!authUser, 
          uid: authUser?.uid,
          email: authUser?.email
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
      console.log('✅ Created new user document:', authUser.uid);
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
      console.log('✅ Updated user document:', authUser.uid);
    }
  }

  async signInWithProvider(provider: AuthProvider): Promise<void> {
    try {
      switch (provider) {
        case 'google':
          await this.signInWithGoogle();
          break;
        case 'apple':
          await this.signInWithApple();
          break;
        case 'email':
          throw new Error('Email sign-in requires email/password');
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    } catch (error) {
      console.error(`❌ ${provider} sign-in failed:`, error);
      throw error;
    }
  }

  private async signInWithGoogle(): Promise<void> {
    const isMobile = isMobileNow();
    const isBlocked = isBlockedOAuthContext();
    
    console.log('🚀 Starting Google sign-in...', { 
      isMobile, 
      isBlocked,
      userAgent: navigator.userAgent,
      displayMode: (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ? 'standalone' : 'browser'
    });
    
    if (isBlocked) {
      console.error('🚫 Google sign-in attempted in blocked context (PWA standalone or in-app browser)');
      throw new Error('OAUTH_BLOCKED');
    }
    
    // Use redirect for both mobile and desktop to avoid popup blocking issues
    console.log('📱 Using redirect flow for Google sign-in');
    try {
      await signInWithRedirect(auth, googleProvider);
      console.log('✅ Redirect initiated - page will reload after sign-in');
      // Note: This will redirect the page to Google. The redirect result will be handled
      // when the page loads after returning from Google.
    } catch (error: any) {
      console.error('❌ Google redirect sign-in failed:', error);
      
      // Check for common configuration errors
      if (error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized')) {
        console.error('🚫 Configuration Error: localhost:8888 is not an authorized domain');
        console.error('📝 To fix: Go to Google Cloud Console → APIs & Services → Credentials');
        console.error('📝 Add these authorized redirect URIs:');
        console.error('   - http://localhost:8888');
        console.error('   - http://localhost:8888/__/auth/handler');
      }
      
      throw error;
    }
  }

  private async signInWithApple(): Promise<void> {
    // Apple always uses redirect
    await signInWithRedirect(auth, appleProvider);
  }

  async signInWithEmail(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist, create account
        await createUserWithEmailAndPassword(auth, email, password);
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
      
      console.log('🧹 Cleared local data on sign-out for privacy');
    } catch (error) {
      console.error('❌ Failed to clear local data:', error);
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
      console.error('❌ Failed to get user settings:', error);
      return null;
    }
  }

  async updateUserSettings(uid: string, settings: Partial<UserSettings>): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        settings: settings,
      });
      console.log('✅ Updated user settings:', settings);
    } catch (error) {
      console.error('❌ Failed to update user settings:', error);
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
