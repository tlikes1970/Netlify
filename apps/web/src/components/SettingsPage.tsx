import { useState, useEffect, useRef, lazy, Suspense } from "react";
import {
  useSettings,
  settingsManager,
  PersonalityLevel,
  getPersonalityText,
} from "../lib/settings";
import { useProStatus } from "../lib/proStatus";
import { startProUpgrade } from "../lib/proUpgrade";
import { useTranslations, useLanguage, changeLanguage } from "../lib/language";
import { useCustomLists, customListManager } from "../lib/customLists";
import { useUsername } from "../hooks/useUsername";
import { useAuth } from "../hooks/useAuth";
import { useLibrary, Library } from "../lib/storage";
import type { MediaItem } from "../components/cards/card.types";
import type { ListName } from "../state/library.types";
import { lockScroll, unlockScroll } from "../utils/scrollLock";
import PersonalityExamples from "./PersonalityExamples";
import ForYouGenreConfig from "./ForYouGenreConfig";
import NotInterestedModal from "./modals/NotInterestedModal";
import type { Language } from "../lib/language.types";

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
const AdminExtrasPage = lazy(() => import("../pages/AdminExtrasPage"));

type SettingsTab =
  | "general"
  | "notifications"
  | "layout"
  | "data"
  | "pro"
  | "about"
  | "social"
  | "community"
  | "admin";

export default function SettingsPage({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [showNotInterestedModal, setShowNotInterestedModal] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] =
    useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const settings = useSettings();
  const translations = useTranslations();
  const currentLanguage = useLanguage();

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
      setActiveTab("pro");
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
      setActiveTab("layout");
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
        600,
        Math.min(window.innerWidth - 40, resizeStartRef.current.width + deltaX)
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

  const tabs = [
    { id: "general" as const, label: translations.general },
    { id: "notifications" as const, label: translations.notifications },
    { id: "layout" as const, label: translations.layout },
    { id: "data" as const, label: translations.data },
    { id: "social" as const, label: "👥 Social" },
    { id: "community" as const, label: "🏆 Community" },
    { id: "pro" as const, label: translations.pro },
    { id: "admin" as const, label: "⚙️ Admin" },
    { id: "about" as const, label: translations.about },
  ];

  return (
    <div
      className="fixed inset-0 z-modal backdrop-blur-sm flex items-start justify-center pt-24 p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
    >
      <div
        ref={modalRef}
        className="rounded-xl flex overflow-hidden relative"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--line)",
          border: "1px solid",
          width: `${modalSize.width}px`,
          height: `${modalSize.height}px`,
          minWidth: "600px",
          minHeight: "400px",
          maxWidth: "95vw",
          maxHeight: "95vh",
        }}
      >
        {/* Left sidebar - Tabs */}
        <div
          className="w-48 p-4"
          style={{
            backgroundColor: "var(--btn)",
            borderRightColor: "var(--line)",
            borderRight: "1px solid",
          }}
        >
          <div className="flex items-center justify-between mb-6">
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

          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                style={{
                  backgroundColor:
                    activeTab === tab.id ? "var(--card)" : "transparent",
                  color: activeTab === tab.id ? "var(--text)" : "var(--muted)",
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = "var(--card)";
                    e.currentTarget.style.opacity = "0.5";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.opacity = "1";
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right content area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === "general" && (
            <GeneralTab
              settings={settings}
              translations={translations}
              currentLanguage={currentLanguage}
              onShowNotInterestedModal={() => setShowNotInterestedModal(true)}
            />
          )}
          {activeTab === "notifications" && (
            <NotificationsTab
              onOpenSettings={() => setShowNotificationSettings(true)}
              onOpenCenter={() => setShowNotificationCenter(true)}
            />
          )}
          {activeTab === "layout" && <LayoutTab settings={settings} />}
          {activeTab === "data" && (
            <DataTab setShowSharingModal={setShowSharingModal} />
          )}
          {activeTab === "social" && <SocialTab />}
          {activeTab === "community" && <CommunityTab />}
          {activeTab === "pro" && <ProTab />}
          {activeTab === "admin" && (
            <Suspense
              fallback={<div className="loading-spinner">Loading admin...</div>}
            >
              <AdminExtrasPage />
            </Suspense>
          )}
          {activeTab === "about" && <AboutTab />}
        </div>

        {/* Resize handle */}
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

// General Tab Component
function GeneralTab({
  settings,
  translations,
  currentLanguage,
  onShowNotInterestedModal,
}: {
  settings: any;
  translations: any;
  currentLanguage: Language;
  onShowNotInterestedModal: () => void;
}) {
  // Get reactive library data for stats
  const watchingItems = useLibrary("watching");
  const wishlistItems = useLibrary("wishlist");
  const watchedItems = useLibrary("watched");
  const notItems = useLibrary("not");

  // Calculate stats by media type
  const tvStats = {
    watching: watchingItems.filter((item) => item.mediaType === "tv").length,
    wishlist: wishlistItems.filter((item) => item.mediaType === "tv").length,
    watched: watchedItems.filter((item) => item.mediaType === "tv").length,
    not: notItems.filter((item) => item.mediaType === "tv").length,
  };

  const movieStats = {
    watching: watchingItems.filter((item) => item.mediaType === "movie").length,
    wishlist: wishlistItems.filter((item) => item.mediaType === "movie").length,
    watched: watchedItems.filter((item) => item.mediaType === "movie").length,
    not: notItems.filter((item) => item.mediaType === "movie").length,
  };
  const { username, updateUsername } = useUsername();
  const [displayName, setDisplayName] = useState(username);
  const [showWarning, setShowWarning] = useState(false);

  // Update local state when username changes
  useEffect(() => {
    setDisplayName(username);
  }, [username]);

  const handleDisplayNameChange = (newName: string) => {
    setDisplayName(newName);
    if (newName !== username) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  };

  const saveDisplayName = async () => {
    if (showWarning) {
      const confirmed = window.confirm(
        "Are you sure you want to change your username? This will update your profile."
      );
      if (confirmed) {
        try {
          await updateUsername(displayName);
          setShowWarning(false);
        } catch (error) {
          console.error("Failed to update username:", error);
          alert("Failed to update username. Please try again.");
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
        {translations.general}
      </h3>

      {/* Language Selection */}
      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: "var(--text)" }}
        >
          {translations.language} / Idioma
        </label>
        <div className="space-y-2">
          {[
            { lang: "en" as Language, label: translations.english, flag: "🇺🇸" },
            { lang: "es" as Language, label: translations.spanish, flag: "🇪🇸" },
          ].map(({ lang, label, flag }) => (
            <label
              key={lang}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <input
                type="radio"
                name="language"
                value={lang}
                checked={currentLanguage === lang}
                onChange={() => changeLanguage(lang)}
                className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium" style={{ color: "var(--text)" }}>
                  {flag} {label}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Display Name */}
      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: "var(--text)" }}
        >
          {translations.username}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={displayName}
            onChange={(e) => handleDisplayNameChange(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--line)",
              color: "var(--text)",
              border: "1px solid",
            }}
            placeholder={translations.username}
          />
          {showWarning && (
            <button
              onClick={saveDisplayName}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              {translations.save}
            </button>
          )}
        </div>
        {showWarning && (
          <p className="mt-1 text-sm text-yellow-400">
            ⚠️ Changing your display name will update your profile
          </p>
        )}
      </div>

      {/* My Statistics */}
      <div>
        <h4
          className="text-lg font-medium mb-3"
          style={{ color: "var(--text)" }}
        >
          My Statistics
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: "var(--card)" }}
          >
            <h5
              className="text-sm font-medium mb-2"
              style={{ color: "var(--text)" }}
            >
              TV Shows
            </h5>
            <div
              className="space-y-1 text-sm"
              style={{ color: "var(--muted)" }}
            >
              <div>Currently Watching: {tvStats.watching}</div>
              <div>Want to Watch: {tvStats.wishlist}</div>
              <div>Watched: {tvStats.watched}</div>
              <div>Not Interested: {tvStats.not}</div>
            </div>
          </div>
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: "var(--card)" }}
          >
            <h5
              className="text-sm font-medium mb-2"
              style={{ color: "var(--text)" }}
            >
              Movies
            </h5>
            <div
              className="space-y-1 text-sm"
              style={{ color: "var(--muted)" }}
            >
              <div>Currently Watching: {movieStats.watching}</div>
              <div>Want to Watch: {movieStats.wishlist}</div>
              <div>Watched: {movieStats.watched}</div>
              <div>Not Interested: {movieStats.not}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Not Interested Management */}
      <div>
        <h4
          className="text-lg font-medium mb-3"
          style={{ color: "var(--text)" }}
        >
          Not Interested Management
        </h4>
        <button
          className="px-4 py-2 rounded-lg transition-colors"
          style={{ backgroundColor: "var(--btn)", color: "var(--text)" }}
          onClick={onShowNotInterestedModal}
        >
          Manage Not Interested List
        </button>
      </div>

      {/* Personality Level */}
      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: "var(--text)" }}
        >
          {translations.personalityLevel}
        </label>
        <div className="space-y-2">
          {[
            {
              level: 1 as PersonalityLevel,
              label: translations.regular,
              description: translations.friendlyAndHelpful,
            },
            {
              level: 2 as PersonalityLevel,
              label: translations.semiSarcastic,
              description: translations.aBitCheeky,
            },
            {
              level: 3 as PersonalityLevel,
              label: translations.severelySarcastic,
              description: translations.maximumSass,
            },
          ].map(({ level, label, description }) => (
            <label
              key={level}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <input
                type="radio"
                name="personality"
                value={level}
                checked={settings.personalityLevel === level}
                onChange={() => settingsManager.updatePersonalityLevel(level)}
                className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium" style={{ color: "var(--text)" }}>
                  {label}
                </div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {description}
                </div>
              </div>
            </label>
          ))}
        </div>
        <div
          className="mt-2 p-3 rounded-lg"
          style={{ backgroundColor: "var(--card)" }}
        >
          <p className="text-sm" style={{ color: "var(--text)" }}>
            {translations.preview}:{" "}
            {getPersonalityText("welcome", settings.personalityLevel)}
          </p>
        </div>

        {/* Personality Examples */}
        <div className="mt-4">
          <PersonalityExamples personalityLevel={settings.personalityLevel} />
        </div>
      </div>

      {/* Reset to Defaults */}
      <div>
        <button
          onClick={() => {
            if (
              window.confirm(
                "Are you sure you want to reset all settings to defaults?"
              )
            ) {
              settingsManager.resetToDefaults();
            }
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Reset System to Defaults
        </button>
      </div>
    </div>
  );
}

