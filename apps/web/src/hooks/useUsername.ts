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
        const settings = await authManager.getUserSettings(currentUser.uid);
        if (settings) {
          const usernameValue = settings.username || "";
          const promptedValue = settings.usernamePrompted || false;

          usernameStateManager.setUsernamePrompted(promptedValue);

          usernameStateManager.setUsername(usernameValue);
          console.log("✅ Username loaded:", {
            username: usernameValue,
            prompted: promptedValue,
          });
        }
      } catch (error) {
        console.error("Failed to load username:", error);
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
      await authManager.updateUserSettings(currentUser.uid, {
        usernamePrompted: true,
      });

      usernameStateManager.setUsernamePrompted(true);
      console.log("✅ Username prompt skipped");
    } catch (error) {
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
