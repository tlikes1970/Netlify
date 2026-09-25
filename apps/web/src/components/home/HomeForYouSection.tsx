import { useCallback, useEffect, useState } from "react";
import Rail from "@/components/Rail";
import Section from "@/components/Section";
import { resolveFlickletLine } from "@/lib/settings";
import type { Settings } from "@/lib/settings";
import type { ForYouRow } from "@/components/GenreRowConfig";
import type { ForYouContentRow } from "@/hooks/useGenreContent";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { ForYouErrorFallback } from "./ForYouErrorFallback";
import {
  getForYouRowLoadState,
  isForYouRowError,
  isForYouRowLoading,
} from "./forYouRowStatus";

/** Visible skeleton slots per row while TMDB loads (lite placeholders, not CardV2). */
const HOME_FOR_YOU_SKELETON_COUNT = 4;

type Props = {
  afterFirstPaintReady: boolean;
  view: string;
  forYouContent: ForYouContentRow[];
  forYouRows: ForYouRow[];
  settings: Settings;
  forYouLabel: string;
  onPersonalizeGenres: () => void;
};

function scheduleIdle(callback: () => void, timeoutMs: number): () => void {
  if (typeof requestIdleCallback !== "undefined") {
    const id = requestIdleCallback(callback, { timeout: timeoutMs });
    return () => cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, 1);
  return () => clearTimeout(id);
}

export default function HomeForYouSection({
  afterFirstPaintReady,
  view,
  forYouContent,
  forYouRows,
  settings,
  forYouLabel,
  onPersonalizeGenres,
}: Props) {
  const isOnline = useOnlineStatus();
  const [renderReady, setRenderReady] = useState(false);
  const [extraRowsReady, setExtraRowsReady] = useState(false);

  const retryFailedRows = useCallback(() => {
    forYouContent.forEach((row) => {
      if (isForYouRowError(row)) {
        void row.refetch();
      }
    });
  }, [forYouContent]);

  useEffect(() => {
    if (!afterFirstPaintReady || view !== "home") {
      setRenderReady(false);
      setExtraRowsReady(false);
      return;
    }

    return scheduleIdle(() => {
      setRenderReady(true);
    }, 120);
  }, [afterFirstPaintReady, view]);

  useEffect(() => {
    if (!renderReady) {
      setExtraRowsReady(false);
      return;
    }

    return scheduleIdle(() => {
      setExtraRowsReady(true);
    }, 400);
  }, [renderReady]);

  if (!renderReady || forYouContent.length === 0) {
    return null;
  }

  const visibleRows = extraRowsReady
    ? forYouContent
    : forYouContent.slice(0, 1);

  const visibleLoading = visibleRows.some((row) => isForYouRowLoading(row));
  const allVisibleFailed =
    visibleRows.length > 0 &&
    !visibleLoading &&
    visibleRows.every((row) => getForYouRowLoadState(row) === "error");

  const sectionHeaderAction = (
    <button
      onClick={onPersonalizeGenres}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm transition-all duration-150 hover:scale-105 active:scale-95"
      style={{
        backgroundColor: "var(--btn)",
        color: "var(--muted)",
        border: "1px solid var(--line)",
      }}
      aria-label="Personalize For You genres"
      title="Personalize For You genres"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
      <span>Genres</span>
    </button>
  );

  return (
    <Section
      title={forYouLabel}
      inlineHeaderAction={true}
      headerAction={sectionHeaderAction}
    >
      <div className="space-y-4">
        {allVisibleFailed ? (
          <ForYouErrorFallback
            isOnline={isOnline}
            onRetry={retryFailedRows}
          />
        ) : (
          visibleRows.map((contentQuery, rowIndex) => {
            const row = forYouRows[rowIndex];
            const rowIntro = resolveFlickletLine(
              "discover.rowIntro",
              settings.personalityLevel,
              {
                rowTitle: contentQuery.title,
                genre: row?.mainGenre,
                subGenre: row?.subGenre,
              }
            );
            const loadState = getForYouRowLoadState(contentQuery);

            return (
              <Rail
                key={`for-you-${contentQuery.rowId}`}
                id={`for-you-${contentQuery.rowId}`}
                title={contentQuery.title}
                intro={rowIntro || undefined}
                items={
                  Array.isArray(contentQuery.data) ? contentQuery.data : []
                }
                loadState={loadState}
                isOnline={isOnline}
                onRetry={() => {
                  void contentQuery.refetch();
                }}
                skeletonCount={HOME_FOR_YOU_SKELETON_COUNT}
                skeletonVariant="lite"
              />
            );
          })
        )}
      </div>
    </Section>
  );
}
