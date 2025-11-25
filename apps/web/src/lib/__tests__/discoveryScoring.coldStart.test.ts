/**
 * Cold-start prior tests for Smart Discovery
 * Verifies behavior for users with fewer than 5 ratings:
 * - Prior (3.0) influences averageRating calculation
 * - Blending behavior changes at the 5-rating threshold
 */
import { describe, it, expect } from "vitest";
import { analyzeUserPreferences, UserPreferences } from "@/lib/smartDiscovery";
import type { LibraryEntry } from "@/lib/storage";

// Helper to create library entries with ratings
function makeEntry(
  id: string,
  rating?: number,
  mediaType: "movie" | "tv" = "movie"
): LibraryEntry {
  return {
    id,
    mediaType,
    title: `Test ${id}`,
    list: "watched",
    addedAt: Date.now(),
    userRating: rating,
    ratingUpdatedAt: rating !== undefined ? Date.now() : undefined,
  };
}

describe("Cold-start prior — averageRating calculation", () => {
  const PRIOR_RATING = 3.0; // The neutral prior used in cold-start
  const MIN_SAMPLE_SIZE = 5;

  it("returns prior (3.0) when user has 0 ratings", () => {
    // Items without ratings
    const items = [makeEntry("1"), makeEntry("2"), makeEntry("3")];

    const prefs = analyzeUserPreferences(items, [], []);
    expect(prefs.averageRating).toBe(PRIOR_RATING);
  });

  it("returns prior (3.0) when user has 0 items", () => {
    const prefs = analyzeUserPreferences([], [], []);
    expect(prefs.averageRating).toBe(PRIOR_RATING);
  });

  it("blends 1 rating with prior (80% prior, 20% user)", () => {
    // 1 rating out of MIN_SAMPLE_SIZE=5 means:
    // priorWeight = (5-1)/5 = 0.8
    // userWeight = 1/5 = 0.2
    // averageRating = 0.8 * 3.0 + 0.2 * userAvg
    const items = [makeEntry("1", 5)]; // Single 5-star rating

    const prefs = analyzeUserPreferences(items, [], []);

    // Expected: 0.8 * 3.0 + 0.2 * 5.0 = 2.4 + 1.0 = 3.4
    expect(prefs.averageRating).toBeCloseTo(3.4, 2);
  });

  it("blends 2 ratings with prior (60% prior, 40% user)", () => {
    // 2 ratings: priorWeight = 3/5 = 0.6, userWeight = 2/5 = 0.4
    const items = [makeEntry("1", 5), makeEntry("2", 5)];

    const prefs = analyzeUserPreferences(items, [], []);

    // Expected: 0.6 * 3.0 + 0.4 * 5.0 = 1.8 + 2.0 = 3.8
    expect(prefs.averageRating).toBeCloseTo(3.8, 2);
  });

  it("blends 3 ratings with prior (40% prior, 60% user)", () => {
    // 3 ratings: priorWeight = 2/5 = 0.4, userWeight = 3/5 = 0.6
    const items = [makeEntry("1", 5), makeEntry("2", 5), makeEntry("3", 5)];

    const prefs = analyzeUserPreferences(items, [], []);

    // Expected: 0.4 * 3.0 + 0.6 * 5.0 = 1.2 + 3.0 = 4.2
    expect(prefs.averageRating).toBeCloseTo(4.2, 2);
  });

  it("blends 4 ratings with prior (20% prior, 80% user)", () => {
    // 4 ratings: priorWeight = 1/5 = 0.2, userWeight = 4/5 = 0.8
    const items = [
      makeEntry("1", 5),
      makeEntry("2", 5),
      makeEntry("3", 5),
      makeEntry("4", 5),
    ];

    const prefs = analyzeUserPreferences(items, [], []);

    // Expected: 0.2 * 3.0 + 0.8 * 5.0 = 0.6 + 4.0 = 4.6
    expect(prefs.averageRating).toBeCloseTo(4.6, 2);
  });

  it("uses pure user average (no prior) when user has 5+ ratings", () => {
    // 5 ratings: usePriors = false, uses recency-weighted average
    const now = Date.now();
    const items = [
      { ...makeEntry("1", 5), ratingUpdatedAt: now },
      { ...makeEntry("2", 5), ratingUpdatedAt: now },
      { ...makeEntry("3", 5), ratingUpdatedAt: now },
      { ...makeEntry("4", 5), ratingUpdatedAt: now },
      { ...makeEntry("5", 5), ratingUpdatedAt: now },
    ];

    const prefs = analyzeUserPreferences(items, [], []);

    // With 5 all-5-star ratings at same timestamp, average should be 5.0
    // (recency weighting is equal for all when timestamps are same)
    expect(prefs.averageRating).toBeCloseTo(5.0, 2);
  });

  it("prior pulls low ratings up toward 3.0", () => {
    // 1 rating of 1 star
    const items = [makeEntry("1", 1)];

    const prefs = analyzeUserPreferences(items, [], []);

    // Expected: 0.8 * 3.0 + 0.2 * 1.0 = 2.4 + 0.2 = 2.6
    expect(prefs.averageRating).toBeCloseTo(2.6, 2);
    // Prior pulls the average UP from 1.0 toward 3.0
    expect(prefs.averageRating).toBeGreaterThan(1.0);
  });

  it("prior pulls high ratings down toward 3.0", () => {
    // 1 rating of 5 stars
    const items = [makeEntry("1", 5)];

    const prefs = analyzeUserPreferences(items, [], []);

    // Prior pulls the average DOWN from 5.0 toward 3.0
    expect(prefs.averageRating).toBeLessThan(5.0);
    expect(prefs.averageRating).toBeGreaterThan(3.0);
  });

  it("handles mixed rated and unrated items correctly", () => {
    // 2 rated items among 5 total items
    // NOTE: usePriors is based on allItems.length, NOT userRatings.length
    // With 5 items, usePriors = false (5 >= MIN_SAMPLE_SIZE)
    // So it uses recency-weighted average of the 2 ratings (both 5.0)
    const now = Date.now();
    const items = [
      { ...makeEntry("1", 5), ratingUpdatedAt: now },
      { ...makeEntry("2", 5), ratingUpdatedAt: now },
      makeEntry("3"), // unrated
      makeEntry("4"), // unrated
      makeEntry("5"), // unrated
    ];

    const prefs = analyzeUserPreferences(items, [], []);

    // With 5 total items, cold-start prior does NOT apply
    // Average of the 2 rated items (both 5) = 5.0
    expect(prefs.averageRating).toBeCloseTo(5.0, 2);
  });

  it("threshold comparison: 4 vs 5 ratings shows prior influence", () => {
    const now = Date.now();

    // 4 ratings (cold-start applies)
    const items4 = Array.from({ length: 4 }, (_, i) => ({
      ...makeEntry(`${i}`, 5),
      ratingUpdatedAt: now,
    }));

    // 5 ratings (no cold-start)
    const items5 = Array.from({ length: 5 }, (_, i) => ({
      ...makeEntry(`${i}`, 5),
      ratingUpdatedAt: now,
    }));

    const prefs4 = analyzeUserPreferences(items4, [], []);
    const prefs5 = analyzeUserPreferences(items5, [], []);

    // With 4 ratings, prior pulls average down from 5.0
    // With 5 ratings, average is pure user (5.0)
    expect(prefs4.averageRating).toBeLessThan(prefs5.averageRating);
    expect(prefs5.averageRating).toBeCloseTo(5.0, 2);
  });
});

