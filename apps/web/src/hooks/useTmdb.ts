import { useQuery } from '@tanstack/react-query';
import { trendingForYou, nowPlayingMovies, CardData } from '@/lib/tmdb';
import { useSettings, getPersonalityText } from '@/lib/settings';

export function useForYou() {
  const settings = useSettings();
  
  return useQuery<CardData[]>({ 
    queryKey: ['tmdb','for-you'], 
    queryFn: trendingForYou, 
    staleTime: 60_000,
    retry: (failureCount, error) => {
      console.error('TMDB For You error:', error);
      return failureCount < 3;
    },
    // onError removed - not supported in newer React Query versions
  });
}

export function useInTheaters() {
  const settings = useSettings();
  
  return useQuery<CardData[]>({ 
    queryKey: ['tmdb','in-theaters'], 
    queryFn: nowPlayingMovies, 
    staleTime: 60_000,
    retry: (failureCount, error) => {
      console.error('TMDB In Theaters error:', error);
      return failureCount < 3;
    },
    // onError removed - not supported in newer React Query versions
  });
}
