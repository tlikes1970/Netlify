import { LibraryEntry } from './storage';
import { CardData } from './tmdb';

export interface UserPreferences {
  favoriteGenres: Record<number, number>; // genre ID -> preference score (0-1)
  preferredMediaTypes: { movie: number; tv: number }; // preference scores
  averageRating: number; // user's average rating of their content
  ratingVariance: number; // how varied their ratings are
  notInterestedIds: Set<string>; // items marked as not interested
}

export interface RecommendationScore {
  item: CardData;
  score: number;
  reasons: string[];
}

/**
 * Analyzes user's library to build preference profile
 */
export function analyzeUserPreferences(
  watching: LibraryEntry[],
  wishlist: LibraryEntry[],
  watched: LibraryEntry[],
  notInterested: LibraryEntry[] = []
): UserPreferences {
  const allItems = [...watching, ...wishlist, ...watched];
  
  // Cold start: use priors when sample size is too small
  const MIN_SAMPLE_SIZE = 5;
  const usePriors = allItems.length < MIN_SAMPLE_SIZE;
  
  if (allItems.length === 0) {
    return {
      favoriteGenres: {},
      preferredMediaTypes: { movie: 0.5, tv: 0.5 },
      averageRating: 3.0, // Prior: neutral rating
      ratingVariance: 0,
      notInterestedIds: new Set(notInterested.map(item => `${item.mediaType}:${item.id}`))
    };
  }

  // Analyze genres from user's content
  // const genreCounts: Record<number, number> = {}; // Unused
  // const genreRatings: Record<number, number[]> = {}; // Unused
  const mediaTypeCounts = { movie: 0, tv: 0 };
  const userRatings: Array<{ rating: number; timestamp: number }> = [];
  const now = Date.now();
  const RECENCY_HALFLIFE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

  allItems.forEach(item => {
    // Count media types
    if (item.mediaType === 'movie') mediaTypeCounts.movie++;
    else if (item.mediaType === 'tv') mediaTypeCounts.tv++;

    // Collect user ratings with recency weighting
    if (item.userRating !== undefined && item.userRating !== null) {
      const timestamp = item.ratingUpdatedAt || item.addedAt || now;
      userRatings.push({ rating: item.userRating, timestamp });
    }
  });

  // Calculate genre preferences based on user ratings and frequency
  const favoriteGenres: Record<number, number> = {};
  
  // Calculate media type preferences
  const totalItems = allItems.length;
  const preferredMediaTypes = {
    movie: totalItems > 0 ? mediaTypeCounts.movie / totalItems : 0.5,
    tv: totalItems > 0 ? mediaTypeCounts.tv / totalItems : 0.5
  };

  // Calculate average rating with recency weighting and cold start priors
  let averageRating: number;
  if (userRatings.length === 0) {
    averageRating = 3.0; // Prior: neutral
  } else if (usePriors) {
    // Cold start: blend user ratings with prior (3.0)
    const userAvg = userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length;
    const priorWeight = (MIN_SAMPLE_SIZE - userRatings.length) / MIN_SAMPLE_SIZE;
    const userWeight = userRatings.length / MIN_SAMPLE_SIZE;
    averageRating = (priorWeight * 3.0) + (userWeight * userAvg);
  } else {
    // Normal: recency-weighted average
    const totalWeight = userRatings.reduce((sum, r) => {
      const age = now - r.timestamp;
      const weight = Math.exp(-age / RECENCY_HALFLIFE_MS);
      return sum + weight;
    }, 0);
    
    const weightedSum = userRatings.reduce((sum, r) => {
      const age = now - r.timestamp;
      const weight = Math.exp(-age / RECENCY_HALFLIFE_MS);
      return sum + (r.rating * weight);
    }, 0);
    
    averageRating = totalWeight > 0 ? weightedSum / totalWeight : 3.0;
  }
  
  // Calculate variance (simple version for now)
  const ratingVariance = userRatings.length > 1
    ? userRatings.reduce((sum, r) => sum + Math.pow(r.rating - averageRating, 2), 0) / userRatings.length
    : 0;

  return {
    favoriteGenres,
    preferredMediaTypes,
    averageRating,
    ratingVariance,
    notInterestedIds: new Set(notInterested.map(item => `${item.mediaType}:${item.id}`))
  };
}

/**
 * Scores a potential recommendation based on user preferences and ratings
 */
