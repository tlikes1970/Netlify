/**
 * Hook to manage onboarding coachmark flow
 */

import { useState, useCallback } from "react";
import {
  getOnboardingCompleted,
  setOnboardingCompleted,
} from "@/lib/onboarding";
import type { OnboardingStep } from "@/lib/onboarding.types";

export function useOnboardingCoachmarks() {
  const [step, setStep] = useState<OnboardingStep>(() => {
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

  const completeOnboarding = useCallback(() => {
    setOnboardingCompleted();
    setStep("none");
    // Dispatch event to notify that onboarding is complete
    window.dispatchEvent(new CustomEvent("onboarding:completed"));
  }, []);

  const skipOnboarding = completeOnboarding;

  const isActive = step !== "none";

  return { step, setStep, completeOnboarding, skipOnboarding, isActive };
}
