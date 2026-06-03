import { useMemo, useState, useEffect } from "react";
import { useSmartDiscovery } from "@/hooks/useSmartDiscovery";
import { useAuth } from "@/hooks/useAuth";
import CardV2 from "@/components/cards/CardV2";
import type { MediaItem, MediaType } from "@/components/cards/card.types";
import { Library } from "@/lib/storage";
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
  const { isAuthenticated } = useAuth();

  const [libraryVersion, setLibraryVersion] = useState(0);

  useEffect(() => {
    const handleLibraryChange = () => {
      setLibraryVersion((prev) => prev + 1);
    };

    window.addEventListener("library:changed", handleLibraryChange);
    return () =>
      window.removeEventListener("library:changed", handleLibraryChange);
  }, []);

  const items = useMemo(() => {
    if (!isAuthenticated) {
      return [];
    }

    return recommendations
      .map((rec) => ({
        id: rec.item.id,
        mediaType: rec.item.kind,
        title: rec.item.title,
        posterUrl: rec.item.poster,
        year: rec.item.year?.toString(),
        genre_ids: [],
        score: rec.score,
        reasons: rec.reasons,
      }))
      .filter((it: { id: string; mediaType: string }) => {
        const kind = (it.mediaType === "tv" ? "tv" : "movie") as MediaType;
        return !Library.has(it.id, kind);
      });
  }, [recommendations, isAuthenticated, libraryVersion]);

  const isLoading = discoveryLoading;
  const hasError = discoveryError;

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
          "wishlist"
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
          "watching"
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
          "watched"
        );
        setLibraryVersion((prev) => prev + 1);
        console.log("✅ Item added to watched, libraryVersion updated");
      } else {
        console.warn("⚠️ onWatched: missing id or mediaType", item);
      }
    },
    onNotInterested: (item: MediaItem) => {
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
          "not"
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
            Personalized by your tastes and tracking activity. Use the search bar
            for specific titles.
          </p>
        </div>

        {!items.length && !isLoading && !isAuthenticated && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-lg font-medium text-neutral-200 mb-2">
              Sign In to Discover Content
            </h3>
            <p className="text-sm text-neutral-400 mb-4">
              Sign in for recommendations personalized by your tastes and
              tracking activity.
            </p>
          </div>
        )}

        {!items.length && !isLoading && isAuthenticated && (
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

        {isLoading && (
          <div className="text-xs text-neutral-500 mb-3">
            Loading recommendations…
          </div>
        )}

        {hasError && (
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
              {items.map((it: Record<string, unknown>, index: number) => {
                const mediaType = (it.kind || it.mediaType || "movie") as
                  | "movie"
                  | "tv";
                const normalizedMediaType = mediaType === "tv" ? "tv" : "movie";

                const mediaItem: MediaItem = {
                  id: String(it.id),
                  mediaType: normalizedMediaType,
                  title: (it.title as string) || "Untitled",
                  posterUrl: (it.posterUrl || it.poster) as string | undefined,
                  year: it.year as string | undefined,
                  voteAverage: it.voteAverage as number | undefined,
                };

                return (
                  <div
                    key={`${normalizedMediaType}-${it.id}-${index}`}
                    className="relative"
                  >
                    <CardV2
                      item={mediaItem}
                      context="tab-foryou"
                      actions={actions}
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
