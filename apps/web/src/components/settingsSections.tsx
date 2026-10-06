import {
  isAndroidBillingAvailable,
  restoreFullAccess,
} from "../lib/proUpgrade";
import { t } from "@/lib/language";
import { recoveryErrorKey } from "../lib/accountErrors";
import { formatDateTime } from "../lib/localeFormatters";
import { t as coreText, tPlural } from "../lib/language";
import SharingModal from "./modals/SharingModal";
import StartOverControl from "./StartOverControl";
import { downloadBackup } from "../lib/downloadBackup";
/**
 * Process: Settings Section Components
 * Purpose: Shared section rendering logic used by both desktop and mobile Settings UIs
 * Data Source: Settings hooks, library data, translations
 * Update Path: Modify section components here to update both desktop and mobile
 * Dependencies: settingsConfig.ts, settings.ts, proStatus.ts, useAdminRole.ts
 */

import { useState } from "react";
import {
  useSettings,
  settingsManager,
  resolveFlickletLine,
  type PersonalityLevel,
} from "../lib/settings";
// PersonalityName type used implicitly through PERSONALITY_LIST
import { useEntitlements } from "../hooks/useEntitlements";
import { getTrialStatusLabel } from "../lib/entitlements";
import { useTranslations, useLanguage, changeLanguage } from "../lib/language";
import { PRO_FEATURES_AVAILABLE } from "./settingsProConfig";
import { UpgradeToProCTA } from "./UpgradeToProCTA";
import { useFullAccessProduct } from "../hooks/useFullAccessProduct";
import { useCustomLists, customListManager } from "../lib/customLists";
import PreferredNameEditor from "./PreferredNameEditor";
import ResetSettingsButton from "./ResetSettingsButton";
import { useLibrary } from "../lib/storage";
import { useAdminRole } from "../hooks/useAdminRole";
// PersonalityExamples removed - inline preview is sufficient
import ForYouGenreConfig from "./ForYouGenreConfig";
import type { Language } from "../lib/language.types";
import type { SettingsSectionId } from "./settingsConfig";
import { createBackup, restoreBackup } from "../lib/backupPersistence";
import { parseBackup } from "../lib/backup";
import { lazy, Suspense } from "react";