// Placeholder tabs
// Notifications Tab Component
function NotificationsTab({
  onOpenSettings,
  onOpenCenter,
}: {
  onOpenSettings: () => void;
  onOpenCenter: () => void;
}) {
  const settings = useSettings();
  const { isAuthenticated, user } = useAuth();
  const [emailSubscribed, setEmailSubscribed] = useState<boolean | null>(null);
  const [updatingEmailSub, setUpdatingEmailSub] = useState(false);

  // Check if user is Pro (simplified check)
  const isProUser = settings.pro || false;

  // Fetch email subscription status
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchEmailSubscriptionStatus();
    }
  }, [isAuthenticated, user]);

  const fetchEmailSubscriptionStatus = async () => {
    try {
      const { doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebaseBootstrap");
      const userRef = doc(db, "users", user!.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setEmailSubscribed(data.emailSubscriber === true);
      } else {
        setEmailSubscribed(false);
      }
    } catch (err) {
      console.error("Failed to fetch email subscription status:", err);
      setEmailSubscribed(false);
    }
  };

  const handleEmailSubscriptionToggle = async (enabled: boolean) => {
    if (!isAuthenticated || !user || updatingEmailSub) return;

    setUpdatingEmailSub(true);
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebaseBootstrap");
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        emailSubscriber: enabled,
      });
      setEmailSubscribed(enabled);
    } catch (err) {
      console.error("Failed to update email subscription:", err);
      alert("Failed to update email subscription. Please try again.");
    } finally {
      setUpdatingEmailSub(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3
          className="text-xl font-semibold mb-2"
          style={{ color: "var(--text)" }}
        >
          🔔 Notifications
        </h3>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Manage your notification preferences and view notification history.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={onOpenSettings}
          className="p-4 rounded-lg border transition-colors hover:opacity-80"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--line)",
            color: "var(--text)",
          }}
        >
          <div className="flex items-center space-x-3">
            <div className="text-2xl">⚙️</div>
            <div className="text-left">
              <div className="font-medium">Notification Settings</div>
              <div className="text-sm" style={{ color: "var(--muted)" }}>
                Configure timing and methods
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={onOpenCenter}
          className="p-4 rounded-lg border transition-colors hover:opacity-80"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--line)",
            color: "var(--text)",
          }}
        >
          <div className="flex items-center space-x-3">
            <div className="text-2xl">📋</div>
            <div className="text-left">
              <div className="font-medium">Notification Center</div>
              <div className="text-sm" style={{ color: "var(--muted)" }}>
                View notification history
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Email Subscription Toggle */}
      {isAuthenticated && (
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--line)",
            border: "1px solid",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4
                className="text-lg font-medium mb-1"
                style={{ color: "var(--text)" }}
              >
                📧 Weekly Email Digest
              </h4>
              <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
                Receive a weekly email with top posts, new comments, and
                mentions from the community hub.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailSubscribed === true}
                onChange={(e) =>
                  handleEmailSubscriptionToggle(e.target.checked)
                }
                disabled={updatingEmailSub || emailSubscribed === null}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          {emailSubscribed === null && (
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
              Loading...
            </p>
          )}
          {emailSubscribed === true && (
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
              ✓ You'll receive weekly emails every Friday at 9 AM UTC
            </p>
          )}
        </div>
      )}

      {/* Current Settings Summary */}
      <div
        className="p-4 rounded-lg"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--line)",
          border: "1px solid",
        }}
      >
        <h4
          className="text-lg font-medium mb-3"
          style={{ color: "var(--text)" }}
        >
          Current Settings
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span style={{ color: "var(--muted)" }}>Episode Reminders:</span>
            <span style={{ color: "var(--text)" }}>Enabled</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--muted)" }}>Timing:</span>
            <span style={{ color: "var(--text)" }}>
              {isProUser ? "Custom (Pro)" : "24 hours before"}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--muted)" }}>Methods:</span>
            <span style={{ color: "var(--text)" }}>
              In-app, Push{isProUser ? ", Email" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Pro Features Banner */}
      {!isProUser && (
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: "var(--btn)",
            borderColor: "var(--accent)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">💎</div>
            <div className="flex-1">
              <h4 className="font-semibold">Upgrade to Pro</h4>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Get precise timing control, email notifications, and advanced
                features
              </p>
            </div>
            <span
              className="px-3 py-1 text-sm font-semibold rounded-full"
              style={{ backgroundColor: "var(--accent)", color: "white" }}
            >
              PRO
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function LayoutTab({ settings }: { settings: any }) {
  const translations = useTranslations();
  const userLists = useCustomLists();
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const handleCreateList = () => {
    const name = prompt(translations.enterListName || "Enter list name:");
    if (!name?.trim()) return;

    try {
      customListManager.createList(name.trim());
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create list");
    }
  };

  const handleEditList = (listId: string) => {
    const list = customListManager.getListById(listId);
    if (!list) return;

    setEditingListId(listId);
    setEditName(list.name);
    setEditDescription(list.description || "");
  };

  const handleSaveEdit = () => {
    if (!editingListId || !editName.trim()) return;

    try {
      customListManager.updateList(editingListId, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setEditingListId(null);
      setEditName("");
      setEditDescription("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update list");
    }
  };

  const handleCancelEdit = () => {
    setEditingListId(null);
    setEditName("");
    setEditDescription("");
  };

  const handleDeleteList = (listId: string) => {
    console.log(
      "[SettingsPage] Delete list button clicked for listId:",
      listId
    );

    try {
      const list = customListManager.getListById(listId);
      if (!list) {
        console.error("[SettingsPage] List not found:", listId);
        alert("List not found");
        return;
      }

      console.log("[SettingsPage] Attempting to delete list:", list.name);

      const confirmed = window.confirm(
        `${translations.confirmDeleteList || "Are you sure you want to delete"} "${list.name}"? ${translations.thisActionCannotBeUndone || "This action cannot be undone."}`
      );

      console.log("[SettingsPage] Delete confirmation:", confirmed);

      if (confirmed) {
        try {
          customListManager.deleteList(listId);
          console.log("[SettingsPage] List deleted successfully");
          // Force a re-render by updating state if needed
          // The list should disappear from the UI automatically
        } catch (error) {
          console.error("[SettingsPage] Error deleting list:", error);
          alert(
            error instanceof Error ? error.message : "Failed to delete list"
          );
        }
      } else {
        console.log("[SettingsPage] User cancelled list deletion");
      }
    } catch (error) {
      console.error(
        "[SettingsPage] Unexpected error in handleDeleteList:",
        error
      );
      alert("An error occurred while trying to delete the list");
    }
  };

  const handleSetDefault = (listId: string) => {
    try {
      customListManager.setSelectedList(listId);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to set default list"
      );
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
        {translations.layout}
      </h3>

      {/* Theme Preference */}
      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: "var(--text)" }}
        >
          {translations.themePreference}
        </label>
        <div className="space-y-2">
          {[
            {
              theme: "dark" as const,
              label: translations.dark,
              description: translations.darkThemeDescription,
            },
            {
              theme: "light" as const,
              label: translations.light,
              description: translations.lightThemeDescription,
            },
          ].map(({ theme, label, description }) => (
            <label
              key={theme}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <input
                type="radio"
                name="theme"
                value={theme}
                checked={settings.layout.theme === theme}
                onChange={() => settingsManager.updateTheme(theme)}
                className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium" style={{ color: "var(--text)" }}>
                  {label}
                </div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Discovery Limit */}
      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: "var(--text)" }}
        >
          Discovery Recommendations
        </label>
        <div className="space-y-2">
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Number of recommendations to show in Discovery
          </p>
          <div className="flex gap-2 flex-wrap">
            {[25, 50, 75, 100].map((limit) => (
              <label
                key={limit}
                className="flex items-center space-x-2 cursor-pointer px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor:
                    settings.layout.discoveryLimit === limit
                      ? "var(--accent)"
                      : "var(--btn)",
                  color:
                    settings.layout.discoveryLimit === limit
                      ? "white"
                      : "var(--text)",
                  border: "1px solid",
                  borderColor:
                    settings.layout.discoveryLimit === limit
                      ? "var(--accent)"
                      : "var(--line)",
                }}
              >
                <input
                  type="radio"
                  name="discoveryLimit"
                  value={limit}
                  checked={settings.layout.discoveryLimit === limit}
                  onChange={() =>
                    settingsManager.updateDiscoveryLimit(
                      limit as 25 | 50 | 75 | 100
                    )
                  }
                  className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 focus:ring-blue-500"
                />
                <span className="font-medium">{limit}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* My Lists Management */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-medium" style={{ color: "var(--text)" }}>
            {translations.myLists || "My Lists"}
          </h4>
          {userLists.customLists.length < userLists.maxLists && (
            <button
              onClick={handleCreateList}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{ backgroundColor: "var(--accent)", color: "white" }}
            >
              {translations.createNewList || "Create New List"}
            </button>
          )}
        </div>

        <div className="space-y-3">
          {userLists.customLists.map((list) => (
            <div
              key={list.id}
              className="p-4 rounded-lg"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--line)",
                border: "1px solid",
              }}
            >
              {editingListId === list.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                      backgroundColor: "var(--btn)",
                      borderColor: "var(--line)",
                      color: "var(--text)",
                      border: "1px solid",
                    }}
                    placeholder={translations.listName || "List name"}
                  />
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                      backgroundColor: "var(--btn)",
                      borderColor: "var(--line)",
                      color: "var(--text)",
                      border: "1px solid",
                    }}
                    placeholder={
                      translations.listDescription ||
                      "List description (optional)"
                    }
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                      style={{
                        backgroundColor: "var(--accent)",
                        color: "white",
                      }}
                    >
                      {translations.save || "Save"}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                      style={{
                        backgroundColor: "var(--btn)",
                        color: "var(--text)",
                        borderColor: "var(--line)",
                        border: "1px solid",
                      }}
                    >
                      {translations.cancel || "Cancel"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5
                        className="font-medium"
                        style={{ color: "var(--text)" }}
                      >
                        {list.name}
                      </h5>
                      {list.isDefault && (
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor: "var(--accent)",
                            color: "white",
                          }}
                        >
                          {translations.default || "Default"}
                        </span>
                      )}
                    </div>
                    {list.description && (
                      <p
                        className="text-sm mt-1"
                        style={{ color: "var(--muted)" }}
                      >
                        {list.description}
                      </p>
                    )}
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--muted)" }}
                    >
                      {list.itemCount} {translations.items || "items"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditList(list.id)}
                      className="px-2 py-1 rounded text-xs transition-colors"
                      style={{
                        backgroundColor: "var(--btn)",
                        color: "var(--text)",
                      }}
                      title={translations.edit || "Edit"}
                    >
                      ✏️
                    </button>
                    {!list.isDefault && (
                      <button
                        onClick={() => handleSetDefault(list.id)}
                        className="px-2 py-1 rounded text-xs transition-colors"
                        style={{
                          backgroundColor: "var(--btn)",
                          color: "var(--text)",
                        }}
                        title={translations.setAsDefault || "Set as Default"}
                      >
                        ⭐
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteList(list.id)}
                      className="px-2 py-1 rounded text-xs transition-colors"
                      style={{
                        backgroundColor: "var(--btn)",
                        color: "var(--text)",
                      }}
                      title={translations.delete || "Delete"}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {userLists.customLists.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
                {translations.noListsCreated || "No lists created yet"}
              </p>
              <button
                onClick={handleCreateList}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: "var(--accent)", color: "white" }}
              >
                {translations.createYourFirstList || "Create Your First List"}
              </button>
            </div>
          )}
        </div>

        <div className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
          {translations.listsUsed || "Lists used"}:{" "}
          {userLists.customLists.length}/{userLists.maxLists}
        </div>
      </div>

      {/* Other Layout Settings */}
      <div>
        <h4
          className="text-lg font-medium mb-3"
          style={{ color: "var(--text)" }}
        >
          {translations.basicCustomization}
        </h4>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.layout.condensedView}
                onChange={(e) =>
                  settingsManager.updateSettings({
                    layout: {
                      ...settings.layout,
                      condensedView: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 rounded focus:ring-blue-500"
              />
              <span style={{ color: "var(--text)" }}>
                {translations.condensedView}
              </span>
            </label>
            <p className="text-xs ml-7" style={{ color: "var(--muted)" }}>
              Show more items per screen with smaller cards and shorter button
              labels. Hides episode tracking and detailed features.
            </p>
          </div>

          <div className="space-y-1">
            <label
              className={`flex items-center space-x-3 ${settings.layout.condensedView && !settings.pro.isPro ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <input
                type="checkbox"
                checked={settings.layout.episodeTracking}
                onChange={() => settingsManager.toggleEpisodeTracking()}
                disabled={settings.layout.condensedView && !settings.pro.isPro}
                className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 rounded focus:ring-blue-500"
              />
              <span style={{ color: "var(--text)" }}>
                {translations.enableEpisodeTracking}
              </span>
            </label>
            {settings.layout.condensedView && !settings.pro.isPro && (
              <p className="text-xs ml-7" style={{ color: "var(--muted)" }}>
                Episode tracking is disabled in condensed view
              </p>
            )}
            {settings.layout.condensedView && settings.pro.isPro && (
              <p className="text-xs ml-7" style={{ color: "var(--muted)" }}>
                Pro users can enable episode tracking even in condensed view
              </p>
            )}
          </div>
        </div>
      </div>

      {/* For You Section Configuration */}
      <div>
        <h4
          className="text-lg font-medium mb-3"
          style={{ color: "var(--text)" }}
        >
          For You Section Configuration
        </h4>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          Customize the three "For You" rows on your home page. Each row
          combines a main genre with a subgenre for personalized
          recommendations.
        </p>

        <ForYouGenreConfig />
      </div>

      {/* Pro Features */}
      {settings.pro.isPro && (
        <div>
          <h4
            className="text-lg font-medium mb-3"
            style={{ color: "var(--text)" }}
          >
            {translations.proFeatures}
          </h4>
          <p style={{ color: "var(--muted)" }}>
            {translations.themePacksComingSoon}
          </p>
        </div>
      )}
    </div>
  );
}

function DataTab({
  setShowSharingModal,
}: {
  setShowSharingModal: (show: boolean) => void;
}) {
  const translations = useTranslations();

  const handleBackup = async () => {
    try {
      // Get Library data from the actual storage system
      const libraryData = JSON.parse(
        localStorage.getItem("flicklet.library.v2") || "{}"
      );

      // Convert from flat object format to grouped watchlists format
      const watchlists = {
        movies: {
          watching: [] as MediaItem[],
          wishlist: [] as MediaItem[],
          watched: [] as MediaItem[],
        },
        tv: {
          watching: [] as MediaItem[],
          wishlist: [] as MediaItem[],
          watched: [] as MediaItem[],
        },
        customLists: [] as any[],
        customItems: {} as Record<string, MediaItem[]>,
      };

      // Group library items by media type and list
      Object.values(libraryData).forEach((item: any) => {
        const mediaItem: MediaItem = {
          id: item.id,
          mediaType: item.mediaType,
          title: item.title || "Untitled",
          year: item.year,
          posterUrl: item.posterUrl,
          voteAverage: item.voteAverage,
          userRating: item.userRating,
          runtimeMins: item.runtimeMins,
          synopsis: item.synopsis,
          nextAirDate: item.nextAirDate,
          showStatus: item.showStatus,
          lastAirDate: item.lastAirDate,
          userNotes: item.userNotes,
          tags: item.tags,
          networks: item.networks,
          productionCompanies: item.productionCompanies,
        };

        if (item.list?.startsWith("custom:")) {
          // Custom list items
          const customListId = item.list.replace("custom:", "");
          if (!watchlists.customItems[customListId]) {
            watchlists.customItems[customListId] = [];
          }
          watchlists.customItems[customListId].push(mediaItem);
        } else if (
          item.list &&
          ["watching", "wishlist", "watched"].includes(item.list)
        ) {
          // Standard lists
          if (
            item.mediaType === "movie" &&
            watchlists.movies[item.list as keyof typeof watchlists.movies]
          ) {
            (
              watchlists.movies[
                item.list as keyof typeof watchlists.movies
              ] as MediaItem[]
            ).push(mediaItem);
          } else if (
            item.mediaType === "tv" &&
            watchlists.tv[item.list as keyof typeof watchlists.tv]
          ) {
            (
              watchlists.tv[
                item.list as keyof typeof watchlists.tv
              ] as MediaItem[]
            ).push(mediaItem);
          }
        }
      });

      // Get custom list definitions
      const customListsData = localStorage.getItem("flicklet.customLists.v2");
      if (customListsData) {
        try {
          const customLists = JSON.parse(customListsData);
          watchlists.customLists = customLists.customLists || [];
        } catch (error) {
          console.warn("Failed to parse custom lists:", error);
        }
      }

      // Get settings and user data
      const settings = JSON.parse(
        localStorage.getItem("flicklet-settings") || "{}"
      );
      const user = JSON.parse(localStorage.getItem("flicklet-user") || "{}");

      const userData = {
        watchlists,
        settings,
        user,
        timestamp: new Date().toISOString(),
        version: "2.0", // Updated version to indicate new format
      };

      // Create downloadable file
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `flicklet-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert("✅ Backup downloaded successfully!");
    } catch (error) {
      console.error("Backup failed:", error);
      alert("❌ Backup failed. Please try again.");
    }
  };

  const handleRestore = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const userData = JSON.parse(text);

        // Validate backup format (support both old and new formats)
        if (!userData.watchlists) {
          throw new Error("Invalid backup file format: missing watchlists");
        }

        // Confirm restore
        const backupDate = userData.timestamp
          ? new Date(userData.timestamp).toLocaleDateString()
          : "unknown date";
        const confirmed = confirm(
          `⚠️ This will replace ALL your current data with the backup from ${backupDate}.\n\nThis action cannot be undone. Continue?`
        );

        if (!confirmed) return;

        // Clear existing library data
        localStorage.removeItem("flicklet.library.v2");

        // Restore watchlists - convert from export format to Library format
        let restoredCount = 0;

        // Process movies
        if (userData.watchlists.movies) {
          const lists: Array<{ list: ListName; items: any[] }> = [
            {
              list: "watching",
              items: userData.watchlists.movies.watching || [],
            },
            {
              list: "wishlist",
              items: userData.watchlists.movies.wishlist || [],
            },
            {
              list: "watched",
              items: userData.watchlists.movies.watched || [],
            },
          ];

          lists.forEach(({ list, items }) => {
            items.forEach((item: any) => {
              if (item && item.id) {
                const mediaItem: MediaItem = {
                  id: item.id,
                  mediaType: "movie",
                  title: item.title || item.name || "Untitled",
                  year: item.year,
                  posterUrl: item.posterUrl || item.poster_path,
                  voteAverage: item.voteAverage || item.vote_average,
                  userRating: item.userRating || item.user_rating,
                  runtimeMins: item.runtimeMins || item.runtime,
                  synopsis: item.synopsis || item.overview,
                  userNotes: item.userNotes || item.notes,
                  tags: item.tags || [],
                  productionCompanies: item.productionCompanies || [],
                };
                Library.upsert(mediaItem, list);
                restoredCount++;
              }
            });
          });
        }

        // Process TV shows
        if (userData.watchlists.tv) {
          const lists: Array<{ list: ListName; items: any[] }> = [
            { list: "watching", items: userData.watchlists.tv.watching || [] },
            { list: "wishlist", items: userData.watchlists.tv.wishlist || [] },
            { list: "watched", items: userData.watchlists.tv.watched || [] },
          ];

          lists.forEach(({ list, items }) => {
            items.forEach((item: any) => {
              if (item && item.id) {
                const mediaItem: MediaItem = {
                  id: item.id,
                  mediaType: "tv",
                  title: item.title || item.name || "Untitled",
                  year: item.year || item.first_air_date?.substring(0, 4),
                  posterUrl: item.posterUrl || item.poster_path,
                  voteAverage: item.voteAverage || item.vote_average,
                  userRating: item.userRating || item.user_rating,
                  synopsis: item.synopsis || item.overview,
                  nextAirDate: item.nextAirDate,
                  showStatus: item.showStatus || item.status,
                  lastAirDate: item.lastAirDate || item.last_air_date,
                  userNotes: item.userNotes || item.notes,
                  tags: item.tags || [],
                  networks: item.networks || [],
                };
                Library.upsert(mediaItem, list);
                restoredCount++;
              }
            });
          });
        }

        // Restore custom lists and items (if present in backup)
        if (
          userData.watchlists.customLists &&
          Array.isArray(userData.watchlists.customLists)
        ) {
          const customListsData = {
            customLists: userData.watchlists.customLists,
            selectedListId: userData.watchlists.selectedListId || null,
            maxLists: userData.watchlists.maxLists || 10,
          };
          localStorage.setItem(
            "flicklet.customLists.v2",
            JSON.stringify(customListsData)
          );
        }

        if (
          userData.watchlists.customItems &&
          typeof userData.watchlists.customItems === "object"
        ) {
          Object.entries(userData.watchlists.customItems).forEach(
            ([listId, items]: [string, any]) => {
              if (Array.isArray(items)) {
                items.forEach((item: any) => {
                  if (item && item.id) {
                    const mediaItem: MediaItem = {
                      id: item.id,
                      mediaType: item.mediaType || "movie",
                      title: item.title || item.name || "Untitled",
                      year: item.year,
                      posterUrl: item.posterUrl || item.poster_path,
                      voteAverage: item.voteAverage || item.vote_average,
                      userRating: item.userRating || item.user_rating,
                      synopsis: item.synopsis || item.overview,
                      userNotes: item.userNotes || item.notes,
                      tags: item.tags || [],
                    };
                    Library.upsert(mediaItem, `custom:${listId}` as ListName);
                    restoredCount++;
                  }
                });
              }
            }
          );
        }

        // Restore settings and user data
        if (userData.settings) {
          localStorage.setItem(
            "flicklet-settings",
            JSON.stringify(userData.settings)
          );
        }

        if (userData.user) {
          localStorage.setItem("flicklet-user", JSON.stringify(userData.user));
        }

        alert(
          `✅ Data restored successfully! ${restoredCount} items restored. Please refresh the page to see changes.`
        );

        // Trigger page refresh after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error("Restore failed:", error);
        alert(
          `❌ Restore failed: ${error instanceof Error ? error.message : "Unknown error"}. Please check the backup file and try again.`
        );
      }
    };
    input.click();
  };

  const handleSystemWipe = () => {
    console.log("[SettingsPage] System wipe button clicked");

    try {
      const confirmed = confirm(
        "🚨 NUCLEAR OPTION: This will permanently delete ALL your data including:\n\n" +
          "• All watchlists (movies & TV)\n" +
          "• All settings\n" +
          "• All user preferences\n" +
          "• Everything stored locally\n\n" +
          "This action CANNOT be undone. Are you absolutely sure?"
      );

      console.log("[SettingsPage] First confirmation:", confirmed);

      if (!confirmed) {
        console.log("[SettingsPage] User cancelled first confirmation");
        return;
      }

      const doubleConfirmed = confirm(
        "⚠️ FINAL WARNING: This will completely wipe your Flicklet data.\n\n" +
          'Type "DELETE" in the next prompt to confirm.'
      );

      console.log("[SettingsPage] Second confirmation:", doubleConfirmed);

      if (!doubleConfirmed) {
        console.log("[SettingsPage] User cancelled second confirmation");
        return;
      }

      const finalCheck = prompt('Type "DELETE" to confirm system wipe:');
      console.log("[SettingsPage] Final prompt result:", finalCheck);

      if (finalCheck !== "DELETE") {
        alert(
          '❌ System wipe cancelled. You must type exactly "DELETE" to confirm.'
        );
        return;
      }

      // Clear all Flicklet data
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith("flicklet-")
      );
      console.log("[SettingsPage] Found keys to delete:", keys);
      keys.forEach((key) => localStorage.removeItem(key));

      // Also clear any other Flicklet-related keys (without prefix)
      const allKeys = Object.keys(localStorage);
      const flickletKeys = allKeys.filter(
        (key) =>
          key.toLowerCase().includes("flicklet") ||
          key.toLowerCase().includes("library") ||
          key.startsWith("flag:")
      );
      flickletKeys.forEach((key) => {
        console.log("[SettingsPage] Removing additional key:", key);
        localStorage.removeItem(key);
      });

      console.log("[SettingsPage] System wipe completed");
      alert("💥 System wiped successfully! The page will refresh.");

      // Refresh page
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("[SettingsPage] System wipe failed:", error);
      alert(
        "❌ System wipe failed: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        {translations.data}
      </h3>

      {/* Share with Friends */}
      <div>
        <h4 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">
          📤 Share with Friends
        </h4>
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
            <h5 className="font-medium mb-2 text-gray-900 dark:text-gray-100">
              Create Shareable List
            </h5>
            <p className="text-sm mb-3 text-gray-600 dark:text-gray-400">
              Create a shareable list of your shows and movies to send to
              friends
            </p>
            <button
              onClick={() => setShowSharingModal(true)}
              className="px-3 py-2 rounded-lg text-sm transition-colors bg-pink-500 hover:bg-pink-600 text-white"
            >
              📤 Share with Friends
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div>
        <h4 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">
          💾 Data Management
        </h4>
        <div className="space-y-3">
          {/* Backup */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
            <h5 className="font-medium mb-2 text-gray-900 dark:text-gray-100">
              💾 Backup Data
            </h5>
            <p className="text-sm mb-3 text-gray-600 dark:text-gray-400">
              Download a complete backup of all your watchlists and settings
            </p>
            <button
              onClick={handleBackup}
              className="px-3 py-2 rounded-lg text-sm transition-colors bg-blue-500 hover:bg-blue-600 text-white"
            >
              💾 Download Backup
            </button>
          </div>

          {/* Restore */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
            <h5 className="font-medium mb-2 text-gray-900 dark:text-gray-100">
              📥 Restore Data
            </h5>
            <p className="text-sm mb-3 text-gray-600 dark:text-gray-400">
              Upload a backup file to restore your watchlists and settings
            </p>
            <button
              onClick={handleRestore}
              className="px-3 py-2 rounded-lg text-sm transition-colors bg-green-500 hover:bg-green-600 text-white"
            >
              📥 Restore from Backup
            </button>
          </div>

          {/* System Wipe */}
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <h5 className="font-medium mb-2 text-red-900 dark:text-red-100">
              🚨 System Wipe
            </h5>
            <p className="text-sm mb-3 text-red-700 dark:text-red-300">
              Permanently delete ALL your data. This action cannot be undone.
            </p>
            <button
              onClick={handleSystemWipe}
              className="px-3 py-2 rounded-lg text-sm transition-colors bg-red-500 hover:bg-red-600 text-white"
            >
              🚨 Nuclear Option
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProTab() {
  const proStatus = useProStatus();
  const isProUser = proStatus.isPro;

  return (
    <div className="space-y-6">
      {/* Pro Status */}
      <div
        className="text-center p-6 rounded-lg"
        style={{ backgroundColor: "var(--btn)" }}
      >
        <div className="text-4xl mb-3">💎</div>
        <h3
          className="text-xl font-semibold mb-2"
          style={{ color: "var(--text)" }}
        >
          {isProUser ? "You are a Pro User!" : "Upgrade to Flicklet Pro"}
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          {isProUser
            ? "Thank you for supporting Flicklet! Enjoy all Pro features."
            : "Unlock advanced features and premium content to enhance your TV and movie tracking experience."}
        </p>
        {!isProUser && (
          <button
            onClick={startProUpgrade}
            className="px-6 py-3 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: "var(--accent)", color: "white" }}
          >
            Upgrade to Pro
          </button>
        )}
      </div>

      {/* Alpha/Testing Toggle */}
      <div
        className="p-4 rounded-lg border"
        style={{ backgroundColor: "var(--bg)", borderColor: "var(--line)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4
              className="text-sm font-medium mb-1"
              style={{ color: "var(--text)" }}
            >
              Treat this device as Pro (Alpha / Testing)
            </h4>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              This is for testing only and is not a real purchase. Toggle this
              to test Pro features.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={isProUser}
              onChange={(e) => {
                settingsManager.updateProStatus(e.target.checked);
              }}
              className="sr-only peer"
            />
            <div
              className="w-11 h-6 rounded-full peer transition-colors"
              style={{
                backgroundColor: isProUser ? "var(--accent)" : "var(--line)",
              }}
            >
              <div
                className="w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5"
                style={{
                  backgroundColor: "#fff",
                  transform: isProUser
                    ? "translateX(1.25rem)"
                    : "translateX(0.125rem)",
                  marginTop: "0.125rem",
                }}
              />
            </div>
          </label>
        </div>
      </div>

      {/* Pro Features */}
      <div>
        <h4
          className="text-lg font-medium mb-4"
          style={{ color: "var(--text)" }}
        >
          Pro Features
        </h4>

        <div className="mb-6">
          <h5
            className="text-sm font-medium mb-3"
            style={{ color: "var(--text)" }}
          >
            Available Now
          </h5>

          <div className="space-y-4">
            {/* Existing Pro Features on Cards */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: "var(--bg)",
                borderColor: "var(--line)",
              }}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎬</div>
                <div className="flex-1">
                  <h5
                    className="font-medium mb-1"
                    style={{ color: "var(--text)" }}
                  >
                    Bloopers & Behind-the-Scenes
                  </h5>
                  <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>
                    Access to bloopers, extras, and behind-the-scenes content on
                    movie and TV show cards
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-1 text-xs rounded-full"
                      style={{
                        backgroundColor: "var(--accent)",
                        color: "white",
                      }}
                    >
                      PRO
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      Available Now
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: "var(--bg)",
                borderColor: "var(--line)",
              }}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">🔔</div>
                <div className="flex-1">
                  <h5
                    className="font-medium mb-1"
                    style={{ color: "var(--text)" }}
                  >
                    Advanced Notifications
                  </h5>
                  <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>
                    Customizable episode notifications with multiple methods,
                    custom timing, and per-show settings
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-1 text-xs rounded-full"
                      style={{
                        backgroundColor: "var(--accent)",
                        color: "white",
                      }}
                    >
                      PRO
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      Available Now
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Simple Reminder - Free Feature */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: "var(--bg)",
                borderColor: "var(--line)",
              }}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">⏰</div>
                <div className="flex-1">
                  <h5
                    className="font-medium mb-1"
                    style={{ color: "var(--text)" }}
                  >
                    Simple Reminder
                  </h5>
                  <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>
                    Basic reminder notifications 24 hours before episodes air
                    (in-app only)
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-1 text-xs rounded-full"
                      style={{
                        backgroundColor: "var(--success)",
                        color: "white",
                      }}
                    >
                      FREE
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      Available Now
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-8">
          <h5
            className="text-sm font-medium mb-3"
            style={{ color: "var(--text)" }}
          >
            Coming Soon
          </h5>
          <div className="space-y-4">
            {/* Smart Notifications */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: "var(--bg)",
                borderColor: "var(--line)",
              }}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">🔔</div>
                <div className="flex-1">
                  <h5
                    className="font-medium mb-1"
                    style={{ color: "var(--text)" }}
                  >
                    Smart Notifications
                  </h5>
                  <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>
                    Customizable episode notifications with advanced scheduling
                    and timing options
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-1 text-xs rounded-full"
                      style={{
                        backgroundColor: "var(--accent)",
                        color: "white",
                      }}
                    >
                      PRO
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Analytics */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: "var(--bg)",
                borderColor: "var(--line)",
              }}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">📊</div>
                <div className="flex-1">
                  <h5
                    className="font-medium mb-1"
                    style={{ color: "var(--text)" }}
                  >
                    Advanced Analytics
                  </h5>
                  <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>
                    Detailed watching statistics and viewing journey insights
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-1 text-xs rounded-full"
                      style={{
                        backgroundColor: "var(--accent)",
                        color: "white",
                      }}
                    >
                      PRO
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Themes */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: "var(--bg)",
                borderColor: "var(--line)",
              }}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎨</div>
                <div className="flex-1">
                  <h5
                    className="font-medium mb-1"
                    style={{ color: "var(--text)" }}
                  >
                    Premium Themes
                  </h5>
                  <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>
                    Access to premium theme packs and advanced customization
                    options
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-1 text-xs rounded-full"
                      style={{
                        backgroundColor: "var(--accent)",
                        color: "white",
                      }}
                    >
                      PRO
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Extra Trivia Content */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: "var(--bg)",
                borderColor: "var(--line)",
              }}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">🧠</div>
                <div className="flex-1">
                  <h5
                    className="font-medium mb-1"
                    style={{ color: "var(--text)" }}
                  >
                    Extra Trivia Content
                  </h5>
                  <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>
                    Access to additional trivia questions and behind-the-scenes
                    content
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-1 text-xs rounded-full"
                      style={{
                        backgroundColor: "var(--accent)",
                        color: "white",
                      }}
                    >
                      PRO
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CSV Export */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: "var(--bg)",
                borderColor: "var(--line)",
              }}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">📊</div>
                <div className="flex-1">
                  <h5
                    className="font-medium mb-1"
                    style={{ color: "var(--text)" }}
                  >
                    CSV Export
                  </h5>
                  <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>
                    Export your lists to CSV format for use in spreadsheets
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-1 text-xs rounded-full"
                      style={{
                        backgroundColor: "var(--accent)",
                        color: "white",
                      }}
                    >
                      PRO
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Priority Support */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: "var(--bg)",
                borderColor: "var(--line)",
              }}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">🚀</div>
                <div className="flex-1">
                  <h5
                    className="font-medium mb-1"
                    style={{ color: "var(--text)" }}
                  >
                    Priority Support
                  </h5>
                  <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>
                    Faster help when you need it with priority customer support
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-1 text-xs rounded-full"
                      style={{
                        backgroundColor: "var(--accent)",
                        color: "white",
                      }}
                    >
                      PRO
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="p-4 rounded-lg" style={{ backgroundColor: "var(--btn)" }}>
        <h5 className="font-medium mb-2" style={{ color: "var(--text)" }}>
          🚀 What's Coming Next
        </h5>
        <ul className="text-sm space-y-1" style={{ color: "var(--muted)" }}>
          <li>• Social Features: Friend connections and shared lists</li>
          <li>• Advanced Recommendations: AI-powered suggestions</li>
          <li>• Community Content: User-submitted videos and reviews</li>
          <li>• Mobile App: Native iOS and Android apps</li>
          <li>• Offline Mode: Full functionality without internet</li>
        </ul>
      </div>
    </div>
  );
}

