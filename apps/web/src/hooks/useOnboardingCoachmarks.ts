/**
 * Hook to manage onboarding coachmark flow
 * 
 * Onboarding gating: Only shows for users who haven't completed onboarding
 * Config: onboarding.ts - shouldShowOnboarding()
 */

import { useState, useCallback, useEffect } from "react";
import {
  getOnboardingCompleted,
  setOnboardingCompleted,
  shouldShowOnboarding,
} from "@/lib/onboarding";
import { useAuth } from "@/hooks/useAuth";
import type { OnboardingStep } from "@/lib/onboarding.types";

export function useOnboardingCoachmarks() {
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState<OnboardingStep>(() => {
    // Initial check: don't show if already completed
    const completed = getOnboardingCompleted();
    const initialStep = completed ? "none" : "welcome";
    console.log(
      "[Onboarding] Hook initialized, completed:",
      completed,
      "step:",
      initialStep
    );
    return initialStep;
  });

  // Update step when auth state changes
  // If user signs in and onboarding was completed, hide onboarding
  useEffect(() => {
    if (!shouldShowOnboarding(isAuthenticated)) {
      if (step !== "none") {
        console.log("[Onboarding] Hiding onboarding - user is authenticated and completed");
        setStep("none");
      }
    }
  }, [isAuthenticated, step]);

  const completeOnboarding = useCallback(() => {
    setOnboardingCompleted();
    setStep("none");
    // Dispatch event to notify that onboarding is complete
    window.dispatchEvent(new CustomEvent("onboarding:completed"));
  }, []);

  const skipOnboarding = completeOnboarding;

  // Only active if step is not "none" AND should show onboarding
  const isActive = step !== "none" && shouldShowOnboarding(isAuthenticated);

  return { step, setStep, completeOnboarding, skipOnboarding, isActive };
}