// Lazy load heavy components
const NotificationCenter = lazy(() =>
  import("./modals/NotificationCenter").then((m) => ({
    default: m.NotificationCenter,
  })),
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
  props: SettingsSectionProps = {},
): JSX.Element | null {
  switch (sectionId) {
    case "account":
      return <AccountSection {...props} />;
    case "notifications":
      return <NotificationsSection {...props} />;
    case "display":
      return <DisplaySection {...props} />;
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

      <PreferredNameEditor />

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
                {translations.currentlyWatchingAction}: {tvStats.watching}
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
                {translations.currentlyWatchingAction}: {movieStats.watching}
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

      {/* Flicklet personality intensity (Phase 1 — single voice) */}
      <fieldset className="min-w-0">
        <legend
          className="block text-sm font-medium mb-2"
          style={{ color: "var(--text)" }}
        >
          {translations.personalityLevel}
        </legend>
        <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
          {t(
            "contentFlickletNoticesYourListsAndCommentsWhenItFitsMinimalKeepsThingsQuietMaximumIsMoreOpinion",
          )}
        </p>
        <div className="grid grid-cols-1 gap-2">
          {(
            [
              {
                level: 1 as PersonalityLevel,
                label: t("contentMinimal"),
                hint: t("contentQuietMarqueeOff"),
              },
              {
                level: 2 as PersonalityLevel,
                label: t("contentStandard"),
                hint: t("contentRecommended"),
              },
              {
                level: 3 as PersonalityLevel,
                label: t("contentMaximum"),
                hint: t("contentMoreObservationsStrongerTone"),
              },
            ] as const
          ).map(({ level, label, hint }) => {
            const isSelected = (settings.personalityLevel ?? 2) === level;
            return (
              <label
                key={level}
                className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg transition-all ${
                  isSelected ? "ring-2 ring-blue-500" : ""
                }`}
                style={{
                  backgroundColor: isSelected ? "var(--card)" : "transparent",
                  border: "1px solid var(--line)",
                }}
              >
                <input
                  type="radio"
                  name="personalityLevel"
                  value={level}
                  checked={isSelected}
                  onChange={() => settingsManager.updatePersonalityLevel(level)}
                  className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium" style={{ color: "var(--text)" }}>
                    {label}
                  </div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    {hint}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
        <div
          className="mt-3 p-3 rounded-lg"
          style={{ backgroundColor: "var(--card)" }}
        >
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {translations.preview}:
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text)" }}>
            &ldquo;
            {resolveFlickletLine("home.header", settings.personalityLevel) ||
              t("contentYourListsAreHere")}
            &rdquo;
          </p>
        </div>
      </fieldset>

      {/* Reset to Defaults */}
      <ResetSettingsButton />
    </div>
  );
}

function NotificationsSection({
  onShowNotificationCenter,
}: SettingsSectionProps) {
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const translations = useTranslations();

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

        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t('settingsRemindersCopy')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="font-medium">
                  {translations.notificationCenter}
                </div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {translations.notificationCenterDescription}
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Modals */}
      {showNotificationCenter && (
        <Suspense fallback={<div>{t('settingsLoading')}</div>}>
          <NotificationCenter
            isOpen={showNotificationCenter}
            onClose={() => setShowNotificationCenter(false)}
          />
        </Suspense>
      )}
    </>
  );
}

function DisplaySection({ isMobile: _isMobile }: SettingsSectionProps) {
  const settings = useSettings();
  const translations = useTranslations();
  useEntitlements(); // Preserve access-state recovery for the neighboring My Lists controls.
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
      alert(
        error instanceof Error
          ? error.message
          : translations.failedToCreateList,
      );
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
      alert(
        error instanceof Error
          ? error.message
          : translations.failedToUpdateList,
      );
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
        coreText("coreDeleteListConfirm", { name: list.name }),
      );

      if (confirmed) {
        customListManager.deleteList(listId);
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : translations.failedToDeleteList,
      );
    }
  };

  const handleSetDefault = (listId: string) => {
    try {
      customListManager.setSelectedList(listId);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : translations.failedToSetDefaultList,
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
                      limit as 25 | 50 | 75 | 100,
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
                      {tPlural(
                        { one: "coreItemOne", other: "coreItemsOther" },
                        list.itemCount,
                      )}
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
          {translations.listsUsed}: {userLists.customLists.length}/
          {userLists.maxLists}
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
                checked={settings.layout.episodeTracking}
                onChange={() => settingsManager.toggleEpisodeTracking()}
                className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 rounded focus:ring-blue-500"
              />
              <span style={{ color: "var(--text)" }}>
                {translations.enableEpisodeTracking}
              </span>
            </label>
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
    </div>
  );
}

function ProSection({ isMobile: _isMobile }: SettingsSectionProps) {
  useLanguage();
  const entitlements = useEntitlements();
  const trialLabel = getTrialStatusLabel(entitlements);
  const featureCopy = {
    "shows-like-this": { title: "accessShows", description: "accessShowsCopy" },
    extras: { title: "accessExtras", description: "accessExtrasCopy" },
    "watch-reminders": {
      title: "accessReminders",
      description: "accessRemindersCopy",
    },
    "unlimited-custom-lists": {
      title: "accessLists",
      description: "accessListsCopy",
    },
  } as const;
  const priceState = useFullAccessProduct();
  const purchaseDisabled =
    priceState.status === "loading" || priceState.status === "unavailable";

  const priceLabel = entitlements.paidPro
    ? coreText(entitlements.proSource === "manual" ? "accessAdminGranted" : "accessComplete")
    : priceState.status === "available"
      ? coreText("accessPrice", { price: priceState.product.price })
      : priceState.status === "loading"
        ? coreText("accessPriceLoading")
        : priceState.status === "unavailable"
          ? coreText("accessPriceUnavailable")
          : coreText("accessPricePlay");

  return (
    <div className="space-y-6">
      <div
        className="text-center p-6 rounded-lg"
        style={{ backgroundColor: "var(--btn)" }}
      >
        <div className="text-4xl mb-3">💎</div>
        <h3
          className="text-2xl font-semibold mb-2"
          style={{ color: "var(--text)" }}
        >
          {coreText("accessName")}
        </h3>
        <p
          className="text-xl font-semibold mb-3"
          style={{
            color: entitlements.paidPro ? "var(--text)" : "var(--accent)",
          }}
        >
          {priceLabel}
        </p>
        <p
          className="text-sm font-medium mb-3"
          style={{ color: "var(--text)" }}
        >
          {entitlements.paidPro
            ? coreText(entitlements.proSource === "manual" ? "accessAdminGranted" : "accessPurchased")
            : entitlements.trialActive
              ? (trialLabel ?? coreText("accessTrial21"))
              : entitlements.isReadOnlyMode
                ? coreText("accessReadOnlyHeading")
                : coreText("accessSignIn")}
        </p>
        {entitlements.isReadOnlyMode ? (
          <div
            className="text-sm mb-3 space-y-3"
            style={{ color: "var(--muted)" }}
          >
            <p>{coreText("accessReadOnly")}</p>
            <p>{coreText("accessExplainer")}</p>
          </div>
        ) : (
          <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
            {entitlements.paidPro
              ? coreText(entitlements.proSource === "manual" ? "accessAdminCopy" : "accessThanks")
              : entitlements.trialActive
                ? coreText("accessExplore", {
                    trial: trialLabel ?? coreText("accessTrial21"),
                  })
                : coreText("accessFeaturesCopy")}
          </p>
        )}
        {(!entitlements.paidPro || isAndroidBillingAvailable()) && (
          <div className="mt-3">
            {isAndroidBillingAvailable() ? (
              <>
                <UpgradeToProCTA variant="button" disabled={purchaseDisabled} />
                <button
                  type="button"
                  className="px-4 py-3 mt-3 rounded border block mx-auto"
                  onClick={() => {
                    void restoreFullAccess().catch(() => undefined);
                  }}
                >
                  {coreText("purchaseRestore")}
                </button>
              </>
            ) : (
              <p className="text-sm">{coreText("purchaseAndroidOnly")}</p>
            )}
          </div>
        )}
        {priceState.status === "unavailable" && !entitlements.paidPro && (
          <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
            {coreText("accessPriceRetry")}
          </p>
        )}
        {entitlements.trialActive && !entitlements.paidPro && (
          <p className="text-xs mt-3" style={{ color: "var(--muted)" }}>
            {coreText("accessTrialKeep")}
          </p>
        )}
      </div>

      <div>
        <h4
          className="text-lg font-medium mb-3"
          style={{ color: "var(--text)" }}
        >
          {entitlements.trialActive && !entitlements.paidPro
            ? coreText("accessIncluded")
            : coreText("accessIncludes")}
        </h4>

        <div className="mb-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {PRO_FEATURES_AVAILABLE.map((feature) => (
              <div
                key={feature.id}
                className="p-3 rounded-lg border"
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
                      {coreText(
                        featureCopy[feature.id as keyof typeof featureCopy]
                          .title,
                      )}
                    </h5>
                    <p className="text-sm" style={{ color: "var(--muted)" }}>
                      {coreText(
                        featureCopy[feature.id as keyof typeof featureCopy]
                          .description,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DataSection({ onShowSharingModal }: SettingsSectionProps) {
  useLanguage();
  const translations = useTranslations();
  /**
   * Process: User Data Backup & Restore
   * Purpose: Validated portable backup and safe replacement using current persistence paths
   * Data Source: Current library, settings, profile and allowlisted user data
   * Update Path: DataSection in settingsSections.tsx
   * Dependencies: Library storage helpers, Sharing modal flow
   */
  const [showSharingModal, setShowSharingModal] = useState(false);

  const [backupBusy, setBackupBusy] = useState(false);
  const handleBackup = async () => {
    setBackupBusy(true);
    try {
      const backup = await createBackup();
      const delivery = await downloadBackup(backup);
      if (delivery.status === "saved") alert(coreText("recoveryBackupSaved"));
      else if (delivery.status === "download-started") alert(coreText("recoveryBackupDownloadStarted"));
      else if (delivery.status === "failed") alert(coreText("recoveryBackupSaveError"));
    } catch (error) {
      console.error("Backup failed", error);
      alert(coreText(recoveryErrorKey(error, "backup")));
    } finally {
      setBackupBusy(false);
    }
  };
  const handleRestore = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setBackupBusy(true);
      try {
        if (file.size > 10 * 1024 * 1024)
          throw new Error("The backup exceeds 10 MB.");
        const backup = parseBackup(await file.text());
        if (
          !window.confirm(
            coreText("recoveryConfirm", {
              date: formatDateTime(new Date(backup.createdAt)),
            }),
          )
        )
          return;
        const warning = await restoreBackup(backup);
        alert(
          coreText(warning ? "recoveryReminderWarning" : "recoverySuccess"),
        );
        window.location.reload();
      } catch (error) {
        console.error("Restore failed", error);
        alert(coreText(recoveryErrorKey(error, "restore")));
      } finally {
        setBackupBusy(false);
      }
    };
    input.click();
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
          {coreText("recoveryData")}
        </h3>

        {/* Share with Friends */}
        <div>
          <h4
            className="text-lg font-medium mb-3"
            style={{ color: "var(--text)" }}
          >
            📤 {translations.sharingTitle}
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
                {translations.sharingTitle}
              </h5>
              <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
                {translations.sharingDescription}
              </p>
              <button
                onClick={handleShowSharing}
                className="min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "white",
                  border: "none",
                }}
              >
                📤 {translations.sharingTitle}
              </button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div>
          <h4
            className="text-lg font-medium mb-3"
            style={{ color: "var(--text)" }}
          >
            💾 {coreText("recoveryManagement")}
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
                💾 {coreText("recoveryBackup")}
              </h5>
              <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
                {coreText("recoveryBackupCopy")}
              </p>
              <button
                disabled={backupBusy}
                onClick={handleBackup}
                className="min-h-[44px] px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ backgroundColor: "var(--accent)", color: "white" }}
              >
                💾 {coreText("recoveryDownload")}
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
                📥 {coreText("recoveryRestore")}
              </h5>
              <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
                {coreText("recoveryRestoreCopy")}
              </p>
              <button
                disabled={backupBusy}
                onClick={handleRestore}
                className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                style={{
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                📥 {coreText("recoveryRestoreButton")}
              </button>
            </div>

            <StartOverControl disabled={backupBusy} />
          </div>
        </div>
      </div>

      {showSharingModal && !onShowSharingModal && (
        <SharingModal onClose={() => setShowSharingModal(false)} />
      )}
    </>
  );
}

function AboutSection(_props: SettingsSectionProps) {
  const translations = useTranslations();
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
        {translations.about}
      </h3>

      <div
        className="space-y-4 text-sm leading-relaxed"
        style={{ color: "var(--text)" }}
      >
        <p>{t('settingsAboutIntro')}</p>

        <p>{t('settingsAboutHouse')}</p>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
          👥 {t('settingsAboutCreators')}
        </h4>

        <div
          className="space-y-3 text-sm leading-relaxed"
          style={{ color: "var(--text)" }}
        >
          <p>{t('settingsAboutBuilders')}</p>

          <p>{t('settingsAboutBackground')}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
          📱 {t('settingsAboutApp')}
        </h4>

        <div
          className="space-y-3 text-sm leading-relaxed"
          style={{ color: "var(--text)" }}
        >
          <p>{t('settingsAboutProblem')}</p>

          <p className="text-xs italic" style={{ color: "var(--muted)" }}>
            {translations.legalAttribution}
          </p>

          <p>{t('settingsAboutInstead')}</p>

          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>
                <strong>{t('settingsAboutSimpleHeading')}</strong>{' '}{t('settingsAboutSimpleCopy')}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>
                <strong>{translations.legalAccessHeading}</strong>{" "}
                {translations.legalAccessCopy}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>
                <strong>{t('settingsAboutShareHeading')}</strong>{' '}{t('settingsAboutShareCopy')}
              </span>
            </li>
          </ul>

          <p>{t('settingsAboutAudience')}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
          📜 {translations.legalHeading}
        </h4>

        <div
          className="space-y-3 text-sm leading-relaxed"
          style={{ color: "var(--text)" }}
        >
          <p>
            <a
              href="https://flicklet.netlify.app/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={translations.legalOpenPrivacy}
              className="inline-flex items-center min-h-[44px] underline hover:no-underline transition-all"
              style={{ color: "var(--accent)" }}
            >
              {translations.legalPrivacy}
            </a>
            {" - "}
            {translations.legalPrivacyDescription}
          </p>
        </div>
      </div>
    </div>
  );
}

function AdminSection(props: SettingsSectionProps) {
  const { isAdmin, loading } = useAdminRole();

  if (loading) {
    return (
      <div style={{ color: "var(--muted)" }}>Checking admin access...</div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div
      className="w-full"
      style={{
        minWidth: 0,
        maxWidth: "100%",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <Suspense
        fallback={
          <div style={{ color: "var(--muted)" }}>Loading admin tools...</div>
        }
      >
        <AdminExtrasPage isMobile={props.isMobile ?? false} />
      </Suspense>
    </div>
  );
}