describe("Cold-start — other preferences fields", () => {
  it("returns default media type preferences for 0 items", () => {
    const prefs = analyzeUserPreferences([], [], []);

    expect(prefs.preferredMediaTypes.movie).toBe(0.5);
    expect(prefs.preferredMediaTypes.tv).toBe(0.5);
  });

  it("calculates correct media type ratios regardless of ratings", () => {
    const items = [
      makeEntry("1", 5, "movie"),
      makeEntry("2", undefined, "movie"),
      makeEntry("3", 3, "tv"),
    ];

    const prefs = analyzeUserPreferences(items, [], []);

    // 2 movies, 1 TV show out of 3 items
    expect(prefs.preferredMediaTypes.movie).toBeCloseTo(2 / 3, 2);
    expect(prefs.preferredMediaTypes.tv).toBeCloseTo(1 / 3, 2);
  });

  it("returns empty favoriteGenres (populated async via hook)", () => {
    const items = [makeEntry("1", 5)];
    const prefs = analyzeUserPreferences(items, [], []);

    // favoriteGenres is populated by analyzeGenrePreferences, not here
    expect(prefs.favoriteGenres).toEqual({});
  });

  it("tracks notInterestedIds from provided list", () => {
    const notInterested = [
      makeEntry("not-1", undefined, "movie"),
      makeEntry("not-2", undefined, "tv"),
    ];

    const prefs = analyzeUserPreferences([], [], [], notInterested);

    expect(prefs.notInterestedIds.has("movie:not-1")).toBe(true);
    expect(prefs.notInterestedIds.has("tv:not-2")).toBe(true);
    expect(prefs.notInterestedIds.size).toBe(2);
  });

  it("tracks favoriteIds from items with isFavorite flag", () => {
    const items: LibraryEntry[] = [
      { ...makeEntry("fav-1", 5, "movie"), isFavorite: true },
      { ...makeEntry("fav-2", 4, "tv"), isFavorite: true },
      makeEntry("not-fav", 3, "movie"),
    ];

    const prefs = analyzeUserPreferences(items, [], []);

    expect(prefs.favoriteIds.has("movie:fav-1")).toBe(true);
    expect(prefs.favoriteIds.has("tv:fav-2")).toBe(true);
    expect(prefs.favoriteIds.has("movie:not-fav")).toBe(false);
    expect(prefs.favoriteIds.size).toBe(2);
  });
});
