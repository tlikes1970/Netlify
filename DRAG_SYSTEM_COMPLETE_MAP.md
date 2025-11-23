# Complete Drag & Drop System Map

**Purpose:** Comprehensive mapping of all drag-and-drop code affecting card behavior on desktop and mobile.  
**Scope:** All files, components, hooks, styles, and state management related to dragging cards.  
**Date:** Generated from codebase analysis

---

## 1. Drag Libraries & Entry Points

### No External Drag Libraries
- ❌ **No `@dnd-kit/*`** - Custom implementation
- ❌ **No `react-beautiful-dnd`** - Custom implementation
- ✅ **Native HTML5 Drag API** - Used for desktop drag
- ✅ **Custom Touch Events** - Used for mobile drag

### Entry Points
- **Desktop:** Native `draggable={true}` attribute on drag handle element
- **Mobile:** Custom touch event handlers in `DragHandle.tsx` with touch-hold detection

---

## 2. Per-File Code Dumps

### `apps/web/src/components/cards/DragHandle.tsx`

**Role:** Unified drag handle component for both desktop and mobile cards. Handles touch-hold detection, visual feedback, and drag state management.

**Key Features:**
- Desktop: Uses native HTML5 drag API (`draggable={true}`)
- Mobile: Custom touch-hold (200ms default, 400ms if flag disabled) with haptic feedback
- Manages drag state internally or accepts external `isDragging` prop
- Applies inline transforms during mobile drag
- Disables SwipeableCard swipe during drag via `pointerEvents: 'none'`

**Code:**

```1:636:apps/web/src/components/cards/DragHandle.tsx
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

        // Set z-index on wrapper during drag so it appears above other cards but below modals
        // Note: CSS variables don't work in inline styles, so we use the numeric value
        if (wrapperElementRef.current) {
          wrapperElementRef.current.style.zIndex = "100"; // Matches --z-dragging token
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

      // Calculate scale based on drag distance (slight scale up as you drag)
      const dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const scale = Math.min(1 + dragDistance / 500, 1.02); // Max scale 1.02 (subtle lift)

      // Move the card visually - apply flat transform (translate3d/scale only, no rotation)
      // Use translate3d for better performance and to ensure proper composition
      // Mobile drag should stay flat, full-width, and aligned
      if (wrapperElementRef.current) {
        // Apply transform to wrapper - this is the [data-item-index] div from ListPage
        wrapperElementRef.current.style.transform = `translate3d(0, ${deltaY}px, 0) scale(${scale})`;
        wrapperElementRef.current.style.opacity = "0.9";
        wrapperElementRef.current.style.zIndex = "100"; // Matches --z-dragging token
        wrapperElementRef.current.style.position = "relative"; // Ensure z-index works
        wrapperElementRef.current.style.transition = "none"; // Disable transition during drag
        // Ensure card stays full-width and aligned
        wrapperElementRef.current.style.width = "100%";
        wrapperElementRef.current.style.maxWidth = "100%";
        
        // Also ensure the SwipeableCard wrapper respects z-index
        const swipeableElement = wrapperElementRef.current.querySelector('.swipeable') as HTMLElement;
        if (swipeableElement) {
          swipeableElement.style.zIndex = "inherit";
          swipeableElement.style.position = "relative";
        }
        
        // Also ensure the card-mobile element inside stays full-width
        const cardElement = wrapperElementRef.current.querySelector('.card-mobile') as HTMLElement;
        if (cardElement) {
          cardElement.style.width = "100%";
          cardElement.style.maxWidth = "100%";
          cardElement.style.zIndex = "inherit";
          // Don't apply transform to card itself - let wrapper handle it
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
        wrapper.style.transform = "translate3d(0, 0, 0) scale(1)";
        // Reset width constraints (FLIP will handle positioning)
        wrapper.style.width = "";
        wrapper.style.maxWidth = "";
        
        // Reset SwipeableCard z-index
        const swipeableElement = wrapper.querySelector('.swipeable') as HTMLElement;
        if (swipeableElement) {
          swipeableElement.style.zIndex = "";
          swipeableElement.style.position = "";
        }
        
        // Reset card element width and z-index if we set it
        const cardElement = wrapper.querySelector('.card-mobile') as HTMLElement;
        if (cardElement) {
          cardElement.style.width = "";
          cardElement.style.maxWidth = "";
          cardElement.style.zIndex = "";
        }
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
        zIndex: 1000, // Matches --z-nav token (handle should be above cards but below modals)
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
```

---

### `apps/web/src/components/cards/TabCard.tsx`

**Role:** Desktop card component that renders drag handle and passes drag handlers. Also conditionally renders mobile card components on mobile viewports.

**Key Drag Features:**
- Desktop drag handle: Inline element with `draggable={true}` (lines 909-928)
- Passes `onDragStart`, `onDragEnd`, `onDragOver` handlers to parent
- Applies `is-dragging` class based on `dragState.isDragging`
- Detects `isBeingDragged` and `isDropTarget` for visual feedback
- Keyboard reordering support via ArrowUp/ArrowDown

**Relevant Code Sections:**

```26:37:apps/web/src/components/cards/TabCard.tsx
  dragState?: {
    draggedItem: { id: string; index: number } | null;
    draggedOverIndex: number | null;
    isDragging: boolean;
  };
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onKeyboardReorder?: (direction: "up" | "down") => void;
```

```413:416:apps/web/src/components/cards/TabCard.tsx
  // Determine if this card is being dragged or is a drop target
  const isBeingDragged = dragState?.draggedItem?.id === item.id;
  const isDropTarget = dragState?.draggedOverIndex === index && !isBeingDragged;
  const isDragging = dragState?.isDragging;
```

