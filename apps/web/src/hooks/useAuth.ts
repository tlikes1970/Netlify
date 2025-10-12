import { useState, useEffect } from 'react';
import { authManager } from '../lib/auth';
import type { AuthUser, AuthProvider } from '../lib/auth.types';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    const initialUser = authManager.getCurrentUser();
    setUser(initialUser);
    setLoading(false);

    // Subscribe to auth state changes
    const unsubscribe = authManager.subscribe((authUser) => {
      setUser(authUser);
      setLoading(false);
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
    signInWithProvider,
    signInWithEmail,
    signOut,
    isAuthenticated: !!user,
  };
}