export function scoreRecommendation(
  item: CardData,
  preferences: UserPreferences,
  tmdbData?: any // Additional TMDB data for the item
): RecommendationScore {
  let score = 0;
  const reasons: string[] = [];

  // Base score from TMDB popularity/rating
  if (tmdbData?.vote_average) {
    const tmdbScore = tmdbData.vote_average / 10; // Normalize to 0-1
    score += tmdbScore * 0.25; // 25% weight to TMDB rating
    reasons.push(`High TMDB rating (${tmdbData.vote_average}/10)`);
  }

  if (tmdbData?.popularity) {
    // Cap popularity influence to prevent overweighting blockbusters
    const rawPopularity = Math.min(tmdbData.popularity / 100, 1);
    const cappedPopularity = Math.min(rawPopularity, 0.7); // Cap at 70% of max
    score += cappedPopularity * 0.12; // Reduced from 15% to 12% weight
    reasons.push(`Popular content`);
    
    // Variety boost: slightly boost less popular items to encourage diversity
    if (rawPopularity < 0.5) {
      score += 0.05; // Small boost for niche content
      reasons.push(`Niche favorite`);
    }
  }

  // Media type preference based on user's rated content
  const mediaTypePreference = preferences.preferredMediaTypes[item.kind];
  score += mediaTypePreference * 0.15; // 15% weight to media type preference
  if (mediaTypePreference > 0.6) {
    reasons.push(`Matches your ${item.kind} preference`);
  }

  // Enhanced genre preferences based on user ratings (with validation)
  if (tmdbData?.genre_ids && Array.isArray(tmdbData.genre_ids)) {
    let genreScore = 0;
    let matchingGenres = 0;
    
    tmdbData.genre_ids.forEach((genreId: any) => {
      // Validate genre ID before using
      const validGenreId = typeof genreId === 'number' && genreId > 0 ? genreId : null;
      if (validGenreId && preferences.favoriteGenres[validGenreId]) {
        genreScore += preferences.favoriteGenres[validGenreId];
        matchingGenres++;
      }
    });
    
    if (matchingGenres > 0) {
      const avgGenreScore = genreScore / matchingGenres;
      score += avgGenreScore * 0.25; // 25% weight to genre preferences
      reasons.push(`Matches ${matchingGenres} favorite genre${matchingGenres > 1 ? 's' : ''}`);
    }
  }

  // User rating compatibility bonus
  // If user tends to rate highly, boost items with high TMDB ratings
  if (preferences.averageRating > 3.5 && tmdbData?.vote_average > 7.0) {
    const ratingBonus = (preferences.averageRating - 3.0) * 0.1; // Up to 0.2 bonus
    score += ratingBonus;
    reasons.push(`Matches your high-rating preference`);
  }

  // Penalty for not interested items
  const itemKey = `${item.kind}:${item.id}`;
  if (preferences.notInterestedIds.has(itemKey)) {
    score = 0;
    reasons.push('Marked as not interested');
  }

  // Bonus for content similar to highly-rated items
  // This would require more complex similarity analysis

  return {
    item,
    score: Math.max(0, Math.min(1, score)), // Clamp to 0-1
    reasons
  };
}

/**
 * Gets smart recommendations based on user preferences
 */
// User-specific recommendation cache (prevents multi-audience contamination)
const recommendationCache = new Map<string, { 
  recommendations: RecommendationScore[]; 
  timestamp: number; 
  userId: string;
  preferencesHash: string;
}>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function hashPreferences(prefs: UserPreferences): string {
  return JSON.stringify({
    avgRating: Math.round(prefs.averageRating * 100) / 100,
    genres: Object.keys(prefs.favoriteGenres).sort().join(','),
    mediaTypes: `${prefs.preferredMediaTypes.movie.toFixed(2)}:${prefs.preferredMediaTypes.tv.toFixed(2)}`
  });
}

