import { useState, useRef, useEffect } from "react";
import { ActionItem, ActionContext } from "./actionsMap";
import type {
  CardActionHandlers,
  MediaItem,
} from "../../components/cards/card.types";
import { Portal } from "../../components/overlay/Portal";
import { useSettings } from "../../lib/settings";
import { useProStatus } from "../../lib/proStatus";
import { shareShowWithFallback } from "../../lib/shareLinks";
import { useToast } from "../../components/Toast";

interface CompactOverflowMenuProps {
  item: ActionItem;
  context: ActionContext;
  actions?: CardActionHandlers; // Add actions prop for real functionality
  showText?: boolean; // Show "More" text or just ellipses icon (default: true)
}

interface MenuPosition {
  top: number;
  left: number;
  direction: "up" | "down";
}

export function CompactOverflowMenu({
  item,
  context,
  actions,
  showText = true,
}: CompactOverflowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    top: 0,
    left: 0,
    direction: "down",
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const settings = useSettings();
  const proStatus = useProStatus();
  const { addToast } = useToast();

  // Calculate menu position
  const calculatePosition = () => {
    if (!buttonRef.current || !menuRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Default: position below button, aligned to right edge (top-end / bottom-end)
    // This avoids covering card content (poster, title, buttons)
    let top = buttonRect.bottom + 4; // Small gap
    let left = buttonRect.right - menuRect.width; // Align to right edge
    let direction: "up" | "down" = "down";

    // Check if menu would overflow bottom
    if (
      top + menuRect.height > viewportHeight &&
      buttonRect.top > menuRect.height
    ) {
      // Flip up if there's space above
      top = buttonRect.top - menuRect.height - 4; // Small gap
      direction = "up";
    }

    // Keep within viewport width (prefer right alignment, but adjust if needed)
    if (left + menuRect.width > viewportWidth) {
      left = viewportWidth - menuRect.width - 8;
    }
    if (left < 8) {
      left = 8;
    }
    
    // Ensure menu doesn't go above viewport
    if (top < 8) {
      top = 8;
    }

    setMenuPosition({ top, left, direction });
  };

  // Reposition on open and resize/scroll
  useEffect(() => {
    if (!isOpen) return;

    calculatePosition();

    const handleResize = () => calculatePosition();
    const handleScroll = () => calculatePosition();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
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
        menuRef.current && !menuRef.current.contains(target);

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

  // Build real menu actions from provided handlers
  const menuActions = actions ? buildMenuActions(item, context, actions) : [];

  if (menuActions.length === 0) {
    return null;
  }

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleActionClick = (action: any) => {
    // If Pro-only and user is not Pro, show upgrade prompt
    if (action.proOnly && !proStatus.isPro) {
      // Import startProUpgrade dynamically to avoid circular deps
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
    // Only show episode tracking if enabled in settings OR if user is Pro
    const episodeTrackingEnabled =
      settings.layout.episodeTracking || proStatus.isPro;

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
            label: "Remind Me",
            onClick: handlers.onSimpleReminder,
          });
        if (handlers.onGoofsOpen)
          menuItems.push({
            id: "goofs",
            label: "Goofs",
            onClick: handlers.onGoofsOpen,
            proOnly: !proStatus.isPro,
          });
        if (handlers.onExtrasOpen)
          menuItems.push({
            id: "extras",
            label: "Extras",
            onClick: handlers.onExtrasOpen,
            proOnly: !proStatus.isPro,
          });
        if (handlers.onNotificationToggle)
          menuItems.push({
            id: "notifications",
            label: "Advanced Notifications",
            onClick: handlers.onNotificationToggle,
            proOnly: !proStatus.isPro,
          });
        if (handlers.onDelete)
          menuItems.push({
            id: "delete",
            label: "Delete",
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
            label: "Remind Me",
            onClick: handlers.onSimpleReminder,
          });
        if (handlers.onGoofsOpen)
          menuItems.push({
            id: "goofs",
            label: "Goofs",
            onClick: handlers.onGoofsOpen,
            proOnly: !proStatus.isPro,
          });
        if (handlers.onExtrasOpen)
          menuItems.push({
            id: "extras",
            label: "Extras",
            onClick: handlers.onExtrasOpen,
            proOnly: !proStatus.isPro,
          });
        if (handlers.onNotificationToggle)
          menuItems.push({
            id: "notifications",
            label: "Advanced Notifications",
            onClick: handlers.onNotificationToggle,
            proOnly: !proStatus.isPro,
          });
        if (handlers.onDelete)
          menuItems.push({
            id: "delete",
            label: "Delete",
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
        if (handlers.onWant)
          menuItems.push({
            id: "remove-want",
            label: "Remove from Want to Watch",
            onClick: handlers.onWant,
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
        // Simple Reminder for TV shows
        if (isTVShow && handlers.onSimpleReminder)
          menuItems.push({
            id: "reminder",
            label: "Remind Me",
            onClick: handlers.onSimpleReminder,
          });
        if (handlers.onGoofsOpen)
          menuItems.push({
            id: "goofs",
            label: "Goofs",
            onClick: handlers.onGoofsOpen,
            proOnly: !proStatus.isPro,
          });
        if (handlers.onExtrasOpen)
          menuItems.push({
            id: "extras",
            label: "Extras",
            onClick: handlers.onExtrasOpen,
            proOnly: !proStatus.isPro,
          });
        if (handlers.onNotificationToggle)
          menuItems.push({
            id: "notifications",
            label: "Advanced Notifications",
            onClick: handlers.onNotificationToggle,
            proOnly: !proStatus.isPro,
          });
        if (handlers.onDelete)
          menuItems.push({
            id: "delete",
            label: "Delete",
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
            label: "Remind Me",
            onClick: handlers.onSimpleReminder,
          });
        if (handlers.onGoofsOpen)
          menuItems.push({
            id: "goofs",
            label: "Goofs",
            onClick: handlers.onGoofsOpen,
            proOnly: !proStatus.isPro,
          });
        if (handlers.onExtrasOpen)
          menuItems.push({
            id: "extras",
            label: "Extras",
            onClick: handlers.onExtrasOpen,
            proOnly: !proStatus.isPro,
          });
        if (handlers.onNotificationToggle)
          menuItems.push({
            id: "notifications",
            label: "Advanced Notifications",
            onClick: handlers.onNotificationToggle,
            proOnly: !proStatus.isPro,
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
            label: "Delete",
            onClick: handlers.onDelete,
          });
    }

    return menuItems;
  }

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
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
          backgroundColor: "var(--muted, rgba(255, 255, 255, 0.1))",
          color: "var(--text, #ffffff)",
          border: "1px solid var(--line, rgba(255, 255, 255, 0.1))",
          cursor: "pointer",
          width: showText ? "100%" : "36px",
          height: showText ? "auto" : "36px",
          minWidth: showText ? "auto" : "36px",
          minHeight: showText ? "auto" : "36px",
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
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        )}
      </button>

      {isOpen && (
        <Portal>
          <div
            ref={menuRef}
            role="menu"
            className="menu-portal"
            data-dir={menuPosition.direction}
            style={{
              position: "fixed",
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              zIndex: 1000,
              minWidth: "200px",
              maxWidth: "min(90vw, 320px)",
              maxHeight: "min(56vh, 420px)",
              overflowY: "auto",
              backgroundColor: "var(--surface-elevated, var(--card, #1a1d24))",
              border: "1px solid var(--line, rgba(255, 255, 255, 0.1))",
              borderRadius: "var(--radius-lg, 12px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)",
              transformOrigin:
                menuPosition.direction === "up" ? "bottom left" : "top left",
            }}
          >
            {menuActions.map((action, index) => (
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
                  color: action.proOnly && !proStatus.isPro 
                    ? "var(--muted, rgba(255, 255, 255, 0.5))" 
                    : "var(--text, #ffffff)",
                  fontSize: "var(--font-sm, 13px)",
                  textAlign: "left",
                  cursor: action.proOnly && !proStatus.isPro ? "not-allowed" : "pointer",
                  borderBottom:
                    index < menuActions.length - 1
                      ? "1px solid var(--line, rgba(255, 255, 255, 0.1))"
                      : "none",
                  transition: "background-color 0.2s ease",
                  opacity: action.proOnly && !proStatus.isPro ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!(action.proOnly && !proStatus.isPro)) {
                    e.currentTarget.style.backgroundColor =
                      "var(--muted, rgba(255, 255, 255, 0.1))";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {action.label}
                {action.proOnly && !proStatus.isPro && (
                  <span style={{ 
                    marginLeft: "auto", 
                    fontSize: "10px", 
                    color: "var(--accent, #4da3ff)",
                    fontWeight: "600"
                  }}>
                    PRO
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