function AboutTab() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
        🏠 About Unique4U
      </h3>

      <div
        className="space-y-4 text-sm leading-relaxed"
        style={{ color: "var(--text)" }}
      >
        <p>
          We're not here to reinvent the wheel — we're here to make the wheel
          less squeaky. At Unique4U, our rule is simple: keep it simple. The
          world already has enough apps that feel like a second job to use. We'd
          rather give you tools that just… work.
        </p>

        <p>
          Everything we build has its own personality, but they all live under
          one roof: a people-first, all-inclusive, slightly offbeat house we
          call Unique4U. If it's fun, useful, and a little different from the
          pack — it belongs here.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
          👥 About the Creators
        </h4>

        <div
          className="space-y-3 text-sm leading-relaxed"
          style={{ color: "var(--text)" }}
        >
          <p>
            We're Pam and Travis. Think of us as casual builders with a shared
            allergy to overcomplication. We make things because we need them,
            and we figure you probably do too.
          </p>

          <p>
            Pam once trained dolphins (true story) and also happens to be really
            good with numbers. Travis studied English and Philosophy, which
            means he can overthink and explain it in writing, then somehow turn
            that into practical business know-how. Together, we're like a
            mash-up of "creative meets operations" — and that combo lets us
            build apps that are simple, useful, and not boring.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
          📱 About the App
        </h4>

        <div
          className="space-y-3 text-sm leading-relaxed"
          style={{ color: "var(--text)" }}
        >
          <p>
            Here's the deal: you want to remember what you're watching without
            needing a PhD in App Navigation. We built this because we got tired
            of two bad options — messy notes on our phones or bloated apps that
            make you log your "episode 7 mid-season thoughts." (Hard pass.)
          </p>

          <p className="text-xs italic" style={{ color: "var(--muted)" }}>
            Data Attribution: This product uses the TMDB API but is not endorsed
            or certified by TMDB.
          </p>

          <p>So we made this instead:</p>

          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>
                <strong>Stupidly easy.</strong> Open it, add your show, done.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>
                <strong>Always free at the core.</strong> No paywalls for the
                basics.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>
                <strong>Friend-proof sharing.</strong> Copy your list and drop
                it in a text when someone asks, "What should I watch?"
              </span>
            </li>
          </ul>

          <p>
            If you watch TV or movies and don't want to make it a hobby just to
            track them, this app's for you. Simple lists, zero drama.
          </p>
        </div>
      </div>
    </div>
  );
}

