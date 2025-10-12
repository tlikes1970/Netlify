import { useQuery } from '@tanstack/react-query';
import { featuredTrendingMovie } from '@/lib/tmdb';
export function useFeatured() {
  return useQuery({ queryKey: ['tmdb','featured'], queryFn: featuredTrendingMovie });
}
