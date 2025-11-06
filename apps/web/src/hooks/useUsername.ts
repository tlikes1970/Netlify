import { useState, useEffect, useCallback } from "react";
import { updateProfile } from "firebase/auth";
import { auth } from "../lib/firebaseBootstrap";
import { authManager } from "../lib/auth";
// import type { UserSettings } from '../lib/auth.types'; // Unused

// Create a simple state manager for username
class UsernameStateManager {
  private username: string = "";
  private usernamePrompted: boolean = false;
  private loading: boolean = true;
  skipInProgress: boolean = false; // Public to allow skipUsernamePrompt to set it
  private subscribers: Set<() => void> = new Set();

  getState() {
    return {
      username: this.username,
      usernamePrompted: this.usernamePrompted,
      loading: this.loading,
    };
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
    this.subscribers.forEach((callback) => callback());
  }
}

const usernameStateManager = new UsernameStateManager();

export function useUsername() {
  const [state, setState] = useState(() => usernameStateManager.getState());
  const [firebaseUser, setFirebaseUser] = useState(auth.currentUser);

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
      // Don't reload if skip is in progress (prevents overwriting optimistic state)
      if (usernameStateManager.skipInProgress) {
        console.log("⏸️ Skipping loadUsername - skip in progress");
        // Still set loading to false so modal can show if needed
        usernameStateManager.setLoading(false);
        return;
      }

      const currentUser = authManager.getCurrentUser();
      console.log("🔄 Loading username for user:", currentUser?.uid);

      if (!currentUser?.uid) {
        // User not logged in - reset state
        console.log("❌ No user, resetting state");
        usernameStateManager.setUsername("");
        usernameStateManager.setUsernamePrompted(false);
        usernameStateManager.setLoading(false);
        return;
      }

      try {
        const loadStartTime = performance.now();
        const settings = await authManager.getUserSettings(currentUser.uid);
        const loadTime = performance.now() - loadStartTime;
        
        if (settings) {
          const usernameValue = settings.username || "";
          const promptedValue = settings.usernamePrompted || false;

          // Only update if skip is not in progress (skip sets optimistic state)
          if (!usernameStateManager.skipInProgress) {
            usernameStateManager.setUsernamePrompted(promptedValue);
            usernameStateManager.setUsername(usernameValue);
            
            // Enhanced logging for investigation
            const logData = {
              username: usernameValue,
              prompted: promptedValue,
              loadTimeMs: Math.round(loadTime),
              timestamp: new Date().toISOString(),
              environment: window.location.hostname === 'localhost' ? 'localhost' : 'production',
            };
            console.log("✅ Username loaded:", logData);
            
            // Store in localStorage for investigation (production-safe, limited size)
            try {
              const existingLogs = JSON.parse(localStorage.getItem('flicklet.username.logs') || '[]');
              existingLogs.push(logData);
              // Keep only last 20 entries
              localStorage.setItem('flicklet.username.logs', JSON.stringify(existingLogs.slice(-20)));
            } catch (e) {
              // ignore storage errors
            }
          } else {
            console.log("⏸️ Skipping state update - skip in progress");
          }
        } else {
          console.warn("⚠️ No settings found for user:", currentUser.uid);
        }
      } catch (error) {
        console.error("Failed to load username:", error);
        // Log error for investigation
        try {
          const errorLog = {
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
            environment: window.location.hostname === 'localhost' ? 'localhost' : 'production',
          };
          const existingLogs = JSON.parse(localStorage.getItem('flicklet.username.errors') || '[]');
          existingLogs.push(errorLog);
          localStorage.setItem('flicklet.username.errors', JSON.stringify(existingLogs.slice(-10)));
        } catch (e) {
          // ignore
        }
      } finally {
        usernameStateManager.setLoading(false);
      }
    };

    loadUsername();

    // Subscribe to auth state changes
    const unsubscribe = authManager.subscribe((user) => {
      console.log("🔔 Auth subscription triggered:", {
        hasUser: !!user?.uid,
        uid: user?.uid,
      });
      setFirebaseUser(auth.currentUser);
      if (user?.uid) {
        // User logged in - reload username
        loadUsername();
      } else {
        // User logged out - reset state
        usernameStateManager.setUsername("");
        usernameStateManager.setUsernamePrompted(false);
        usernameStateManager.setLoading(false);
        setFirebaseUser(null);
      }
    });

    return unsubscribe;
  }, []);

  const updateUsername = async (newUsername: string): Promise<void> => {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) {
      throw new Error("No authenticated user");
    }

    // Get Firebase Auth user object for updateProfile
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      throw new Error("No Firebase Auth user");
    }

    try {
      // Update Firebase Auth profile first (this updates user.displayName)
      await updateProfile(firebaseUser, {
        displayName: newUsername,
      });
      console.log(
        "✅ Firebase Auth profile updated with displayName:",
        newUsername
      );

      // Then update Firestore settings
      await authManager.updateUserSettings(currentUser.uid, {
        username: newUsername,
        usernamePrompted: true,
      });

      usernameStateManager.setUsername(newUsername);
      usernameStateManager.setUsernamePrompted(true);
      console.log("✅ Username updated in settings:", newUsername);
    } catch (error) {
      console.error("Failed to update username:", error);
      throw error;
    }
  };

  const skipUsernamePrompt = async (): Promise<void> => {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) {
      throw new Error("No authenticated user");
    }

    try {
      // Set flag to prevent loadUsername from overwriting our optimistic state
      usernameStateManager.skipInProgress = true;
      
      // Optimistically update state immediately
      usernameStateManager.setUsernamePrompted(true);
      console.log("✅ Username prompt skipped (optimistic)");

      // Then persist to Firestore
      const writeStartTime = performance.now();
      await authManager.updateUserSettings(currentUser.uid, {
        usernamePrompted: true,
      });
      const writeTime = performance.now() - writeStartTime;

      console.log("✅ Username prompt skipped (persisted)", {
        writeTimeMs: Math.round(writeTime),
        timestamp: new Date().toISOString(),
      });
      
      // Clear flag after write completes + buffer (investigation: track actual write time)
      // If write takes >500ms, we may have issues on slow networks
      const clearDelay = Math.max(500, Math.round(writeTime * 1.5));
      if (writeTime > 500) {
        console.warn(`⚠️ Firestore write took ${Math.round(writeTime)}ms (longer than expected)`);
      }
      
      setTimeout(() => {
        usernameStateManager.skipInProgress = false;
        console.log("🔓 Skip flag cleared after", clearDelay, "ms");
      }, clearDelay);
    } catch (error) {
      // Clear flag on error so we can retry
      usernameStateManager.skipInProgress = false;
      console.error("Failed to skip username prompt:", error);
      throw error;
    }
  };

  const needsUsernamePrompt = useCallback((): boolean => {
    const currentUser = authManager.getCurrentUser();
    const result = !!(currentUser?.uid && !username && !usernamePrompted);
    console.log("🎯 needsUsernamePrompt check:", {
      hasUser: !!currentUser?.uid,
      username,
      usernamePrompted,
      result,
      currentUser: currentUser
        ? { uid: currentUser.uid, email: currentUser.email }
        : null,
    });
    return result;
  }, [username, usernamePrompted]);

  return {
    username,
    usernamePrompted,
    loading,
    user: firebaseUser, // Add reactive user reference
    updateUsername,
    skipUsernamePrompt,
    needsUsernamePrompt,
  };
}
