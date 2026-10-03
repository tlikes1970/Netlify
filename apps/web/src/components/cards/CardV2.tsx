import { TitlePoster } from './TitlePoster';
import React from "react";
import type { CardContext, CardActionHandlers, MediaItem } from "./card.types";
import type { ListName } from "../../state/library.types";
import { useTranslations } from "../../lib/language";
import { useSettings } from "../../lib/settings";
import { useIsDesktop } from "../../hooks/useDeviceDetection";
import SwipeableCard from "../SwipeableCard";
import MyListToggle from "../MyListToggle";
import { CompactPrimaryAction } from "../../features/compact/CompactPrimaryAction";
import { CompactOverflowMenu } from "../../features/compact/CompactOverflowMenu";
import { EpisodeProgressDisplay } from "../EpisodeProgressDisplay";
import { ContextStatusActions } from "./mobile/ContextStatusActions";
import StarRating from "./StarRating";
import { ProviderBadges } from "./ProviderBadge";
import { getShowStatusInfo } from "../../utils/showStatus";
import { ListMembershipBadge } from "../ListMembershipBadge";
import {
  resolvePosterUrl,
} from "../../lib/posterPlaceholder";

export type CardV2Props = {
  item: MediaItem;
  ratingOpportunity?: React.ReactNode;
  secondaryWatching?: boolean;
  context: CardContext;
  actions?: CardActionHandlers;
  // optional presentation flags
  compact?: boolean; // smaller text; still 2:3 poster
  showRating?: boolean; // default true where voteAverage exists
  disableSwipe?: boolean; // disable swipe actions for horizontal scrolling contexts
  disableOverflow?: boolean; // hide overflow menu (e.g., home currently watching rail)
  // optional: override the list context derived from 'context' prop (useful for custom lists)
  currentListContext?: ListName;
};

/**
 * Cards V2 — unified card for rails, tabs, and search
 * - 2:3 poster with safe fallback
 * - context-specific action bar
 * - optional Holiday + chip top-right (where relevant)
 * - SWIPE ONLY ON MOBILE: Desktop has zero swipe wrapper
 *
 * Badge contexts:
 * - ListMembershipBadge SHOWS in mixed contexts: 'home', 'search', 'tab-foryou', 'holiday'
 * - ListMembershipBadge HIDES in list-specific contexts: 'tab-watching', 'tab-want', 'tab-watched', 'tab-not'
 * - Usage: HomeYourShowsRail (tab-watching - hide), DiscoveryPage (tab-foryou - show), MyListsPage (tab-watching - hide)
 */
/**
 * Helper to determine if membership badge should be shown based on context.
 * Badge shows in mixed contexts (where list membership is useful info).
 * Badge hides in list-specific contexts (where tab/section already implies membership).
 */
function shouldShowMembershipBadge(context: CardContext): boolean {
  // Mixed contexts where badge is useful (items from various lists mixed together)
  const mixedContexts: CardContext[] = [
    "home",
    "search",
    "tab-foryou",
    "holiday",
  ];

  return mixedContexts.includes(context);
}

function getListContextFromCardContext(
  context: CardContext,
): ListName | undefined {
  switch (context) {
    case "home-cw-preview":
    case "tab-watching":
      return "watching";
    case "tab-want":
      return "wishlist";
    case "tab-watched":
      return "watched";
    case "tab-not":
      return "not";
    default:
      return undefined;
  }
}

