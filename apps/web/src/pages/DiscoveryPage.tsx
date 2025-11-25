import { useMemo, useState, useEffect } from "react";
import { useSearch } from "@/hooks/useSearch";
import { useSmartDiscovery } from "@/hooks/useSmartDiscovery";
import { useAuth } from "@/hooks/useAuth";
import CardV2 from "@/components/cards/CardV2";
import type { MediaItem } from "@/components/cards/card.types";
import { Library } from "@/lib/storage";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function DiscoveryPage({
  query,
  genreId,
}: {
  query: string;
  genreId: number | null;
}) {
  const searchResults = useSearch({ queryText: query });
  const {
    recommendations,
    isLoading: discoveryLoading,
    error: discoveryError,
  } = useSmartDiscovery();
  const { isAuthenticated } = useAuth();

  // Track library changes to filter items immediately
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
    // If user is searching, use search results
    if (query.trim()) {
      const all = searchResults.results ?? [];
      const filtered = !genreId
        ? all
        : all.filter(
            (it: any) =>
              Array.isArray(it.genre_ids) && it.genre_ids.includes(genreId)
          );

      // Filter out items already in library
      return filtered.filter((it: any) => {
        const mediaType = it.kind || it.mediaType;
        const id = it.id;
        return !Library.has(id, mediaType);
      });
    }

    // For discovery without search, only show recommendations if authenticated
    if (!isAuthenticated) {
      return [];
    }

    // For authenticated users, use smart recommendations
    // Filter out items already in library (backfill happens in getSmartRecommendations)
    return recommendations
      .map((rec) => ({
        id: rec.item.id,
        mediaType: rec.item.kind,
        title: rec.item.title,
        posterUrl: rec.item.poster,
        year: rec.item.year?.toString(),
        genre_ids: [], // Will be populated by TMDB data
        score: rec.score,
        reasons: rec.reasons,
      }))
      .filter((it: any) => {
        return !Library.has(it.id, it.mediaType);
      });
  }, [
    query,
    genreId,
    searchResults.results,
    recommendations,
    isAuthenticated,
    libraryVersion,
  ]);

  const isLoading = query.trim() ? searchResults.loading : discoveryLoading;
  const hasError = query.trim() ? searchResults.error : discoveryError;

  // Action handlers using Library.upsert
  const actions = {
    onWant: (item: MediaItem) => {
      console.log("🎬 Discovery onWant called:", item);
      if (item.id && item.mediaType) {
        // Get existing entry to preserve rating if it exists
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
            userRating: existing?.userRating || item.userRating, // Preserve existing rating
          },
          "wishlist"
        );
        // Trigger library change to update UI immediately
        setLibraryVersion((prev) => prev + 1);
        console.log("✅ Item added to wishlist, libraryVersion updated");
      } else {
        console.warn("⚠️ onWant: missing id or mediaType", item);
      }
    },
    onWatching: (item: MediaItem) => {
      if (item.id && item.mediaType) {
        // Get existing entry to preserve rating if it exists
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
            userRating: existing?.userRating || item.userRating, // Preserve existing rating
          },
          "watching"
        );
        // Trigger library change to update UI immediately
        setLibraryVersion((prev) => prev + 1);
      }
    },
    onWatched: (item: MediaItem) => {
      console.log("🎬 Discovery onWatched called:", item);
      if (item.id && item.mediaType) {
        // Get existing entry to preserve rating if it exists
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
            userRating: existing?.userRating || item.userRating, // Preserve existing rating
          },
          "watched"
        );
        // Trigger library change to update UI immediately
        setLibraryVersion((prev) => prev + 1);
        console.log("✅ Item added to watched, libraryVersion updated");
      } else {
        console.warn("⚠️ onWatched: missing id or mediaType", item);
      }
    },
    onNotInterested: (item: MediaItem) => {
      if (item.id && item.mediaType) {
        // Get existing entry to preserve rating if it exists
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
            userRating: existing?.userRating || item.userRating, // Preserve existing rating
          },
          "not"
        );
        // Trigger library change to update UI immediately
        setLibraryVersion((prev) => prev + 1);
      }
    },
  };

  return (
    <section className="px-4 py-4">
      <div className="max-w-screen-2xl mx-auto">
        {!query && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-neutral-200 mb-2">
              🎯 Personalized Recommendations
            </h2>
            <p className="text-sm text-neutral-400">
              Based on your ratings and preferences
            </p>
          </div>
        )}

        {!query && !items.length && !isLoading && !isAuthenticated && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-lg font-medium text-neutral-200 mb-2">
              Sign In to Discover Content
            </h3>
            <p className="text-sm text-neutral-400 mb-4">
              Sign in to get personalized recommendations based on your ratings
              and preferences.
            </p>
          </div>
        )}

        {!query && !items.length && !isLoading && isAuthenticated && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎬</div>
            <h3 className="text-lg font-medium text-neutral-200 mb-2">
              Building Your Recommendations
            </h3>
            <p className="text-sm text-neutral-400 mb-4">
              Rate some movies and TV shows to get personalized recommendations,
              or use the search bar to find specific content.
            </p>
          </div>
        )}

        {query && !query.trim() && (
          <div className="text-xs text-neutral-500 mb-3">
            Type a search above.
          </div>
        )}
        {isLoading && (
          <div className="text-xs text-neutral-500 mb-3">
            {query.trim()
              ? "Loading search results..."
              : "Loading personalized recommendations..."}
          </div>
        )}

        {hasError && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-neutral-200 mb-2">
              Failed to Load Search Results
            </h3>
            <p className="text-sm text-neutral-400">Please try again later.</p>
          </div>
        )}

        {items.length > 0 && (
          <ErrorBoundary
            name="DiscoveryResults"
            onReset={() => {
              // Refetch search results if searching, otherwise discovery will auto-refetch
              if (query.trim()) {
                // Search results update automatically via Firestore listener
              }
            }}
          >
            <div className="grid grid-cols-[repeat(auto-fill,154px)] gap-3">
              {items.map((it: any, index: number) => {
                // Normalize mediaType - ensure it's 'movie' or 'tv'
                const mediaType = (it.kind || it.mediaType || "movie") as
                  | "movie"
                  | "tv";
                const normalizedMediaType = mediaType === "tv" ? "tv" : "movie";

                const mediaItem: MediaItem = {
                  id: String(it.id), // Ensure id is string
                  mediaType: normalizedMediaType,
                  title: it.title || "Untitled",
                  posterUrl: it.posterUrl || it.poster, // Use posterUrl if available, fallback to poster
                  year: it.year,
                  voteAverage: it.voteAverage,
                };

                console.log("🎬 Rendering discovery card:", {
                  id: mediaItem.id,
                  mediaType: mediaItem.mediaType,
                  title: mediaItem.title,
                  hasActions: !!actions,
                });

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
