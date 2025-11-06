import React, { useState, useRef, useEffect } from "react";
import { useIsDesktop } from "../../hooks/useDeviceDetection";

export interface DragHandleProps {
  onDragStart?: (e: React.DragEvent | React.TouchEvent, index: number) => void;
  onDragEnd?: () => void;
  onTouchDragMove?: (e: React.TouchEvent, index: number) => void;
  onKeyboardReorder?: (direction: "up" | "down") => void;
  itemId: string;
  index: number;
  className?: string;
  isDragging?: boolean;
  itemTitle?: string;
}

/**
 * Process: Drag Handle
 * Purpose: Accessible drag handle that appears on hover (desktop) or touch-hold (mobile)
 * Data Source: Card index and item ID
 * Update Path: Pass onDragStart/onDragEnd handlers from parent
 * Dependencies: useIsDesktop hook for responsive behavior
 */

// Touch hold duration: 200ms by default (improved), 400ms if explicitly disabled via flag
const getTouchHoldDuration = () => {
  // Default to 200ms for better responsiveness
  // Check if explicitly disabled: if flag exists and is 'false', use 400ms (rollback)
  if (typeof window !== "undefined") {
    try {
      const flagValue = localStorage.getItem("flag:drag-touch-hold-reduced");
      if (flagValue === "false") return 400; // Explicitly disabled
    } catch {
      // Ignore localStorage errors
    }
  }
  return 200; // Default: improved responsiveness
};

