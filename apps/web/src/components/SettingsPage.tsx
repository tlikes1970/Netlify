import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useTranslations } from "../lib/language";
import { useAdminRole } from "../hooks/useAdminRole";
import { lockScroll, unlockScroll } from "../utils/scrollLock";
import NotInterestedModal from "./modals/NotInterestedModal";
import { getVisibleSections, type SettingsSectionId } from "./settingsConfig";
import { renderSettingsSection } from "./settingsSections";
import { isMobileNow } from "../lib/isMobile";
import { useUsername } from "../hooks/useUsername";
import { useLibrary } from "../lib/storage";
import { useCustomLists } from "../lib/customLists";
import { Library } from "../lib/storage";
import type { MediaItem } from "./cards/card.types";
import type { ListName } from "../state/library.types";

// Lazy load heavy notification modals
const NotificationSettings = lazy(() =>
  import("./modals/NotificationSettings").then((m) => ({
    default: m.NotificationSettings,
  }))
);
const NotificationCenter = lazy(() =>
  import("./modals/NotificationCenter").then((m) => ({
    default: m.NotificationCenter,
  }))
);

export default function SettingsPage({ onClose }: { onClose: () => void }) {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("account");
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [showNotInterestedModal, setShowNotInterestedModal] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] =
    useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showMobileSectionMenu, setShowMobileSectionMenu] = useState(false);
  const translations = useTranslations();
  const { isAdmin } = useAdminRole();
  const isMobile = isMobileNow();
  
  // Map old tab navigation events to new sections
  useEffect(() => {
    const handleNavigateToPro = () => {
      setActiveSection("pro");
    };
    const handleNavigateToLayout = () => {
      setActiveSection("display");
    };
    const handleNavigateToSection = (e: Event) => {
      const customEvent = e as CustomEvent<{ sectionId: SettingsSectionId }>;
      if (customEvent.detail?.sectionId) {
        setActiveSection(customEvent.detail.sectionId);
      }
    };

    window.addEventListener(
      "navigate-to-pro-settings",
      handleNavigateToPro as EventListener
    );
    window.addEventListener(
      "navigate-to-layout-settings",
      handleNavigateToLayout as EventListener
    );
    window.addEventListener(
      "navigate-to-settings-section",
      handleNavigateToSection as EventListener
    );
    return () => {
      window.removeEventListener(
        "navigate-to-pro-settings",
        handleNavigateToPro as EventListener
      );
      window.removeEventListener(
        "navigate-to-layout-settings",
        handleNavigateToLayout as EventListener
      );
      window.removeEventListener(
        "navigate-to-settings-section",
        handleNavigateToSection as EventListener
      );
    };
  }, []);

  // Resizable modal state
  const modalRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [modalSize, setModalSize] = useState(() => {
    // Load saved size from localStorage
    const saved = localStorage.getItem("settings-modal-size");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { width: parsed.width || 1024, height: parsed.height || 600 };
      } catch {
        // Fallback to defaults if parse fails
      }
    }
    return { width: 1024, height: 600 };
  });

  // Lock scroll when settings modal is open
  useEffect(() => {
    lockScroll();
    return () => {
      unlockScroll();
    };
  }, []);

  // Listen for navigation to Pro tab (from startProUpgrade)
  useEffect(() => {
    const handleNavigateToPro = () => {
      setActiveSection("pro");
    };

    window.addEventListener(
      "navigate-to-pro-settings",
      handleNavigateToPro as EventListener
    );
    return () => {
      window.removeEventListener(
        "navigate-to-pro-settings",
        handleNavigateToPro as EventListener
      );
    };
  }, []);

  // Listen for navigation to Layout tab (from For You section)
  useEffect(() => {
    const handleNavigateToLayout = () => {
      setActiveSection("display");
    };

    window.addEventListener(
      "navigate-to-layout-settings",
      handleNavigateToLayout as EventListener
    );
    return () => {
      window.removeEventListener(
        "navigate-to-layout-settings",
        handleNavigateToLayout as EventListener
      );
    };
  }, []);

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!modalRef.current || !resizeStartRef.current) return;

      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;

      const newWidth = Math.max(
        320,
        Math.min(window.innerWidth - 32, resizeStartRef.current.width + deltaX)
      );
      const newHeight = Math.max(
        400,
        Math.min(
          window.innerHeight - 100,
          resizeStartRef.current.height + deltaY
        )
      );

      setModalSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
      // Save size to localStorage
      if (modalRef.current) {
        const currentSize = {
          width: modalRef.current.offsetWidth,
          height: modalRef.current.offsetHeight,
        };
        localStorage.setItem(
          "settings-modal-size",
          JSON.stringify(currentSize)
        );
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "nwse-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height,
      };
      setIsResizing(true);
    }
  };

  // Get visible sections (filters out admin if not admin)
  const visibleSections = getVisibleSections(isAdmin);

  return (
    <div
      className={`fixed inset-0 z-modal backdrop-blur-sm flex ${isMobile ? 'items-start' : 'items-start justify-center'} ${isMobile ? '' : 'pt-24 p-4'}`}
      style={{
        backgroundColor: "rgba(0,0,0,0.8)",
        ...(isMobile ? {
          top: 0,
          left: 0,
          padding: 0,
        } : {}),
      }}
    >
      <div
        ref={modalRef}
        className={`flex ${isMobile ? 'flex-col' : ''} overflow-hidden relative ${isMobile ? '' : 'rounded-xl'}`}
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--line)",
          border: "1px solid",
          // Mobile: full-screen
          ...(isMobile ? {
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            maxWidth: "100vw",
            maxHeight: "100vh",
            minWidth: 0,
            minHeight: 0,
            borderRadius: 0,
          } : {
            // Desktop: resizable modal
            width: `min(${modalSize.width}px, 100vw - 32px)`,
            height: `${modalSize.height}px`,
            minWidth: "320px",
            minHeight: "400px",
            maxWidth: "min(1024px, 100vw - 32px)",
            maxHeight: "95vh",
          }),
        }}
      >
        {/* Mobile Header */}
        {isMobile && (
          <>
            <div
              className="flex items-center justify-between p-4 flex-shrink-0"
              style={{
                backgroundColor: "var(--btn)",
                borderBottomColor: "var(--line)",
                borderBottom: "1px solid",
              }}
            >
              <button
                onClick={() => setShowMobileSectionMenu(!showMobileSectionMenu)}
                className="flex items-center space-x-2 transition-colors"
                style={{ color: "var(--text)" }}
                aria-label="Select section"
              >
                <h2
                  className="text-lg font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  {visibleSections.find((s) => s.id === activeSection)?.label || translations.settings}
                </h2>
                <svg
                  className={`w-5 h-5 transition-transform ${showMobileSectionMenu ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="transition-colors ml-4"
                style={{ color: "var(--muted)" }}
                aria-label="Close Settings"
              >
                <svg
                  className="w-6 h-6"
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
            {/* Mobile Section Menu */}
            {showMobileSectionMenu && (
              <div
                className="flex-shrink-0 border-b"
                style={{
                  backgroundColor: "var(--card)",
                  borderBottomColor: "var(--line)",
                }}
              >
                <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                  {visibleSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => {
                        setActiveSection(section.id);
                        setShowMobileSectionMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg transition-colors"
                      style={{
                        backgroundColor:
                          activeSection === section.id ? "var(--btn)" : "transparent",
                        color: activeSection === section.id ? "var(--text)" : "var(--muted)",
                      }}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Desktop Header - Title and Close button at top */}
        {!isMobile && (
          <div
            className="hidden lg:flex absolute top-0 left-0 right-0 h-16 items-center justify-between px-6 flex-shrink-0 z-10"
            style={{
              backgroundColor: "var(--card)",
              borderBottomColor: "var(--line)",
              borderBottom: "1px solid",
            }}
          >
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--text)" }}
            >
              {translations.settings}
            </h2>
            <button
              onClick={onClose}
              className="transition-colors"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--muted)")
              }
              aria-label="Close Settings"
            >
              <svg
                className="w-6 h-6"
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
        )}

        {/* Left sidebar - Sections (desktop only) */}
        {!isMobile && (
          <div
            className="hidden lg:flex w-48 p-4 flex-shrink-0 flex-col"
            style={{
              backgroundColor: "var(--btn)",
              borderRightColor: "var(--line)",
              borderRight: "1px solid",
              paddingTop: "80px", // Account for header height
            }}
          >
            <nav className="space-y-1">
              {visibleSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    backgroundColor:
                      activeSection === section.id ? "var(--card)" : "transparent",
                    color: activeSection === section.id ? "var(--text)" : "var(--muted)",
                    textAlign: "left", // Ensure left alignment
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== section.id) {
                      e.currentTarget.style.backgroundColor = "var(--card)";
                      e.currentTarget.style.opacity = "0.5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== section.id) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.opacity = "1";
                    }
                  }}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Content area */}
        <div 
          className={`flex-1 overflow-y-auto ${isMobile ? 'w-full p-4' : 'p-6'}`}
          style={{
            WebkitOverflowScrolling: isMobile ? 'touch' : 'auto',
            ...(!isMobile ? {
              paddingTop: "88px", // Account for header height
            } : {}),
          }}
        >
          {renderSettingsSection(activeSection, {
            onShowNotInterestedModal: () => setShowNotInterestedModal(true),
            onShowSharingModal: () => setShowSharingModal(true),
            onShowNotificationSettings: () => setShowNotificationSettings(true),
            onShowNotificationCenter: () => setShowNotificationCenter(true),
            isMobile: isMobile,
          })}
        </div>

        {/* Resize handle - Desktop only */}
        {!isMobile && (
          <div
            ref={resizeHandleRef}
            onMouseDown={handleResizeStart}
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 z-10"
            style={{
              backgroundColor: "transparent",
            }}
            aria-label="Resize settings modal"
            title="Drag to resize"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{ color: "var(--muted)", pointerEvents: "none" }}
            >
              <path
                d="M6 10L10 6M10 10L14 6M2 14L14 2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Sharing Modal */}
      {showSharingModal && (
        <SharingModal onClose={() => setShowSharingModal(false)} />
      )}

      {/* Not Interested Modal */}
      <NotInterestedModal
        isOpen={showNotInterestedModal}
        onClose={() => setShowNotInterestedModal(false)}
      />

      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <Suspense
          fallback={
            <div className="loading-spinner">
              Loading notification settings...
            </div>
          }
        >
          <NotificationSettings
            isOpen={showNotificationSettings}
            onClose={() => setShowNotificationSettings(false)}
          />
        </Suspense>
      )}

      {/* Notification Center Modal */}
      {showNotificationCenter && (
        <Suspense
          fallback={
            <div className="loading-spinner">
              Loading notification center...
            </div>
          }
        >
          <NotificationCenter
            isOpen={showNotificationCenter}
            onClose={() => setShowNotificationCenter(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

// OLD TAB COMPONENTS REMOVED - Now using shared sections from settingsSections.tsx
// The following old components are kept for reference but are no longer used:
// - GeneralTab (replaced by AccountSection)
// - NotificationsTab (replaced by NotificationsSection)
// - LayoutTab (replaced by DisplaySection)
// - DataTab (replaced by DataSection)
// - SocialTab (removed - placeholder content)
// - CommunityTab (removed - placeholder content)
// - ProTab (replaced by ProSection)
// - AboutTab (replaced by AboutSection)

// OLD TAB COMPONENTS REMOVED - Now using shared sections from settingsSections.tsx
// The following old components have been removed:
// - GeneralTab (replaced by AccountSection)
// - NotificationsTab (replaced by NotificationsSection)  
// - LayoutTab (replaced by DisplaySection)
// - DataTab (replaced by DataSection)
// - SocialTab (removed - placeholder content)
// - CommunityTab (removed - placeholder content)
// - ProTab (replaced by ProSection)
// - AboutTab (replaced by AboutSection)

// Sharing Modal Component
function SharingModal({ onClose }: { onClose: () => void }) {
  const { username } = useUsername();
  const watchingItems = useLibrary("watching");
  const wishlistItems = useLibrary("wishlist");
  const watchedItems = useLibrary("watched");
  const userLists = useCustomLists();

  // Initialize selectedTabs with custom lists
  const [selectedTabs, setSelectedTabs] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {
        watching: true,
        wishlist: true,
        watched: true,
      };
      // Add custom lists, default to false (not selected)
      userLists.customLists.forEach((list) => {
        initial[`custom:${list.id}`] = false;
      });
      return initial;
    }
  );

  // Update selectedTabs when custom lists change
  useEffect(() => {
    setSelectedTabs((prev) => {
      const updated = { ...prev };
      // Add any new custom lists that don't exist yet
      userLists.customLists.forEach((list) => {
        const listKey = `custom:${list.id}`;
        if (!(listKey in updated)) {
          updated[listKey] = false;
        }
      });
      // Remove custom lists that no longer exist
      Object.keys(updated).forEach((key) => {
        if (key.startsWith("custom:")) {
          const listId = key.replace("custom:", "");
          if (!userLists.customLists.some((list) => list.id === listId)) {
            delete updated[key];
          }
        }
      });
      return updated;
    });
  }, [userLists.customLists]);

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [contentOptions, setContentOptions] = useState({
    includeMovies: true,
    includeTV: true,
    includeRatings: true,
    includeDescriptions: false,
  });

  const [showResult, setShowResult] = useState(false);
  const [shareableText, setShareableText] = useState("");

  // Get all items from selected tabs
  const getAllItems = () => {
    const items: MediaItem[] = [];
    if (selectedTabs.watching) items.push(...watchingItems);
    if (selectedTabs.wishlist) items.push(...wishlistItems);
    if (selectedTabs.watched) items.push(...watchedItems);

    // Add items from selected custom lists
    userLists.customLists.forEach((list) => {
      const listKey = `custom:${list.id}`;
      if (selectedTabs[listKey]) {
        const customListItems = Library.getByList(
          `custom:${list.id}` as ListName
        );
        items.push(...customListItems);
      }
    });

    return items;
  };

  // Filter items based on content options
  const getFilteredItems = () => {
    let items = getAllItems();

    if (!contentOptions.includeMovies && !contentOptions.includeTV) {
      return [];
    }

    if (!contentOptions.includeMovies) {
      items = items.filter((item) => item.mediaType !== "movie");
    }

    if (!contentOptions.includeTV) {
      items = items.filter((item) => item.mediaType !== "tv");
    }

    return items;
  };

  // Get items to include in share
  const getItemsToShare = () => {
    const filteredItems = getFilteredItems();

    if (selectedItems.size === 0) {
      return filteredItems; // If nothing selected individually, include all filtered items
    }

    return filteredItems.filter((item) =>
      selectedItems.has(item.id.toString())
    );
  };

  const handleTabToggle = (tab: string) => {
    setSelectedTabs((prev) => ({ ...prev, [tab]: !prev[tab] }));
  };

  const handleOptionToggle = (option: keyof typeof contentOptions) => {
    setContentOptions((prev) => ({ ...prev, [option]: !prev[option] }));
  };

  const handleItemToggle = (itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allItemIds = getFilteredItems().map((item) => item.id.toString());
    setSelectedItems(new Set(allItemIds));
  };

  const handleSelectNone = () => {
    setSelectedItems(new Set());
  };

  const generateShareableText = () => {
    const userName = username || "Flicklet User";
    const itemsToShare = getItemsToShare();

    let text = `🎬 Flicklet - ${userName}'s Watchlist\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (
      selectedTabs.watching &&
      itemsToShare.some((item) => watchingItems.some((w) => w.id === item.id))
    ) {
      text += `▶️ Currently Watching\n`;
      text += `${"─".repeat(30)}\n`;
      const watchingItemsToShare = itemsToShare.filter((item) =>
        watchingItems.some((w) => w.id === item.id)
      );
      watchingItemsToShare.forEach((item) => {
        const icon = item.mediaType === "movie" ? "🎬" : "📺";
        const rating =
          contentOptions.includeRatings && item.voteAverage
            ? ` ⭐ ${item.voteAverage.toFixed(1)}`
            : "";
        text += `${icon} ${item.title}${rating}\n`;
      });
      text += "\n";
    }

    if (
      selectedTabs.wishlist &&
      itemsToShare.some((item) => wishlistItems.some((w) => w.id === item.id))
    ) {
      text += `❤️ Want to Watch\n`;
      text += `${"─".repeat(30)}\n`;
      const wishlistItemsToShare = itemsToShare.filter((item) =>
        wishlistItems.some((w) => w.id === item.id)
      );
      wishlistItemsToShare.forEach((item) => {
        const icon = item.mediaType === "movie" ? "🎬" : "📺";
        const rating =
          contentOptions.includeRatings && item.voteAverage
            ? ` ⭐ ${item.voteAverage.toFixed(1)}`
            : "";
        text += `${icon} ${item.title}${rating}\n`;
      });
      text += "\n";
    }

    if (
      selectedTabs.watched &&
      itemsToShare.some((item) => watchedItems.some((w) => w.id === item.id))
    ) {
      text += `✅ Already Watched\n`;
      text += `${"─".repeat(30)}\n`;
      const watchedItemsToShare = itemsToShare.filter((item) =>
        watchedItems.some((w) => w.id === item.id)
      );
      watchedItemsToShare.forEach((item) => {
        const icon = item.mediaType === "movie" ? "🎬" : "📺";
        const rating =
          contentOptions.includeRatings && item.voteAverage
            ? ` ⭐ ${item.voteAverage.toFixed(1)}`
            : "";
        text += `${icon} ${item.title}${rating}\n`;
      });
      text += "\n";
    }

    // Add custom lists
    userLists.customLists.forEach((list) => {
      const listKey = `custom:${list.id}`;
      if (selectedTabs[listKey]) {
        const customListItems = Library.getByList(
          `custom:${list.id}` as ListName
        );
        const customItemsToShare = itemsToShare.filter((item) =>
          customListItems.some((c) => c.id === item.id)
        );
        if (customItemsToShare.length > 0) {
          text += `📋 ${list.name}\n`;
          text += `${"─".repeat(30)}\n`;
          customItemsToShare.forEach((item) => {
            const icon = item.mediaType === "movie" ? "🎬" : "📺";
            const rating =
              contentOptions.includeRatings && item.voteAverage
                ? ` ⭐ ${item.voteAverage.toFixed(1)}`
                : "";
            text += `${icon} ${item.title}${rating}\n`;
          });
          text += "\n";
        }
      }
    });

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📱 Track your shows and movies with Flicklet!\n`;
    text += `🔗 https://flicklet.netlify.app\n`;

    return text;
  };

  const handleGenerate = () => {
    const text = generateShareableText();
    setShareableText(text);
    setShowResult(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareableText);
      alert("Copied to clipboard!");
    } catch (_error) {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = shareableText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      alert("Copied to clipboard!");
    }
  };

  const filteredItems = getFilteredItems();

  if (showResult) {
    return (
      <div className="fixed inset-0 z-modal backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                📋 Your Shareable List
              </h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Copy the text below and share it with your friends! They can see
                what you're watching and get recommendations.
              </p>
            </div>

            <textarea
              value={shareableText}
              readOnly
              className="w-full h-64 p-3 border rounded-lg font-mono text-sm bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />

            <div className="flex gap-2 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm transition-colors"
                style={{
                  backgroundColor: "var(--btn)",
                  color: "var(--text)",
                  borderColor: "var(--line)",
                  border: "1px solid",
                }}
              >
                Close
              </button>
              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-lg text-sm transition-colors"
                style={{ backgroundColor: "var(--accent)", color: "white" }}
              >
                📋 Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-modal backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              📤 Share Your Lists
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Tab Selection */}
            <div>
              <h4 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">
                📋 Select Lists to Share
              </h4>
              <div className="space-y-2">
                {[
                  {
                    key: "watching",
                    label: "▶️ Currently Watching",
                    items: watchingItems,
                  },
                  {
                    key: "wishlist",
                    label: "❤️ Want to Watch",
                    items: wishlistItems,
                  },
                  {
                    key: "watched",
                    label: "✅ Already Watched",
                    items: watchedItems,
                  },
                ].map(({ key, label, items }) => (
                  <label
                    key={key}
                    className="flex items-center justify-between p-3 rounded-lg cursor-pointer"
                    style={{
                      backgroundColor: "var(--btn)",
                      borderColor: "var(--line)",
                      border: "1px solid",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTabs[key] || false}
                        onChange={() => handleTabToggle(key)}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-900 dark:text-gray-100">
                        {label}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {items.length} items
                    </span>
                  </label>
                ))}

                {/* Custom Lists */}
                {userLists.customLists.length > 0 && (
                  <>
                    <div
                      className="pt-2 mt-2 border-t"
                      style={{ borderColor: "var(--line)" }}
                    >
                      <h5 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        📋 Custom Lists
                      </h5>
                    </div>
                    {userLists.customLists.map((list) => {
                      const listKey = `custom:${list.id}`;
                      const customListItems = Library.getByList(
                        `custom:${list.id}` as ListName
                      );
                      return (
                        <label
                          key={list.id}
                          className="flex items-center justify-between p-3 rounded-lg cursor-pointer"
                          style={{
                            backgroundColor: "var(--btn)",
                            borderColor: "var(--line)",
                            border: "1px solid",
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedTabs[listKey] || false}
                              onChange={() => handleTabToggle(listKey)}
                              className="w-4 h-4"
                            />
                            <span className="text-gray-900 dark:text-gray-100">
                              📋 {list.name}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {customListItems.length} items
                          </span>
                        </label>
                      );
                    })}
                  </>
                )}
              </div>
            </div>

            {/* Content Options */}
            <div>
              <h4 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">
                🎯 Content Options
              </h4>
              <div className="space-y-2">
                {[
                  { key: "includeMovies", label: "🎬 Include Movies" },
                  { key: "includeTV", label: "📺 Include TV Shows" },
                  { key: "includeRatings", label: "⭐ Include Ratings" },
                  {
                    key: "includeDescriptions",
                    label: "📝 Include Descriptions",
                  },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
                    style={{
                      backgroundColor: "var(--btn)",
                      borderColor: "var(--line)",
                      border: "1px solid",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        contentOptions[key as keyof typeof contentOptions]
                      }
                      onChange={() =>
                        handleOptionToggle(key as keyof typeof contentOptions)
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-gray-900 dark:text-gray-100">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Item Selection */}
            {filteredItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                    🎬 Select Items to Share
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-1 rounded text-sm transition-colors"
                      style={{
                        backgroundColor: "var(--accent)",
                        color: "white",
                      }}
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleSelectNone}
                      className="px-3 py-1 rounded text-sm transition-colors"
                      style={{
                        backgroundColor: "var(--btn)",
                        color: "var(--text)",
                        borderColor: "var(--line)",
                        border: "1px solid",
                      }}
                    >
                      Select None
                    </button>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2">
                  {filteredItems.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id.toString())}
                        onChange={() => handleItemToggle(item.id.toString())}
                        className="w-4 h-4"
                      />
                      <span className="flex-1 text-sm text-gray-900 dark:text-gray-100">
                        {item.mediaType === "movie" ? "🎬" : "📺"} {item.title}
                        {contentOptions.includeRatings && item.voteAverage && (
                          <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                            ⭐ {item.voteAverage.toFixed(1)}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div
              className="flex gap-2 pt-4 border-t"
              style={{ borderColor: "var(--line)" }}
            >
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm transition-colors"
                style={{
                  backgroundColor: "var(--btn)",
                  color: "var(--text)",
                  borderColor: "var(--line)",
                  border: "1px solid",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 rounded-lg text-sm transition-colors"
                style={{ backgroundColor: "var(--accent)", color: "white" }}
              >
                📋 Generate Shareable List
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
