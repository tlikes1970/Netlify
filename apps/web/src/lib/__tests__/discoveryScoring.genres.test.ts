/**
 * Genre scoring tests for Discovery
 * Verifies that favoriteGenres influences scoring when populated,
 * and has no effect when empty.
 */
import { describe, it, expect, vi } from "vitest";
import {
  scoreRecommendation,
  analyzeGenrePreferences,
  UserPreferences,
} from "@/lib/smartDiscovery";
import type { LibraryEntry } from "@/lib/storage";

// Reuse helper pattern from favorites tests
function makeCardData() {
  return {
    id: "candidate",
    kind: "movie" as const,
    title: "Candidate",
    poster: "https://example.com/poster.jpg",
    year: 2024,
  };
}

// Base preferences with empty genres (default state)
const basePreferences: UserPreferences = {
  favoriteGenres: {},
  preferredMediaTypes: { movie: 0.5, tv: 0.5 },
  averageRating: 3.5,
  notInterestedIds: new Set(),
  favoriteIds: new Set(),
};

// TMDB data with genre_ids for testing genre matching
const tmdbDataWithGenres = {
  vote_average: 7.5,
  voteCount: 1000,
  popularity: 100,
  genre_ids: [18, 28], // Drama (18), Action (28)
};

const tmdbDataNoMatchingGenres = {
  vote_average: 7.5,
  voteCount: 1000,
  popularity: 100,
  genre_ids: [35, 10749], // Comedy (35), Romance (10749)
};

describe("Discovery scoring — genre preferences", () => {
  it("gives a higher score when candidate genres match favoriteGenres", () => {
    // Preferences with Drama (18) as a favorite genre
    const prefsWithGenres: UserPreferences = {
      ...basePreferences,
      favoriteGenres: { 18: 0.8 }, // Drama with high preference
    };

    const matchingScore = scoreRecommendation(
      makeCardData(),
      prefsWithGenres,
      tmdbDataWithGenres
    );
    const nonMatchingScore = scoreRecommendation(
      makeCardData(),
      prefsWithGenres,
      tmdbDataNoMatchingGenres
    );

    expect(matchingScore.score).toBeGreaterThan(nonMatchingScore.score);
    expect(matchingScore.reasons).toContain("Matches 1 favorite genre");
  });

  it("gives no genre bonus when favoriteGenres is empty", () => {
    // Both candidates should score the same when no genre preferences exist
    const scoreWithGenres = scoreRecommendation(
      makeCardData(),
      basePreferences,
      tmdbDataWithGenres
    );
    const scoreNoGenres = scoreRecommendation(
      makeCardData(),
      basePreferences,
      tmdbDataNoMatchingGenres
    );

    // Scores should be equal (no genre bonus applied)
    expect(scoreWithGenres.score).toBeCloseTo(scoreNoGenres.score, 5);
    expect(scoreWithGenres.reasons).not.toContain(
      expect.stringMatching(/favorite genre/)
    );
  });

  it("accumulates bonus for multiple matching genres", () => {
    // Preferences with both Drama (18) and Action (28) as favorites
    const prefsWithMultipleGenres: UserPreferences = {
      ...basePreferences,
      favoriteGenres: { 18: 0.7, 28: 0.6 }, // Drama and Action
    };

    const multiMatchScore = scoreRecommendation(
      makeCardData(),
      prefsWithMultipleGenres,
      tmdbDataWithGenres
    );

    // Should mention multiple genres in reasons
    expect(multiMatchScore.reasons).toContain("Matches 2 favorite genres");
  });

  it("handles missing genre_ids in tmdbData gracefully", () => {
    const prefsWithGenres: UserPreferences = {
      ...basePreferences,
      favoriteGenres: { 18: 0.8 },
    };

    const tmdbNoGenreIds = {
      vote_average: 7.5,
      voteCount: 1000,
      popularity: 100,
      // No genre_ids field
    };

    // Should not crash, just skip genre scoring
    const result = scoreRecommendation(
      makeCardData(),
      prefsWithGenres,
      tmdbNoGenreIds
    );
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons).not.toContain(
      expect.stringMatching(/favorite genre/)
    );
  });

  it("ignores invalid genre IDs (non-positive numbers)", () => {
    const prefsWithGenres: UserPreferences = {
      ...basePreferences,
      favoriteGenres: { 18: 0.8, 0: 0.5, [-1]: 0.5 }, // Include invalid IDs
    };

    const tmdbWithInvalidGenres = {
      vote_average: 7.5,
      voteCount: 1000,
      popularity: 100,
      genre_ids: [18, 0, -1, null, undefined], // Mix of valid and invalid
    };

    // Should only count the valid genre (18)
    const result = scoreRecommendation(
      makeCardData(),
      prefsWithGenres,
      tmdbWithInvalidGenres as any
    );
    expect(result.reasons).toContain("Matches 1 favorite genre");
  });
});

describe("analyzeGenrePreferences", () => {
  it("returns genre scores based on item frequency", async () => {
    // Mock TMDB API that returns genre data
    const mockTmdbApi = vi.fn().mockImplementation((path: string) => {
      if (path.includes("/movie/")) {
        return Promise.resolve({
          genres: [
            { id: 18, name: "Drama" },
            { id: 28, name: "Action" },
          ],
        });
      }
      return Promise.resolve({ genres: [] });
    });

    const items: LibraryEntry[] = [
      { id: "1", mediaType: "movie", title: "Movie 1", list: "watching" },
      { id: "2", mediaType: "movie", title: "Movie 2", list: "watched" },
    ];

    const result = await analyzeGenrePreferences(items, mockTmdbApi, 5000);

    // Should have genre preferences for Drama and Action
    expect(result[18]).toBeGreaterThan(0); // Drama
    expect(result[28]).toBeGreaterThan(0); // Action
    expect(mockTmdbApi).toHaveBeenCalledTimes(2);
  });

  it("boosts genres that user rates highly", async () => {
    const mockTmdbApi = vi.fn().mockImplementation((path: string) => {
      return Promise.resolve({
        genres: [{ id: 18, name: "Drama" }],
      });
    });

    // Two items with different ratings for the same genre
    const itemsHighRating: LibraryEntry[] = [
      {
        id: "1",
        mediaType: "movie",
        title: "Movie 1",
        list: "watched",
        userRating: 5,
      },
    ];
    const itemsLowRating: LibraryEntry[] = [
      {
        id: "2",
        mediaType: "movie",
        title: "Movie 2",
        list: "watched",
        userRating: 1,
      },
    ];

    const highResult = await analyzeGenrePreferences(
      itemsHighRating,
      mockTmdbApi,
      5000
    );
    const lowResult = await analyzeGenrePreferences(
      itemsLowRating,
      mockTmdbApi,
      5000
    );

    // High-rated genre should have higher preference score
    expect(highResult[18]).toBeGreaterThan(lowResult[18]);
  });

  it("returns empty object when no items provided", async () => {
    const mockTmdbApi = vi.fn();
    const result = await analyzeGenrePreferences([], mockTmdbApi, 5000);

    expect(result).toEqual({});
    expect(mockTmdbApi).not.toHaveBeenCalled();
  });

  it("handles API errors gracefully without crashing", async () => {
    const mockTmdbApi = vi.fn().mockRejectedValue(new Error("Network error"));

    const items: LibraryEntry[] = [
      { id: "1", mediaType: "movie", title: "Movie 1", list: "watching" },
    ];

    // Should not throw, just return empty or partial results
    const result = await analyzeGenrePreferences(items, mockTmdbApi, 5000);
    expect(result).toBeDefined();
  });
});
