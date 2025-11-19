/**
 * Process: Onboarding Coachmarks
 * Purpose: Show numbered conversation bubbles that point at real UI elements
 * Data Source: useOnboardingCoachmarks hook
 * Update Path: User progresses through steps or skips
 * Dependencies: data-onboarding-id anchors in UI
 */

import { useState, useEffect } from "react";
import Portal from "@/components/Portal";
import { useOnboardingCoachmarks } from "@/hooks/useOnboardingCoachmarks";

export default function OnboardingCoachmarks() {
  const { step, setStep, completeOnboarding, skipOnboarding, isActive } =
    useOnboardingCoachmarks();
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [currentlyWatchingRect, setCurrentlyWatchingRect] =
    useState<DOMRect | null>(null);
  const [upNextRect, setUpNextRect] = useState<DOMRect | null>(null);

  // Find anchor element(s) based on current step
  useEffect(() => {
    if (!isActive) {
      setAnchorRect(null);
      setCurrentlyWatchingRect(null);
      setUpNextRect(null);
      return;
    }

    // For homeDone step, find both sections (with retry for timing issues)
    if (step === "homeDone") {
      const findAnchors = () => {
        const currentlyWatchingEl = document.querySelector(
          '[data-onboarding-id="currently-watching-section"]'
        ) as HTMLElement | null;
        const upNextEl = document.querySelector(
          '[data-onboarding-id="up-next-section"]'
        ) as HTMLElement | null;

        if (currentlyWatchingEl) {
          setCurrentlyWatchingRect(currentlyWatchingEl.getBoundingClientRect());
        } else {
          setCurrentlyWatchingRect(null);
        }
        if (upNextEl) {
          setUpNextRect(upNextEl.getBoundingClientRect());
        } else {
          setUpNextRect(null);
        }

        // Retry if elements not found (they might not be rendered yet)
        if (!currentlyWatchingEl || !upNextEl) {
          setTimeout(findAnchors, 100);
        }
      };

      // Try immediately, then retry if needed
      findAnchors();

      const updatePosition = () => {
        const updatedCurrentlyWatching = document.querySelector(
          '[data-onboarding-id="currently-watching-section"]'
        ) as HTMLElement | null;
        const updatedUpNext = document.querySelector(
          '[data-onboarding-id="up-next-section"]'
        ) as HTMLElement | null;
        if (updatedCurrentlyWatching) {
          setCurrentlyWatchingRect(
            updatedCurrentlyWatching.getBoundingClientRect()
          );
        }
        if (updatedUpNext) {
          setUpNextRect(updatedUpNext.getBoundingClientRect());
        }
      };

      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }

    // For other steps, use single anchor with retry mechanism
    let selector: string | null = null;
    if (step === "welcome") selector = '[data-onboarding-id="home-header"]';
    else if (step === "search")
      selector = '[data-onboarding-id="search-input"]';
    else if (step === "addShow")
      selector = '[data-onboarding-id="search-add-button"]';
    else if (step === "help") selector = '[data-role="help"]';

    if (!selector) {
      setAnchorRect(null);
      return;
    }

    const findAnchor = () => {
      const el = document.querySelector(selector!) as HTMLElement | null;
      if (el) {
        const rect = el.getBoundingClientRect();
        setAnchorRect(rect);
      } else {
        // Retry if element not found (might not be rendered yet)
        setTimeout(findAnchor, 100);
      }
    };

    findAnchor();

    // Update position on scroll/resize
    const updatePosition = () => {
      const updatedEl = document.querySelector(selector!) as HTMLElement | null;
      if (updatedEl) {
        setAnchorRect(updatedEl.getBoundingClientRect());
      } else {
        // Element might have been removed, try to find it again
        findAnchor();
      }
    };

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [step, isActive]);

  // Listen for first show added to advance from addShow to homeDone
  useEffect(() => {
    if (step !== "addShow") return;

    const handleFirstShowAdded = () => {
      setStep("homeDone");
      // Scroll to show both sections clearly
      setTimeout(() => {
        const currentlyWatchingEl = document.querySelector(
          '[data-onboarding-id="currently-watching-section"]'
        );
        const upNextEl = document.querySelector(
          '[data-onboarding-id="up-next-section"]'
        );
        if (currentlyWatchingEl && upNextEl) {
          // Calculate the midpoint between both sections
          const currentlyWatchingRect =
            currentlyWatchingEl.getBoundingClientRect();
          const upNextRect = upNextEl.getBoundingClientRect();
          const midPoint = (currentlyWatchingRect.top + upNextRect.bottom) / 2;

          // Scroll to show both sections with some padding
          window.scrollTo({
            top: window.scrollY + midPoint - window.innerHeight / 2 + 100,
            behavior: "smooth",
          });
        } else if (currentlyWatchingEl) {
          currentlyWatchingEl.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
        }
      }, 200);
    };

    window.addEventListener("onboarding:firstShowAdded", handleFirstShowAdded);
    return () => {
      window.removeEventListener(
        "onboarding:firstShowAdded",
        handleFirstShowAdded
      );
    };
  }, [step, setStep]);

  // Handle scrolling when transitioning to help step
  useEffect(() => {
    if (step !== "help") return;

    // Scroll up to show help icon
    setTimeout(() => {
      const helpButton = document.querySelector('[data-role="help"]');
      if (helpButton) {
        helpButton.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      } else {
        // Fallback: scroll to top
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    }, 100);
  }, [step]);

  // Handle step navigation
  const handleWelcomeNext = () => {
    // Navigate to search - trigger search view
    window.dispatchEvent(
      new CustomEvent("onboarding:navigate-to-search", {
        detail: { step: "search" },
      })
    );
    // Delay step change to allow search view to render
    setTimeout(() => {
      setStep("search");
    }, 100);
  };

  const handleSearchGotIt = () => {
    setStep("addShow");
    // Dispatch event to indicate we're in addShow step (for SearchTip)
    window.dispatchEvent(new CustomEvent("onboarding:entered-addShow-step"));
  };

  const handleHomeDoneGotIt = () => {
    setStep("help");
  };

  const handleHelpGotIt = () => {
    completeOnboarding();
  };

  // Special handling for homeDone step - render single bubble with two arrows
  if (step === "homeDone") {
    if (!isActive || !currentlyWatchingRect || !upNextRect) {
      // Wait for anchors to be found
      return null;
    }

    const bubbleWidth = 320;
    const bubbleHeight = 180;

    // Position bubble between the two sections, to the right of the content but not too far
    const midPointY = (currentlyWatchingRect.bottom + upNextRect.top) / 2;

    // Position bubble to the right of the sections, but closer than before
    const preferredBubbleLeft = Math.max(
      currentlyWatchingRect.right + 20,
      upNextRect.right + 20
    );

    // Don't go too far right - keep it reasonable
    const maxBubbleLeft = window.innerWidth - bubbleWidth - 20;
    const finalBubbleLeft = Math.min(
      preferredBubbleLeft,
      maxBubbleLeft,
      window.innerWidth * 0.25
    );

    // Calculate target points for arrows - terminate at halfway point (shortened by half)
    const bubbleTop = Math.max(20, midPointY - bubbleHeight / 2);
    const bubbleCenterY = bubbleTop + bubbleHeight / 2;
    const arrowStartX = finalBubbleLeft; // Start arrows from left edge of bubble

    // Original target points
    const currentlyWatchingTargetXOriginal = currentlyWatchingRect.left;
    const currentlyWatchingTargetYOriginal =
      currentlyWatchingRect.top + currentlyWatchingRect.height / 2;

    const upNextTargetXOriginal = upNextRect.left;
    const upNextTargetYOriginal = upNextRect.top + upNextRect.height / 2;

    // Shortened by half - calculate midpoint
    const currentlyWatchingTargetX =
      (arrowStartX + currentlyWatchingTargetXOriginal) / 2;
    const currentlyWatchingTargetY =
      (bubbleCenterY + currentlyWatchingTargetYOriginal) / 2;

    const upNextTargetX = (arrowStartX + upNextTargetXOriginal) / 2;
    const upNextTargetY = (bubbleCenterY + upNextTargetYOriginal) / 2;

    return (
      <Portal>
        {/* Backdrop overlay */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            zIndex: 9998,
          }}
        />

        {/* Single bubble with two arrows */}
        <div
          className="fixed rounded-lg shadow-2xl pointer-events-auto"
          style={{
            position: "fixed",
            top: Math.max(20, bubbleTop),
            left: finalBubbleLeft,
            width: bubbleWidth,
            backgroundColor: "var(--card)",
            border: "1px solid var(--line)",
            padding: "16px",
            zIndex: 9999,
          }}
        >
          {/* Content */}
          <div className="space-y-3">
            <div>
              <h3
                className="text-base font-semibold mb-1"
                style={{ color: "var(--text)" }}
              >
                Your Shows
              </h3>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                The shows you&apos;re watching appear up here. The one with the
                next upcoming episode shows down here first.
              </p>
            </div>

            {/* Got it button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleHomeDoneGotIt}
                className="px-4 py-1.5 text-sm font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "white",
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>

        {/* Single SVG for both arrows */}
        <svg
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            pointerEvents: "none",
            zIndex: 9998,
            overflow: "hidden",
          }}
        >
          <defs>
            <marker
              id="arrowhead-onboarding-1"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="var(--accent)" />
            </marker>
            <marker
              id="arrowhead-onboarding-2"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="var(--accent)" />
            </marker>
          </defs>
          {/* Arrow 1 pointing to Currently Watching */}
          <line
            x1={arrowStartX}
            y1={bubbleCenterY}
            x2={currentlyWatchingTargetX}
            y2={currentlyWatchingTargetY}
            stroke="var(--accent)"
            strokeWidth="3"
            markerEnd="url(#arrowhead-onboarding-1)"
          />
          {/* Arrow 2 pointing to Up Next */}
          <line
            x1={arrowStartX}
            y1={bubbleCenterY}
            x2={upNextTargetX}
            y2={upNextTargetY}
            stroke="var(--accent)"
            strokeWidth="3"
            markerEnd="url(#arrowhead-onboarding-2)"
          />
        </svg>
      </Portal>
    );
  }

  if (!isActive || !anchorRect) {
    return null;
  }

  // Calculate bubble position and arrow direction
  const getBubbleStyle = (): React.CSSProperties & {
    arrowDirection: "up" | "down" | "left" | "right";
  } => {
    if (!anchorRect) return { display: "none", arrowDirection: "up" as const };

    const bubbleWidth = 280;
    const bubbleHeight = 200; // Approximate height of bubble

    // Special handling for help step - position below help icon with arrow pointing up
    if (step === "help") {
      return {
        position: "fixed",
        top: anchorRect.bottom + 12,
        left: anchorRect.left + anchorRect.width / 2 - 20, // Shift left by 20px
        transform: "translateX(-50%)",
        maxWidth: bubbleWidth,
        zIndex: 9999,
        arrowDirection: "up" as const,
      };
    }

    // Default: Check if bubble would be cut off at bottom of viewport
    const spaceBelow = window.innerHeight - anchorRect.bottom;
    const spaceAbove = anchorRect.top;
    const shouldPositionAbove =
      spaceBelow < bubbleHeight + 20 && spaceAbove > spaceBelow;

    // Position bubble below or above anchor, centered horizontally
    return {
      position: "fixed",
      top: shouldPositionAbove
        ? anchorRect.top - bubbleHeight - 12
        : anchorRect.bottom + 12,
      left: anchorRect.left + anchorRect.width / 2,
      transform: "translateX(-50%)",
      maxWidth: bubbleWidth,
      zIndex: 9999,
      arrowDirection: shouldPositionAbove ? "down" : "up",
    };
  };

  // Render step-specific content
  const renderStepContent = () => {
    switch (step) {
      case "welcome":
        return {
          stepNumber: 1,
          title: "Welcome to Flicklet",
          body: "Let's get you set up! We'll show you how to add your first show in just a few quick steps.",
          primaryAction: {
            label: "Let's go",
            onClick: handleWelcomeNext,
          },
          secondaryAction: {
            label: "Skip setup",
            onClick: skipOnboarding,
          },
        };

      case "search":
        return {
          stepNumber: 2,
          title: "Search for a show",
          body: "Go ahead, type the name of something you're watching in the search box above and hit search!",
          primaryAction: {
            label: "Got it",
            onClick: handleSearchGotIt,
          },
          secondaryAction: {
            label: "Skip setup",
            onClick: skipOnboarding,
          },
        };

      case "addShow":
        return {
          stepNumber: 3,
          title: "Add it to Your Shows",
          body: "Perfect! Now go ahead and click the 'Currently Watching' button below to add this show to your home screen.",
          primaryAction: null,
          secondaryAction: {
            label: "Skip setup",
            onClick: skipOnboarding,
          },
        };

      case "help":
        return {
          stepNumber: 4,
          title: "Need Help?",
          body: "If you want to find out more, click here. Have fun!",
          primaryAction: {
            label: "Got it",
            onClick: handleHelpGotIt,
          },
          secondaryAction: null,
        };

      default:
        return null;
    }
  };

  const content = renderStepContent();
  if (!content) return null;

  const bubbleStyle = getBubbleStyle();
  const arrowDirection = bubbleStyle.arrowDirection || "up";
  const { arrowDirection: _, ...styleProps } = bubbleStyle;

  return (
    <Portal>
      {/* Backdrop overlay (subtle, non-blocking) */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          zIndex: 9998,
        }}
      />

      {/* Bubble */}
      <div
        className="fixed rounded-lg shadow-2xl pointer-events-auto"
        style={{
          ...styleProps,
          backgroundColor: "var(--card)",
          border: "1px solid var(--line)",
          padding: "16px",
        }}
      >
        {/* Arrow pointing to anchor (direction based on position) */}
        {arrowDirection === "up" ? (
          <>
            <div
              className="absolute -top-2 left-1/2 transform -translate-x-1/2"
              style={{
                width: 0,
                height: 0,
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderBottom: "8px solid var(--card)",
              }}
            />
            <div
              className="absolute -top-2.5 left-1/2 transform -translate-x-1/2"
              style={{
                width: 0,
                height: 0,
                borderLeft: "9px solid transparent",
                borderRight: "9px solid transparent",
                borderBottom: "9px solid var(--line)",
              }}
            />
          </>
        ) : arrowDirection === "down" ? (
          <>
            <div
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
              style={{
                width: 0,
                height: 0,
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderTop: "8px solid var(--card)",
              }}
            />
            <div
              className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2"
              style={{
                width: 0,
                height: 0,
                borderLeft: "9px solid transparent",
                borderRight: "9px solid transparent",
                borderTop: "9px solid var(--line)",
              }}
            />
          </>
        ) : arrowDirection === "left" ? (
          <>
            <div
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full"
              style={{
                width: 0,
                height: 0,
                borderTop: "8px solid transparent",
                borderBottom: "8px solid transparent",
                borderRight: "8px solid var(--card)",
              }}
            />
            <div
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full"
              style={{
                width: 0,
                height: 0,
                borderTop: "9px solid transparent",
                borderBottom: "9px solid transparent",
                borderRight: "9px solid var(--line)",
                marginLeft: "-1px",
              }}
            />
          </>
        ) : (
          <>
            <div
              className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-full"
              style={{
                width: 0,
                height: 0,
                borderTop: "8px solid transparent",
                borderBottom: "8px solid transparent",
                borderLeft: "8px solid var(--card)",
              }}
            />
            <div
              className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-full"
              style={{
                width: 0,
                height: 0,
                borderTop: "9px solid transparent",
                borderBottom: "9px solid transparent",
                borderLeft: "9px solid var(--line)",
                marginRight: "-1px",
              }}
            />
          </>
        )}

        {/* Content */}
        <div className="space-y-3">
          <div>
            <h3
              className="text-base font-semibold mb-1"
              style={{ color: "var(--text)" }}
            >
              {content.title}
            </h3>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {content.body}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            {content.secondaryAction && (
              <button
                onClick={content.secondaryAction.onClick}
                className="px-3 py-1.5 text-sm rounded-lg transition-colors"
                style={{
                  backgroundColor: "transparent",
                  color: "var(--muted)",
                  border: "1px solid var(--line)",
                }}
              >
                {content.secondaryAction.label}
              </button>
            )}
            {content.primaryAction && (
              <button
                onClick={content.primaryAction.onClick}
                className="px-4 py-1.5 text-sm font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "white",
                }}
              >
                {content.primaryAction.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
