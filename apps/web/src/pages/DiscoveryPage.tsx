import { setNotInterested } from "../lib/statusTransitions";
import { useMemo, useState, useEffect } from "react";
import { useSmartDiscovery } from "@/hooks/useSmartDiscovery";
import { useAuth } from "@/hooks/useAuth";
import CardV2 from "@/components/cards/CardV2";
import type { MediaItem, MediaType } from "@/components/cards/card.types";
import { Library } from "@/lib/storage";
import StarRating from "@/components/cards/StarRating";
import ErrorBoundary from "@/components/ErrorBoundary";

/**
 * Personalized discovery (recommendations). TMDB title search uses SearchResults
 * in App when the header search is active — this page never queries Firestore posts.
 */
export default function DiscoveryPage() {
  const {
    recommendations,
    isLoading: discoveryLoading,
    error: discoveryError,
  } = useSmartDiscovery();
  const { isAuthenticated, user } = useAuth();

  const [libraryVersion, setLibraryVersion] = useState(0);
  const [ratingOpportunities, setRatingOpportunities] = useState<
    Array<{ item: MediaItem; index: number }>
  >([]);
  const dismissRating = (item: MediaItem) =>
    setRatingOpportunities((current) =>
      current.filter(
        ({ item: other }) =>
          other.id !== item.id || other.mediaType !== item.mediaType,
      ),
    );

  useEffect(() => {
    setRatingOpportunities([]);
  }, [isAuthenticated, user?.uid]);

  useEffect(() => {
    const handleLibraryChange = () => {
      setLibraryVersion((prev) => prev + 1);
      setRatingOpportunities(current => {
        const pending = current.filter(({item}) => Library.getCurrentList(item.id, item.mediaType) === "watched");
        return pending.length === current.length ? current : pending;
      });
    };

    const unsubscribe = Library.subscribe(handleLibraryChange);
    window.addEventListener("library:changed", handleLibraryChange);
    return () => {
      unsubscribe();
      window.removeEventListener("library:changed", handleLibraryChange);
    };
  }, []);

  const items = useMemo(() => {
    if (!isAuthenticated) {
      return [];
    }

    const candidates: MediaItem[] = recommendations
      .map((rec) => ({
        id: rec.item.id,
        mediaType: rec.item.kind,
        title: rec.item.title,
        posterUrl: rec.item.poster,
        synopsis: rec.item.overview,
        year: rec.item.year?.toString(),
        genre_ids: [],
        score: rec.score,
        reasons: rec.reasons,
      }))
      .filter((it: { id: string; mediaType: string }) => {
        const kind = (it.mediaType === "tv" ? "tv" : "movie") as MediaType;
        return !Library.has(it.id, kind);
      });
    // Keep each rating opportunity in its original grid position, including
    // when a recommendation refresh no longer includes the Watched title.
    const display = [...candidates];
    [...ratingOpportunities]
      .sort((a, b) => a.index - b.index)
      .forEach(({ item, index }) => {
        display.splice(Math.max(0, Math.min(index, display.length)), 0, item);
      });
    return display;
  }, [recommendations, isAuthenticated, libraryVersion, ratingOpportunities]);

  const isLoading = discoveryLoading;
  const hasError = discoveryError;

  const handleSignIn = () => {
    window.dispatchEvent(new CustomEvent("auth:sign-in-required"));
  };

  const actions = {
    onWant: (item: MediaItem) => {
      console.log("🎬 Discovery onWant called:", item);
      if (item.id && item.mediaType) {
        const existing = Library.getEntry(item.id, item.mediaType);
        Library.upsert(
          {
            id: item.id,
            mediaType: item.mediaType,
            title: item.title,
            posterUrl: item.posterUrl,
            year: item.year,
            voteAverage: item.voteAverage,
            showStatus: item.showStatus,
            lastAirDate: item.lastAirDate,
            synopsis: item.synopsis,
            userRating: existing?.userRating || item.userRating,
          },
          "wishlist",
        );
        setLibraryVersion((prev) => prev + 1);
        console.log("✅ Item added to wishlist, libraryVersion updated");
      } else {
        console.warn("⚠️ onWant: missing id or mediaType", item);
      }
    },
    onWatching: (item: MediaItem) => {
      if (item.id && item.mediaType) {
        const existing = Library.getEntry(item.id, item.mediaType);
        Library.upsert(
          {
            id: item.id,
            mediaType: item.mediaType,
            title: item.title,
            posterUrl: item.posterUrl,
            year: item.year,
            voteAverage: item.voteAverage,
            showStatus: item.showStatus,
            lastAirDate: item.lastAirDate,
            synopsis: item.synopsis,
            userRating: existing?.userRating || item.userRating,
          },
          "watching",
        );
        setLibraryVersion((prev) => prev + 1);
      }
    },
    onWatched: (item: MediaItem) => {
      console.log("🎬 Discovery onWatched called:", item);
      if (item.id && item.mediaType) {
        const existing = Library.getEntry(item.id, item.mediaType);
        Library.upsert(
          {
            id: item.id,
            mediaType: item.mediaType,
            title: item.title,
            posterUrl: item.posterUrl,
            year: item.year,
            voteAverage: item.voteAverage,
            showStatus: item.showStatus,
            lastAirDate: item.lastAirDate,
            synopsis: item.synopsis,
            userRating: existing?.userRating || item.userRating,
          },
          "watched",
        );
        if (Library.getCurrentList(item.id, item.mediaType) === "watched") {
          setRatingOpportunities((current) => [
            ...current.filter(
              ({ item: other }) =>
                other.id !== item.id || other.mediaType !== item.mediaType,
            ),
            {
              item,
              index: items.findIndex(
                (other) =>
                  other.id === item.id && other.mediaType === item.mediaType,
              ),
            },
          ]);
        }
        setLibraryVersion((prev) => prev + 1);
        console.log("✅ Item added to watched, libraryVersion updated");
      } else {
        console.warn("⚠️ onWatched: missing id or mediaType", item);
      }
    },
    onNotInterested: async (item: MediaItem) => {
      if (item.id && item.mediaType) {
        const existing = Library.getEntry(item.id, item.mediaType);
        await setNotInterested(
          {
            id: item.id,
            mediaType: item.mediaType,
            title: item.title,
            posterUrl: item.posterUrl,
            year: item.year,
            voteAverage: item.voteAverage,
            showStatus: item.showStatus,
            lastAirDate: item.lastAirDate,
            synopsis: item.synopsis,
            userRating: existing?.userRating || item.userRating,
          },
        );
        setLibraryVersion((prev) => prev + 1);
      }
    },
  };

  return (
    <section className="px-4 py-4">
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-neutral-200 mb-2">
            🎯 Personalized Recommendations
          </h2>
          <p className="text-sm text-neutral-400">
            Personalized by your tastes and tracking activity. Use the search
            bar for specific titles.
          </p>
        </div>

        {!items.length && !isAuthenticated && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-lg font-medium text-neutral-200 mb-2">
              Sign In to Discover Content
            </h3>
            <p className="text-sm text-neutral-400 mb-4">
              Sign in for recommendations personalized by your tastes and
              tracking activity.
            </p>
            <button
              type="button"
              onClick={handleSignIn}
              className="px-6 py-3 rounded-lg font-semibold transition-colors"
              style={{ backgroundColor: "var(--accent)", color: "white" }}
            >
              Sign In
            </button>
          </div>
        )}

        {!items.length && !isLoading && !hasError && isAuthenticated && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎬</div>
            <h3 className="text-lg font-medium text-neutral-200 mb-2">
              Building Your Recommendations
            </h3>
            <p className="text-sm text-neutral-400 mb-4">
              Rate a few titles so we can personalize Discovery from your tastes
              and tracking activity, or search for something specific.
            </p>
          </div>
        )}

        {isLoading && isAuthenticated && (
          <div className="text-xs text-neutral-500 mb-3">
            Loading recommendations…
          </div>
        )}

        {hasError && isAuthenticated && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-neutral-200 mb-2">
              Failed to Load Recommendations
            </h3>
            <p className="text-sm text-neutral-400">Please try again later.</p>
          </div>
        )}

        {items.length > 0 && (
          <ErrorBoundary
            name="DiscoveryResults"
            onReset={() => {
              /* useSmartDiscovery refetches on its own */
            }}
          >
            <div className="discovery-results-grid gap-3">
              {items.map((it) => {
                const mediaType = (it.mediaType || "movie") as "movie" | "tv";
                const normalizedMediaType = mediaType === "tv" ? "tv" : "movie";

                const mediaItem: MediaItem = {
                  id: String(it.id),
                  mediaType: normalizedMediaType,
                  title: (it.title as string) || "Untitled",
                  posterUrl: it.posterUrl as string | undefined,
                  synopsis: it.synopsis,
                  year: it.year as string | undefined,
                  voteAverage: it.voteAverage as number | undefined,
                };

                return (
                  <div
                    key={`${normalizedMediaType}-${it.id}`}
                    className="relative"
                  >
                    <CardV2
                      item={mediaItem}
                      context="tab-foryou"
                      actions={actions}
                      secondaryWatching
                      ratingOpportunity={
                        ratingOpportunities.some(
                          ({ item }) =>
                            item.id === mediaItem.id &&
                            item.mediaType === mediaItem.mediaType,
                        ) ? (
                          <div
                            className="p-2 space-y-1"
                            aria-label={`Rate ${mediaItem.title}`}
                          >
                            <p className="text-xs">
                              Added to Watched. Rate it?
                            </p>
                            <StarRating
                              value={
                                Library.getEntry(
                                  mediaItem.id,
                                  mediaItem.mediaType,
                                )?.userRating || 0
                              }
                              size="sm"
                              className="compact-user-rating"
                              onChange={(rating) => {
                                Library.updateRating(
                                  mediaItem.id,
                                  mediaItem.mediaType,
                                  rating,
                                );
                                if (Library.getEntry(mediaItem.id, mediaItem.mediaType)?.userRating === rating) {
                                  dismissRating(mediaItem);
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="min-h-[44px] text-sm"
                              onClick={() => dismissRating(mediaItem)}
                            >
                              Not now
                            </button>
                          </div>
                        ) : undefined
                      }
                    />
                  </div>
                );
              })}
            </div>
          </ErrorBoundary>
        )}
      </div>
    </section>
  );
}