```588:627:apps/web/src/components/cards/TabCard.tsx
  // Card content (shared between mobile and desktop)
  const cardContent = (
    <article
      className={`card-desktop tab-card group relative ${
        isBeingDragged ? "is-dragging" : ""
      } ${isDropTarget ? "is-drop-target" : ""}`}
      data-testid="tab-card"
      data-card-type="tab"
      aria-label={title}
      style={{
        touchAction: "pan-y",
      }}
      draggable={false}
      // Note: Drag handlers moved to wrapper div in ListPage for proper drop zone
      // Keeping these for backward compatibility but they may not fire if wrapper handles it first
      onDragOver={(e) => {
        // Only handle if not already handled by wrapper
        e.stopPropagation();
        onDragOver?.(e, index);
        // Add aria-dropeffect for accessibility
        if (isDropTarget && e.currentTarget instanceof HTMLElement) {
          e.currentTarget.setAttribute("aria-dropeffect", "move");
        }
      }}
      onDragLeave={(e) => {
        onDragLeave?.(e);
        // Clear aria-dropeffect when leaving
        if (e.currentTarget instanceof HTMLElement) {
          e.currentTarget.removeAttribute("aria-dropeffect");
        }
      }}
      onDrop={(e) => {
        e.stopPropagation();
        onDrop?.(e);
        // Clear aria-dropeffect on drop
        if (e.currentTarget instanceof HTMLElement) {
          e.currentTarget.removeAttribute("aria-dropeffect");
        }
      }}
      aria-grabbed={isBeingDragged}
    >
```

```876:929:apps/web/src/components/cards/TabCard.tsx
        {/* Drag handle - Desktop only, shows on hover/focus */}
        {isDesktop && (
          <div
            className={`handle absolute top-1/4 right-2 transform -translate-y-1/2 cursor-grab text-lg transition-all duration-200 ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            } ${isBeingDragged ? "is-dragging" : ""}`}
            style={{
              color: isBeingDragged ? "var(--accent)" : "var(--muted)",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
              border: "1px solid transparent",
              backgroundColor: "transparent",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!isBeingDragged) {
                e.currentTarget.style.borderColor = "var(--line)";
                e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--accent) 10%, transparent)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isBeingDragged) {
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
            title="Drag to reorder (Arrow Up/Down to move with keyboard)"
            aria-label="Drag to reorder. Press Arrow Up or Down to move with keyboard."
            tabIndex={0}
            draggable={true}
            onDragStart={(e) => {
              e.stopPropagation();
              e.dataTransfer.setData("text/plain", String(item.id)); // DEBUG: required for some browsers
              e.dataTransfer.effectAllowed = "move";
              onDragStart?.(e, index);
            }}
            onDragEnd={() => onDragEnd?.({} as React.DragEvent)}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                e.stopPropagation();
                onKeyboardReorder?.(e.key === "ArrowUp" ? "up" : "down");
              }
            }}
            role="button"
            aria-grabbed={isBeingDragged}
          >
            <span style={{ fontSize: "20px", lineHeight: "1", fontWeight: "600", letterSpacing: "-0.5px" }}>⋮⋮</span>
          </div>
        )}
```

---

### `apps/web/src/components/cards/mobile/TvCardMobile.tsx`

**Role:** Mobile TV card component that integrates DragHandle for touch-based drag.

**Key Drag Features:**
- Renders `DragHandle` component (lines 126-145)
- Passes `onDragStart`, `onDragEnd`, `onKeyboardReorder`, `isDragging` props to DragHandle
- Wraps content in `card-mobile` div with `data-item-index` attribute

**Relevant Code:**

```38:47:apps/web/src/components/cards/mobile/TvCardMobile.tsx
export interface TvCardMobileProps {
  item: MediaItem;
  actions?: CardActionHandlers;
  tabKey?: 'watching' | 'watched' | 'want';
  index?: number;
  onDragStart?: (e: React.DragEvent | React.TouchEvent, index: number) => void;
  onDragEnd?: () => void;
  onKeyboardReorder?: (direction: "up" | "down") => void;
  isDragging?: boolean;
}
```

```113:146:apps/web/src/components/cards/mobile/TvCardMobile.tsx
      <div 
        className="card-mobile" 
        style={{ position: 'relative', overflow: 'visible' }}
        data-item-index={index}
      >
        {/* Drag Handle - Mobile (always visible, dimmed; full opacity on touch-hold) */}
        {onDragStart && (
          <DragHandle
            itemId={String(item.id)}
            index={index}
            onDragStart={(e, idx) => {
              if ('touches' in e) {
                // Touch event - notify parent
                onDragStart(e as any, idx);
              } else {
                onDragStart(e as any, idx);
              }
            }}
            onDragEnd={onDragEnd}
            onKeyboardReorder={onKeyboardReorder}
            isDragging={isDragging}
            itemTitle={item.title}
            onTouchDragMove={(_e, _idx) => {
              // Touch drag move is handled by global listener in DragHandle
              // This callback is called to notify parent about potential drop target
            }}
          />
        )}
```

---

### `apps/web/src/components/cards/mobile/MovieCardMobile.tsx`

**Role:** Mobile movie card component with identical drag integration to TvCardMobile.

**Relevant Code:**

```37:46:apps/web/src/components/cards/mobile/MovieCardMobile.tsx
export interface MovieCardMobileProps {
  item: MediaItem;
  actions?: CardActionHandlers;
  tabKey?: 'watching' | 'watched' | 'want';
  index?: number;
  onDragStart?: (e: React.DragEvent | React.TouchEvent, index: number) => void;
  onDragEnd?: () => void;
  onKeyboardReorder?: (direction: "up" | "down") => void;
  isDragging?: boolean;
}
```

