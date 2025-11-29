import React from "react";
import type { CardActionHandlers, MediaItem } from "./cards/card.types";
import type { LibraryEntry } from "../lib/storage";
import type { ListName } from "../state/library.types";
import { Library } from "../lib/storage";
import { useTranslations } from "../lib/language";
import { useSettings } from "../lib/settings";
import StarRating from "./cards/StarRating";
import { useProStatus } from "../lib/proStatus";
import { startProUpgrade } from "../lib/proUpgrade";

export type LibraryActionsMode = "list" | "search-inline" | "search-sheet";

export interface LibraryActionsProps {
  item: MediaItem;
  libraryEntry?: LibraryEntry;
  actions?: CardActionHandlers;
  mode?: LibraryActionsMode;
  currentList?: ListName | null;
  isCondensed?: boolean;
}

/**
 * Process: Library Actions Component
 * Purpose: Reusable component for managing library items (list changes, rating, notes, reminders, etc.)
 * Data Source: LibraryEntry (if provided) or Library.getCurrentList() for current list
 * Update Path: Actions call handlers from CardActionHandlers interface
 * Dependencies: Library storage, translations, settings, pro status
 */
export default function LibraryActions({
  item,
  libraryEntry,
  actions,
  mode = "list",
  currentList,
  isCondensed = false,
}: LibraryActionsProps) {
  const translations = useTranslations();
  const settings = useSettings();
  const proStatus = useProStatus();
  const isPro = proStatus.isPro;
  const { mediaType } = item;

  // Determine current list from libraryEntry or Library
  const listName = libraryEntry?.list || currentList || Library.getCurrentList(item.id, item.mediaType);
  
  // Get user rating from libraryEntry or item
  const userRating = libraryEntry?.userRating ?? item.userRating ?? 0;

  // Button class based on condensed mode
  const buttonClass = isCondensed
    ? "px-3 py-2 rounded-lg text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md"
    : "px-4 py-2.5 rounded-xl text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md";

  const handleRatingChange = (rating: number) => {
    if (actions?.onRatingChange) {
      actions.onRatingChange(item, rating);
    }
  };

  // Render status buttons based on current list
  const renderStatusButtons = () => {
    const buttons: React.ReactNode[] = [];

    switch (listName) {
      case "watching":
        buttons.push(
          <button
            key="want"
            onClick={() => actions?.onWant?.(item)}
            className={buttonClass}
            style={{
              backgroundColor: "var(--btn)",
              color: "var(--text)",
              borderColor: "var(--line)",
              border: "1px solid",
            }}
          >
            {isCondensed ? "Want" : translations.wantToWatchAction}
          </button>,
          <button
            key="watched"
            onClick={() => actions?.onWatched?.(item)}
            className={buttonClass}
            style={{
              backgroundColor: "var(--btn)",
              color: "var(--text)",
              borderColor: "var(--line)",
              border: "1px solid",
            }}
          >
            {isCondensed ? "Watched" : translations.watchedAction}
          </button>,
          <button
            key="not"
            onClick={() => actions?.onNotInterested?.(item)}
            className={buttonClass}
            style={{
              backgroundColor: "var(--btn)",
              color: "var(--text)",
              borderColor: "var(--line)",
              border: "1px solid",
            }}
          >
            {isCondensed ? "Not" : translations.notInterestedAction}
          </button>
        );
        break;
      case "wishlist":
        buttons.push(
          <button
            key="watching"
            onClick={() => {
              if (item.id && item.mediaType) {
                Library.move(item.id, item.mediaType, "watching");
              }
            }}
            className={buttonClass}
            style={{
              backgroundColor: "var(--btn)",
              color: "var(--text)",
              borderColor: "var(--line)",
              border: "1px solid",
            }}
          >
            {isCondensed ? "Watching" : translations.currentlyWatchingAction}
          </button>,
          <button
            key="watched"
            onClick={() => actions?.onWatched?.(item)}
            className={buttonClass}
            style={{
              backgroundColor: "var(--btn)",
              color: "var(--text)",
              borderColor: "var(--line)",
              border: "1px solid",
            }}
          >
            {isCondensed ? "Watched" : translations.watchedAction}
          </button>,
          <button
            key="not"
            onClick={() => actions?.onNotInterested?.(item)}
            className={buttonClass}
            style={{
              backgroundColor: "var(--btn)",
              color: "var(--text)",
              borderColor: "var(--line)",
              border: "1px solid",
            }}
          >
            {isCondensed ? "Not" : translations.notInterestedAction}
          </button>
        );
        break;
      case "watched":
        buttons.push(
          <button
            key="want"
            onClick={() => actions?.onWant?.(item)}
            className={buttonClass}
            style={{
              backgroundColor: "var(--btn)",
              color: "var(--text)",
              borderColor: "var(--line)",
              border: "1px solid",
            }}
          >
            {isCondensed ? "Want" : translations.wantToWatchAction}
          </button>,
          <button
            key="watching"
            onClick={() => {
              if (item.id && item.mediaType) {
                Library.move(item.id, item.mediaType, "watching");
              }
            }}
            className={buttonClass}
            style={{
              backgroundColor: "var(--btn)",
              color: "var(--text)",
              borderColor: "var(--line)",
              border: "1px solid",
            }}
          >
            {isCondensed ? "Watching" : translations.currentlyWatchingAction}
          </button>,
          <button
            key="not"
            onClick={() => actions?.onNotInterested?.(item)}
            className={buttonClass}
            style={{
              backgroundColor: "var(--btn)",
              color: "var(--text)",
              borderColor: "var(--line)",
              border: "1px solid",
            }}
          >
            {isCondensed ? "Not" : translations.notInterestedAction}
          </button>
        );
        break;
      default:
        // Not in any list - show add buttons
        buttons.push(
          <button
            key="want"
            onClick={() => actions?.onWant?.(item)}
            className={buttonClass}
            style={{
              backgroundColor: "var(--btn)",
              color: "var(--text)",
              borderColor: "var(--line)",
              border: "1px solid",
            }}
          >
            {isCondensed ? "Want" : translations.wantToWatchAction}
          </button>,
          <button
            key="watching"
            onClick={() => {
              if (item.id && item.mediaType) {
                Library.move(item.id, item.mediaType, "watching");
              }
            }}
            className={buttonClass}
            style={{
              backgroundColor: "var(--btn)",
              color: "var(--text)",
              borderColor: "var(--line)",
              border: "1px solid",
            }}
          >
            {isCondensed ? "Watching" : translations.currentlyWatchingAction}
          </button>,
          <button
            key="watched"
            onClick={() => actions?.onWatched?.(item)}
            className={buttonClass}
            style={{
              backgroundColor: "var(--btn)",
              color: "var(--text)",
              borderColor: "var(--line)",
              border: "1px solid",
            }}
          >
            {isCondensed ? "Watched" : translations.watchedAction}
          </button>
        );
    }

    return buttons;
  };

  // Render based on mode
  if (mode === "search-inline") {
    // Compact inline version for desktop search results
    return (
      <div className="flex flex-wrap gap-2 items-center">
        {/* Status buttons */}
        <div className="flex gap-2 flex-wrap">
          {renderStatusButtons()}
        </div>
        
        {/* Rating (if in a list) */}
        {listName && (listName === "watching" || listName === "watched") && (
          <div className="flex items-center gap-2">
            <StarRating
              value={userRating || 0}
              onChange={handleRatingChange}
              size="sm"
            />
          </div>
        )}
        
        {/* Notes button */}
        {!isCondensed && (
          <button
            onClick={() => actions?.onNotesEdit?.(item)}
            className={buttonClass}
            style={{
              backgroundColor: "var(--btn)",
              color: "var(--text)",
              borderColor: "var(--line)",
              border: "1px solid",
            }}
          >
            📝 Notes & Tags
          </button>
        )}
        
        {/* Remind Me (TV shows only) */}
        {mediaType === "tv" && (
          <button
            onClick={() => {
              actions?.onSimpleReminder?.(item);
            }}
            className={buttonClass}
            style={{
              backgroundColor: "var(--btn)",
              color: "var(--text)",
              borderColor: "var(--line)",
              border: "1px solid",
            }}
            title="Set simple reminder (24 hours before)"
          >
            ⏰ Remind Me
          </button>
        )}
        
        {/* Episode Progress (TV shows only) */}
        {mediaType === "tv" && (
          <button
            onClick={() => actions?.onEpisodeTracking?.(item)}
            className={buttonClass}
            style={{
              backgroundColor: "var(--btn)",
              color: settings.layout.episodeTracking || settings.pro.isPro ? "var(--text)" : "var(--muted)",
              borderColor: "var(--line)",
              border: "1px solid",
              opacity: settings.layout.episodeTracking || settings.pro.isPro ? 1 : 0.6,
            }}
            disabled={!settings.layout.episodeTracking && !settings.pro.isPro}
            title={settings.layout.episodeTracking || settings.pro.isPro ? "Track episode progress" : "Enable episode tracking in settings"}
          >
            Episode Progress
          </button>
        )}
        
        {/* Remove button */}
        {listName && (
          <button
            onClick={() => actions?.onDelete?.(item)}
            className={buttonClass}
            style={{
              backgroundColor: "var(--btn)",
              color: "var(--text)",
              borderColor: "var(--line)",
              border: "1px solid",
            }}
          >
            Remove
          </button>
        )}
      </div>
    );
  }

  if (mode === "search-sheet") {
    // Mobile bottom sheet version - vertical layout
    return (
      <div className="space-y-3">
        {/* Status buttons */}
        <div className="grid grid-cols-2 gap-2">
          {renderStatusButtons()}
        </div>
        
        {/* Rating (if in a list) */}
        {listName && (listName === "watching" || listName === "watched") && (
          <div className="flex items-center gap-2 py-2">
            <span className="text-sm" style={{ color: "var(--text)" }}>Your Rating:</span>
            <StarRating
              value={userRating || 0}
              onChange={handleRatingChange}
              size="sm"
            />
          </div>
        )}
        
        {/* Notes button */}
        <button
          onClick={() => actions?.onNotesEdit?.(item)}
          className="w-full px-4 py-3 rounded-lg text-sm text-left"
          style={{
            backgroundColor: "var(--btn)",
            color: "var(--text)",
            borderColor: "var(--line)",
            border: "1px solid",
          }}
        >
          📝 Notes & Tags
        </button>
        
        {/* Remind Me (TV shows only) */}
        {mediaType === "tv" && (
          <button
            onClick={() => {
              actions?.onSimpleReminder?.(item);
            }}
            className="w-full px-4 py-3 rounded-lg text-sm text-left"
            style={{
              backgroundColor: "var(--btn)",
              color: "var(--text)",
              borderColor: "var(--line)",
              border: "1px solid",
            }}
          >
            ⏰ Remind Me
          </button>
        )}
        
        {/* Episode Progress (TV shows only) */}
        {mediaType === "tv" && (
          <button
            onClick={() => actions?.onEpisodeTracking?.(item)}
            className="w-full px-4 py-3 rounded-lg text-sm text-left"
            style={{
              backgroundColor: "var(--btn)",
              color: settings.layout.episodeTracking || settings.pro.isPro ? "var(--text)" : "var(--muted)",
              borderColor: "var(--line)",
              border: "1px solid",
              opacity: settings.layout.episodeTracking || settings.pro.isPro ? 1 : 0.6,
            }}
            disabled={!settings.layout.episodeTracking && !settings.pro.isPro}
          >
            Episode Progress
          </button>
        )}
        
        {/* Pro features */}
        {!isCondensed && (
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: "var(--line)" }}>
            <button
              onClick={() => {
                if (isPro && settings.pro.features.bloopersAccess) {
                  actions?.onGoofsOpen?.(item);
                } else {
                  startProUpgrade();
                }
              }}
              className="w-full px-4 py-3 rounded-lg text-sm text-left"
              style={{
                backgroundColor: "var(--btn)",
                color: "var(--text)",
                borderColor: "var(--line)",
                border: "1px solid",
                opacity: isPro && settings.pro.features.bloopersAccess ? 1 : 0.65,
              }}
            >
              Goofs {!isPro && "🔒"}
            </button>
            <button
              onClick={() => {
                if (isPro && settings.pro.features.extrasAccess) {
                  actions?.onExtrasOpen?.(item);
                } else {
                  startProUpgrade();
                }
              }}
              className="w-full px-4 py-3 rounded-lg text-sm text-left"
              style={{
                backgroundColor: "var(--btn)",
                color: "var(--text)",
                borderColor: "var(--line)",
                border: "1px solid",
                opacity: isPro && settings.pro.features.extrasAccess ? 1 : 0.65,
              }}
            >
              Extras {!isPro && "🔒"}
            </button>
            <button
              onClick={() => {
                if (isPro) {
                  actions?.onNotificationToggle?.(item);
                } else {
                  startProUpgrade();
                }
              }}
              className="w-full px-4 py-3 rounded-lg text-sm text-left"
              style={{
                backgroundColor: "var(--btn)",
                color: "var(--text)",
                borderColor: "var(--line)",
                border: "1px solid",
                opacity: isPro ? 1 : 0.65,
              }}
            >
              Advanced Notifications {!isPro && "🔒"}
            </button>
          </div>
        )}
        
        {/* Remove button */}
        {listName && (
          <button
            onClick={() => actions?.onDelete?.(item)}
            className="w-full px-4 py-3 rounded-lg text-sm text-left text-red-500"
            style={{
              backgroundColor: "var(--btn)",
              borderColor: "var(--line)",
              border: "1px solid",
            }}
          >
            Remove from List
          </button>
        )}
      </div>
    );
  }

  // Default "list" mode - full button layout (for TabCard)
  return (
    <>
      {/* Status buttons */}
      {renderStatusButtons()}
      
      {/* Notes button (if not condensed) */}
      {!isCondensed && (
        <button
          onClick={() => actions?.onNotesEdit?.(item)}
          className={buttonClass}
          style={{
            backgroundColor: "var(--btn)",
            color: "var(--text)",
            borderColor: "var(--line)",
            border: "1px solid",
          }}
        >
          📝 Notes & Tags
        </button>
      )}
      
      {/* Remind Me (TV shows only) */}
      {mediaType === "tv" && (
        <button
          onClick={() => {
            actions?.onSimpleReminder?.(item);
          }}
          className={buttonClass}
          style={{
            backgroundColor: "var(--btn)",
            color: "var(--text)",
            borderColor: "var(--line)",
            border: "1px solid",
          }}
          title="Set simple reminder (24 hours before)"
        >
          ⏰ Remind Me
        </button>
      )}
    </>
  );
}


