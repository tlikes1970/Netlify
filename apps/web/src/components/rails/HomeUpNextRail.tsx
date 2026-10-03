import { useMemo } from "react";

import UpNextCard from "../cards/UpNextCard";

import { useTranslations } from "../../lib/language";

import { useSettings, resolveFlickletLine } from "../../lib/settings";

import { useReturningShows } from "../../state/selectors/useReturningShows";

import { HOME_UP_NEXT_LIMIT } from "../../lib/upNextShows";

export default function HomeUpNextRail() {
  const translations = useTranslations();

  const settings = useSettings();

  const allItems = useReturningShows();

  const items = useMemo(
    () => allItems.slice(0, HOME_UP_NEXT_LIMIT),

    [allItems],
  );

  return (
    <div>
      <h3
        className="text-base font-semibold mb-3"
        style={{ color: "var(--text)" }}
      >
        {translations.upNext}
      </h3>

      {items.length > 0 ? (
        <div
          data-cards
          className="flex gap-3 overflow-x-auto snap-x snap-proximity pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent rail-scroll"
        >
          {items.map((item) => (
            <div
              key={`${item.mediaType}:${item.id}:${item.nextAirDate ?? "tba"}`}
              className="flex-shrink-0"
            >
              <UpNextCard item={item} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-neutral-400">
          <p>
            {resolveFlickletLine("empty.upnext", settings.personalityLevel) ||
              "No upcoming shows on the radar."}
          </p>

          <p className="mt-1">Add TV shows to Currently Watching or Watched to follow their release schedule.</p>
        </div>
      )}
    </div>
  );
}