```88:121:apps/web/src/components/cards/mobile/MovieCardMobile.tsx
      <div 
        className="card-mobile" 
        style={{ position: 'relative', overflow: 'visible' }}
        data-item-index={index}
      >
        {/* Drag Handle - Mobile (always visible, dimmed; full opacity on touch-hold) */}
        {onDragStart && (
          <DragHandle
            itemId={String(item.id)}
            index={index}
            onDragStart={(e, idx) => {
              if ('touches' in e) {
                // Touch event - notify parent
                onDragStart(e as any, idx);
              } else {
                onDragStart(e as any, idx);
              }
            }}
            onDragEnd={onDragEnd}
            onKeyboardReorder={onKeyboardReorder}
            isDragging={isDragging}
            itemTitle={item.title}
            onTouchDragMove={(_e, _idx) => {
              // Touch drag move is handled by global listener in DragHandle
              // This callback is called to notify parent about potential drop target
            }}
          />
        )}
```

---

### `apps/web/src/pages/ListPage.tsx`

**Role:** Main page component that manages drag state, reordering logic, FLIP animations, and persistence.

**Key Drag Features:**
- Uses `useDragAndDrop` hook for drag state management
- Implements FLIP animation for smooth reorder transitions
- Handles custom order persistence via `Library.reorder()`
- Wraps each card in a `[data-item-index]` div for drop zone handling
- Listens for `touchdragover` custom events from DragHandle
- Keyboard reordering support

**Relevant Code Sections:**

```345:410:apps/web/src/pages/ListPage.tsx
  // Drag and drop functionality
  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (mode !== "discovery") {
        // Capture positions BEFORE reorder (critical for FLIP animation)
        const cardMap = cardRefs.current;
        const currentRects = new Map<string, DOMRect>();
        processedItems.forEach((item) => {
          const el = cardMap.get(String(item.id));
          if (el) {
            currentRects.set(String(item.id), el.getBoundingClientRect());
          }
        });
        prevRects.current = currentRects;
        pendingReorderRef.current = { fromIndex, toIndex };

        console.log("[ListPage] Captured positions before reorder", {
          fromIndex,
          toIndex,
          rectCount: currentRects.size,
        });

        // When user manually reorders, switch to Custom mode
        handleSortModeChange("custom");
        const listName = getListName(mode);
        if (listName) {
          Library.reorder(listName, fromIndex, toIndex);
        }

        // Track reorder completion
        trackReorderCompleted(tabKey, fromIndex, toIndex);

        // Clear pending reorder after animation completes
        setTimeout(() => {
          pendingReorderRef.current = null;
        }, 500);
      }
    },
    [mode, processedItems, handleSortModeChange, tabKey]
  );

  const {
    dragState,
    handleDragStart,
    handleDragEnd: originalHandleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useDragAndDrop(
    processedItems.map((item) => ({ ...item, id: String(item.id) })),
    handleReorder
  );

  // Wrap handleDragEnd to flush pending saves on drop completion
  const handleDragEnd = useCallback(
    (e: React.DragEvent) => {
      originalHandleDragEnd(e);
      // Flush pending saves immediately after drop completes
      flushPendingSaves();
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.info("[reorder] flushed on drop completion");
      }
    },
    [originalHandleDragEnd]
  );
```

```415:460:apps/web/src/pages/ListPage.tsx
  // Aria-live region for accessibility announcements
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>("");

  // Keyboard reordering
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map()); // Track by item ID, not index
  const prevRects = useRef<Map<string, DOMRect>>(new Map());
  const pendingReorderRef = useRef<{
    fromIndex: number;
    toIndex: number;
  } | null>(null);
  const getItemElement = useCallback(
    (index: number) => {
      const item = processedItems[index];
      return item ? cardRefs.current.get(String(item.id)) || null : null;
    },
    [processedItems]
  );

  const announceChange = useCallback((message: string) => {
    setAriaAnnouncement(message);
    // Clear after announcement is read
    setTimeout(() => setAriaAnnouncement(""), 1000);
  }, []);

  const handleKeyboardReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      handleReorder(fromIndex, toIndex);
      const item = processedItems[fromIndex];
      const direction = toIndex > fromIndex ? "down" : "up";
      announceChange(
        `${item.title} moved ${direction}, now at position ${toIndex + 1} of ${processedItems.length}`
      );

      // Maintain focus on handle after reorder
      // Use setTimeout to allow DOM to update first
      setTimeout(() => {
        const newElement = getItemElement(toIndex);
        if (newElement) {
          const handle = newElement.querySelector(
            ".handle, .drag-handle"
          ) as HTMLElement;
          if (handle) {
            handle.focus();
          }
        }
      }, 50);
    },
    [processedItems, handleReorder, announceChange, getItemElement]
  );
```

