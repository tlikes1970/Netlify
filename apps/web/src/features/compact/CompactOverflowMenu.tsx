import ListSelectorModal from "../../components/ListSelectorModal";
import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo, useContext } from "react";
import { ActionItem, ActionContext } from "./actionsMap";
import type {
  CardActionHandlers,
  MediaItem,
} from "../../components/cards/card.types";
import { Portal } from "../../components/overlay/Portal";
import { useSettings } from "../../lib/settings";
import { useEntitlements } from "../../hooks/useEntitlements";
import { shareShowWithFallback } from "../../lib/shareLinks";
import { useToast } from "../../components/Toast";
import { isSeriesReminderEnabled } from "../../lib/seriesReminders";
import {
  computeOverflowMenuPlacement,
  resolveOverflowMenuHeight,
  type MenuPlacement,
  getMenuViewportBounds,
} from "./overflowMenuPlacement";
import { SwipeOverflowContext } from '../../components/SwipeOverflowContext';
interface CompactOverflowMenuProps {
  item: ActionItem;
  context: ActionContext;
  actions?: CardActionHandlers; // Add actions prop for real functionality
  hideStatusActions?: boolean;
  secondaryWatching?: boolean;
  customListContext?: boolean;
  showText?: boolean; // Show "More" text or just ellipses icon (default: true)
}

