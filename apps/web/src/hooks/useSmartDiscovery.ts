import { useState, useEffect, useMemo } from 'react';
import { Library } from '@/lib/storage';
import { getSmartRecommendations, analyzeUserPreferences, analyzeGenrePreferences } from '@/lib/smartDiscovery';
import { get } from '@/lib/tmdb';
import { customListManager } from '@/lib/customLists';
import type { RecommendationScore } from '@/lib/smartDiscovery';

/**
 * Process: Smart Discovery Hook
 * Purpose: Provides personalized movie/TV recommendations based on user's library and ratings
 * Data Source: User's watching/wishlist/watched lists with ratings, TMDB trending/popular content
 * Update Path: Updates when user adds/rates content or when library changes
 * Dependencies: Library storage, TMDB API, smart discovery algorithms
 */
export function useSmartDiscovery() {
  const [recommendations, setRecommendations] = useState<RecommendationScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user's library data
  const watching = Library.getByList('watching');
  const wishlist = Library.getByList('wishlist');
  const watched = Library.getByList('watched');
  const notInterested = Library.getByList('not');

  // Analyze user preferences including ratings
  const userPreferences = useMemo(() => {
    return analyzeUserPreferences(watching, wishlist, watched, notInterested);
  }, [watching, wishlist, watched, notInterested]);

  // Enhanced genre analysis with ratings
  const genrePreferences = useMemo(async () => {
    if (watching.length + wishlist.length + watched.length === 0) {
      return {};
    }
    
    const allItems = [...watching, ...wishlist, ...watched];
    return await analyzeGenrePreferences(allItems, get);
  }, [watching, wishlist, watched]);

  // Fetch smart recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get enhanced preferences with genre analysis
        const enhancedPreferences = {
          ...userPreferences,
          favoriteGenres: await genrePreferences
        };

        // Fetch smart recommendations
        const recs = await getSmartRecommendations(enhancedPreferences, 20, get);
        
        // Filter out items already in user's library (including custom lists)
        // Get all items from all lists to ensure no duplicates across any tab
        const allExistingItems = [
          ...Library.getByList('watching'),
          ...Library.getByList('wishlist'), 
          ...Library.getByList('watched'),
          ...Library.getByList('not')
        ];
        
        // Add custom list items dynamically
        const userLists = customListManager.getUserLists();
        userLists.customLists.forEach(customList => {
          const customListName = `custom:${customList.id}` as any;
          allExistingItems.push(...Library.getByList(customListName));
        });
        
        const existingIds = new Set(
          allExistingItems.map(item => `${item.mediaType}:${item.id}`)
        );

        const filteredRecs = recs.filter(rec => {
          const itemKey = `${rec.item.kind}:${rec.item.id}`;
          return !existingIds.has(itemKey);
        });

        setRecommendations(filteredRecs);
      } catch (err) {
        console.error('Failed to fetch smart recommendations:', err);
        setError('Failed to load recommendations. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [userPreferences, genrePreferences, watching, wishlist, watched, notInterested]);

  return {
    recommendations,
    isLoading,
    error,
    userPreferences
  };
}
