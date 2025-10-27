import { 
  signInWithPopup, 
  signInWithRedirect, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getRedirectResult,
  User
} from 'firebase/auth';
import { isMobileNow } from './isMobile';
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
      console.log('🔍 Checking for redirect result...');
      const result = await getRedirectResult(auth);
      
      if (result && result.user) {
        console.log('✅ Redirect sign-in successful:', {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        });
        // The user is now signed in, onAuthStateChanged will fire and handle the rest
      } else {
        console.log('ℹ️ No redirect result - not returning from sign-in');
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
    
    if (isMobile) {
      // Mobile: use redirect
      await signInWithRedirect(auth, googleProvider);
    } else {
      // Desktop: try popup first
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (error: any) {
        // Popup blocked, fallback to redirect
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
          console.log('🔄 Popup blocked, falling back to redirect');
          await signInWithRedirect(auth, googleProvider);
        } else {
          throw error;
        }
      }
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
