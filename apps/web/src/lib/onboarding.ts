/**
 * Onboarding state management
 * Stores completion status in localStorage (not Firestore)
 */

const ONBOARDING_KEY = "flicklet.onboardingCompleted";

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

export const setOnboardingCompleted = (): void => {
  try {
    localStorage.setItem(ONBOARDING_KEY, "true");
  } catch {
    // Silently fail if localStorage is unavailable
  }
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