export default function CardV2({
  item,
  context,
  actions,
  compact,
  showRating = true,
  ratingOpportunity,
  secondaryWatching = false,
  disableSwipe = false,
  disableOverflow = false,
  currentListContext: propCurrentListContext,
}: CardV2Props) {
  const translations = useTranslations();
  const { title, year, voteAverage } = item;
  const displayPosterUrl = resolvePosterUrl(item.posterUrl);
  const rating =
    typeof voteAverage === "number"
      ? Math.round(voteAverage * 10) / 10
      : undefined;
  const isDesktop = useIsDesktop(); // Device detection for conditional swipe
  const settings = useSettings();

  const isCustomList = propCurrentListContext?.startsWith("custom:") ?? false;
  const topOverflow = isCustomList || secondaryWatching;
  const statusInfo = secondaryWatching && item.mediaType === "tv" ? getShowStatusInfo(item.showStatus) : null;
  const simplified =
    context === "tab-foryou" || context === "home" || isCustomList;
  const showMyListBtn =
    !simplified &&
    (context === "search" ||
      context === "tab-watching" ||
      context === "holiday");

  // Card content (shared between mobile and desktop)
  const cardContent = (
    <article
      className={`curated-card v2 group select-none${secondaryWatching ? " discovery-detail-card" : ""}${topOverflow ? " cardv2-content-menu" : ""}${isCustomList ? " custom-list-detail-card" : ""}`}
      data-testid="cardv2"
      aria-label={title}
      style={{ width: "var(--poster-w-desktop, var(--poster-w, 160px))" }}
    >
      <div
        className="cardv2-shell relative border shadow-sm overflow-hidden"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--line)",
          borderRadius: "var(--radius, 12px)",
        }}
      >
        {/* Poster (2:3) */}
        <div
          className="poster-wrap relative aspect-[2/3] cursor-pointer"
          style={{ backgroundColor: "var(--muted)" }}

        >
          <TitlePoster item={{...item, posterUrl: displayPosterUrl}} className="h-full w-full" />

          {/* My List + */}
          {showMyListBtn && (
            <MyListToggle
              item={item}
              currentListContext={
                // Use prop if provided (for custom lists), otherwise derive from context
                propCurrentListContext !== undefined
                  ? propCurrentListContext
                  : getListContextFromCardContext(context)
              }
            />
          )}
        </div>

        <div className="cardv2-content">
        {/* Meta */}
        <div className="p-1">
          <div className="flex items-start gap-1 min-w-0">
            <h3
              className={[
                "line-clamp-2 break-words flex-1 min-w-0 min-h-[2.5em] leading-tight",
                compact ? "font-medium" : "text-sm",
                "font-medium",
              ].join(" ")}
              style={{
                fontSize: compact ? "var(--font-md, 13px)" : undefined,
                color: "var(--text)",
              }}
              title={title}
            >
              {title}
            </h3>

            {/* Notes and Tags Indicators */}
            <div className="flex gap-0.5 flex-shrink-0">
              {item.userNotes && item.userNotes.trim() && (
                <span
                  role={actions?.onNotesEdit ? "button" : undefined}
                  tabIndex={actions?.onNotesEdit ? 0 : undefined}
                  aria-label={actions?.onNotesEdit ? translations.notesAndTags : undefined}
                  onKeyDown={event => { if (actions?.onNotesEdit && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); actions.onNotesEdit(item); } }}
                  className={actions?.onNotesEdit ? "cursor-pointer inline-flex items-center justify-center" : "inline-flex items-center"}
                  style={{ fontSize: "var(--font-sm, 10px)" }}
                  title={`Notes: ${item.userNotes.substring(0, 50)}${item.userNotes.length > 50 ? "..." : ""}`}
                  onClick={actions?.onNotesEdit ? () => actions.onNotesEdit?.(item) : undefined}
                >
                  📝
                </span>
              )}
              {item.tags && item.tags.length > 0 && (
                <span
                  role={actions?.onNotesEdit ? "button" : undefined}
                  tabIndex={actions?.onNotesEdit ? 0 : undefined}
                  aria-label={actions?.onNotesEdit ? translations.notesAndTags : undefined}
                  onKeyDown={event => { if (actions?.onNotesEdit && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); actions.onNotesEdit(item); } }}
                  className={actions?.onNotesEdit ? "cursor-pointer inline-flex items-center justify-center" : "inline-flex items-center"}
                  style={{ fontSize: "var(--font-sm, 10px)" }}
                  title={`Tags: ${item.tags.join(", ")}`}
                  onClick={actions?.onNotesEdit ? () => actions.onNotesEdit?.(item) : undefined}
                >
                  🏷️
                </span>
              )}
            </div>
          </div>

          {/* Episode progress indicator for TV shows - only show on tab contexts, not home/search */}
          {item.mediaType === "tv" &&
            settings.layout.episodeTracking &&
            (context === "tab-watching" ||
              context === "tab-want" ||
              context === "tab-watched" ||
              context === "tab-not") && (
              <div className="mb-1">
                <EpisodeProgressDisplay
                  showId={
                    typeof item.id === "string" ? parseInt(item.id) : item.id
                  }
                  compact={true}
                />
              </div>
            )}

          {/* List membership badge - only show in mixed contexts */}
          {shouldShowMembershipBadge(context) && (
            <div className="mb-1">
              <ListMembershipBadge item={item} />
            </div>
          )}

          <div
            className="mt-0 flex items-center justify-between"
            style={{ fontSize: "var(--font-sm, 11px)", color: "var(--muted)" }}
          >
            <span>{year || "TBA"}{secondaryWatching ? ` • ${item.mediaType === "tv" ? "TV Show" : "Movie"}` : ""}</span>
            {showRating && <span aria-label="rating">{rating || "—"}</span>}
          </div>
        </div>

        {secondaryWatching && (statusInfo || !!item.networks?.length) && (
          <div className="discovery-state-providers">
            {statusInfo && <span className="badge card-mobile-status-badge" style={{color:statusInfo.color,backgroundColor:statusInfo.backgroundColor}}>{statusInfo.badge}</span>}
            {!!item.networks?.length && <ProviderBadges providers={item.networks} maxVisible={2} mediaType={item.mediaType === "tv" ? "tv" : "movie"}/>}
          </div>
        )}
        {secondaryWatching && item.synopsis?.trim() && (
          <p className="discovery-card-overview line-clamp-3 break-words px-1 text-xs" style={{color: "var(--muted)"}}>{item.synopsis}</p>
        )}

        {/* Actions per context */}
        {ratingOpportunity ||
          (isCustomList ? (
            <div className="p-2">
              <ContextStatusActions
                item={item}
                omitCurrentStatus={!isDesktop.isDesktop}
              />
              <StarRating
                value={item.userRating || 0}
                onChange={(rating) => actions?.onRatingChange?.(item, rating)}
                size="sm"
                className="compact-user-rating"
              />
            </div>
          ) : (
            <CardActions context={context} item={item} actions={actions} />
          ))}

        {/* Discovery and mobile custom-list secondary actions stay available independently of compact flags. */}
        <div
          className={`compact-actions-container${topOverflow ? " cardv2-top-overflow" : ""}`}
          style={{
            padding: "var(--space-1, 4px)",
            display: (isCustomList && !isDesktop.isDesktop) || secondaryWatching ? "block" : undefined,
          }}
        >
          {context !== "home-cw-preview" &&
            !simplified &&
            !ratingOpportunity && (
              <CompactPrimaryAction
                item={item as any}
                context={context === "search" ? "home" : "tab"}
                actions={actions}
              />
            )}
          {!disableOverflow && !ratingOpportunity && (
            <CompactOverflowMenu
              item={item as any}
              context={
                isCustomList
                  ? "tab-watching"
                  : context === "home" ||
                      context === "tab-foryou" ||
                      context === "search"
                    ? "home"
                    : "tab"
              }
              actions={actions}
              secondaryWatching={secondaryWatching}
              hideStatusActions={simplified}
              customListContext={isCustomList}
              showText={false}
            />
          )}
        </div>
        </div>
      </div>
    </article>
  );

  // Mobile: wrap with SwipeableCard (swipe functionality + More menu)
  // Desktop: no wrapper at all (just the card + More menu)
  if (isDesktop.isDesktop || disableSwipe) {
    return cardContent;
  }

  return (
    <SwipeableCard
      item={item}
      actions={actions}
      context={context}
      disableSwipe={false}
    >
      {cardContent}
    </SwipeableCard>
  );
}