```468:656:apps/web/src/pages/ListPage.tsx
  // Stable item IDs array for FLIP dependency (prevents unnecessary re-runs)
  const itemIds = useMemo(
    () => processedItems.map((i) => String(i.id)),
    [processedItems]
  );

  // FLIP animation for smooth reorder transitions
  // Disabled during active drag to prevent conflicts with drag transform
  // Feature flag: drag-animation-v1 (enabled by default, can be disabled for rollback)
  const isAnimationDisabled = useMemo(() => {
    // Check if explicitly disabled: if flag exists and is 'false', disable animation
    if (typeof window !== "undefined") {
      try {
        const flagValue = localStorage.getItem("flag:drag-animation-v1");
        return flagValue === "false";
      } catch {
        // Ignore localStorage errors
      }
    }
    return false; // Default: animation enabled
  }, []);

  useLayoutEffect(() => {
    if (!processedItems.length || dragState.isDragging || isAnimationDisabled) {
      console.log("[ListPage] FLIP skipped", {
        hasItems: !!processedItems.length,
        isDragging: dragState.isDragging,
        isDisabled: isAnimationDisabled,
      });
      return;
    }

    // Only run FLIP if we have a pending reorder (prevents running on every render)
    if (!pendingReorderRef.current) {
      console.log("[ListPage] FLIP skipped - no pending reorder");
      return;
    }

    console.log("[ListPage] FLIP running", {
      itemCount: processedItems.length,
      itemIds: itemIds.join(","),
      pendingReorder: pendingReorderRef.current,
    });

    const cardMap = cardRefs.current;
    const prevMap = prevRects.current; // This was captured BEFORE reorder in handleReorder
    const nextRects = new Map<string, DOMRect>();

    // 2. Let React commit the reorder (positions are already captured in handleReorder)
    requestAnimationFrame(() => {
      // 3. Read new positions - track by item ID (after reorder)
      processedItems.forEach((item) => {
        const el = cardMap.get(String(item.id));
        if (el) {
          nextRects.set(String(item.id), el.getBoundingClientRect());
        }
      });

      // 4. Animate each card that moved with enhanced effects
      let animatedCount = 0;
      const animatedCards: Array<{
        el: HTMLElement;
        itemId: string;
        index: number;
      }> = [];

      // First pass: collect all cards that need animation
      nextRects.forEach((nextRect, itemId) => {
        const prevRect = prevMap.get(itemId);
        if (!prevRect) {
          console.log("[ListPage] FLIP no prevRect for", itemId);
          return;
        }

        const dx = prevRect.left - nextRect.left;
        const dy = prevRect.top - nextRect.top;
        if (dx === 0 && dy === 0) {
          console.log("[ListPage] FLIP no movement for", itemId);
          return;
        }

        const el = cardMap.get(itemId);
        if (!el) {
          console.log("[ListPage] FLIP no element for", itemId);
          return;
        }

        // Find index of this item for stagger calculation
        const itemIndex = processedItems.findIndex(
          (item) => String(item.id) === itemId
        );
        animatedCards.push({
          el,
          itemId,
          index: itemIndex >= 0 ? itemIndex : 0,
        });
      });

      // Sort by index for proper stagger order
      animatedCards.sort((a, b) => a.index - b.index);

      // Second pass: apply FLIP animation with enhanced effects
      animatedCards.forEach(({ el, itemId, index }) => {
        const prevRect = prevMap.get(itemId);
        const nextRect = nextRects.get(itemId);
        if (!prevRect || !nextRect) return;

        const dx = prevRect.left - nextRect.left;
        const dy = prevRect.top - nextRect.top;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Dynamic duration based on distance (medium priority)
        // Base duration 0.3s, scales with distance up to 0.6s
        const baseDuration = 0.3;
        const maxDuration = 0.6;
        const duration = Math.min(baseDuration + distance / 1500, maxDuration);

        // Calculate rotation angle based on direction (flip effect)
        const rotationAngle =
          Math.abs(dy) > Math.abs(dx)
            ? dy > 0
              ? -3
              : 3 // Rotate based on vertical movement
            : dx > 0
              ? -2
              : 2; // Rotate based on horizontal movement

        // Stagger delay: 20ms per card (high priority)
        const staggerDelay = index * 20;

        console.log("[ListPage] FLIP animating card", {
          itemId,
          dx,
          dy,
          distance,
          duration,
          rotationAngle,
          staggerDelay,
        });

        // FLIP: INVERT - Set initial state with flip and scale
        // Add perspective for 3D effect
        el.style.perspective = "1000px";
        el.style.transform = `translate(${dx}px, ${dy}px) rotateX(${rotationAngle}deg) scale(0.95)`;
        el.style.transition = "transform 0s, opacity 0s";
        el.style.opacity = "0.9";
        // Ensure z-index is elevated during animation (below modals)
        el.style.zIndex = "100"; // Matches --z-dragging token
        el.style.position = "relative";
        el.style.transformStyle = "preserve-3d";

        // Stagger the animation start
        setTimeout(() => {
          requestAnimationFrame(() => {
            // FLIP: PLAY - Smooth animated transition with spring physics
            // Spring easing: cubic-bezier(.34, 1.56, .64, 1) creates bounce effect
            el.style.transition = `transform ${duration}s cubic-bezier(.34, 1.56, .64, 1), opacity ${duration}s ease-out`;
            el.style.transform = "translate(0, 0) rotateX(0deg) scale(1)";
            el.style.opacity = "1";

            el.addEventListener(
              "transitionend",
              () => {
                if (el) {
                  el.style.transition = "";
                  el.style.zIndex = "";
                  el.style.position = "";
                  el.style.perspective = "";
                  el.style.transformStyle = "";
                  el.style.opacity = "";
                  animatedCount++;
                  console.log("[ListPage] FLIP animation complete", {
                    itemId,
                    animatedCount,
                  });
                }
              },
              { once: true }
            );
          });
        }, staggerDelay);
      });

      if (animatedCount === 0) {
        console.log("[ListPage] FLIP no cards moved", {
          prevMapSize: prevMap.size,
          nextRectsSize: nextRects.size,
          itemIds: Array.from(nextRects.keys()),
        });
      }

      // 5. Store for next flip
      prevRects.current = nextRects;
    });
  }, [itemIds.join(","), dragState.isDragging, isAnimationDisabled]); // re-run only when order changes or drag ends

  // Listen for touch drag over events from DragHandle
  useEffect(() => {
    const handleTouchDragOver = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log("[ListPage] touchdragover", customEvent.detail);
      if (customEvent.detail && dragState.isDragging) {
        const targetIndex = customEvent.detail.targetIndex;
        if (targetIndex >= 0 && targetIndex !== dragState.draggedItem?.index) {
          const syntheticEvent = {
            preventDefault: () => {},
            stopPropagation: () => {},
            dataTransfer: { dropEffect: "move" },
            currentTarget: customEvent.target,
          } as any;
          handleDragOver(syntheticEvent, targetIndex);
        }
      }
    };

    document.addEventListener(
      "touchdragover",
      handleTouchDragOver as EventListener
    );
    return () => {
      document.removeEventListener(
        "touchdragover",
        handleTouchDragOver as EventListener
      );
    };
  }, [dragState, handleDragOver]);
```

