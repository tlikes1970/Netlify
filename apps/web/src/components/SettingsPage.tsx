import { useLanguage, t } from "@/lib/language";
import { useCallback, useState, useEffect, useRef, lazy, Suspense } from "react";
import { useTranslations } from "../lib/language";
import { useAdminRole } from "../hooks/useAdminRole";
import { lockScroll, unlockScroll } from "../utils/scrollLock";
import NotInterestedModal from "./modals/NotInterestedModal";
import { getVisibleSections, type SettingsSectionId } from "./settingsConfig";
import { renderSettingsSection } from "./settingsSections";
import { useIsMobileScreen } from "../hooks/useDeviceDetection";
import SharingModal from "./modals/SharingModal";
import { useAuth } from "../hooks/useAuth";
import type { MediaItem } from "./cards/card.types";
import { useAndroidBackDismiss } from "../hooks/useAndroidBackDismiss";

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

export default function SettingsPage({
  onClose,
  initialSection = "account",
  onNotesEdit, notesEditorOpen = false,
}: {
  onClose: () => void;
  onNotesEdit?: (item: MediaItem) => void;
  notesEditorOpen?: boolean;
  /** First section shown when the modal mounts (e.g. `pro` from upgrade CTAs). */
  initialSection?: SettingsSectionId;
}) {
  const [activeSection, setActiveSection] =
    useState<SettingsSectionId>(initialSection);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [showNotInterestedModal, setShowNotInterestedModal] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] =
    useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showMobileSectionMenu, setShowMobileSectionMenu] = useState(false);
  useLanguage();
  const translations = useTranslations();
  const { isAdmin } = useAdminRole();
  const isMobile = useIsMobileScreen();
  const { user } = useAuth();

  const dismissForAndroidBack = useCallback(() => {
    if (showNotificationCenter) {
      setShowNotificationCenter(false);
    } else if (showNotificationSettings) {
      setShowNotificationSettings(false);
    } else if (showNotInterestedModal) {
      setShowNotInterestedModal(false);
    } else if (showSharingModal) {
      setShowSharingModal(false);
    } else if (showMobileSectionMenu) {
      setShowMobileSectionMenu(false);
    } else {
      onClose();
    }
  }, [
    onClose,
    showMobileSectionMenu,
    showNotInterestedModal,
    showNotificationCenter,
    showNotificationSettings,
    showSharingModal,
  ]);

  useAndroidBackDismiss(!showNotInterestedModal && !notesEditorOpen, dismissForAndroidBack);
  
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
      className={`fixed inset-0 z-modal backdrop-blur-sm flex ${isMobile ? 'items-start' : 'items-start justify-center'}`}
      style={{
        backgroundColor: "rgba(0,0,0,0.8)",
        ...(isMobile ? {
          top: 0,
          left: 0,
          padding: 0,
        } : {
          paddingTop: "max(6rem, var(--safe-top, 0px))",
          paddingRight: "max(1rem, var(--safe-right, 0px))",
          paddingBottom: "max(1rem, var(--safe-bottom, 0px))",
          paddingLeft: "max(1rem, var(--safe-left, 0px))",
        }),
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
            width: `min(${modalSize.width}px, 100%)`,
            height: `${modalSize.height}px`,
            minWidth: "320px",
            minHeight: "0",
            maxWidth: "min(1024px, 100%)",
            maxHeight: "100%",
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
                paddingTop: "calc(16px + var(--safe-top, 0px))",
                paddingLeft: "calc(16px + var(--safe-left, 0px))",
                paddingRight: "calc(16px + var(--safe-right, 0px))",
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
            className="flex absolute top-0 left-0 right-0 h-16 items-center justify-between px-6 flex-shrink-0 z-10"
            style={{
              backgroundColor: "var(--card)",
              borderBottomColor: "var(--line)",
              borderBottom: "1px solid",
            }}
          >
            <div>
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--text)" }}
              >
                {translations.settings}
              </h2>
              <p
                className="text-sm mt-0.5"
                style={{ color: "var(--muted)" }}
              >
                {user?.email ? t("accountSignedInAs", { email: user.email }) : t(user ? "accountSignedIn" : "accountSignedOut")}
              </p>
            </div>
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
            className="flex w-48 p-4 flex-shrink-0 flex-col"
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
          className={`settings-page-body flex-1 overflow-y-auto ${isMobile ? 'w-full p-4' : 'p-6'}`}
          style={{
            WebkitOverflowScrolling: isMobile ? 'touch' : 'auto',
            ...(isMobile ? {
              paddingBottom: "calc(16px + var(--safe-bottom, 0px))",
            } : {
              paddingTop: "88px", // Account for header height
            }),
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
        onNotesEdit={onNotesEdit} notesEditorOpen={notesEditorOpen}
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