export function CompactOverflowMenu({
  item,
  context,
  actions,
  showText = true,
  hideStatusActions = false,
  secondaryWatching = false,
  customListContext = false,
}: CompactOverflowMenuProps) {
  const [showLists, setShowLists] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const reportOverflowOpen = useContext(SwipeOverflowContext);
  useLayoutEffect(() => {
    reportOverflowOpen?.(isOpen);
    return () => reportOverflowOpen?.(false);
  }, [isOpen, reportOverflowOpen]);
  const [menuPosition, setMenuPosition] = useState<MenuPlacement | null>(null);
  const [positionReady, setPositionReady] = useState(false);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);  const settings = useSettings();
  const { hasFullAccess, isReadOnlyMode } = useEntitlements();
  const { addToast } = useToast();

  // Build real menu actions from provided handlers (before positioning hooks)
  const menuActions = useMemo(
    () => (actions ? buildMenuActions(item, context, actions) : []),
    [actions, item, context, settings, hasFullAccess, addToast, hideStatusActions, customListContext, secondaryWatching]
  );

  const updateMenuPosition = useCallback(() => {
    if (!buttonRef.current || !menuPanelRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const menuEl = menuPanelRef.current;
    const viewport = getMenuViewportBounds();
    // Measure against the current viewport, including when it expands again.
    // Restore live styles before scheduling React's final placement so an open
    // panel cannot briefly expand at its old coordinates during repositioning.
    const previousLimits = {
      maxHeight: menuEl.style.maxHeight,
      maxWidth: menuEl.style.maxWidth,
      minWidth: menuEl.style.minWidth,
    };
    menuEl.style.maxHeight = `min(56vh, 420px, ${Math.max(0, viewport.bottom - viewport.top)}px)`;
    menuEl.style.maxWidth = `min(90vw, 320px, ${Math.max(0, viewport.right - viewport.left)}px)`;
    menuEl.style.minWidth = `min(200px, ${Math.max(0, viewport.right - viewport.left)}px)`;
    const actualHeight = menuEl.offsetHeight;
    const actualWidth = menuEl.offsetWidth;
    Object.assign(menuEl.style, previousLimits);
    const menuHeight = resolveOverflowMenuHeight(actualHeight, menuActions.length);
    const menuWidth = actualWidth || 200;
    const placement = computeOverflowMenuPlacement({
      buttonRect,
      menuWidth,
      menuHeight,
      viewport,
    });
    setMenuPosition(placement);
    setPositionReady(
      actualHeight > 0 && actualWidth > 0 &&
      placement.maxHeight > 0 && placement.maxWidth > 0
    );
  }, [menuActions.length]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();
    const raf = requestAnimationFrame(updateMenuPosition);
    return () => cancelAnimationFrame(raf);
  }, [isOpen, updateMenuPosition]);

  // Reposition on resize/scroll/visualViewport changes
  useEffect(() => {
    if (!isOpen) return;

    const handleReposition = () => updateMenuPosition();

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("capacitor-safe-area", handleReposition);
    window.visualViewport?.addEventListener("resize", handleReposition);
    window.visualViewport?.addEventListener("scroll", handleReposition);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("capacitor-safe-area", handleReposition);
      window.visualViewport?.removeEventListener("resize", handleReposition);
      window.visualViewport?.removeEventListener("scroll", handleReposition);
    };
  }, [isOpen, updateMenuPosition]);
  useEffect(() => {
    if (!isOpen) return;
    const close = () => setIsOpen(false);
    window.addEventListener('flicklet:overflow-open', close);
    return () => window.removeEventListener('flicklet:overflow-open', close);
  }, [isOpen]);
  // Close menu on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: Event) => {
      const target = e.target as Node;
      // Check if click is outside both button and menu
      const isOutsideButton =
        buttonRef.current && !buttonRef.current.contains(target);
      const isOutsideMenu =
        menuPanelRef.current && !menuPanelRef.current.contains(target);
      if (isOutsideButton && isOutsideMenu) {
        setIsOpen(false);
        buttonRef.current?.focus(); // Return focus to button
      }
    };

    // Small delay to avoid closing on the same click that opened it
    const timeoutId = setTimeout(() => {
      // Use capture phase to catch all clicks
      // Passive: true for better scroll performance (not preventing default)
      document.addEventListener("mousedown", handleClickOutside, {
        capture: true,
      });
      document.addEventListener("touchstart", handleClickOutside, {
        passive: true,
        capture: true,
      });
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside, {
        capture: true,
      });
      document.removeEventListener("touchstart", handleClickOutside, {
        passive: true,
        capture: true,
      } as AddEventListenerOptions);
    };
  }, [isOpen]);

  if (menuActions.length === 0) {    return null;
  }

  const handleToggle = () => {
    if (!isOpen) {
      // Notify other card menus before opening this one.
      window.dispatchEvent(new Event('flicklet:overflow-open'));
      setPositionReady(false);
      setMenuPosition(null);
    }
    setIsOpen(!isOpen);
  };

  const handleActionClick = (action: any) => {
    // If Pro-only and user is not Pro, show upgrade prompt
    if (action.proOnly && !hasFullAccess) {
      if (isReadOnlyMode) {
        import("../../lib/readOnlyGuard").then(({ notifyReadOnlyBlocked }) => {
          notifyReadOnlyBlocked();
        });
        return;
      }
      import("../../lib/proUpgrade").then(({ startProUpgrade }) => {
        startProUpgrade();
      });
      setIsOpen(false);
      return;
    }
    action.onClick(item);
    setIsOpen(false);
  };

  // Build menu actions based on context and available handlers
  function buildMenuActions(
    _item: ActionItem,
    context: ActionContext,
    handlers: CardActionHandlers
  ) {
    const menuItems: Array<{
      id: string;
      label: string;
      onClick: (item: MediaItem) => void;
      proOnly?: boolean;
    }> = [];

    // Check if item is a TV show (for episode tracking)
    const isTVShow = (_item as any)?.mediaType === "tv";
    // Episode tracking is available to every user, but remains opt-in UI.
    const episodeTrackingEnabled = settings.layout.episodeTracking;

    // Share handler for shows
    const handleShareShow = async (showItem: MediaItem) => {
      await shareShowWithFallback(
        {
          tmdbId: showItem.id,
          titleId: (showItem as any).titleId,
          title: showItem.title ?? "this show",
        },
        {
          onSuccess: () => {
            addToast("Share link copied to clipboard!", "success");
          },
          onError: (error) => {
            console.error("Share failed:", error);
            addToast("Failed to share", "error");
          },
        }
      );
    };

    // Add context-appropriate actions
    switch (context) {
      case "tab-watching":
        // Open Details - always first
        if (handlers.onOpen)
          menuItems.push({
            id: "open",
            label: "Open Details",
            onClick: handlers.onOpen,
          });
        // Share this show
        menuItems.push({
          id: "share",
          label: "Share this show",
          onClick: handleShareShow,
        });
        if (handlers.onWant)
          menuItems.push({
            id: "want",
            label: "Want to Watch",
            onClick: handlers.onWant,
          });
        if (handlers.onNotInterested)
          menuItems.push({
            id: "not-interested",
            label: "Not Interested",
            onClick: handlers.onNotInterested,
          });
        if (isTVShow && episodeTrackingEnabled && handlers.onEpisodeTracking)
          menuItems.push({
            id: "episodes",
            label: "Episodes",
            onClick: handlers.onEpisodeTracking,
          });
        if (handlers.onNotesEdit)
          menuItems.push({
            id: "notes",
            label: "Notes & Tags",
            onClick: handlers.onNotesEdit,
          });
        // Simple Reminder for TV shows
        if (isTVShow && handlers.onSimpleReminder)
          menuItems.push({
            id: "reminder",
            label: isSeriesReminderEnabled(_item.id) ? "✓ Reminded" : "Remind Me",
            onClick: handlers.onSimpleReminder,
          });
        if (handlers.onGoofsOpen)
          menuItems.push({
            id: "goofs",
            label: "Shows Like This",
            onClick: handlers.onGoofsOpen,
            proOnly: !hasFullAccess,
          });
        if (handlers.onExtrasOpen)
          menuItems.push({
            id: "extras",
            label: "Extras",
            onClick: handlers.onExtrasOpen,
            proOnly: !hasFullAccess,
          });
        if (handlers.onDelete)
          menuItems.push({
            id: "delete",
            label: customListContext ? "Remove from this List" : "Delete",
            onClick: handlers.onDelete,
          });
        break;

      case "tab-watched":
        // Open Details - always first
        if (handlers.onOpen)
          menuItems.push({
            id: "open",
            label: "Open Details",
            onClick: handlers.onOpen,
          });
        // Share this show
        menuItems.push({
          id: "share",
          label: "Share this show",
          onClick: handleShareShow,
        });
        if (handlers.onWant)
          menuItems.push({
            id: "want",
            label: "Want to Watch",
            onClick: handlers.onWant,
          });
        if (handlers.onNotInterested)
          menuItems.push({
            id: "not-interested",
            label: "Not Interested",
            onClick: handlers.onNotInterested,
          });
        if (isTVShow && episodeTrackingEnabled && handlers.onEpisodeTracking)
          menuItems.push({
            id: "episodes",
            label: "Episodes",
            onClick: handlers.onEpisodeTracking,
          });
        if (handlers.onNotesEdit)
          menuItems.push({
            id: "notes",
            label: "Notes & Tags",
            onClick: handlers.onNotesEdit,
          });
        // Simple Reminder for TV shows
        if (isTVShow && handlers.onSimpleReminder)
          menuItems.push({
            id: "reminder",
            label: isSeriesReminderEnabled(_item.id) ? "✓ Reminded" : "Remind Me",
            onClick: handlers.onSimpleReminder,
          });
        if (handlers.onGoofsOpen)
          menuItems.push({
            id: "goofs",
            label: "Shows Like This",
            onClick: handlers.onGoofsOpen,
            proOnly: !hasFullAccess,
          });
        if (handlers.onExtrasOpen)
          menuItems.push({
            id: "extras",
            label: "Extras",
            onClick: handlers.onExtrasOpen,
            proOnly: !hasFullAccess,
          });
        if (handlers.onDelete)
          menuItems.push({
            id: "delete",
            label: customListContext ? "Remove from this List" : "Delete",
            onClick: handlers.onDelete,
          });
        break;

      case "tab-want":
        // Open Details - always first
        if (handlers.onOpen)
          menuItems.push({
            id: "open",
            label: "Open Details",
            onClick: handlers.onOpen,
          });
        // Share this show
        menuItems.push({
          id: "share",
          label: "Share this show",
          onClick: handleShareShow,
        });
        if (handlers.onWatched)
          menuItems.push({
            id: "watched",
            label: "Mark Watched",
            onClick: handlers.onWatched,
          });
        if (handlers.onNotInterested)
          menuItems.push({
            id: "not-interested",
            label: "Not Interested",
            onClick: handlers.onNotInterested,
          });
        if (isTVShow && episodeTrackingEnabled && handlers.onEpisodeTracking)
          menuItems.push({
            id: "episodes",
            label: "Episodes",
            onClick: handlers.onEpisodeTracking,
          });
        if (handlers.onNotesEdit)
          menuItems.push({
            id: "notes",
            label: "Notes & Tags",
            onClick: handlers.onNotesEdit,
          });
        // Simple Reminder for TV shows
        if (isTVShow && handlers.onSimpleReminder)
          menuItems.push({
            id: "reminder",
            label: isSeriesReminderEnabled(_item.id) ? "✓ Reminded" : "Remind Me",
            onClick: handlers.onSimpleReminder,
          });
        if (handlers.onGoofsOpen)
          menuItems.push({
            id: "goofs",
            label: "Shows Like This",
            onClick: handlers.onGoofsOpen,
            proOnly: !hasFullAccess,
          });
        if (handlers.onExtrasOpen)
          menuItems.push({
            id: "extras",
            label: "Extras",
            onClick: handlers.onExtrasOpen,
            proOnly: !hasFullAccess,
          });
        if (handlers.onDelete)
          menuItems.push({
            id: "delete",
            label: customListContext ? "Remove from this List" : "Delete",
            onClick: handlers.onDelete,
          });
        break;

      case "home":
      case "search":
      case "tab-foryou":
        // Open Details - always first
        if (handlers.onOpen)
          menuItems.push({
            id: "open",
            label: "Open Details",
            onClick: handlers.onOpen,
          });
        // Share this show
        menuItems.push({
          id: "share",
          label: "Share this show",
          onClick: handleShareShow,
        });
        if (handlers.onWant)
          menuItems.push({
            id: "want",
            label: "Want to Watch",
            onClick: handlers.onWant,
          });
        if (handlers.onWatched)
          menuItems.push({
            id: "watched",
            label: "Mark Watched",
            onClick: handlers.onWatched,
          });
        if (handlers.onNotInterested)
          menuItems.push({
            id: "not-interested",
            label: "Not Interested",
            onClick: handlers.onNotInterested,
          });
        if (handlers.onNotesEdit)
          menuItems.push({
            id: "notes",
            label: "Notes & Tags",
            onClick: handlers.onNotesEdit,
          });
        // Episodes for TV shows
        if (isTVShow && episodeTrackingEnabled && handlers.onEpisodeTracking)
          menuItems.push({
            id: "episodes",
            label: "Episodes",
            onClick: handlers.onEpisodeTracking,
          });
        // Simple Reminder for TV shows
        if (isTVShow && handlers.onSimpleReminder)
          menuItems.push({
            id: "reminder",
            label: isSeriesReminderEnabled(_item.id) ? "✓ Reminded" : "Remind Me",
            onClick: handlers.onSimpleReminder,
          });
        if (handlers.onGoofsOpen)
          menuItems.push({
            id: "goofs",
            label: "Shows Like This",
            onClick: handlers.onGoofsOpen,
            proOnly: !hasFullAccess,
          });
        if (handlers.onExtrasOpen)
          menuItems.push({
            id: "extras",
            label: "Extras",
            onClick: handlers.onExtrasOpen,
            proOnly: !hasFullAccess,
          });
        break;

      default:
        // Generic fallback - include common actions
        if (handlers.onOpen)
          menuItems.push({
            id: "open",
            label: "Open Details",
            onClick: handlers.onOpen,
          });
        if (handlers.onDelete)
          menuItems.push({
            id: "delete",
            label: customListContext ? "Remove from this List" : "Delete",
            onClick: handlers.onDelete,
          });
    }

    if (secondaryWatching && handlers.onWatching) {
      menuItems.push({id: "watching", label: "Watching", onClick: handlers.onWatching});
    }
    menuItems.push({ id: "custom-lists", label: "Custom Lists", onClick: () => setShowLists(true) });
    if (customListContext && handlers.onWatched) menuItems.push({id:"watched",label:"Watched",onClick:handlers.onWatched});
    return menuItems.filter(action => !hideStatusActions || !["want", "watching", "watched"].includes(action.id) || (customListContext && action.id === "watched") || (secondaryWatching && action.id === "watching"));
  }

  return (
    <div style={{ position: "relative" }}>      <button
        ref={buttonRef}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={showText ? "More" : "More options"}
        className="compact-overflow-trigger"
        style={{
          padding: "var(--space-2, 8px)",
          borderRadius: "var(--radius, 12px)",
          fontSize: "var(--font-sm, 13px)",
          backgroundColor: "transparent",
          color: "var(--text, #ffffff)",
          border: "none",
          cursor: "pointer",
          width: showText ? "100%" : "44px",
          height: showText ? "auto" : "44px",
          minWidth: showText ? "auto" : "44px",
          minHeight: showText ? "auto" : "44px",
          marginTop: "var(--space-2, 8px)",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-1, 4px)",
          opacity: 0.7,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--muted-hover, rgba(255, 255, 255, 0.15))";
          e.currentTarget.style.borderColor = "var(--accent, #4da3ff)";
          e.currentTarget.style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--muted, rgba(255, 255, 255, 0.1))";
          e.currentTarget.style.borderColor = "var(--line, rgba(255, 255, 255, 0.1))";
          e.currentTarget.style.opacity = "0.7";
        }}
      >
        {showText ? (
          <>
            More
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="19" r="1" />
            <circle cx="12" cy="5" r="1" />
          </svg>
        )}
      </button>

      {showLists && <ListSelectorModal isOpen onClose={() => setShowLists(false)} item={item as MediaItem} />}
      {isOpen && (
        <Portal>
          <div
            ref={menuPanelRef}
            role="menu"
            className="menu-portal compact-overflow-menu"
            data-dir={menuPosition?.direction ?? "down"}
            aria-hidden={!positionReady}
            style={{
              position: "fixed",
              top: `${menuPosition?.top ?? 0}px`,
              left: `${menuPosition?.left ?? 0}px`,
              minWidth: `min(200px, ${menuPosition?.maxWidth ?? 200}px)`,
              maxWidth: `min(90vw, 320px, ${menuPosition?.maxWidth ?? 320}px)`,
              maxHeight: `min(56vh, 420px, ${menuPosition?.maxHeight ?? 420}px)`,
              visibility: positionReady ? "visible" : "hidden",
              pointerEvents: positionReady ? "auto" : "none",
              animation: positionReady ? undefined : "none",
              overflowY: "auto",
              backgroundColor: "var(--surface-elevated, var(--card, #1a1d24))",
              border: "1px solid var(--line, rgba(255, 255, 255, 0.1))",
              borderRadius: "var(--radius-lg, 12px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)",
              transformOrigin:
                menuPosition?.direction === "up" ? "bottom left" : "top left",
            }}
          >            {menuActions.map((action, index) => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                role="menuitem"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "var(--space-2, 8px) var(--space-3, 12px)",
                  border: 0,
                  background: "transparent",
                  color: action.proOnly && !hasFullAccess 
                    ? "var(--muted, rgba(255, 255, 255, 0.5))" 
                    : "var(--text, #ffffff)",
                  fontSize: "var(--font-sm, 13px)",
                  textAlign: "left",
                  cursor: action.proOnly && !hasFullAccess ? "not-allowed" : "pointer",
                  borderBottom:
                    index < menuActions.length - 1
                      ? "1px solid var(--line, rgba(255, 255, 255, 0.1))"
                      : "none",
                  transition: "background-color 0.2s ease",
                  opacity: action.proOnly && !hasFullAccess ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!(action.proOnly && !hasFullAccess)) {
                    e.currentTarget.style.backgroundColor =
                      "var(--muted, rgba(255, 255, 255, 0.1))";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {action.label}
                {action.proOnly && !hasFullAccess && (
                  <span style={{ 
                    marginLeft: "auto", 
                    fontSize: "10px", 
                    color: "var(--accent, #4da3ff)",
                    fontWeight: "600"
                  }}>
                    FULL ACCESS
                  </span>
                )}
              </button>
            ))}
          </div>
        </Portal>
      )}
    </div>
  );
}