function CardActions({
  context,
  item,
  actions,
}: {
  context: CardContext;
  item: MediaItem;
  actions?: CardActionHandlers;
}) {
  const translations = useTranslations();
  const [pressedButtons, setPressedButtons] = React.useState<Set<string>>(
    new Set(),
  );
  const [loadingButtons, setLoadingButtons] = React.useState<Set<string>>(
    new Set(),
  );

  const btn = (
    label: string,
    onClick?: () => void,
    testId?: string,
    isLoading = false,
    isSquare = false,
  ) => {
    const buttonKey = `${testId}-${item.id}`;
    const isPressed = pressedButtons.has(buttonKey);
    const isLoadingState = loadingButtons.has(buttonKey) || isLoading;

    const handleClick = async () => {
      if (!onClick || isLoadingState) return;

      setPressedButtons((prev) => new Set(prev).add(buttonKey));
      if (testId === "act-watched" || testId === "act-want") {
        setLoadingButtons((prev) => new Set(prev).add(buttonKey));
      }
      try {
        await onClick();
      } finally {
        setTimeout(() => {
          setPressedButtons((prev) => {
            const s = new Set(prev);
            s.delete(buttonKey);
            return s;
          });
          setLoadingButtons((prev) => {
            const s = new Set(prev);
            s.delete(buttonKey);
            return s;
          });
        }, 150);
      }
    };

    const base =
      "inline-flex items-center justify-center rounded-xl border " +
      "bg-[var(--btn)] text-[var(--text)] border-[var(--line)] " +
      "shadow-sm transition-[transform,box-shadow,background-color] duration-150 ease-out " +
      "hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-inner " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
      "focus-visible:ring-[var(--accent)] disabled:opacity-60 disabled:cursor-not-allowed";

    const variant = isSquare
      ? "w-[68px] min-h-[40px] h-auto sm:w-[72px] sm:min-h-[44px] p-1.5 text-[10px] leading-[1.15] text-center"
      : "w-full min-h-9 h-auto py-1.5 px-3 text-[length:var(--font-sm,0.75rem)] leading-snug font-medium tracking-tight";

    const state = isPressed ? "translate-y-0.5 shadow-inner" : "";

    return (
      <button
        type="button"
        onClick={handleClick}
        className={`${base} ${variant} ${state}`}
        style={{
          backgroundColor: isPressed
            ? "var(--btn-pressed, var(--btn))"
            : "var(--btn)",
        }}
        data-testid={testId}
        disabled={isPressed || isLoadingState}
        aria-busy={isLoadingState || undefined}
      >
        {isLoadingState ? (
          <span className="inline-flex items-center gap-2">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
            {!isSquare && (
              <span className="text-[length:var(--font-sm,11px)]">
                Working…
              </span>
            )}
          </span>
        ) : (
          <span className="block px-0.5 text-center leading-[1.05] [text-wrap:balance] break-words">
            {label}
          </span>
        )}
      </button>
    );
  };

  // Map the context to a set of buttons, min 1, max 4 as per spec
  if (context === "home-cw-preview") {
    return (
      <div
        className="actions grid grid-cols-1 justify-items-center gap-1.5 p-2"
        style={{
          ["--btn-pressed" as any]: "var(--accent-weak, var(--accent))",
        }}
        data-testid="cardv2-actions"
      >
        {btn(
          translations.manageCurrentlyWatchingAction,
          () =>
            window.dispatchEvent(
              new CustomEvent("navigate-to-tab", {
                detail: { tab: "watching" },
              }),
            ),
          "act-go-watching",
        )}
      </div>
    );
  }

  if (context === "tab-watching") {
    return (
      <div
        className="actions grid grid-cols-2 justify-items-center gap-1.5 p-2"
        style={{
          ["--btn-pressed" as any]: "var(--accent-weak, var(--accent))",
        }}
        data-testid="cardv2-actions"
      >
        {btn(
          translations.wantToWatchAction,
          () => actions?.onWant?.(item),
          "act-want",
          false,
          true,
        )}
        {btn(
          translations.watchedAction,
          () => actions?.onWatched?.(item),
          "act-watched",
          false,
          true,
        )}
        {btn(
          translations.notInterestedAction,
          () => actions?.onNotInterested?.(item),
          "act-not",
          false,
          true,
        )}
        {btn(
          translations.deleteAction,
          () => actions?.onDelete?.(item),
          "act-delete",
          false,
          true,
        )}
      </div>
    );
  }

  if (context === "tab-foryou" || context === "search" || context === "home") {
    return (
      <div
        className="actions grid grid-cols-2 gap-1 p-1"
        data-testid="cardv2-actions"
      >
        {btn(
          translations.wantToWatchAction,
          () => actions?.onWant?.(item),
          "act-want",
        )}
        {btn(
          translations.watchedAction,
          () => actions?.onWatched?.(item),
          "act-watched",
        )}
      </div>
    );
  }

  if (context === "holiday") {
    return (
      <div
        className="actions grid grid-cols-2 gap-1 p-1"
        data-testid="cardv2-actions"
      >
        {btn(
          translations.watchedAction,
          () => actions?.onWatched?.(item),
          "act-watched",
        )}
        {btn(
          translations.removeAction,
          () => actions?.onDelete?.(item),
          "act-delete",
        )}
      </div>
    );
  }

  return <div className="p-2" />; // default no-op
}
