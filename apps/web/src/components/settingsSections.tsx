/**
 * Process: Settings Section Components
 * Purpose: Shared section rendering logic used by both desktop and mobile Settings UIs
 * Data Source: Settings hooks, library data, translations
 * Update Path: Modify section components here to update both desktop and mobile
 * Dependencies: settingsConfig.ts, settings.ts, proStatus.ts, useAdminRole.ts
 */

import { useState, useEffect } from "react";
import {
  useSettings,
  settingsManager,
  PersonalityLevel,
  getPersonalityText,
} from "../lib/settings";
import { useProStatus } from "../lib/proStatus";
import { useTranslations, useLanguage, changeLanguage } from "../lib/language";
import { PRO_FEATURES_AVAILABLE, PRO_FEATURES_COMING_SOON } from "./settingsProConfig";
import { UpgradeToProCTA } from "./UpgradeToProCTA";
import { useCustomLists, customListManager } from "../lib/customLists";
import { useUsername } from "../hooks/useUsername";
import { useAuth } from "../hooks/useAuth";
import { useLibrary } from "../lib/storage";
import { useAdminRole } from "../hooks/useAdminRole";
import PersonalityExamples from "./PersonalityExamples";
import ForYouGenreConfig from "./ForYouGenreConfig";
import type { Language } from "../lib/language.types";
import type { SettingsSectionId } from "./settingsConfig";
import type { ListName } from "../state/library.types";
import { lazy, Suspense } from "react";

// Lazy load heavy components
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

export interface SettingsSectionProps {
  onShowNotInterestedModal?: () => void;
  onShowSharingModal?: () => void;
  onShowNotificationSettings?: () => void;
  onShowNotificationCenter?: () => void;
  isMobile?: boolean; // If true, render mobile-optimized layout
}

/**
 * Render a settings section by ID
 * This is the single source of truth for section content
 */
export function renderSettingsSection(
  sectionId: SettingsSectionId,
  props: SettingsSectionProps = {}
): JSX.Element | null {
  switch (sectionId) {
    case "account":
      return <AccountSection {...props} />;
    case "notifications":
      return <NotificationsSection {...props} />;
    case "display":
      return <DisplaySection {...props} />;
    case "community":
      return <CommunitySection {...props} />;
    case "pro":
      return <ProSection {...props} />;
    case "data":
      return <DataSection {...props} />;
    case "about":
      return <AboutSection {...props} />;
    case "admin":
      return <AdminSection {...props} />;
    default:
      return null;
  }
}

// ============================================================================
// SECTION COMPONENTS
// ============================================================================

function AccountSection({ onShowNotInterestedModal }: SettingsSectionProps) {
  const settings = useSettings();
  const translations = useTranslations();
  const currentLanguage = useLanguage();
  const watchingItems = useLibrary("watching");
  const wishlistItems = useLibrary("wishlist");
  const watchedItems = useLibrary("watched");
  const notItems = useLibrary("not");
  const { username, updateUsername } = useUsername();
  const [displayName, setDisplayName] = useState(username);
  const [showWarning, setShowWarning] = useState(false);

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
        `${translations.areYouSureChangeDisplayName} ${translations.thisWillUpdateYourProfile}`
      );
      if (confirmed) {
        try {
          await updateUsername(displayName);
          setShowWarning(false);
        } catch (error) {
          console.error("Failed to update username:", error);
          alert(translations.usernameUpdateFailed);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
        {translations.accountAndProfile}
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
          {translations.myStatistics}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: "var(--card)" }}
          >
            <h5
              className="text-sm font-medium mb-2"
              style={{ color: "var(--text)" }}
            >
              {translations.tvShows}
            </h5>
            <div
              className="space-y-1 text-sm"
              style={{ color: "var(--muted)" }}
            >
              <div>
                {translations.currentlyWatching}: {tvStats.watching}
              </div>
              <div>
                {translations.wantToWatch}: {tvStats.wishlist}
              </div>
              <div>
                {translations.watched}: {tvStats.watched}
              </div>
              <div>
                {translations.notInterested}: {tvStats.not}
              </div>
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
              {translations.movies}
            </h5>
            <div
              className="space-y-1 text-sm"
              style={{ color: "var(--muted)" }}
            >
              <div>
                {translations.currentlyWatching}: {movieStats.watching}
              </div>
              <div>
                {translations.wantToWatch}: {movieStats.wishlist}
              </div>
              <div>
                {translations.watched}: {movieStats.watched}
              </div>
              <div>
                {translations.notInterested}: {movieStats.not}
              </div>
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
          {translations.notInterestedManagement}
        </h4>
        <button
          className="px-4 py-2 rounded-lg transition-colors"
          style={{ backgroundColor: "var(--btn)", color: "var(--text)" }}
          onClick={onShowNotInterestedModal}
        >
          {translations.manageNotInterestedList}
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
        <div className="mt-4">
          <PersonalityExamples personalityLevel={settings.personalityLevel} />
        </div>
      </div>

      {/* Reset to Defaults */}
      <div>
        <button
          onClick={() => {
            if (window.confirm(translations.confirmResetSettings)) {
              settingsManager.resetToDefaults();
            }
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          {translations.resetSettingsToDefaults}
        </button>
      </div>
    </div>
  );
}