```1014:1134:apps/web/src/pages/ListPage.tsx
                  return (
                    <div
                      key={item.id}
                      ref={(el) => {
                        if (el) cardRefs.current.set(String(item.id), el);
                        else cardRefs.current.delete(String(item.id));
                      }}
                      data-item-index={index}
                      className={`${isBeingDragged ? "is-dragging" : ""} ${isDropTarget ? "is-drop-target" : ""}`} // Add CSS classes for animations
                      role="listitem"
                      aria-posinset={index + 1}
                      aria-setsize={processedItems.length}
                      // Drag and drop handlers on wrapper for proper drop zone
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = "move";
                        // Add aria-dropeffect for screen readers when this is a valid drop target
                        if (
                          isDropTarget &&
                          e.currentTarget instanceof HTMLElement
                        ) {
                          e.currentTarget.setAttribute(
                            "aria-dropeffect",
                            "move"
                          );
                        }
                        console.log("[ListPage] wrapper onDragOver", {
                          index,
                          draggedItem: dragState.draggedItem,
                        });
                        handleDragOver(e, index);
                      }}
                      onDragLeave={(e) => {
                        console.log("[ListPage] wrapper onDragLeave", {
                          index,
                        });
                        // Clear aria-dropeffect when leaving
                        if (e.currentTarget instanceof HTMLElement) {
                          e.currentTarget.removeAttribute("aria-dropeffect");
                        }
                        handleDragLeave(e);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Clear aria-dropeffect on drop
                        if (e.currentTarget instanceof HTMLElement) {
                          e.currentTarget.removeAttribute("aria-dropeffect");
                        }
                        console.log("[ListPage] wrapper onDrop", {
                          index,
                          draggedItem: dragState.draggedItem,
                        });
                        handleDrop(e);
                      }}
                      aria-dropeffect={isDropTarget ? "move" : undefined}
                      onTouchEnd={(e) => {
                        // Handle touch drag end
                        if (
                          dragState.isDragging &&
                          dragState.draggedOverIndex !== null
                        ) {
                          const syntheticEvent = {
                            preventDefault: () => {},
                            stopPropagation: () => {},
                            currentTarget: e.currentTarget,
                          } as any;
                          handleDragEnd(syntheticEvent);
                        }
                      }}
                      style={{
                        touchAction: "pan-y", // Allow vertical scroll but enable drag
                        position: "relative", // Ensure z-index works during drag
                      }}
                    >
                      <TabCard
                        item={mediaItem}
                        actions={actions}
                        tabType={mode}
                        index={index}
                        dragState={dragState}
                        onDragStart={(e, idx) => {
                          // Handle both drag and touch events
                          if ("touches" in e) {
                            // Touch event - manually set drag state
                            const item = processedItems[idx];
                            if (item) {
                              // Set drag state manually
                              handleDragStart(
                                {
                                  ...e,
                                  dataTransfer: {
                                    setData: () => {},
                                    effectAllowed: "move",
                                  } as any,
                                  preventDefault: () => {},
                                  stopPropagation: () => {},
                                  currentTarget: e.currentTarget,
                                } as any,
                                idx
                              );
                            }
                          } else {
                            handleDragStart(e, idx);
                          }
                        }}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onKeyboardReorder={(direction) => {
                          const newIndex =
                            direction === "up"
                              ? Math.max(0, index - 1)
                              : Math.min(processedItems.length - 1, index + 1);
                          if (newIndex !== index) {
                            handleKeyboardReorder(index, newIndex);
                          }
                        }}
                      />
                    </div>
                  );
```

---

### `apps/web/src/hooks/useDragAndDrop.ts`

**Role:** Custom hook that manages drag state and coordinates drag events.

**Key Features:**
- Tracks `draggedItem`, `draggedOverIndex`, `isDragging` state
- Handles drag start/end/over/leave events
- Applies visual feedback (opacity, transform) during drag
- Calls `onReorder` callback when valid drop occurs

**Code:**

