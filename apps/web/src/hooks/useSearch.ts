import { useQuery } from '@tanstack/react-query';
import { searchMulti } from '@/lib/tmdb';
export function useSearch(query: string) {
  return useQuery({ queryKey: ['tmdb','search', query], queryFn: () => searchMulti(query), enabled: !!query.trim() });
}
