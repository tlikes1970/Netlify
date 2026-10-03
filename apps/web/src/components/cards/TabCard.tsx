import { t as coreText, useLanguage } from "@/lib/language";
import { CompactOverflowMenu } from '../../features/compact/CompactOverflowMenu';
import { ContextStatusActions } from './mobile/ContextStatusActions';
import { TitlePoster } from './TitlePoster';
import { MetadataIndicators } from './MetadataIndicators';
import React, { useState, useEffect } from "react";
import type { CardActionHandlers, MediaItem } from "./card.types";
import { getItemSynopsis } from "@/lib/itemSynopsis";
import { useTranslations } from "../../lib/language";
import { useSettings } from "../../lib/settings";
import { Library } from "../../lib/storage";
import { setPrimaryStatus } from "../../lib/statusTransitions";
import StarRating from "./StarRating";
import MyListToggle from "../MyListToggle";
import { useIsDesktop } from "../../hooks/useDeviceDetection";
import SwipeableCard from "../SwipeableCard";
import { trackOpenFromReturning } from "@/lib/analytics";
import { getUpNextLabel } from "@/lib/upNextShows";
import { dlog } from "../../lib/log";
import { TvCardMobile } from "./mobile/TvCardMobile";
import { MovieCardMobile } from "./mobile/MovieCardMobile";
import { ProviderBadges } from "./ProviderBadge";
import { startProUpgrade } from "../../lib/proUpgrade";
import { useEntitlements } from "../../hooks/useEntitlements";
import { notifyReadOnlyBlocked } from "../../lib/readOnlyGuard";
import { useBackdropCallbacks } from "../WatchingListWithBackdrop";
import { isSeriesReminderEnabled } from "../../lib/seriesReminders";

export type TabCardProps = {
  item: MediaItem;
  actions?: CardActionHandlers;
  tabType?: "watching" | "want" | "watched" | "returning" | "discovery";
  index?: number;
  customListContext?: boolean;
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
};

/**
 * TabCard — horizontal card layout for tab pages
 * - Poster on left (160px wide, 2:3 aspect ratio)
 * - Content on right with title, meta, overview, actions
 * - Matches the design mockups exactly
 * 
 * Badge contexts:
 * - TabCard does NOT render ListMembershipBadge (list-specific contexts)
 * - Used in: Watching tab, Want to Watch tab, Watched tab, Returning tab, My Lists detail pages
 * - MyListToggle button still shows current list membership via button text
 */