```1:160:apps/web/src/hooks/useDragAndDrop.ts
import { useState, useCallback, useRef } from 'react';

export interface DragItem {
  id: string;
  index: number;
}

export interface DragState {
  draggedItem: DragItem | null;
  draggedOverIndex: number | null;
  isDragging: boolean;
}

export function useDragAndDrop<T extends { id: string }>(
  items: T[],
  onReorder: (fromIndex: number, toIndex: number) => void
) {
  const [dragState, setDragState] = useState<DragState>({
    draggedItem: null,
    draggedOverIndex: null,
    isDragging: false,
  });

  const dragStartRef = useRef<number | null>(null);
  const isDragEndingRef = useRef<boolean>(false); // Prevent double onDragEnd calls

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    const item = items[index];
    if (!item) return;

    console.log('[useDragAndDrop] drag start', { index, itemId: item.id });
    dragStartRef.current = index;
    
    setDragState({
      draggedItem: { id: item.id, index },
      draggedOverIndex: null,
      isDragging: true,
    });

    // Set drag data
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';

    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
      e.currentTarget.style.transform = 'rotate(2deg)';
    }
  }, [items]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    // Prevent double calls
    if (isDragEndingRef.current) {
      console.log('[useDragAndDrop] drag end ignored - already processing');
      return;
    }
    
    isDragEndingRef.current = true;
    
    console.log('[useDragAndDrop] drag end', { 
      draggedItem: dragState.draggedItem, 
      draggedOverIndex: dragState.draggedOverIndex,
      dragStart: dragStartRef.current 
    });

    // Save state BEFORE resetting (in case we need it for FLIP)
    const wasDragging = dragState.isDragging;
    const draggedItem = dragState.draggedItem;
    const draggedOverIndex = dragState.draggedOverIndex;
    const fromIndex = dragStartRef.current;

    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '';
      e.currentTarget.style.transform = '';
      e.currentTarget.classList.remove('is-dragging');
    }

    // Reset state FIRST (before reorder) so FLIP can detect the change
    setDragState({
      draggedItem: null,
      draggedOverIndex: null,
      isDragging: false,
    });
    dragStartRef.current = null;

    // Perform reorder if we have valid drop target (use saved values)
    if (
      wasDragging &&
      draggedItem &&
      draggedOverIndex !== null &&
      fromIndex !== null &&
      fromIndex !== draggedOverIndex
    ) {
      console.log('[useDragAndDrop] reordering', { 
        from: fromIndex, 
        to: draggedOverIndex 
      });
      // Use setTimeout to ensure state reset completes before reorder
      // This allows FLIP to detect isDragging: false
      setTimeout(() => {
        onReorder(fromIndex, draggedOverIndex);
        // Reset flag after reorder completes
        setTimeout(() => {
          isDragEndingRef.current = false;
        }, 100);
      }, 0);
    } else {
      console.log('[useDragAndDrop] no reorder - invalid drop target');
      // Reset flag immediately if no reorder
      setTimeout(() => {
        isDragEndingRef.current = false;
      }, 100);
    }
  }, [dragState, onReorder]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    e.dataTransfer.dropEffect = 'move';

    if (dragState.draggedOverIndex !== index) {
      console.log('[useDragAndDrop] drag over', { index, draggedOverIndex: dragState.draggedOverIndex });
      setDragState(prev => ({
        ...prev,
        draggedOverIndex: index,
      }));
    }
  }, [dragState.draggedOverIndex]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragState(prev => ({
        ...prev,
        draggedOverIndex: null,
      }));
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // The actual reorder is handled in handleDragEnd
  }, []);

  return {
    dragState,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
```

---

### `apps/web/src/hooks/useKeyboardReorder.ts`

**Role:** Hook for keyboard-based reordering (ArrowUp/ArrowDown keys).

**Code:**

```1:83:apps/web/src/hooks/useKeyboardReorder.ts
import { useCallback, useRef } from 'react';

export interface KeyboardReorderOptions {
  items: Array<{ id: string }>;
  onReorder: (fromIndex: number, toIndex: number) => void;
  getItemElement: (index: number) => HTMLElement | null;
  announceChange?: (message: string) => void;
}

/**
 * Process: Keyboard Reordering
 * Purpose: Enable keyboard navigation (ArrowUp/ArrowDown) to reorder items
 * Data Source: Item list and focus state
 * Update Path: Pass onReorder callback from parent
 * Dependencies: Focus management, aria-live announcements
 */
export function useKeyboardReorder({
  items,
  onReorder,
  getItemElement,
  announceChange
}: KeyboardReorderOptions) {
  const focusedIndexRef = useRef<number | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent, index: number) => {
    // Only handle if focused item has drag handle focused or card is focused
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      // Prevent default scrolling
      e.preventDefault();
      e.stopPropagation();

      const currentIndex = focusedIndexRef.current ?? index;
      let newIndex: number;

      if (e.key === 'ArrowUp') {
        newIndex = Math.max(0, currentIndex - 1);
      } else {
        newIndex = Math.min(items.length - 1, currentIndex + 1);
      }

      if (newIndex !== currentIndex) {
        // Move item
        onReorder(currentIndex, newIndex);
        
        // Announce change
        if (announceChange) {
          const item = items[currentIndex];
          const direction = e.key === 'ArrowUp' ? 'up' : 'down';
          announceChange(`${item.id ? item.id : 'Item'} moved ${direction}, now at position ${newIndex + 1} of ${items.length}`);
        }

        // Update focus to new position after a brief delay to allow DOM update
        setTimeout(() => {
          const newElement = getItemElement(newIndex);
          if (newElement) {
            const handle = newElement.querySelector('.handle, .drag-handle') as HTMLElement;
            if (handle) {
              handle.focus();
            } else {
              newElement.focus();
            }
            focusedIndexRef.current = newIndex;
          }
        }, 50);
      } else {
        // Can't move further - announce
        if (announceChange) {
          announceChange(`Already at ${e.key === 'ArrowUp' ? 'top' : 'bottom'} of list`);
        }
      }
    }
  }, [items, onReorder, getItemElement, announceChange]);

  return {
    handleKeyDown,
    setFocusedIndex: (index: number | null) => {
      focusedIndexRef.current = index;
    }
  };
}
```

---

### `apps/web/src/styles/cards.css`

**Role:** CSS styles for drag states, animations, and visual feedback.

**Key Drag Styles:**
- `.tab-card.is-dragging` - Desktop drag animation (scale + rotate)
- `.card-mobile.is-dragging` - Mobile drag styling (no rotation, flat)
- `.is-drop-target` - Drop target highlight animation
- `[data-item-index].is-dragging` - Wrapper drag styling
- Drag handle hover/active states

**Relevant Code:**

