/**
 * Onboarding state management
 * Stores completion status in localStorage (not Firestore)
 */

const ONBOARDING_KEY = "flicklet.onboardingCompleted";

export const getOnboardingCompleted = (): boolean => {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  } catch {
    return true; // Default to completed if localStorage fails
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
