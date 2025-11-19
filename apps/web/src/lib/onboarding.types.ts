/**
 * Onboarding step types for coachmark flow
 */

export type OnboardingStep =
  | "welcome" // Bubble on Home
  | "search" // Bubble on Search input
  | "addShow" // Bubble on + button for a show in Search results
  | "homeDone" // Optional final bubble on Your Shows section
  | "help" // Final step pointing to help icon
  | "none";