// Social Features Tab
function SocialTab() {
  // const translations = useTranslations(); // Unused

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
        👥 Social Features
      </h3>

      {/* Coming Soon Notice */}
      <div
        className="p-6 rounded-lg"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--line)",
          border: "1px solid",
        }}
      >
        <div className="text-center">
          <div className="text-4xl mb-4">🚧</div>
          <h4
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--text)" }}
          >
            Coming Soon!
          </h4>
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
            Social features are in development. Here's what we're planning:
          </p>
        </div>
      </div>

      {/* Planned Features */}
      <div className="space-y-4">
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: "var(--btn)",
            borderColor: "var(--line)",
            border: "1px solid",
          }}
        >
          <h5 className="font-semibold mb-2" style={{ color: "var(--text)" }}>
            👥 Friend Connections
          </h5>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Connect with friends and see what they're watching
          </p>
        </div>

        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: "var(--btn)",
            borderColor: "var(--line)",
            border: "1px solid",
          }}
        >
          <h5 className="font-semibold mb-2" style={{ color: "var(--text)" }}>
            📋 Shared Watchlists
          </h5>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Create collaborative watchlists with friends and family
          </p>
        </div>

        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: "var(--btn)",
            borderColor: "var(--line)",
            border: "1px solid",
          }}
        >
          <h5 className="font-semibold mb-2" style={{ color: "var(--text)" }}>
            💬 Activity Feed
          </h5>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            See what your friends are watching and their ratings
          </p>
        </div>

        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: "var(--btn)",
            borderColor: "var(--line)",
            border: "1px solid",
          }}
        >
          <h5 className="font-semibold mb-2" style={{ color: "var(--text)" }}>
            🎯 Recommendations
          </h5>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Get personalized recommendations based on your friends' tastes
          </p>
        </div>
      </div>

      {/* Pro Features */}
      <div
        className="p-4 rounded-lg"
        style={{
          backgroundColor: "rgba(77, 163, 255, 0.1)",
          borderColor: "var(--accent)",
          border: "1px solid",
        }}
      >
        <h5 className="font-semibold mb-2" style={{ color: "var(--accent)" }}>
          🔒 Pro Features
        </h5>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Advanced social features like private groups, custom recommendations,
          and priority support will be available with Pro.
        </p>
      </div>
    </div>
  );
}