function NotificationsSection({
  onShowNotificationSettings,
  onShowNotificationCenter,
}: SettingsSectionProps) {
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const proStatus = useProStatus();
  const isProUser = proStatus.isPro;
  const translations = useTranslations();

  const handleOpenSettings = () => {
    if (onShowNotificationSettings) {
      onShowNotificationSettings();
    } else {
      setShowNotificationSettings(true);
    }
  };

  const handleOpenCenter = () => {
    if (onShowNotificationCenter) {
      onShowNotificationCenter();
    } else {
      setShowNotificationCenter(true);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <h3 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
          {translations.notifications}
        </h3>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleOpenSettings}
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
                <div className="font-medium">{translations.notificationSettings}</div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {translations.notificationSettingsDescription}
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={handleOpenCenter}
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
                <div className="font-medium">{translations.notificationCenter}</div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {translations.notificationCenterDescription}
                </div>
              </div>
            </div>
          </button>
        </div>


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
            {translations.currentSettings}
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "var(--muted)" }}>
                {translations.episodeReminders}:
              </span>
              <span style={{ color: "var(--text)" }}>{translations.enabled}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--muted)" }}>
                {translations.notificationTiming}:
              </span>
              <span style={{ color: "var(--text)" }}>
                {isProUser
                  ? translations.timingCustomPro
                  : translations.timing24HoursBefore}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--muted)" }}>
                {translations.notificationMethods}:
              </span>
              <span style={{ color: "var(--text)" }}>
                {isProUser
                  ? translations.methodsInAppPushEmail
                  : translations.methodsInAppPush}
              </span>
            </div>
          </div>
        </div>

        {/* Pro Upgrade Banner - Small note only */}
        <UpgradeToProCTA variant="banner" />
      </div>

      {/* Modals */}
      {showNotificationSettings && (
        <Suspense fallback={<div>Loading...</div>}>
          <NotificationSettings
            isOpen={showNotificationSettings}
            onClose={() => setShowNotificationSettings(false)}
          />
        </Suspense>
      )}
      {showNotificationCenter && (
        <Suspense fallback={<div>Loading...</div>}>
          <NotificationCenter
            isOpen={showNotificationCenter}
            onClose={() => setShowNotificationCenter(false)}
          />
        </Suspense>
      )}
    </>
  );
}

