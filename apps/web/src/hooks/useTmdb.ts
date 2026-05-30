import { useQuery } from '@tanstack/react-query';
import { trendingForYou, CardData } from '@/lib/tmdb';
// import { useSettings, getPersonalityText } from '@/lib/settings'; // Unused

export function useForYou() {
  // const settings = useSettings(); // Unused
  
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