```3:61:apps/web/src/styles/cards.css
/* Drag Handle Styles */
.tab-card .handle {
  opacity: 0.4; /* More visible by default for better discoverability */
  transition:
    opacity 0.2s ease,
    transform 0.15s ease-out,
    border-color 0.2s ease,
    background-color 0.2s ease;
  pointer-events: auto; /* Always allow pointer events */
}

.tab-card:hover .handle,
.tab-card:focus-within .handle,
.tab-card:focus-visible .handle {
  opacity: 1; /* Fully visible on hover/interaction */
  pointer-events: auto;
}

/* Enhanced hover effects on drag handle */
.tab-card .handle:hover {
  transform: scale(1.05);
  transition:
    transform 0.15s ease-out,
    opacity 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;
}

/* Active state animation */
.tab-card .handle:active {
  transform: scale(0.98);
  transition: transform 0.1s ease-out;
}

/* Drag state - handle becomes more prominent */
.tab-card .handle.is-dragging,
.tab-card.is-dragging .handle {
  opacity: 1;
  border-color: var(--accent) !important;
  background-color: color-mix(in srgb, var(--accent) 15%, transparent) !important;
  transform: scale(1.1);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--accent) 30%, transparent);
}

.tab-card .handle:focus-visible {
  opacity: 1;
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 6px;
}

/* Fallback for browsers without color-mix support */
@supports not (color-mix: srgb) {
  .tab-card .handle.is-dragging,
  .tab-card.is-dragging .handle {
    background-color: rgba(77, 163, 255, 0.15) !important;
    box-shadow: 0 2px 8px rgba(77, 163, 255, 0.3);
  }
}
```

```400:471:apps/web/src/styles/cards.css
/* Medium Priority: Animated drag start - smooth entrance */
.tab-card.is-dragging {
  animation: dragStartAnimation 0.2s ease-out forwards;
  z-index: var(--z-dragging, 100) !important; /* Above base content, below modals */
  position: relative !important; /* Ensure z-index works */
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--accent);
  border-color: var(--accent) !important;
}

/* Mobile cards: flat drag (no rotation) */
/* Note: Transform is handled by DragHandle inline styles during active drag */
/* This rule only applies visual styling (shadow, z-index) without conflicting transforms */
.card-mobile.is-dragging {
  z-index: var(--z-dragging, 100) !important; /* Above base content, below modals */
  position: relative !important; /* Ensure z-index works */
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--accent) !important;
  border-color: var(--accent) !important;
  /* Ensure card stays full-width and aligned */
  width: 100% !important;
  max-width: 100% !important;
  /* Don't apply transform here - let DragHandle inline style handle it */
  /* This prevents animation conflicts with the drag transform */
}

@keyframes dragStartAnimation {
  0% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: scale(1.02) rotate(2deg);
    opacity: 0.95;
  }
}

/* Drop target animation - smooth highlight */
.tab-card.is-drop-target,
.card-mobile.is-drop-target {
  animation: dropTargetAnimation 0.2s ease-out forwards;
}

@keyframes dropTargetAnimation {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
  100% {
    transform: scale(1.02);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }
}

/* Ensure wrapper div stays on top during drag */
[data-item-index].is-dragging {
  z-index: var(--z-dragging, 100) !important; /* Above base content, below modals */
  position: relative !important;
  /* Ensure wrapper stays full-width and aligned during drag */
  width: 100% !important;
  max-width: 100% !important;
  /* Don't apply transform here - DragHandle inline style handles it */
  /* This prevents conflicts and ensures proper alignment */
  /* Force isolation to ensure z-index works across stacking contexts */
  isolation: isolate;
}

/* Ensure SwipeableCard and card-mobile inside dragged wrapper respect z-index */
[data-item-index].is-dragging > *,
[data-item-index].is-dragging .swipeable,
[data-item-index].is-dragging .card-mobile {
  position: relative;
  z-index: inherit;
}
```

---

### `apps/web/src/styles/tokens.css`

**Role:** CSS custom properties (tokens) including z-index scale for drag layering.

**Relevant Code:**

```16:23:apps/web/src/styles/tokens.css
  /* Z-index scale */
  --z-base: 0;
  --z-dragging: 100; /* Dragged cards - above base content, below modals */
  --z-nav: 1000;
  --z-dropdown: 2000;
  --z-overlay: 3000;
  --z-modal: 4000;
  --z-toast: 5000;
```

---

### `apps/web/src/lib/storage.ts`

**Role:** Library persistence layer that saves custom order to localStorage.

**Key Functions:**
- `Library.reorder(listName, fromIndex, toIndex)` - Reorders items and saves custom order
- `Library.resetCustomOrder(listName)` - Clears custom order
- `queueCustomOrderSave(tabKey, orderIds)` - Debounced custom order persistence

**Relevant Code:**

```125:153:apps/web/src/lib/storage.ts
let pendingCustomOrder: { tabKey: string; orderIds: string[] } | null = null;

// Debounced save function
const debouncedSave = debounce(() => {
  try {
    // Save custom order if pending
    if (pendingCustomOrder) {
      localStorage.setItem(
        `flk.tab.${pendingCustomOrder.tabKey}.order.custom`,
        JSON.stringify(pendingCustomOrder.orderIds)
      );
      pendingCustomOrder = null;
    }
  } catch (e) {
    console.warn("Failed to save custom order to localStorage:", e);
  }
}, 500); // 500ms debounce

// Queue a custom order save (debounced)
function queueCustomOrderSave(tabKey: string, orderIds: string[]) {
  pendingCustomOrder = { tabKey, orderIds };
  debouncedSave();
}
```

