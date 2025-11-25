import { describe, it, expect } from "vitest";
import { scoreRecommendation, UserPreferences } from "@/lib/smartDiscovery";

function makeCardData(isFavorite?: boolean) {
  return {
    id: "candidate",
    kind: "movie" as const,
    title: "Candidate",
    poster: "https://example.com/poster.jpg",
    year: 2024,
    isFavorite,
  };
}

const basePreferences: UserPreferences = {
  favoriteGenres: {},
  preferredMediaTypes: { movie: 0.5, tv: 0.5 },
  averageRating: 3.5,
  notInterestedIds: new Set(),
  favoriteIds: new Set(),
};

const tmdbData = {
  vote_average: 8,
  voteCount: 1200,
  popularity: 150,
};

describe("Discovery scoring — favorites boost", () => {
  it("gives a favorite a higher score than a non-favorite with identical inputs", () => {
    const favoriteScore = scoreRecommendation(
      makeCardData(true),
      basePreferences,
      tmdbData
    );
    const nonFavoriteScore = scoreRecommendation(
      makeCardData(false),
      basePreferences,
      tmdbData
    );

    expect(favoriteScore.score).toBeGreaterThan(nonFavoriteScore.score);
  });

  it("does not let a low-rated favorite outrank a very high-rated non-favorite", () => {
    const lowFavorite = scoreRecommendation(
      makeCardData(true),
      basePreferences,
      {
        ...tmdbData,
        vote_average: 2.0,
      }
    );
    const highNonFavorite = scoreRecommendation(
      makeCardData(false),
      basePreferences,
      {
        ...tmdbData,
        vote_average: 9.5,
      }
    );

    expect(lowFavorite.score).toBeLessThan(highNonFavorite.score);
  });

  it("treats undefined isFavorite as a non-favorite without crashing", () => {
    const undefinedFavoriteScore = scoreRecommendation(
      makeCardData(),
      basePreferences,
      tmdbData
    );
    const explicitNonFavorite = scoreRecommendation(
      makeCardData(false),
      basePreferences,
      tmdbData
    );

    expect(undefinedFavoriteScore.score).toBeCloseTo(
      explicitNonFavorite.score,
      5
    );
  });
});
