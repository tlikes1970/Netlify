import { useState, useEffect, useCallback } from 'react';
import { authManager } from '../lib/auth';
// import type { UserSettings } from '../lib/auth.types'; // Unused

// Create a simple state manager for username
class UsernameStateManager {
  private username: string = '';
  private usernamePrompted: boolean = false;
  private loading: boolean = true;
  private subscribers: Set<() => void> = new Set();

  getState() {
    return { username: this.username, usernamePrompted: this.usernamePrompted, loading: this.loading };
  }

  setUsername(username: string) {
    this.username = username;
    this.notifySubscribers();
  }

  setUsernamePrompted(prompted: boolean) {
    this.usernamePrompted = prompted;
    this.notifySubscribers();
  }

  setLoading(loading: boolean) {
    this.loading = loading;
    this.notifySubscribers();
  }

  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  }
}

const usernameStateManager = new UsernameStateManager();

export function useUsername() {
  const [state, setState] = useState(() => usernameStateManager.getState());

  useEffect(() => {
    const unsubscribe = usernameStateManager.subscribe(() => {
      setState(usernameStateManager.getState());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const { username, usernamePrompted, loading } = state;

  useEffect(() => {
    const loadUsername = async () => {
      const currentUser = authManager.getCurrentUser();
      console.log('🔄 Loading username for user:', currentUser?.uid);
      
      if (!currentUser?.uid) {
        // User not logged in - reset state
        console.log('❌ No user, resetting state');
        usernameStateManager.setUsername('');
        usernameStateManager.setUsernamePrompted(false);
        usernameStateManager.setLoading(false);
        return;
      }

      try {
        const settings = await authManager.getUserSettings(currentUser.uid);
        if (settings) {
          const usernameValue = settings.username || '';
          const promptedValue = settings.usernamePrompted || false;
          
          // If usernamePrompted is true but username is empty, reset the flag
          if (promptedValue && !usernameValue) {
            console.log('🔄 Resetting usernamePrompted flag - username is empty');
            await authManager.updateUserSettings(currentUser.uid, {
              usernamePrompted: false,
            });
            usernameStateManager.setUsernamePrompted(false);
            console.log('✅ Flag reset complete, username should trigger modal');
          } else {
            usernameStateManager.setUsernamePrompted(promptedValue);
          }
          
          usernameStateManager.setUsername(usernameValue);
          console.log('✅ Username loaded:', { username: usernameValue, prompted: promptedValue });
        }
      } catch (error) {
        console.error('Failed to load username:', error);
      } finally {
        usernameStateManager.setLoading(false);
      }
    };

    loadUsername();

    // Subscribe to auth state changes
    const unsubscribe = authManager.subscribe((user) => {
      console.log('🔔 Auth subscription triggered:', { hasUser: !!user?.uid, uid: user?.uid });
      if (user?.uid) {
        // User logged in - reload username
        loadUsername();
      } else {
        // User logged out - reset state
        usernameStateManager.setUsername('');
        usernameStateManager.setUsernamePrompted(false);
        usernameStateManager.setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const updateUsername = async (newUsername: string): Promise<void> => {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      await authManager.updateUserSettings(currentUser.uid, {
        username: newUsername,
        usernamePrompted: true,
      });
      
      usernameStateManager.setUsername(newUsername);
      usernameStateManager.setUsernamePrompted(true);
      console.log('✅ Username updated:', newUsername);
    } catch (error) {
      console.error('Failed to update username:', error);
      throw error;
    }
  };

  const skipUsernamePrompt = async (): Promise<void> => {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      await authManager.updateUserSettings(currentUser.uid, {
        usernamePrompted: true,
      });
      
      usernameStateManager.setUsernamePrompted(true);
      console.log('✅ Username prompt skipped');
    } catch (error) {
      console.error('Failed to skip username prompt:', error);
      throw error;
    }
  };

  const needsUsernamePrompt = useCallback((): boolean => {
    const currentUser = authManager.getCurrentUser();
    const result = !!(currentUser?.uid && !username && !usernamePrompted);
    console.log('🎯 needsUsernamePrompt check:', { 
      hasUser: !!currentUser?.uid, 
      username, 
      usernamePrompted,
      result,
      currentUser: currentUser ? { uid: currentUser.uid, email: currentUser.email } : null
    });
    return result;
  }, [username, usernamePrompted]);

  return {
    username,
    usernamePrompted,
    loading,
    updateUsername,
    skipUsernamePrompt,
    needsUsernamePrompt,
  };
}
