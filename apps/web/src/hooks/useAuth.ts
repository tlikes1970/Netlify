import { useState, useEffect } from 'react';
import { authManager } from '../lib/auth';
import type { AuthUser, AuthProvider } from '../lib/auth.types';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [status, setStatus] = useState<string>('idle');

  useEffect(() => {
    // Get initial user
    const initialUser = authManager.getCurrentUser();
    setUser(initialUser);
    
    // Get initial status immediately (includes restored status from localStorage)
    const initialStatus = authManager.getStatus();
    setStatus(initialStatus);
    
    // Check if auth state is already initialized
    const isInitialized = authManager.isAuthStateInitialized();
    setAuthInitialized(isInitialized);
    
    // If auth is already initialized, we can stop loading
    if (isInitialized) {
      setLoading(false);
    }

    // Subscribe to auth state changes
    const unsubscribe = authManager.subscribe((authUser) => {
      setUser(authUser);
      
      // Update status from auth manager
      const currentStatus = authManager.getStatus();
      setStatus(currentStatus);
      
      // Check if auth state is now initialized
      const isInitialized = authManager.isAuthStateInitialized();
      setAuthInitialized(isInitialized);
      
      // Only stop loading once auth state is initialized
      if (isInitialized) {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signInWithProvider = async (provider: AuthProvider) => {
    try {
      await authManager.signInWithProvider(provider);
    } catch (error) {
      console.error('Sign-in failed:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await authManager.signInWithEmail(email, password);
    } catch (error) {
      console.error('Email sign-in failed:', error);
      throw error;
    }
  };

  const createAccountWithEmail = async (email: string, password: string) => {
    try {
      await authManager.createAccountWithEmail(email, password);
    } catch (error) {
      console.error('Account creation failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authManager.signOut();
    } catch (error) {
      console.error('Sign-out failed:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    authInitialized,
    signInWithProvider,
    signInWithEmail,
    createAccountWithEmail,
    signOut,
    isAuthenticated: !!user,
    status,
  };
}
