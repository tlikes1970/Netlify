/**
 * Process: Onboarding State Management
 * Purpose: Single source of truth for onboarding completion status
 * Data Source: localStorage (flicklet.onboardingCompleted) + user authentication state
 * Update Path: setOnboardingCompleted() when user completes or skips onboarding
 * Dependencies: useAuth hook for authentication state
 * 
 * IMPORTANT: Onboarding completion is stored in localStorage (not Firestore) because:
 * - It needs to be available immediately on page load
 * - It's device-specific (user might want to see onboarding on a new device)
 * - For signed-in users, we also check auth state to prevent showing welcome to returning users
 */

const ONBOARDING_KEY = "flicklet.onboardingCompleted";

/**
 * Get onboarding completion status from localStorage
 * This is the device-specific flag
 */
export const getOnboardingCompleted = (): boolean => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      console.log("[Onboarding] No window/localStorage, returning false");
      return false; // In SSR or no localStorage, show onboarding
    }
    const value = localStorage.getItem(ONBOARDING_KEY);
    const completed = value === "true";
    console.log(
      "[Onboarding] Checked localStorage:",
      ONBOARDING_KEY,
      "=",
      value,
      "completed:",
      completed
    );
    return completed;
  } catch (error) {
    console.log("[Onboarding] localStorage error, returning false:", error);
    return false; // Default to NOT completed if localStorage fails (safer for onboarding)
  }
};

/**
 * Mark onboarding as completed
 * Stores flag in localStorage
 */
export const setOnboardingCompleted = (): void => {
  try {
    localStorage.setItem(ONBOARDING_KEY, "true");
    console.log("[Onboarding] Marked as completed in localStorage");
  } catch {
    // Silently fail if localStorage is unavailable
  }
};

/**
 * Check if onboarding should be shown
 * Returns false (don't show) if:
 * - User is authenticated AND onboarding was completed (returning user)
 * - Onboarding was completed on this device
 * 
 * Returns true (show) if:
 * - User is not authenticated AND onboarding not completed (new user)
 * - User is authenticated but onboarding not completed (newly signed-in user)
 */
export const shouldShowOnboarding = (isAuthenticated: boolean): boolean => {
  const completed = getOnboardingCompleted();
  
  // If user is authenticated and onboarding was completed, they're a returning user
  // Don't show onboarding again
  if (isAuthenticated && completed) {
    console.log("[Onboarding] User is authenticated and onboarding completed - don't show");
    return false;
  }
  
  // If onboarding was completed on this device, don't show again
  if (completed) {
    console.log("[Onboarding] Onboarding completed on this device - don't show");
    return false;
  }
  
  // Otherwise, show onboarding
  console.log("[Onboarding] Should show onboarding - not completed yet");
  return true;
};

export const getSearchTipDismissed = (): boolean => {
  try {
    return localStorage.getItem("flicklet.searchTipDismissed") === "true";
  } catch {
    return false;
  }
};

export const setSearchTipDismissed = (): void => {
  try {
    localStorage.setItem("flicklet.searchTipDismissed", "true");
  } catch {
    // Silently fail if localStorage is unavailable
  }
};