function CommunitySection({ isMobile: _isMobile }: SettingsSectionProps) {
  const { isAuthenticated, user } = useAuth();
  const [emailSubscribed, setEmailSubscribed] = useState<boolean | null>(null);
  const [updatingEmailSub, setUpdatingEmailSub] = useState(false);
  const settings = useSettings();

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
      <h3 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
        Community
      </h3>

      {/* Weekly Email Digest */}
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

      {/* Topic Following - Placeholder for future settings */}
      <div
        className="p-4 rounded-lg"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--line)",
          border: "1px solid",
        }}
      >
        <h4
          className="text-lg font-medium mb-1"
          style={{ color: "var(--text)" }}
        >
          📌 Topic Following
        </h4>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Manage your followed topics in the Community Hub. Follow topics to
          prioritize posts in your feed.
        </p>
        <p className="text-xs mt-2 italic" style={{ color: "var(--muted)" }}>
          Currently managed in the Community Hub interface
        </p>
      </div>

      {/* Community Stats - Placeholder for future stats */}
      {settings.community.followedTopics.length > 0 && (
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--line)",
            border: "1px solid",
          }}
        >
          <h4
            className="text-lg font-medium mb-2"
            style={{ color: "var(--text)" }}
          >
            Community Activity
          </h4>
          <div className="text-sm" style={{ color: "var(--muted)" }}>
            <div>Following {settings.community.followedTopics.length} topic{settings.community.followedTopics.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function DisplaySection({ isMobile: _isMobile }: SettingsSectionProps) {
  const settings = useSettings();
  const translations = useTranslations();
  const { isPro } = useProStatus();
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
      alert(error instanceof Error ? error.message : translations.failedToCreateList);
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
      alert(error instanceof Error ? error.message : translations.failedToUpdateList);
    }
  };

  const handleCancelEdit = () => {
    setEditingListId(null);
    setEditName("");
    setEditDescription("");
  };

  const handleDeleteList = (listId: string) => {
    try {
      const list = customListManager.getListById(listId);
      if (!list) {
        alert(translations.listNotFound);
        return;
      }

      const confirmed = window.confirm(
        `${translations.confirmDeleteList || "Are you sure you want to delete"} "${list.name}"? ${translations.thisActionCannotBeUndone || "This action cannot be undone."}`
      );

      if (confirmed) {
        customListManager.deleteList(listId);
      }
      } catch (error) {
      alert(error instanceof Error ? error.message : translations.failedToDeleteList);
    }
  };

  const handleSetDefault = (listId: string) => {
    try {
      customListManager.setSelectedList(listId);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : translations.failedToSetDefaultList
      );
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
        {translations.displayAndLayout}
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
          {translations.discoveryRecommendations}
        </label>
        <div className="space-y-2">
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {translations.discoveryRecommendationsDescription}
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
            {translations.myLists}
          </h4>
          {userLists.customLists.length < userLists.maxLists && (
              <button
                onClick={handleCreateList}
                className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                style={{ backgroundColor: "var(--accent)", color: "white" }}
              >
                {translations.createNewList}
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
                    placeholder={translations.listName}
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
                    placeholder={translations.listDescriptionOptional}
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
                      {list.itemCount} {translations.items}
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
                {translations.noListsCreated}
              </p>
              <button
                onClick={handleCreateList}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: "var(--accent)", color: "white" }}
              >
                {translations.createYourFirstList}
              </button>
            </div>
          )}
        </div>

        <div className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
          {translations.listsUsed}:{" "}
          {userLists.customLists.length}/{userLists.maxLists}
        </div>
      </div>

      {/* Other Layout Settings */}
      <div>
        <h4
          className="text-lg font-medium mb-3"
          style={{ color: "var(--text)" }}
        >
          {translations.otherLayoutSettings}
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
              {translations.condensedViewDescription}
            </p>
          </div>

          <div className="space-y-1">
            <label
              className={`flex items-center space-x-3 ${settings.layout.condensedView && !isPro ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <input
                type="checkbox"
                checked={settings.layout.episodeTracking}
                onChange={() => settingsManager.toggleEpisodeTracking()}
                disabled={settings.layout.condensedView && !isPro}
                className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 rounded focus:ring-blue-500"
              />
              <span style={{ color: "var(--text)" }}>
                {translations.enableEpisodeTracking}
              </span>
            </label>
            {settings.layout.condensedView && !isPro && (
              <p className="text-xs ml-7" style={{ color: "var(--muted)" }}>
                {translations.episodeTrackingCondensedProRequired}{" "}
                <UpgradeToProCTA variant="inline" />
              </p>
            )}
            {settings.layout.condensedView && isPro && (
              <p className="text-xs ml-7" style={{ color: "var(--muted)" }}>
                {translations.episodeTrackingCondensedProAllowed}
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
          {translations.forYouSectionConfiguration}
        </h4>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          {translations.forYouSectionDescription}
        </p>

        <ForYouGenreConfig />
      </div>

      {/* Pro Features - Theme Packs */}
      {/* Pro gating: Theme packs are Pro-only (future feature) */}
      {/* Config: settings.pro.features.themePacks, settingsProConfig.ts - PRO_FEATURES_COMING_SOON */}
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

function ProSection({ isMobile: _isMobile }: SettingsSectionProps) {
  const proStatus = useProStatus();
  const isProUser = proStatus.isPro;
  const { isAdmin } = useAdminRole();

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
          {isProUser ? "You're a Pro" : "Upgrade to Flicklet Pro"}
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          {isProUser
            ? "Thanks for going Pro! All features are unlocked."
            : "Get more out of Flicklet with Pro features."}
        </p>
        {!isProUser && (
          <UpgradeToProCTA variant="button" />
        )}
      </div>

      {/* Alpha/Testing Toggle - Admin only */}
      {isAdmin && (
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
      )}

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
            {PRO_FEATURES_AVAILABLE.map((feature) => (
              <div
                key={feature.id}
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: "var(--bg)",
                  borderColor: "var(--line)",
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{feature.icon}</div>
                  <div className="flex-1">
                    <h5
                      className="font-medium mb-1"
                      style={{ color: "var(--text)" }}
                    >
                      {feature.title}
                    </h5>
                    <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>
                      {feature.description}
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
            ))}
          </div>
        </div>

        {/* Coming Soon Section */}
        {PRO_FEATURES_COMING_SOON.length > 0 && (
          <div className="mt-8">
            <h5
              className="text-sm font-medium mb-3"
              style={{ color: "var(--text)" }}
            >
              Coming Soon
            </h5>
            <div className="space-y-4">
              {PRO_FEATURES_COMING_SOON.map((feature) => (
                <div
                  key={feature.id}
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: "var(--bg)",
                    borderColor: "var(--line)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{feature.icon}</div>
                    <div className="flex-1">
                      <h5
                        className="font-medium mb-1"
                        style={{ color: "var(--text)" }}
                      >
                        {feature.title}
                      </h5>
                      <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>
                        {feature.description}
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
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DataSection({ onShowSharingModal }: SettingsSectionProps) {
  /**
   * Process: User Data Backup & Restore
   * Purpose: Manual, local-only backup/restore plus share-entry surface in Settings
   * Data Source: localStorage keys prefixed with flicklet.*
   * Update Path: DataSection in settingsSections.tsx
   * Dependencies: Library storage helpers, Sharing modal flow
   */
  const [showSharingModal, setShowSharingModal] = useState(false);

  const handleBackup = async () => {
    try {
      const libraryData = JSON.parse(
        localStorage.getItem("flicklet.library.v2") || "{}"
      );

      const watchlists = {
        movies: {
          watching: [] as any[],
          wishlist: [] as any[],
          watched: [] as any[],
        },
        tv: {
          watching: [] as any[],
          wishlist: [] as any[],
          watched: [] as any[],
        },
        customLists: [] as any[],
        customItems: {} as Record<string, any[]>,
      };

      Object.values(libraryData).forEach((item: any) => {
        const mediaItem = {
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
          const customListId = item.list.replace("custom:", "");
          if (!watchlists.customItems[customListId]) {
            watchlists.customItems[customListId] = [];
          }
          watchlists.customItems[customListId].push(mediaItem);
        } else if (
          item.list &&
          ["watching", "wishlist", "watched"].includes(item.list)
        ) {
          if (
            item.mediaType === "movie" &&
            watchlists.movies[item.list as keyof typeof watchlists.movies]
          ) {
            (
              watchlists.movies[
                item.list as keyof typeof watchlists.movies
              ] as any[]
            ).push(mediaItem);
          } else if (
            item.mediaType === "tv" &&
            watchlists.tv[item.list as keyof typeof watchlists.tv]
          ) {
            (
              watchlists.tv[
                item.list as keyof typeof watchlists.tv
              ] as any[]
            ).push(mediaItem);
          }
        }
      });

      const customListsData = localStorage.getItem("flicklet.customLists.v2");
      if (customListsData) {
        try {
          const customLists = JSON.parse(customListsData);
          watchlists.customLists = customLists.customLists || [];
        } catch (error) {
          console.warn("Failed to parse custom lists:", error);
        }
      }

      const settings = JSON.parse(
        localStorage.getItem("flicklet-settings") || "{}"
      );
      const user = JSON.parse(localStorage.getItem("flicklet-user") || "{}");

      const userData = {
        watchlists,
        settings,
        user,
        timestamp: new Date().toISOString(),
        version: "2.0",
      };

      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `flicklet-backup-${new Date()
        .toISOString()
        .split("T")[0]}.json`;
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

      let userData: any;
      try {
        const text = await file.text();
        userData = JSON.parse(text);
      } catch (error) {
        console.error("Restore failed to parse file:", error);
        alert(
          "❌ Restore failed: Unable to read the backup file. Please select a Flicklet backup."
        );
        return;
      }

      if (
        !userData?.watchlists ||
        typeof userData.watchlists !== "object" ||
        !(
          userData.watchlists.movies ||
          userData.watchlists.tv ||
          userData.watchlists.customLists
        )
      ) {
        alert(
          "❌ Restore failed: The backup file is missing watchlist data. Please choose a valid Flicklet backup."
        );
        return;
      }

      const backupDate = userData.timestamp
        ? new Date(userData.timestamp)
        : null;
      const formattedDate = backupDate
        ? backupDate.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "unknown date";
      const backupVersion = userData.version || "unknown version";
      const confirmed = window.confirm(
        `⚠️ This will overwrite ALL local data on this device with the backup from ${formattedDate} (version ${backupVersion}). This action cannot be undone. Continue?`
      );

      if (!confirmed) return;

      const safeSetItem = (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (error) {
          console.error(`Failed to write ${key}:`, error);
          return false;
        }
      };

      try {
        localStorage.removeItem("flicklet.library.v2");

        let restoredCount = 0;
        const { Library } = await import("../lib/storage");

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
                const mediaItem = {
                  id: item.id,
                  mediaType: "movie" as const,
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
            {
              list: "watching",
              items: userData.watchlists.tv.watching || [],
            },
            {
              list: "wishlist",
              items: userData.watchlists.tv.wishlist || [],
            },
            {
              list: "watched",
              items: userData.watchlists.tv.watched || [],
            },
          ];

          lists.forEach(({ list, items }) => {
            items.forEach((item: any) => {
              if (item && item.id) {
                const mediaItem = {
                  id: item.id,
                  mediaType: "tv" as const,
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

        // Restore custom lists
        if (
          userData.watchlists.customLists &&
          Array.isArray(userData.watchlists.customLists)
        ) {
          const customListsData = {
            customLists: userData.watchlists.customLists,
            selectedListId: userData.watchlists.selectedListId || null,
            maxLists: userData.watchlists.maxLists || 10,
          };
          if (
            !safeSetItem(
              "flicklet.customLists.v2",
              JSON.stringify(customListsData)
            )
          ) {
            throw new Error("Unable to restore custom lists.");
          }
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
                    const mediaItem = {
                      id: item.id,
                      mediaType: (item.mediaType || "movie") as "movie" | "tv",
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

        if (userData.settings) {
          if (
            !safeSetItem(
              "flicklet-settings",
              JSON.stringify(userData.settings)
            )
          ) {
            throw new Error("Unable to restore settings.");
          }
        }

        if (userData.user) {
          if (
            !safeSetItem("flicklet-user", JSON.stringify(userData.user))
          ) {
            throw new Error("Unable to restore user data.");
          }
        }

        alert(
          `✅ Data restored from ${formattedDate} (version ${backupVersion}). A reload will ensure the restored data appears. ${restoredCount} items restored.`
        );

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error("Restore failed:", error);
        alert(
          `❌ Restore failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }. Please check the backup file and try again.`
        );
      }
    };
    input.click();
  };

  const handleSystemWipe = () => {
    try {
      const confirmed = confirm(
        "🚨 NUCLEAR OPTION: This will permanently delete ALL your data including:\n\n" +
          "• All watchlists (movies & TV)\n" +
          "• All settings\n" +
          "• All user preferences\n" +
          "• Everything stored locally\n\n" +
          "This action CANNOT be undone. Are you absolutely sure?"
      );

      if (!confirmed) return;

      const doubleConfirmed = confirm(
        "⚠️ FINAL WARNING: This will completely wipe your Flicklet data.\n\n" +
          'Type "DELETE" in the next prompt to confirm.'
      );

      if (!doubleConfirmed) return;

      const finalCheck = prompt('Type "DELETE" to confirm system wipe:');

      if (finalCheck !== "DELETE") {
        alert(
          '❌ System wipe cancelled. You must type exactly "DELETE" to confirm.'
        );
        return;
      }

      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith("flicklet-")
      );
      keys.forEach((key) => localStorage.removeItem(key));

      const allKeys = Object.keys(localStorage);
      const flickletKeys = allKeys.filter(
        (key) =>
          key.toLowerCase().includes("flicklet") ||
          key.toLowerCase().includes("library") ||
          key.startsWith("flag:")
      );
      flickletKeys.forEach((key) => localStorage.removeItem(key));

      alert("💥 System wiped successfully! The page will refresh.");

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("System wipe failed:", error);
      alert(
        "❌ System wipe failed: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  };

  const handleShowSharing = () => {
    if (onShowSharingModal) {
      onShowSharingModal();
    } else {
      setShowSharingModal(true);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <h3 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
          Data & Backups
        </h3>

        {/* Share with Friends */}
        <div>
          <h4 className="text-lg font-medium mb-3" style={{ color: "var(--text)" }}>
            📤 Share Your Lists
          </h4>
          <div className="space-y-3">
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--line)",
                border: "1px solid",
              }}
            >
              <h5 className="font-medium mb-2" style={{ color: "var(--text)" }}>
                Share your lists
              </h5>
              <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
                Generate a text snapshot of your lists that you can paste into messages or social posts.
              </p>
              <button
                onClick={handleShowSharing}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "white",
                  border: "none",
                }}
              >
                📤 Share your lists
              </button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div>
          <h4 className="text-lg font-medium mb-3" style={{ color: "var(--text)" }}>
            💾 Data Management
          </h4>
          <div className="space-y-3">
            {/* Backup */}
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--line)",
                border: "1px solid",
              }}
            >
              <h5 className="font-medium mb-2" style={{ color: "var(--text)" }}>
                💾 Backup Data
              </h5>
              <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
                Download a local JSON file that includes your watchlists, custom lists, and settings. The file is saved to your device only and never uploaded to the cloud.
              </p>
              <button
                onClick={handleBackup}
                className="px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ backgroundColor: "var(--accent)", color: "white" }}
              >
                💾 Download Backup
              </button>
            </div>

            {/* Restore */}
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--line)",
                border: "1px solid",
              }}
            >
              <h5 className="font-medium mb-2" style={{ color: "var(--text)" }}>
                📥 Restore Data
              </h5>
              <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
                Upload a Flicklet backup file to overwrite data on this device only. This restores the library, lists, and settings from the chosen snapshot.
              </p>
              <button
                onClick={handleRestore}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                style={{ 
                  backgroundColor: "#10b981", 
                  color: "white",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                📥 Restore from Backup
              </button>
            </div>

            {/* System Wipe */}
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--error)",
                border: "1px solid",
              }}
            >
              <h5 className="font-medium mb-2" style={{ color: "var(--error)" }}>
                🚨 System Wipe
              </h5>
              <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
                Permanently delete ALL your data. This action cannot be undone.
              </p>
              <button
                onClick={handleSystemWipe}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                style={{ 
                  backgroundColor: "#ef4444", 
                  color: "white",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                🚨 Nuclear Option
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sharing fallback for contexts without a global SharingModal */}
      {showSharingModal && !onShowSharingModal && (
        <div
          className="p-4 rounded-lg mt-4"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--line)",
            border: "1px solid",
          }}
        >
          <p className="text-sm" style={{ color: "var(--text)" }}>
            The sharing experience is managed by the parent view in this layout.
            Please open Settings from the main app to share your lists.
          </p>
          <button
            onClick={() => setShowSharingModal(false)}
            className="mt-3 px-3 py-1 text-xs font-medium rounded-lg transition-colors"
            style={{
              backgroundColor: "var(--btn)",
              color: "var(--text)",
            }}
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}

function AboutSection(_props: SettingsSectionProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
        About
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
              <span className="mt-0.5">•</span>
              <span>
                <strong>Stupidly easy.</strong> Open it, add your show, done.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>
                <strong>Always free at the core.</strong> No paywalls for the
                basics.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
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

function AdminSection(props: SettingsSectionProps) {
  const { isAdmin, loading } = useAdminRole();
  
  if (loading) {
    return <div>Loading admin...</div>;
  }
  
  if (!isAdmin) {
    return null;
  }
  
  return (
    <div className="w-full" style={{ minWidth: 0, maxWidth: "100%", overflow: "hidden", boxSizing: "border-box" }}>
      <Suspense fallback={<div>Loading admin...</div>}>
        <AdminExtrasPage isMobile={props.isMobile ?? false} />
      </Suspense>
    </div>
  );
}

