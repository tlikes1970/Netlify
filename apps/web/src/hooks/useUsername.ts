import { useState, useEffect, useCallback } from "react";
import { getFirebaseAuth, firebaseReady } from "../lib/firebaseBootstrap";
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
    // Always return a valid state object, never null
    return {
      username: this.username || "",
      usernamePrompted: this.usernamePrompted ?? false,
      loading: this.loading ?? true,
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
  const [firebaseIsReady, setFirebaseIsReady] = useState(false);

  useEffect(() => {
    firebaseReady.then(() => setFirebaseIsReady(true));
  }, []);

  // ⚠️ CRITICAL: All hooks must be called before any early returns
  // This ensures hooks are called in the same order on every render
  const [state, setState] = useState(() => {
    try {
      return usernameStateManager.getState();
    } catch (e) {
      console.error('[useUsername] Error getting initial state:', e);
      return { username: "", usernamePrompted: false, loading: true };
    }
  });
  
  const auth = getFirebaseAuth();
  const [firebaseUser, setFirebaseUser] = useState(() => {
    try {
      return auth.currentUser;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    // Only subscribe if Firebase is ready
    if (!firebaseIsReady) return;
    
    const unsubscribe = usernameStateManager.subscribe(() => {
      try {
        const newState = usernameStateManager.getState();
        if (newState) {
          setState(newState);
        }
      } catch (e) {
        console.error('[useUsername] Error updating state:', e);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [firebaseIsReady]);

  // ⚠️ CRITICAL: This useEffect must be called before any early return
  // It's guarded internally to only run when firebaseIsReady is true
  useEffect(() => {
    // Only run if Firebase is ready
    if (!firebaseIsReady) return;
    let isLoading = false; // Track if loadUsername is currently running
    
    const loadUsername = async () => {
      // Don't reload if skip is in progress (prevents overwriting optimistic state)
      if (usernameStateManager.skipInProgress) {
        console.log("⏸️ Skipping loadUsername - skip in progress");
        // Still set loading to false so modal can show if needed
        usernameStateManager.setLoading(false);
        return;
      }

      // Prevent concurrent calls
      if (isLoading) {
        console.log("⏸️ Skipping loadUsername - already loading");
        return;
      }

      isLoading = true;
      usernameStateManager.setLoading(true);

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
        
        // ⚠️ FIXED: Add retry logic for race condition
        // Document might not be readable immediately after creation (Firestore eventual consistency)
        let settings = null;
        let retries = 0;
        const maxRetries = 3;
        const retryDelay = 200; // ms
        
        while (!settings && retries < maxRetries) {
          settings = await authManager.getUserSettings(currentUser.uid);
          
          if (!settings && retries < maxRetries - 1) {
            // Document might not exist yet - wait and retry
            console.log(`⏳ Settings not found, retrying... (${retries + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retries++;
          } else {
            break;
          }
        }
        
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
              retries,
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
          // Document still doesn't exist after retries - might be a new user
          // Set defaults: no username, not prompted yet
          console.warn("⚠️ No settings found for user after retries:", currentUser.uid);
          if (!usernameStateManager.skipInProgress) {
            usernameStateManager.setUsername("");
            usernameStateManager.setUsernamePrompted(false);
          }
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
        isLoading = false;
        usernameStateManager.setLoading(false);
      }
    };

    // Do initial load
    const doInitialLoad = async () => {
      await loadUsername();
    };
    
    doInitialLoad();

    // Subscribe to auth state changes
    const unsubscribe = authManager.subscribe((user) => {
      console.log("🔔 Auth subscription triggered:", {
        hasUser: !!user?.uid,
        uid: user?.uid,
      });
      setFirebaseUser(auth.currentUser);
      if (user?.uid) {
        // User logged in - reload username
        // ⚠️ FIXED: Always reload username after sign-in, even if initial load is in progress
        // The initial load might be for a different user (or no user), so we need to reload
        if (!usernameStateManager.skipInProgress) {
          // Use a small delay to ensure Firestore document is created after sign-in
          setTimeout(() => {
            if (!isLoading) {
              loadUsername();
            } else {
              // If still loading, wait a bit more and try again
              setTimeout(() => {
                if (!isLoading) {
                  loadUsername();
                }
              }, 500);
            }
          }, 200);
        } else {
          console.log("⏸️ Skipping loadUsername from auth subscription - skip in progress");
        }
      } else {
        // User logged out - reset state
        usernameStateManager.setUsername("");
        usernameStateManager.setUsernamePrompted(false);
        usernameStateManager.setLoading(false);
        setFirebaseUser(null);
      }
    });

    return unsubscribe;
  }, [firebaseIsReady]);

  // Safely destructure with fallback values
  const { username, usernamePrompted, loading } = state || { username: "", usernamePrompted: false, loading: true };

  // ⚠️ CRITICAL: useCallback is a hook and must be called before any early return
  const needsUsernamePrompt = useCallback((): boolean => {
    if (!firebaseIsReady) return false;
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
  }, [firebaseIsReady, username, usernamePrompted]);

  // Early return AFTER all hooks are called
  if (!firebaseIsReady) {
    return { 
      loading: true, 
      username: "", 
      usernamePrompted: false, 
      needsUsernamePrompt,
      updateUsername: async () => {},
      skipUsernamePrompt: async () => {},
      user: null,
    };
  }

  const updateUsername = async (newUsername: string): Promise<void> => {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) {
      throw new Error("No authenticated user");
    }

    try {
      // ⚠️ CRITICAL: Only update Firestore settings.username
      // Do NOT touch Firebase Auth displayName - that comes from Google and should never be changed
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
