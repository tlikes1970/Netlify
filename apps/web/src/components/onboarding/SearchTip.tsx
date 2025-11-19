/**
 * Process: Search Micro-Tip
 * Purpose: Show a small tip bubble pointing to the + button during onboarding
 * Data Source: localStorage (flicklet.searchTipDismissed)
 * Update Path: User dismisses tip or adds a show
 * Dependencies: onboarding.ts helpers
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getSearchTipDismissed,
  setSearchTipDismissed,
  getOnboardingCompleted,
} from "@/lib/onboarding";

interface SearchTipProps {
  targetRef: React.RefObject<HTMLElement>;
  onDismiss?: () => void;
}

export default function SearchTip({ targetRef, onDismiss }: SearchTipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isInAddShowStep, setIsInAddShowStep] = useState(false);
  const tipRef = useRef<HTMLDivElement>(null);

  const handleDismiss = useCallback(() => {
    setSearchTipDismissed();
    setVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  useEffect(() => {
    // Only show tip if onboarding is active (not completed) and we're in addShow step
    if (getSearchTipDismissed() || getOnboardingCompleted()) {
      setIsInAddShowStep(false);
      return;
    }

    // Listen for addShow step entry
    const handleEnteredAddShowStep = () => {
      setIsInAddShowStep(true);
    };

    window.addEventListener(
      "onboarding:entered-addShow-step",
      handleEnteredAddShowStep
    );

    // Initially assume we're not in addShow step - wait for the event
    setIsInAddShowStep(false);

    // Handle dismissal event
    const handleDismissEvent = () => {
      handleDismiss();
    };

    window.addEventListener(
      "onboarding:searchTipDismissed",
      handleDismissEvent
    );

    // Wait for target element to be available
    const checkTarget = () => {
      if (targetRef.current) {
        const rect = targetRef.current.getBoundingClientRect();
        setPosition({
          top: rect.top - 60, // Position above the button
          left: rect.left + rect.width / 2 - 100, // Center above button
        });
        setVisible(true);
      } else {
        // Retry after a short delay
        setTimeout(checkTarget, 100);
      }
    };

    checkTarget();

    return () => {
      window.removeEventListener(
        "onboarding:searchTipDismissed",
        handleDismissEvent
      );
      window.removeEventListener(
        "onboarding:entered-addShow-step",
        handleEnteredAddShowStep
      );
    };
  }, [targetRef, handleDismiss]);

  if (
    !visible ||
    !isInAddShowStep ||
    getSearchTipDismissed() ||
    getOnboardingCompleted()
  ) {
    return null;
  }

  return (
    <div
      ref={tipRef}
      className="fixed z-50 pointer-events-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)",
      }}
    >
      <div
        className="relative bg-accent text-white rounded-lg px-4 py-2 shadow-lg"
        style={{
          backgroundColor: "var(--accent)",
          color: "white",
          minWidth: "200px",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Tap + to add it to Your Shows</p>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Dismiss tip"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {/* Arrow pointing down */}
        <div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full"
          style={{
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: `8px solid var(--accent)`,
          }}
        />
      </div>
    </div>
  );
}