// Community Stats Tab
function CommunityTab() {
  // const translations = useTranslations(); // Unused

  // Mock stats - in a real app, these would come from the backend
  const userStats = {
    games: {
      flickword: { played: 12, won: 8, lost: 4, streak: 3, bestStreak: 7 },
      trivia: { played: 25, won: 18, lost: 7, correct: 89, total: 125 },
    },
    media: {
      movies: { watching: 5, wishlist: 12, watched: 47 },
      tv: { watching: 8, wishlist: 15, watched: 23 },
    },
    community: {
      friends: 0,
      sharedLists: 0,
      recommendationsGiven: 0,
      recommendationsReceived: 0,
    },
  };

  const getWinRate = (won: number, played: number) => {
    return played > 0 ? Math.round((won / played) * 100) : 0;
  };

  const getAccuracy = (correct: number, total: number) => {
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
        🏆 Community Stats
      </h3>

      {/* Game Statistics */}
      <div>
        <h4
          className="text-lg font-medium mb-3"
          style={{ color: "var(--text)" }}
        >
          🎮 Game Statistics
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* FlickWord Stats */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--line)",
              border: "1px solid",
            }}
          >
            <h5 className="font-semibold mb-3" style={{ color: "var(--text)" }}>
              🎯 FlickWord
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--muted)" }}>Games Played:</span>
                <span style={{ color: "var(--text)" }}>
                  {userStats.games.flickword.played}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--muted)" }}>Win Rate:</span>
                <span style={{ color: "var(--text)" }}>
                  {getWinRate(
                    userStats.games.flickword.won,
                    userStats.games.flickword.played
                  )}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--muted)" }}>Current Streak:</span>
                <span style={{ color: "var(--text)" }}>
                  {userStats.games.flickword.streak}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--muted)" }}>Best Streak:</span>
                <span style={{ color: "var(--text)" }}>
                  {userStats.games.flickword.bestStreak}
                </span>
              </div>
            </div>
          </div>

          {/* Trivia Stats */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--line)",
              border: "1px solid",
            }}
          >
            <h5 className="font-semibold mb-3" style={{ color: "var(--text)" }}>
              🧠 Trivia
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--muted)" }}>Games Played:</span>
                <span style={{ color: "var(--text)" }}>
                  {userStats.games.trivia.played}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--muted)" }}>Win Rate:</span>
                <span style={{ color: "var(--text)" }}>
                  {getWinRate(
                    userStats.games.trivia.won,
                    userStats.games.trivia.played
                  )}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--muted)" }}>Accuracy:</span>
                <span style={{ color: "var(--text)" }}>
                  {getAccuracy(
                    userStats.games.trivia.correct,
                    userStats.games.trivia.total
                  )}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--muted)" }}>
                  Questions Correct:
                </span>
                <span style={{ color: "var(--text)" }}>
                  {userStats.games.trivia.correct}/
                  {userStats.games.trivia.total}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Statistics */}
      <div>
        <h4
          className="text-lg font-medium mb-3"
          style={{ color: "var(--text)" }}
        >
          📺 Media Statistics
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Movies */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--line)",
              border: "1px solid",
            }}
          >
            <h5 className="font-semibold mb-3" style={{ color: "var(--text)" }}>
              🎬 Movies
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--muted)" }}>
                  Currently Watching:
                </span>
                <span style={{ color: "var(--text)" }}>
                  {userStats.media.movies.watching}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--muted)" }}>Want to Watch:</span>
                <span style={{ color: "var(--text)" }}>
                  {userStats.media.movies.wishlist}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--muted)" }}>Watched:</span>
                <span style={{ color: "var(--text)" }}>
                  {userStats.media.movies.watched}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span style={{ color: "var(--text)" }}>Total:</span>
                <span style={{ color: "var(--text)" }}>
                  {userStats.media.movies.watching +
                    userStats.media.movies.wishlist +
                    userStats.media.movies.watched}
                </span>
              </div>
            </div>
          </div>

          {/* TV Shows */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--line)",
              border: "1px solid",
            }}
          >
            <h5 className="font-semibold mb-3" style={{ color: "var(--text)" }}>
              📺 TV Shows
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--muted)" }}>
                  Currently Watching:
                </span>
                <span style={{ color: "var(--text)" }}>
                  {userStats.media.tv.watching}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--muted)" }}>Want to Watch:</span>
                <span style={{ color: "var(--text)" }}>
                  {userStats.media.tv.wishlist}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--muted)" }}>Watched:</span>
                <span style={{ color: "var(--text)" }}>
                  {userStats.media.tv.watched}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span style={{ color: "var(--text)" }}>Total:</span>
                <span style={{ color: "var(--text)" }}>
                  {userStats.media.tv.watching +
                    userStats.media.tv.wishlist +
                    userStats.media.tv.watched}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Engagement */}
      <div>
        <h4
          className="text-lg font-medium mb-3"
          style={{ color: "var(--text)" }}
        >
          👥 Community Engagement
        </h4>
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--line)",
            border: "1px solid",
          }}
        >
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "var(--muted)" }}>Friends Connected:</span>
              <span style={{ color: "var(--text)" }}>
                {userStats.community.friends}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--muted)" }}>Shared Lists:</span>
              <span style={{ color: "var(--text)" }}>
                {userStats.community.sharedLists}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--muted)" }}>
                Recommendations Given:
              </span>
              <span style={{ color: "var(--text)" }}>
                {userStats.community.recommendationsGiven}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--muted)" }}>
                Recommendations Received:
              </span>
              <span style={{ color: "var(--text)" }}>
                {userStats.community.recommendationsReceived}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
