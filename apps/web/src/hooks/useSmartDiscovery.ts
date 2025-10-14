import { useQuery } from '@tanstack/react-query';
import { useLibrary } from '../lib/storage';
import { analyzeUserPreferences, analyzeGenrePreferences, getSmartRecommendations, UserPreferences, RecommendationScore } from '../lib/smartDiscovery';
import { get } from '../lib/tmdb';

export function useSmartDiscovery() {
  const watching = useLibrary('watching');
  const wishlist = useLibrary('wishlist');
  const watched = useLibrary('watched');
  
  // Get not interested items (we'll need to implement this)
  const notInterested: any[] = []; // TODO: implement not interested list

  return useQuery({
    queryKey: ['smart-discovery', watching.length, wishlist.length, watched.length],
    queryFn: async (): Promise<RecommendationScore[]> => {
      // Analyze user preferences
      const preferences = analyzeUserPreferences(watching, wishlist, watched, notInterested);
      
      // Get genre preferences from TMDB data
      const genrePreferences = await analyzeGenrePreferences(
        [...watching, ...wishlist, ...watched],
        get
      );
      
      // Update preferences with genre data
      preferences.favoriteGenres = genrePreferences;
      
      // Get smart recommendations
      return await getSmartRecommendations(preferences, 20, get);
    },
    enabled: watching.length > 0 || wishlist.length > 0 || watched.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUserPreferences() {
  const watching = useLibrary('watching');
  const wishlist = useLibrary('wishlist');
  const watched = useLibrary('watched');
  
  return useQuery({
    queryKey: ['user-preferences', watching.length, wishlist.length, watched.length],
    queryFn: async (): Promise<UserPreferences> => {
      const preferences = analyzeUserPreferences(watching, wishlist, watched);
      
      // Get detailed genre preferences
      const genrePreferences = await analyzeGenrePreferences(
        [...watching, ...wishlist, ...watched],
        get
      );
      
      preferences.favoriteGenres = genrePreferences;
      
      return preferences;
    },
    enabled: watching.length > 0 || wishlist.length > 0 || watched.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
