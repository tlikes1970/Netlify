import { useState, useEffect, useMemo, useRef } from 'react';
import { authManager } from '@/lib/auth';
import { Library } from '@/lib/storage';
import { getSmartRecommendations, analyzeUserPreferences, analyzeGenrePreferences } from '@/lib/smartDiscovery';
import { get } from '@/lib/tmdb';
import { customListManager } from '@/lib/customLists';
import { useSettings } from '@/lib/settings';
import type { RecommendationScore } from '@/lib/smartDiscovery';

/**
 * Process: Smart Discovery Hook
 * Purpose: Provides personalized movie/TV recommendations based on user's library and ratings
 * Data Source: User's watching/wishlist/watched lists with ratings, TMDB trending/popular content
 * Update Path: Updates when user adds/rates content or when library changes
 * Dependencies: Library storage, TMDB API, smart discovery algorithms
 */
// Track recent rating changes for deduplication
const recentRatingChanges = new Map<string, { timestamp: number; rating: number }>();
const RATING_DEDUP_WINDOW_MS = 300; // 300ms window

export function useSmartDiscovery() {
  const [recommendations, setRecommendations] = useState<RecommendationScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_ratingVersion, setRatingVersion] = useState(0);
  const lastUpdateRef = useRef<{ itemKey: string; rating: number; timestamp: number } | null>(null);
  const isFetchingRef = useRef(false);
  const lastLibraryHashRef = useRef<string>('');
  const settings = useSettings();

  // Get user's library data - include ratings in the data
  const watching = Library.getByList('watching');
  const wishlist = Library.getByList('wishlist');
  const watched = Library.getByList('watched');
  const notInterested = Library.getByList('not');
  
  // Create stable hash of library contents to detect actual changes
  const libraryHash = useMemo(() => {
    const allItems = [...watching, ...wishlist, ...watched, ...notInterested];
    return JSON.stringify({
      count: allItems.length,
      ratings: allItems
        .filter(item => item.userRating !== undefined)
        .map(item => `${item.id}:${item.mediaType}:${item.userRating}`)
        .sort()
        .join(',')
    });
  }, [watching, wishlist, watched, notInterested]);
  
  // Listen for rating changes to trigger discovery refresh (with deduplication and origin tracking)
  useEffect(() => {
    const handleLibraryChange = (e: CustomEvent) => {
      const detail = e.detail || {};
      
      // Ignore events that came from discovery itself (prevent circular updates)
      if (detail.origin === 'discovery') {
        return; // Ignore our own updates
      }
      
      // Only process rating changes
      if (detail.operation === 'rating') {
        const itemKey = detail.itemId && detail.mediaType 
          ? `${detail.mediaType}:${detail.itemId}` 
          : null;
        const rating = detail.rating;
        const timestamp = Date.now();
        
        if (!itemKey || rating === undefined) return;
        
        // Check for duplicate (same item, same rating, within window)
        const recent = recentRatingChanges.get(itemKey);
        if (recent && recent.rating === rating) {
          const timeDiff = timestamp - recent.timestamp;
          if (timeDiff < RATING_DEDUP_WINDOW_MS) {
            return; // Duplicate, skip
          }
        }
        
        // Check if this is the same as last update we processed
        if (lastUpdateRef.current?.itemKey === itemKey && 
            lastUpdateRef.current?.rating === rating &&
            timestamp - lastUpdateRef.current.timestamp < RATING_DEDUP_WINDOW_MS) {
          return; // Same update, skip
        }
        
        // Record this update
        recentRatingChanges.set(itemKey, { timestamp, rating });
        lastUpdateRef.current = { itemKey, rating, timestamp };
        
        // Clean up old entries
        const cutoff = Date.now() - RATING_DEDUP_WINDOW_MS;
        for (const [k, v] of recentRatingChanges.entries()) {
          if (v.timestamp < cutoff) {
            recentRatingChanges.delete(k);
          }
        }
        
        // Trigger refresh
        setRatingVersion(prev => prev + 1);
      }
    };
    
    window.addEventListener('library:changed', handleLibraryChange as EventListener);
    return () => {
      window.removeEventListener('library:changed', handleLibraryChange as EventListener);
    };
  }, []);

  // Analyze user preferences including ratings
  // Use libraryHash instead of arrays to prevent unnecessary recalculations
  const userPreferences = useMemo(() => {
    return analyzeUserPreferences(watching, wishlist, watched, notInterested);
  }, [libraryHash]);

  // User-specific cache key (prevents multi-audience contamination)
  const userId = useMemo(() => {
    try {
      const currentUser = authManager.getCurrentUser();
      return currentUser?.uid || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }, []);

  // Enhanced genre analysis with ratings (use state instead of useMemo for async)
  const [genrePreferences, setGenrePreferences] = useState<Record<number, number>>({});
  const lastGenreHashRef = useRef<string>('');
  
  useEffect(() => {
    // Only fetch if library actually changed (not just array reference)
    const genreHash = libraryHash;
    if (genreHash === lastGenreHashRef.current) {
      return; // No change, skip
    }
    lastGenreHashRef.current = genreHash;
    
    const fetchGenrePreferences = async () => {
      if (watching.length + wishlist.length + watched.length === 0) {
        setGenrePreferences({});
        return;
      }
      
      const allItems = [...watching, ...wishlist, ...watched];
      // Limit to first 20 items to prevent blocking (genre analysis is expensive)
      const itemsToAnalyze = allItems.slice(0, 20);
      // Add timeout to prevent hanging (8 second timeout)
      const prefs = await analyzeGenrePreferences(itemsToAnalyze, get, 8000);
      setGenrePreferences(prefs);
    };
    
    fetchGenrePreferences();
  }, [libraryHash, watching, wishlist, watched]);

  // Fetch smart recommendations (with guards to prevent infinite loops)
  useEffect(() => {
    // Guard: prevent concurrent fetches
    if (isFetchingRef.current) {
      return; // Already fetching, skip
    }
    
    // Guard: only fetch if library actually changed
    if (libraryHash === lastLibraryHashRef.current && Object.keys(genrePreferences).length > 0) {
      return; // No change, skip
    }
    lastLibraryHashRef.current = libraryHash;
    
    const fetchRecommendations = async () => {
      isFetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        // Get enhanced preferences with genre analysis (already resolved, no await needed)
        const enhancedPreferences = {
          ...userPreferences,
          favoriteGenres: genrePreferences
        };

        // Fetch smart recommendations using configured limit (cache key includes userId to prevent contamination)
        const discoveryLimit = settings.layout.discoveryLimit || 25;
        const recs = await getSmartRecommendations(enhancedPreferences, discoveryLimit, get, userId);
        
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
        // Only log errors, not every fetch
        if (err instanceof Error && !err.message.includes('aborted')) {
          console.error('Failed to fetch smart recommendations:', err);
        }
        setError('Failed to load recommendations. Please try again.');
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchRecommendations();
  }, [libraryHash, userPreferences, genrePreferences, userId, settings.layout.discoveryLimit]);

  return {
    recommendations,
    isLoading,
    error,
    userPreferences
  };
}