export default function TabCard({
  item,
  actions,
  tabType = "watching",
  index = 0,
  customListContext = false,
  dragState,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onKeyboardReorder,
}: TabCardProps) {
  useLanguage();
  const { hasFullAccess, isReadOnlyMode } = useEntitlements();
  const canUseProFeatures = hasFullAccess;
  const backdropCallbacks = useBackdropCallbacks();

  dlog("🔔 TabCard render:", {
    title: item.title,
    mediaType: item.mediaType,
    hasOnNotificationToggle: !!actions?.onNotificationToggle,
  });

  // Get latest rating from library to ensure we have the most up-to-date value
  const [currentRating, setCurrentRating] = useState(item.userRating);

  // Subscribe to library changes to update rating immediately
  useEffect(() => {
    const updateRating = () => {
      const latestEntry = Library.getEntry(item.id, item.mediaType);
      if (latestEntry?.userRating !== undefined) {
        setCurrentRating(latestEntry.userRating);
      }
    };

    // Update immediately
    updateRating();

    // Subscribe to library changes
    const unsubscribe = Library.subscribe(updateRating);

    return () => {
      unsubscribe();
    };
  }, [item.id, item.mediaType]);

  const { title, year, posterUrl, mediaType } = item;
  const synopsis = getItemSynopsis(item);
  const userRating = currentRating; // Use the latest rating
  const translations = useTranslations();
  const settings = useSettings();
  const { ready, isDesktop } = useIsDesktop(); // Device detection for conditional swipe
  // DEBUG: isDesktop available for desktop state detection

  const handleRatingChange = (rating: number) => {
    if (actions?.onRatingChange) {
      actions.onRatingChange(item, rating);
    }
  };

  const getTabSpecificActions = () => {
    if (customListContext) return <ContextStatusActions item={item} omitCurrentStatus />;
    switch (tabType) {
      case "watching":
      case "returning":
        return (
          <>
            <button
              onClick={() => actions?.onWant?.(item)}
              className={buttonClass}
              style={{
                backgroundColor: "var(--btn)",
                color: "var(--text)",
                borderColor: "var(--line)",
                border: "1px solid",
              }}
            >
              {translations.wantToWatchAction}
            </button>
            <button
              onClick={() => actions?.onWatched?.(item)}
              className={buttonClass}
              style={{
                backgroundColor: "var(--btn)",
                color: "var(--text)",
                borderColor: "var(--line)",
                border: "1px solid",
              }}
            >
              {translations.watchedAction}
            </button>
            <button
              onClick={() => actions?.onNotInterested?.(item)}
              className={buttonClass}
              style={{
                backgroundColor: "var(--btn)",
                color: "var(--text)",
                borderColor: "var(--line)",
                border: "1px solid",
              }}
            >
              {translations.notInterestedAction}
            </button>
            {!customListContext && (
              <button
                onClick={actions?.onNotesEdit ? () => actions.onNotesEdit?.(item) : undefined}
                className={buttonClass}
                style={{
                  backgroundColor: "var(--btn)",
                  color: "var(--text)",
                  borderColor: "var(--line)",
                  border: "1px solid",
                }}
              >
                📝 {translations.notesAndTags}
              </button>
            )}
            {/* Simple reminder for TV shows (Free feature) */}
            {mediaType === "tv" && settings.layout.episodeTracking && (
              <button
                onClick={() => {
                  dlog(
                    "⏰ TabCard simple reminder button clicked for:",
                    item.title
                  );
                  actions?.onSimpleReminder?.(item);
                }}
                className={buttonClass}
                style={{
                  backgroundColor: "var(--btn)",
                  color: "var(--text)",
                  borderColor: "var(--line)",
                  border: "1px solid",
                }}
                title={coreText("coreReminderHint")}
              >
                {isSeriesReminderEnabled(item.id) ? coreText("coreReminded") : coreText("coreRemind")}
              </button>
            )}
          </>
        );
      case "want":
        return (
          <>
            <button
              onClick={() => {
                // Move to watching list
                if (item.id && item.mediaType) {
                  setPrimaryStatus(item, "watching", { feedback: true });
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
              {translations.currentlyWatchingAction}
            </button>
            <button
              onClick={() => actions?.onWatched?.(item)}
              className={buttonClass}
              style={{
                backgroundColor: "var(--btn)",
                color: "var(--text)",
                borderColor: "var(--line)",
                border: "1px solid",
              }}
            >
              {translations.watchedAction}
            </button>
            <button
              onClick={() => actions?.onNotInterested?.(item)}
              className={buttonClass}
              style={{
                backgroundColor: "var(--btn)",
                color: "var(--text)",
                borderColor: "var(--line)",
                border: "1px solid",
              }}
            >
              {translations.notInterestedAction}
            </button>
            {!customListContext && (
              <button
                onClick={actions?.onNotesEdit ? () => actions.onNotesEdit?.(item) : undefined}
                className={buttonClass}
                style={{
                  backgroundColor: "var(--btn)",
                  color: "var(--text)",
                  borderColor: "var(--line)",
                  border: "1px solid",
                }}
              >
                📝 {translations.notesAndTags}
              </button>
            )}
            {/* Simple reminder for TV shows (Free feature) */}
            {!customListContext && mediaType === "tv" && (
              <button
                onClick={() => {
                  dlog(
                    "⏰ TabCard simple reminder button clicked for:",
                    item.title
                  );
                  actions?.onSimpleReminder?.(item);
                }}
                className={buttonClass}
                style={{
                  backgroundColor: "var(--btn)",
                  color: "var(--text)",
                  borderColor: "var(--line)",
                  border: "1px solid",
                }}
                title={coreText("coreReminderHint")}
              >
                {isSeriesReminderEnabled(item.id) ? coreText("coreReminded") : coreText("coreRemind")}
              </button>
            )}
          </>
        );
      case "watched":
        return (
          <>
            <button
              onClick={() => actions?.onWant?.(item)}
              className={buttonClass}
              style={{
                backgroundColor: "var(--btn)",
                color: "var(--text)",
                borderColor: "var(--line)",
                border: "1px solid",
              }}
            >
              {translations.wantToWatchAction}
            </button>
            <button
              onClick={() => {
                // Move to watching list
                if (item.id && item.mediaType) {
                  setPrimaryStatus(item, "watching", { feedback: true });
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
              {translations.currentlyWatchingAction}
            </button>
            <button
              onClick={() => actions?.onNotInterested?.(item)}
              className={buttonClass}
              style={{
                backgroundColor: "var(--btn)",
                color: "var(--text)",
                borderColor: "var(--line)",
                border: "1px solid",
              }}
            >
              {translations.notInterestedAction}
            </button>
            {!customListContext && (
              <button
                onClick={actions?.onNotesEdit ? () => actions.onNotesEdit?.(item) : undefined}
                className={buttonClass}
                style={{
                  backgroundColor: "var(--btn)",
                  color: "var(--text)",
                  borderColor: "var(--line)",
                  border: "1px solid",
                }}
              >
                📝 {translations.notesAndTags}
              </button>
            )}
            {/* Simple reminder for TV shows (Free feature) */}
            {!customListContext && mediaType === "tv" && (
              <button
                onClick={() => {
                  dlog(
                    "⏰ TabCard simple reminder button clicked for:",
                    item.title
                  );
                  actions?.onSimpleReminder?.(item);
                }}
                className={buttonClass}
                style={{
                  backgroundColor: "var(--btn)",
                  color: "var(--text)",
                  borderColor: "var(--line)",
                  border: "1px solid",
                }}
                title={coreText("coreReminderHint")}
              >
                {isSeriesReminderEnabled(item.id) ? coreText("coreReminded") : coreText("coreRemind")}
              </button>
            )}
          </>
        );
      case "discovery":
        return (
          <>
            <button
              onClick={() => actions?.onWant?.(item)}
              className={buttonClass}
              style={{
                backgroundColor: "var(--btn)",
                color: "var(--text)",
                borderColor: "var(--line)",
                border: "1px solid",
              }}
            >
              {translations.wantToWatchAction}
            </button>
            <button
              onClick={() => {
                if (item.id && item.mediaType) setPrimaryStatus(item, "watching", { feedback: true });
              }}
              className={buttonClass}
              style={{
                backgroundColor: "var(--btn)",
                color: "var(--text)",
                borderColor: "var(--line)",
                border: "1px solid",
              }}
            >
              {translations.currentlyWatchingAction}
            </button>
            <button
              onClick={() => actions?.onWatched?.(item)}
              className={buttonClass}
              style={{
                backgroundColor: "var(--btn)",
                color: "var(--text)",
                borderColor: "var(--line)",
                border: "1px solid",
              }}
            >
              {translations.watchedAction}
            </button>
            <button
              onClick={() => actions?.onNotInterested?.(item)}
              className={buttonClass}
              style={{
                backgroundColor: "var(--btn)",
                color: "var(--text)",
                borderColor: "var(--line)",
                border: "1px solid",
              }}
            >
              {translations.notInterestedAction}
            </button>
          </>
        );
      default:
        return null;
    }
  };

  // Determine if this card is being dragged or is a drop target
  const isBeingDragged = dragState?.draggedItem?.id === item.id;
  const isDropTarget = dragState?.draggedOverIndex === index && !isBeingDragged;
  const isDragging = dragState?.isDragging;

  // Map tabType to context for swipe actions
  const getSwipeContext = ():
    | "tab-watching"
    | "tab-want"
    | "tab-watched"
    | "tab-foryou"
    | "search"
    | "home"
    | "holiday" => {
    switch (tabType) {
      case "watching":
        return "tab-watching";
      case "want":
        return "tab-want";
      case "watched":
        return "tab-watched";
      case "discovery":
        return "tab-foryou";
      default:
        return "tab-watching";
    }
  };


  // Define buttonClass at component level so it can be used throughout
  const buttonClass = "px-4 py-2.5 rounded-xl text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md";

  // Convert tabType to tabKey for mobile components
  const getTabKey = (tabType: string): "watching" | "watched" | "want" => {
    switch (tabType) {
      case "watching":
        return "watching";
      case "watched":
        return "watched";
      case "want":
        return "want";
      default:
        return "watching";
    }
  };

  // Guard: wait for viewport detection to avoid hydration mismatch
  if (!ready) {
    // Render a neutral skeleton that works on both mobile and desktop
    return (
      <article
        className="tab-card"
        data-card="skeleton"
        style={{
          display: "flex",
          gap: "16px",
          padding: "16px",
          borderRadius: "16px",
          backgroundColor: "var(--card)",
          border: "1px solid var(--line)",
          minHeight: "180px",
        }}
      >
        <div
          style={{
            width: "160px",
            height: "240px",
            backgroundColor: "var(--muted)",
            borderRadius: "8px",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1 }} />
      </article>
    );
  }

  // Phone and tablet share the touch structure; desktop begins at 1024px.
  if (!isDesktop) {
    dlog("📱 Mobile viewport detected, using mobile components:", {
      mediaType,
      title: item.title,
    });
    if (mediaType === "tv") {
      return (
        <TvCardMobile
          item={item}
          actions={actions}
          tabKey={getTabKey(tabType)}
          customListContext={customListContext}
          index={index}
          onDragStart={customListContext ? undefined : (e, idx) => {
            // Convert TouchEvent to DragEvent-like for useDragAndDrop
            if ("touches" in e) {
              // Touch event - create synthetic drag event
              const syntheticEvent = {
                ...e,
                dataTransfer: {
                  setData: () => {},
                  effectAllowed: "move",
                },
                preventDefault: () => {},
              } as any;
              onDragStart?.(syntheticEvent, idx);
            } else {
              onDragStart?.(e, idx);
            }
          }}
          onDragEnd={() => onDragEnd?.({} as React.DragEvent)}
          onKeyboardReorder={onKeyboardReorder}
          isDragging={isBeingDragged}
        />
      );
    } else if (mediaType === "movie") {
      return (
        <MovieCardMobile
          item={item}
          actions={actions}
          tabKey={getTabKey(tabType)}
          customListContext={customListContext}
          index={index}
          onDragStart={customListContext ? undefined : (e, idx) => {
            // Convert TouchEvent to DragEvent-like for useDragAndDrop
            if ("touches" in e) {
              // Touch event - create synthetic drag event
              const syntheticEvent = {
                ...e,
                dataTransfer: {
                  setData: () => {},
                  effectAllowed: "move",
                },
                preventDefault: () => {},
              } as any;
              onDragStart?.(syntheticEvent, idx);
            } else {
              onDragStart?.(e, idx);
            }
          }}
          onDragEnd={() => onDragEnd?.({} as React.DragEvent)}
          onKeyboardReorder={onKeyboardReorder}
          isDragging={isBeingDragged}
        />
      );
    }
  }

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
      onMouseEnter={() => {
        // Activate backdrop on hover (desktop only, all list tabs)
        if (isDesktop && (tabType === "watching" || tabType === "want" || tabType === "watched") && backdropCallbacks && posterUrl) {
          backdropCallbacks.onBackdropActivate(posterUrl);
        }
      }}
      onFocus={() => {
        // Activate backdrop on focus (desktop only, all list tabs)
        if (isDesktop && (tabType === "watching" || tabType === "want" || tabType === "watched") && backdropCallbacks && posterUrl) {
          backdropCallbacks.onBackdropActivate(posterUrl);
        }
      }}
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
      {/* Poster Column */}
      <div
        className="poster-col"

      >
        <TitlePoster item={item} className="h-full w-full" onOpen={() => { if (tabType === 'returning') trackOpenFromReturning(item.id, item.title); }} />

        {/* My List + button */}
        {!customListContext && <MyListToggle
          item={item} 
          currentListContext={
            tabType === "returning" || tabType === "watching" ? "watching" :
            tabType === "want" ? "wishlist" :
            tabType === "watched" ? "watched" :
            undefined
          }
        />}
      </div>

      {/* Info Column */}
      <div className={`info-col relative ${customListContext ? "pr-12" : ""}`}>
        {customListContext && <div className="absolute top-0 right-0"><CompactOverflowMenu item={{...item,id:String(item.id)}} context="tab-watching" actions={actions} showText={false} hideStatusActions customListContext /></div>}
        <header>
          <h3>{title}</h3>
          <div className="flex items-center gap-2">
            <span className="meta">
              {year || coreText("coreTBA")} • {mediaType === "tv" ? coreText("coreTV") : coreText("coreMovie")}
            </span>

            {/* Status badge for TV shows */}
            {mediaType === "tv" && item.showStatus && (
              <span className="status-badge">
                {item.showStatus === "Returning Series" && coreText("coreReturning")}
                {item.showStatus === "Ended" && coreText("coreComplete")}
                {item.showStatus === "In Production" && coreText("coreProduction")}
                {item.showStatus === "Canceled" && coreText("coreCanceled")}
                {item.showStatus === "Planned" && coreText("coreUpcoming")}
              </span>
            )}
          </div>

          {tabType === "returning" && mediaType === "tv" && (
            <p
              className="text-xs font-medium mt-1"
              style={{ color: "var(--accent)" }}
            >
              {getUpNextLabel(item)}
            </p>
          )}

          {/* Provider badges */}
          {item.networks && item.networks.length > 0 && (
            <ProviderBadges
              providers={item.networks}
              maxVisible={3}
              mediaType={
                mediaType === "tv" || mediaType === "movie" ? mediaType : "tv"
              }
            />
          )}

          <MetadataIndicators item={item} actions={actions} />
        </header>

        {/* Rating Row */}
        {(tabType === "watching" || tabType === "want" || tabType === "watched") && (
          <div className="rating-row">
            <StarRating
              value={userRating || 0}
              onChange={handleRatingChange}
              size="sm"
            />
          </div>
        )}

        {/* Synopsis - Description */}
        {synopsis ? (
          <div className="synopsis-wrapper" style={{ flexGrow: 1 }}>
            <p className="synopsis">{synopsis}</p>
          </div>
        ) : (
          <div className="synopsis-wrapper" style={{ flexGrow: 1 }} />
        )}

        {/* Buttons Container - Bottom Aligned */}
        <div className="buttons-container">
          {/* Actions Row */}
          <div className="actions-row">
            {/* Tab-specific primary actions */}
            {getTabSpecificActions()}

            {/* Episode tracking (conditional) */}
            {!customListContext && mediaType === "tv" && (
              <button
                onClick={() => actions?.onEpisodeTracking?.(item)}
                className={buttonClass}
                style={{
                  backgroundColor: "var(--btn)",
                  color: "var(--text)",
                  borderColor: "var(--line)",
                  border: "1px solid",
                  opacity: 1,
                }}
                title={coreText("coreTrackProgress")}
              >{coreText("coreEpisodeProgress")}</button>
            )}
          </div>

          {/* Pro Strip - with dotted yellow border */}
          {!customListContext && (
            <div className="pro-buttons-row">
              <button
                onClick={() => {
                  if (canUseProFeatures) {
                    actions?.onGoofsOpen?.(item);
                  } else if (isReadOnlyMode) {
                    notifyReadOnlyBlocked();
                  } else {
                    startProUpgrade();
                  }
                }}
                title={
                  canUseProFeatures
                    ? coreText('coreViewSimilar')
                    : isReadOnlyMode
                      ? "Read-Only — unlock Full Access"
                      : "Included in your Full Access trial"
                }
                className={buttonClass}
                style={{
                  backgroundColor: "var(--btn)",
                  color: "var(--text)",
                  borderColor: "var(--line)",
                  border: "1px solid",
                  opacity: canUseProFeatures ? 1 : 0.65,
                  cursor: "pointer",
                }}
              >{coreText("coreShowsLikeThis")}</button>
              <button
                onClick={() => {
                  if (canUseProFeatures) {
                    actions?.onExtrasOpen?.(item);
                  } else if (isReadOnlyMode) {
                    notifyReadOnlyBlocked();
                  } else {
                    startProUpgrade();
                  }
                }}
                title={
                  canUseProFeatures
                    ? coreText('coreViewExtras')
                    : isReadOnlyMode
                      ? "Read-Only — unlock Full Access"
                      : "Included in your Full Access trial"
                }
                className={buttonClass}
                style={{
                  backgroundColor: "var(--btn)",
                  color: "var(--text)",
                  borderColor: "var(--line)",
                  border: "1px solid",
                  opacity: canUseProFeatures ? 1 : 0.65,
                  cursor: "pointer",
                }}
              >{coreText("coreExtras")}</button>
            </div>
          )}
        </div>

        {/* Drag handle - Desktop only, shows on hover/focus */}
        {!customListContext && isDesktop && (
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
            title={coreText("coreReorderTitle")}
            aria-label={coreText("coreReorderAria")}
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

        {/* Delete button - bottom right */}
        {!customListContext && <button
          onClick={() => actions?.onDelete?.(item)}
          className="absolute bottom-3 right-3 px-4 py-2.5 rounded-lg text-xs cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md font-semibold"
          style={{
            backgroundColor: "var(--btn)",
            color: "#ef4444",
            borderColor: "#ef4444",
            border: "1px solid",
          }}
          title={coreText("coreDeleteItem")}
        >{coreText("coreDeleteIcon")}</button>}
      </div>
    </article>
  );

  // Mobile: wrap with SwipeableCard (swipe functionality)
  // Desktop: no wrapper at all (just the card + More menu)
  if (isDesktop && ready) {
    return cardContent;
  }

  return (
    <SwipeableCard
      item={item}
      actions={actions}
      context={getSwipeContext()}
      className="mb-5"
    >
      {cardContent}
    </SwipeableCard>
  );
}
