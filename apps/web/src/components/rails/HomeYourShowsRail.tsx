import CardV2 from "../cards/CardV2";

import { useLibrary, Library } from "../../lib/storage";
import { setPrimaryStatus } from "../../lib/statusTransitions";

import { removeMediaItemWithConfirmation } from "../../lib/confirmRemoveShow";

import { useTranslations } from "../../lib/language";

import { useSettings, resolveFlickletLine } from "../../lib/settings";

export default function HomeYourShowsRail() {
  const items = useLibrary("watching", { includeItemUpdates: true });

  const translations = useTranslations();

  const settings = useSettings();

  const emptyLine = resolveFlickletLine(
    "empty.watching",
    settings.personalityLevel,
  );

  return (
    <div>
      <h3
        className="text-base font-semibold mb-3"
        style={{ color: "var(--text)" }}
      >
        {translations.currentlyWatching}
      </h3>

      {items.length > 0 ? (
        <div
          data-cards
          className="flex gap-3 overflow-x-auto snap-x snap-proximity pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent rail-scroll"
        >
          {items.map((item) => (
            <div key={`${item.mediaType}:${item.id}`} className="flex-shrink-0">
              <CardV2
                item={item}
                context="home-cw-preview"
                disableSwipe={true}
                disableOverflow={true}
                actions={{
                  onWant: (i) => setPrimaryStatus(i, "wishlist", { feedback: true }),

                  onWatched: (i) => setPrimaryStatus(i, "watched", { feedback: true }),

                  onNotInterested: (i) =>
                    Library.move(i.id, i.mediaType, "not"),

                  onDelete: (i) => removeMediaItemWithConfirmation(i),
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-neutral-400">
          <p>{emptyLine || "Nothing in Currently Watching yet."}</p>

          <p className="mt-1">{translations.addSomeFromSearchOrDiscovery}</p>
        </div>
      )}
    </div>
  );
}