```430:465:apps/web/src/lib/storage.ts
    // Queue custom order save (debounced, idempotent)
    try {
      const tabKey = list === "wishlist" ? "want" : list;
      const orderIds = reorderedItems.map(
        (item) => `${item.id}:${item.mediaType}`
      );
      queueCustomOrderSave(tabKey, orderIds);
    } catch (e) {
      console.warn("Failed to queue custom order save:", e);
    }

    console.log(
      `🔄 Reordered ${list} list: moved item from ${fromIndex} to ${toIndex}`
    );

    // Trigger Firebase sync via event
    const currentUser = getCurrentFirebaseUser();
    if (currentUser) {
      window.dispatchEvent(
        new CustomEvent("library:changed", {
          detail: { uid: currentUser.uid, operation: "reorder" },
        })
      );
    }
  },

  // Reset custom order for a tab
  resetCustomOrder(list: ListName) {
    try {
      const tabKey = list === "wishlist" ? "want" : list;
      localStorage.removeItem(`flk.tab.${tabKey}.order.custom`);
      console.log(`🔄 Reset custom order for ${tabKey} tab`);
    } catch (e) {
      console.warn("Failed to reset custom order:", e);
    }
  },
```

---

## 3. Behavior Summary

### How Drag is Started

**Desktop:**
1. User clicks and holds drag handle (`.handle` element in `TabCard.tsx`)
2. Native `onDragStart` event fires (line 910-914 in `TabCard.tsx`)
3. `handleDragStart` from `useDragAndDrop` hook sets `dragState.isDragging = true`
4. Visual feedback: card opacity 0.5, rotate 2deg (inline styles in `useDragAndDrop.ts:46-48`)

**Mobile:**
1. User touches drag handle (`.drag-handle` element in `DragHandle.tsx`)
2. Non-passive `touchstart` listener in capture phase prevents SwipeableCard from handling
3. Touch-hold timer starts (200ms default, 400ms if flag disabled)
4. After hold duration: `setIsDragging(true)`, haptic feedback (15ms vibration), `onDragStart` callback fires
5. SwipeableCard swipe disabled via `pointerEvents: 'none'` and `data-drag-active="true"` attribute

### How Item Position is Updated and Persisted

**During Drag:**
- **Desktop:** Browser handles drag ghost image, `onDragOver` events update `draggedOverIndex`
- **Mobile:** `handleGlobalTouchMove` in `DragHandle.tsx` applies inline `transform: translate3d(0, ${deltaY}px, 0) scale(${scale})` to wrapper element
- Drop target detection: `elementFromPoint()` finds card under touch point, dispatches `touchdragover` custom event

**On Drop:**
1. `handleDragEnd` in `useDragAndDrop.ts` resets drag state
2. If valid drop target: calls `handleReorder(fromIndex, toIndex)` in `ListPage.tsx`
3. `handleReorder` captures positions BEFORE reorder (for FLIP), calls `Library.reorder()`, switches to "Custom" sort mode
4. `Library.reorder()` updates in-memory state and queues debounced localStorage save (`flk.tab.{tabKey}.order.custom`)
5. FLIP animation runs after state update completes

### Visual Changes During Drag

**Desktop Cards (`.tab-card.is-dragging`):**
- `z-index: 100` (via `--z-dragging` token)
- `box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--accent)`
- `border-color: var(--accent)`
- Animation: `dragStartAnimation` (scale 1.02, rotate 2deg, opacity 0.95)
- Inline styles: `opacity: 0.5`, `transform: rotate(2deg)` (from `useDragAndDrop.ts`)

**Mobile Cards (`.card-mobile.is-dragging`):**
- `z-index: 100` (via `--z-dragging` token)
- `box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--accent)`
- `border-color: var(--accent)`
- **No rotation** - flat drag only
- Inline transform: `translate3d(0, ${deltaY}px, 0) scale(${scale})` applied to `[data-item-index]` wrapper
- `opacity: 0.9` during drag
- `width: 100%`, `max-width: 100%` to maintain full-width alignment

**Drop Target (`.is-drop-target`):**
- Animation: `dropTargetAnimation` (scale 1.02, blue glow shadow)
- Applied to both `.tab-card` and `.card-mobile`

### Different Code Paths: Desktop vs Mobile

**Desktop:**
- Uses native HTML5 Drag API (`draggable={true}`)
- Drag handle shows on hover/focus (opacity transition)
- Browser provides drag ghost image
- `onDragOver` events fire natively
- Visual feedback: rotation + scale animation

**Mobile:**
- Custom touch event handling (non-passive listeners in capture phase)
- Touch-hold detection (200ms timer)
- Haptic feedback on drag start
- Inline transform applied to wrapper element
- SwipeableCard swipe disabled during drag
- Custom `touchdragover` event dispatched for drop target detection
- Visual feedback: flat translate + scale only (no rotation)
- Handle always visible (dimmed 0.5 opacity, full on touch-hold)

**Shared:**
- Both use `useDragAndDrop` hook for state management
- Both use FLIP animation after drop
- Both persist custom order via `Library.reorder()`
- Both support keyboard reordering (ArrowUp/ArrowDown)

---

## 4. Feature Flags

- `flag:drag-touch-hold-reduced` - Controls touch-hold duration (default: 200ms, disabled: 400ms)
- `flag:drag-animation-v1` - Controls FLIP animation (default: enabled, set to `"false"` to disable)

---

## 5. Data Attributes & Classes

**Data Attributes:**
- `data-item-index` - Applied to wrapper div in `ListPage.tsx`, used for drop target detection
- `data-drag-active="true"` - Applied to SwipeableCard wrapper during mobile drag to disable swipe

**CSS Classes:**
- `.is-dragging` - Applied to dragged card and wrapper
- `.is-drop-target` - Applied to drop target card
- `.drag-handle` - Drag handle element
- `.handle` - Desktop drag handle (alternative class name)
- `.card-mobile` - Mobile card container
- `.tab-card` - Desktop card container

---

## 6. Accessibility

- `aria-grabbed` attribute on drag handle and card
- `aria-dropeffect="move"` on drop targets
- `aria-label` on drag handle with keyboard instructions
- Keyboard support: ArrowUp/ArrowDown to reorder
- `aria-live` region for screen reader announcements
- Focus management: maintains focus on drag handle after reorder

---

**End of Report**