export function DragHandle({
  onDragStart,
  onDragEnd,
  onTouchDragMove,
  onKeyboardReorder,
  itemId,
  index,
  className = "",
  isDragging: externalIsDragging,
  itemTitle,
}: DragHandleProps) {
  const { ready, isDesktop } = useIsDesktop();

  // DEBUG: Log when component renders
  console.log("[DragHandle] Component rendering", {
    ready,
    isDesktop,
    hasOnDragStart: !!onDragStart,
    itemId,
    index,
  });

  const [isTouchHolding, setIsTouchHolding] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // Use external isDragging if provided, otherwise use internal state
  const isDraggingState =
    externalIsDragging !== undefined ? externalIsDragging : isDragging;
  const touchHoldTimerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const cardElementRef = useRef<HTMLElement | null>(null);
  const wrapperElementRef = useRef<HTMLElement | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (touchHoldTimerRef.current) {
        clearTimeout(touchHoldTimerRef.current);
      }
    };
  }, []);

  // Attach non-passive touch listener directly to handle element AND document (capture phase)
  useEffect(() => {
    console.log("[DragHandle] useEffect running", {
      isDesktop,
      ready,
      hasHandleRef: !!handleRef.current,
      isDragging,
      index,
    });

    // Wait for ready state and handle ref to be available
    if (isDesktop || !ready || !handleRef.current) {
      console.log("[DragHandle] useEffect skipping listener attachment", {
        isDesktop,
        ready,
        hasHandleRef: !!handleRef.current,
        reason: isDesktop ? "isDesktop" : !ready ? "not ready" : "no handleRef",
      });
      return;
    }

    console.log("[DragHandle] ✅ All conditions met, attaching listeners!", {
      handleRef: handleRef.current,
      isDesktop,
      ready,
      index,
    });
    const handle = handleRef.current;

    // Verify handle is in DOM and can receive events
    if (!document.contains(handle)) {
      console.warn("[DragHandle] handle not in DOM yet");
    }

    // Add click test listener to verify handle is clickable
    const testClick = (e: MouseEvent) => {
      console.log("[DragHandle] TEST: Handle is clickable!", {
        target: e.target,
        currentTarget: e.currentTarget,
      });
      if (handle === e.target || handle.contains(e.target as Node)) {
        handle.style.backgroundColor = "rgba(0, 255, 0, 0.5)"; // Green flash
        setTimeout(() => {
          handle.style.backgroundColor = isDesktop
            ? "transparent"
            : "rgba(0, 0, 0, 0.2)";
        }, 500);
      }
    };
    handle.addEventListener("click", testClick);
    // Also add mousedown for testing
    const testMouseDown = (e: MouseEvent) => {
      console.log("[DragHandle] TEST: mousedown on handle!", {
        target: e.target,
      });
    };
    handle.addEventListener("mousedown", testMouseDown);

    // Non-passive touch start listener to allow preventDefault
    const handleNativeTouchStart = (e: TouchEvent) => {
      // Check if this touch event is actually on our handle
      const touch = e.touches[0];
      const target = touch?.target as HTMLElement;

      // Verify the touch is on our handle or its children
      if (!target || (!handle.contains(target) && handle !== target)) {
        console.log("[DragHandle] touchstart ignored - not on handle", {
          target,
          handle,
        });
        return;
      }

      // Only handle if we're not already dragging
      if (isDragging) {
        console.log("[DragHandle] touchstart ignored - already dragging");
        return;
      }

      console.log("[DragHandle] touchstart detected", {
        target: e.target,
        currentTarget: e.currentTarget,
        touches: e.touches.length,
        eventPhase: e.eventPhase, // Should be 1 (CAPTURING_PHASE)
      });

      // CRITICAL: Stop propagation in capture phase to prevent SwipeableCard from handling
      e.stopPropagation();
      e.stopImmediatePropagation(); // Stop ALL other handlers on this element
      e.preventDefault(); // Now we can preventDefault

      touchStartRef.current = { x: touch.clientX, y: touch.clientY };

      // Find the parent card element and SwipeableCard wrapper
      let element: HTMLElement | null = handle;
      let swipeableElement: HTMLElement | null = null;

      while (element) {
        if (element.classList.contains("card-mobile")) {
          cardElementRef.current = element;
        }
        // Find the ListPage wrapper div (has data-item-index)
        if (element.hasAttribute("data-item-index")) {
          wrapperElementRef.current = element as HTMLElement;
        }
        // Find SwipeableCard wrapper - it's the div with class 'swipeable' that has touch handlers
        if (element.classList.contains("swipeable")) {
          swipeableElement = element;
          break; // Found it, stop searching
        }
        const parent = element.parentElement;
        if (!parent || parent === document.body) break;
        element = parent as HTMLElement;
      }

      // Disable swipe on the SwipeableCard when dragging
      if (swipeableElement) {
        console.log("[DragHandle] Disabling SwipeableCard", {
          swipeableElement,
        });
        swipeableElement.style.pointerEvents = "none";
        swipeableElement.setAttribute("data-drag-active", "true");
      }

      // Start touch-hold timer
      touchHoldTimerRef.current = window.setTimeout(() => {
        console.log(
          "[DragHandle] touch-hold complete, firing onDragStart for index=",
          index
        );
        setIsTouchHolding(true);
        setIsDragging(true);

        // Haptic feedback on drag start (reduced from 30ms to 15ms for subtlety)
        if (navigator.vibrate) {
          navigator.vibrate(15);
        }

        // Set high z-index on wrapper during drag so it appears above other cards
        if (wrapperElementRef.current) {
          wrapperElementRef.current.style.zIndex = "9999";
          wrapperElementRef.current.style.position = "relative";
        }

        // Start drag - create synthetic React event
        const syntheticEvent = {
          touches: e.touches,
          preventDefault: () => {},
          stopPropagation: () => {},
          currentTarget: handle,
        } as any;
        onDragStart?.(syntheticEvent, index);
      }, getTouchHoldDuration());
    };

    // Attach to handle in capture phase
    handle.addEventListener("touchstart", handleNativeTouchStart, {
      passive: false,
      capture: true, // Capture phase - fires before bubbling handlers
    });

    // ALSO attach to document in capture phase as backup to catch events before anything else
    const documentTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const target = touch?.target as HTMLElement;

      // Only handle if touch is on our handle
      if (target && (handle.contains(target) || handle === target)) {
        console.log("[DragHandle] Document capture touchstart on handle");
        handleNativeTouchStart(e);
      }
    };

    document.addEventListener("touchstart", documentTouchStart, {
      passive: false,
      capture: true,
    });

    return () => {
      handle.removeEventListener("touchstart", handleNativeTouchStart, {
        capture: true,
      });
      handle.removeEventListener("click", testClick);
      handle.removeEventListener("mousedown", testMouseDown);
      document.removeEventListener("touchstart", documentTouchStart, {
        capture: true,
      });
    };
  }, [isDesktop, ready, isDragging, index, onDragStart]); // Added 'ready' to deps so it re-runs when ready becomes true

  // Add global touch listeners when dragging
  useEffect(() => {
    if (!isDragging || isDesktop) return;

    const handleGlobalTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!touchStartRef.current || !wrapperElementRef.current) return;

      const touch = e.touches[0];
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaX = touch.clientX - touchStartRef.current.x;
      console.log("[DragHandle] touchmove deltaY=", deltaY, "deltaX=", deltaX);

      // Calculate rotation based on movement (more rotation = more drag distance)
      const rotationAngle = Math.min(Math.abs(deltaY) / 10, 8); // Max 8 degrees
      const rotationDirection = deltaY > 0 ? rotationAngle : -rotationAngle;

      // Calculate scale based on drag distance (slight scale up as you drag)
      const dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const scale = Math.min(1 + dragDistance / 500, 1.08); // Max scale 1.08

      // Move the card visually - apply enhanced transform with rotation and scale
      // This ensures the drag transform and FLIP animation target the same element
      if (wrapperElementRef.current) {
        wrapperElementRef.current.style.transform = `translateY(${deltaY}px) rotate(${rotationDirection}deg) scale(${scale})`;
        wrapperElementRef.current.style.opacity = "0.85";
        wrapperElementRef.current.style.zIndex = "9999";
        wrapperElementRef.current.style.position = "relative"; // Ensure z-index works
        wrapperElementRef.current.style.transition = "none"; // Disable transition during drag
        // Also ensure parent container has high z-index
        const parent = wrapperElementRef.current.parentElement;
        if (parent) {
          parent.style.zIndex = "9999";
          parent.style.position = "relative";
        }
      }

      // Check which card is under the touch point for drop target detection
      const elementBelow = document.elementFromPoint(
        touch.clientX,
        touch.clientY
      );
      if (elementBelow) {
        const cardElement = elementBelow.closest(
          "[data-item-index]"
        ) as HTMLElement;
        if (cardElement) {
          const targetIndex = parseInt(
            cardElement.getAttribute("data-item-index") || "-1"
          );
          if (targetIndex >= 0) {
            // Always trigger dragOver event to update draggedOverIndex state
            const dragOverEvent = new CustomEvent("touchdragover", {
              bubbles: true,
              cancelable: true,
              detail: { targetIndex, sourceIndex: index },
            });
            cardElement.dispatchEvent(dragOverEvent);

            // Also call onTouchDragMove callback to notify parent
            onTouchDragMove?.(e as any, targetIndex);
          }
        }
      }
    };

    const handleGlobalTouchEnd = (_e: TouchEvent) => {
      console.log("[DragHandle] touchend – resetting drag state");
      if (!isDragging) return;

      setIsDragging(false);

      // Re-enable swipe on SwipeableCard
      const swipeableElements = document.querySelectorAll(
        '[data-drag-active="true"]'
      );
      swipeableElements.forEach((el) => {
        (el as HTMLElement).style.pointerEvents = "";
        el.removeAttribute("data-drag-active");
      });

      // Reset visual state - clear transform with smooth transition before FLIP
      if (wrapperElementRef.current) {
        const wrapper = wrapperElementRef.current;
        // Smooth transition back to normal state before FLIP takes over
        wrapper.style.transition =
          "transform .2s ease-out, opacity .2s ease-out";
        wrapper.style.opacity = "1";
        wrapper.style.transform = "translateY(0) rotate(0deg) scale(1)";
        // Keep z-index via CSS class (is-dragging class will be removed by parent)
        // Clear inline z-index after FLIP completes
        setTimeout(() => {
          if (wrapper === wrapperElementRef.current) {
            wrapper.style.zIndex = "";
            wrapper.style.position = "";
            wrapper.style.transition = "";
          }
        }, 600); // After FLIP animation completes (longer timeout for smoother transition)
      }

      // Reset parent z-index after delay
      if (wrapperElementRef.current?.parentElement) {
        const parent = wrapperElementRef.current.parentElement;
        setTimeout(() => {
          parent.style.zIndex = "";
          parent.style.position = "";
        }, 400);
      }

      // Create proper synthetic event with currentTarget for handleDragEnd
      // Note: onDragEnd will trigger reorder and reset dragState, which will trigger FLIP
      // For mobile touch events, onDragEnd doesn't expect arguments
      onDragEnd?.();
      setTimeout(() => {
        setIsTouchHolding(false);
      }, 100);
      touchStartRef.current = null;
    };

    const handleGlobalTouchCancel = (_e: TouchEvent) => {
      // Clear timer if drag hasn't started yet
      if (touchHoldTimerRef.current) {
        clearTimeout(touchHoldTimerRef.current);
        touchHoldTimerRef.current = null;
      }
      // Reset state
      setIsTouchHolding(false);
      setIsDragging(false);
      // Re-enable swipe
      const swipeableElements = document.querySelectorAll(
        '[data-drag-active="true"]'
      );
      swipeableElements.forEach((el) => {
        (el as HTMLElement).style.pointerEvents = "";
        el.removeAttribute("data-drag-active");
      });
      // Reset visual state
      if (wrapperElementRef.current) {
        wrapperElementRef.current.style.transform = "";
        wrapperElementRef.current.style.opacity = "";
        wrapperElementRef.current.style.zIndex = "";
        wrapperElementRef.current.style.position = "";
      }
      touchStartRef.current = null;
    };

    document.addEventListener("touchmove", handleGlobalTouchMove, {
      passive: false,
    });
    document.addEventListener("touchend", handleGlobalTouchEnd);
    document.addEventListener("touchcancel", handleGlobalTouchCancel);

    return () => {
      document.removeEventListener("touchmove", handleGlobalTouchMove);
      document.removeEventListener("touchend", handleGlobalTouchEnd);
      document.removeEventListener("touchcancel", handleGlobalTouchCancel);
    };
  }, [isDragging, isDesktop, index, onTouchDragMove, onDragEnd]);

  const handleTouchStart = (e: React.TouchEvent) => {
    // This is just for React compatibility - actual handling is done in native listener
    // We can't preventDefault here because React handlers are passive
    if (isDesktop || isDragging) return;
    e.stopPropagation();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDesktop || !touchStartRef.current || isDragging) return;

    e.stopPropagation(); // Prevent swipe gesture

    // Only handle movement before drag starts (to cancel touch-hold)
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);

    // If moved more than 10px before hold completes, cancel touch-hold
    if (dx > 10 || dy > 10) {
      if (touchHoldTimerRef.current) {
        clearTimeout(touchHoldTimerRef.current);
        touchHoldTimerRef.current = null;
      }
      setIsTouchHolding(false);

      // Re-enable swipe if we cancelled
      const swipeableElements = document.querySelectorAll(
        '[data-drag-active="true"]'
      );
      swipeableElements.forEach((el) => {
        (el as HTMLElement).style.pointerEvents = "";
        el.removeAttribute("data-drag-active");
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isDesktop || isDragging) return; // Global handler will take care of drag end

    e.stopPropagation();

    // Re-enable swipe if we didn't start dragging
    const swipeableElements = document.querySelectorAll(
      '[data-drag-active="true"]'
    );
    swipeableElements.forEach((el) => {
      (el as HTMLElement).style.pointerEvents = "";
      el.removeAttribute("data-drag-active");
    });

    // Clear timer on touch end (handles touchcancel too)
    if (touchHoldTimerRef.current) {
      clearTimeout(touchHoldTimerRef.current);
      touchHoldTimerRef.current = null;
    }

    // Small delay before hiding to allow drag to start
    setTimeout(() => {
      setIsTouchHolding(false);
    }, 100);
  };

  const handleTouchCancel = (e: React.TouchEvent) => {
    // Handle touchcancel - ensure timer is cleared and state is reset
    if (isDesktop || isDragging) return;

    e.stopPropagation();

    // Clear timer immediately
    if (touchHoldTimerRef.current) {
      clearTimeout(touchHoldTimerRef.current);
      touchHoldTimerRef.current = null;
    }

    // Reset state
    setIsTouchHolding(false);

    // Re-enable swipe
    const swipeableElements = document.querySelectorAll(
      '[data-drag-active="true"]'
    );
    swipeableElements.forEach((el) => {
      (el as HTMLElement).style.pointerEvents = "";
      el.removeAttribute("data-drag-active");
    });
  };

  const handleMouseDown = (_e: React.MouseEvent) => {
    if (!isDesktop) return;
    // Desktop drag is handled by onDragStart
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragStart?.(e, index);
  };

  // On mobile, show handle with reduced opacity when not touching, full opacity when touch-holding
  // On desktop, always show fully
  const shouldShow = isDesktop ? true : isTouchHolding;
  const mobileOpacity = isDesktop ? 1 : isTouchHolding ? 1 : 0.5; // Increased from 0.3 to 0.5 for better visibility

  if (!ready) {
    console.log("[DragHandle] Component NOT ready, returning null", {
      ready,
      isDesktop,
    });
    return null;
  }

  console.log("[DragHandle] Component ready, rendering handle", {
    ready,
    isDesktop,
    itemId,
    index,
  });

  return (
    <div
      ref={handleRef}
      className={`drag-handle ${className} ${shouldShow ? "visible" : ""}`}
      style={{
        position: "absolute",
        top: "50%",
        right: "4px",
        transform: "translateY(-50%)",
        width: isDesktop ? "32px" : "40px",
        height: isDesktop ? "32px" : "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isDesktop ? "grab" : "default",
        borderRadius: "4px",
        transition: "opacity 0.2s ease, transform 0.2s ease",
        opacity: isDesktop ? (shouldShow ? 1 : 0) : mobileOpacity,
        pointerEvents: "auto", // Always allow pointer events so touch-hold can work
        zIndex: 1000, // Much higher z-index to ensure it's above SwipeableCard and other elements
        touchAction: "none",
        backgroundColor: isDesktop ? "transparent" : "rgba(0, 0, 0, 0.2)", // More visible background on mobile
        padding: "4px",
        userSelect: "none", // Prevent text selection
        WebkitUserSelect: "none",
      }}
      draggable={isDesktop && shouldShow}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseDown={handleMouseDown}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          e.stopPropagation();
          onKeyboardReorder?.(e.key === "ArrowUp" ? "up" : "down");
        }
      }}
      title="Drag to reorder (Arrow Up/Down to move with keyboard)"
      aria-label={`Drag to reorder${itemTitle ? ` ${itemTitle}` : ""}. Press Arrow Up or Down to move with keyboard.`}
      role="button"
      tabIndex={0}
      aria-grabbed={isDraggingState}
    >
      <span
        style={{
          fontSize: isDesktop ? "24px" : "28px",
          lineHeight: "1",
          color: "var(--muted)",
          userSelect: "none",
        }}
      >
        ⋮⋮
      </span>
    </div>
  );
}