export async function getSmartRecommendations(
  preferences: UserPreferences,
  limit: number = 20,
  tmdbApi: (path: string, params?: any) => Promise<any> = () => Promise.resolve({}),
  userId: string = 'anonymous'
): Promise<RecommendationScore[]> {
  // Check cache (user-specific)
  const prefsHash = hashPreferences(preferences);
  const cacheKey = `${userId}:${prefsHash}`;
  const cached = recommendationCache.get(cacheKey);
  const now = Date.now();
  
  if (cached && cached.userId === userId && (now - cached.timestamp) < CACHE_TTL_MS) {
    return cached.recommendations;
  }
  try {
    // Fetch candidate content from TMDB
    const [trendingData, popularMoviesData, popularTvData] = await Promise.all([
      tmdbApi('/trending/all/week', { page: 1 }),
      tmdbApi('/movie/popular', { page: 1 }),
      tmdbApi('/tv/popular', { page: 1 })
    ]);

    // Combine all candidate items and deduplicate
    const candidatesMap = new Map<string, any>();
    
    // Add trending items
    if (trendingData?.results) {
      trendingData.results.forEach((item: any) => {
        const key = `${item.media_type || 'movie'}-${item.id}`;
        if (!candidatesMap.has(key)) {
          candidatesMap.set(key, { ...item, media_type: item.media_type || 'movie' });
        }
      });
    }
    
    // Add popular movies (only if not already in trending)
    if (popularMoviesData?.results) {
      popularMoviesData.results.forEach((item: any) => {
        const key = `movie-${item.id}`;
        if (!candidatesMap.has(key)) {
          candidatesMap.set(key, { ...item, media_type: 'movie' });
        }
      });
    }
    
    // Add popular TV shows (only if not already in trending)
    if (popularTvData?.results) {
      popularTvData.results.forEach((item: any) => {
        const key = `tv-${item.id}`;
        if (!candidatesMap.has(key)) {
          candidatesMap.set(key, { ...item, media_type: 'tv' });
        }
      });
    }
    
    const candidates = Array.from(candidatesMap.values());

    // Convert to CardData format and score each item
    const scoredItems: RecommendationScore[] = [];
    
    for (const candidate of candidates) {
      if (!candidate.poster_path) continue; // Skip items without posters
      
      // Ensure title is properly extracted and validated
      const rawTitle = candidate.title || candidate.name;
      const safeTitle = (() => {
        if (typeof rawTitle === 'string' && rawTitle.trim() && rawTitle !== String(candidate.id)) {
          return rawTitle.trim();
        }
        return 'Untitled';
      })();
      
      // Extract year from release_date or first_air_date
      const date = candidate.release_date || candidate.first_air_date;
      const year = date ? parseInt(String(date).slice(0, 4)) : undefined;
      
      const cardData: CardData = {
        id: String(candidate.id),
        kind: candidate.media_type as 'movie' | 'tv',
        title: safeTitle,
        poster: candidate.poster_path ? `https://image.tmdb.org/t/p/w342${candidate.poster_path}` : '',
        year
      };

      const score = scoreRecommendation(cardData, preferences, candidate);
      
      // Only include items with reasonable scores
      if (score.score > 0.1) {
        scoredItems.push(score);
      }
    }

    // Sort by score (highest first) and return top results
    scoredItems.sort((a, b) => b.score - a.score);
    
    const results = scoredItems.slice(0, limit);
    
    // Cache results (user-specific)
    recommendationCache.set(cacheKey, {
      recommendations: results,
      timestamp: now,
      userId,
      preferencesHash: prefsHash
    });
    
    // Clean up old cache entries
    for (const [key, value] of recommendationCache.entries()) {
      if (value.userId !== userId || (now - value.timestamp) >= CACHE_TTL_MS) {
        recommendationCache.delete(key);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Failed to get smart recommendations:', error);
    return [];
  }
}

/**
 * Analyzes genre preferences from TMDB data
 */
export async function analyzeGenrePreferences(
  items: LibraryEntry[],
  tmdbApi: (path: string, params?: any) => Promise<any>,
  timeoutMs: number = 10000 // 10 second timeout
): Promise<Record<number, number>> {
  const genreCounts: Record<number, number> = {};
  const genreRatings: Record<number, number[]> = {};
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Fetch genre data for each item (with timeout protection)
  for (const item of items) {
    try {
      // Check if aborted
      if (controller.signal.aborted) {
        // Silent timeout (expected behavior)
        break;
      }
      
      const path = item.mediaType === 'movie' ? `/movie/${item.id}` : `/tv/${item.id}`;
      const data = await tmdbApi(path);
      
      if (data?.genres && Array.isArray(data.genres)) {
        data.genres.forEach((genre: any) => {
          // Validate genre ID (must be positive integer)
          const genreId = typeof genre.id === 'number' && genre.id > 0 ? genre.id : null;
          if (!genreId) {
            // Silent skip for invalid genres (data quality issue, not an error)
            return; // Skip invalid genres
          }
          
          genreCounts[genreId] = (genreCounts[genreId] || 0) + 1;
          
          // Only include ratings that are valid (1-5, not null/undefined)
          if (item.userRating !== undefined && item.userRating !== null && 
              item.userRating >= 1 && item.userRating <= 5) {
            if (!genreRatings[genreId]) genreRatings[genreId] = [];
            genreRatings[genreId].push(item.userRating);
          }
        });
      }
    } catch (error) {
      if (controller.signal.aborted) {
        // Silent abort on timeout (expected behavior)
        break;
      }
      // Only log unexpected errors (not network timeouts or aborts)
      if (error instanceof Error && !error.message.includes('abort') && !error.message.includes('timeout')) {
        console.warn(`Failed to fetch genre data for ${item.mediaType}:${item.id}`, error);
      }
    }
  }
  
  // Clear timeout
  clearTimeout(timeoutId);

  // Calculate preference scores
  const preferences: Record<number, number> = {};
  
  Object.keys(genreCounts).forEach(genreIdStr => {
    const genreId = parseInt(genreIdStr);
    const count = genreCounts[genreId];
    const ratings = genreRatings[genreId] || [];
    
    // Base score on frequency
    let score = count / items.length;
    
    // Boost score if user rates this genre highly
    if (ratings.length > 0) {
      const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      const ratingBoost = (avgRating - 3) / 2; // Convert 1-5 scale to -1 to +1 boost
      score += ratingBoost * 0.3; // 30% weight to rating boost
    }
    
    preferences[genreId] = Math.max(0, Math.min(1, score));
  });

  return preferences;
}
