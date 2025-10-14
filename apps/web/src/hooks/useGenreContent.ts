import { useQuery } from '@tanstack/react-query';
import { fetchGenreContent, CardData } from '@/lib/tmdb';
import { useSettings, getPersonalityText } from '@/lib/settings';
import { ForYouRow } from '@/components/GenreRowConfig';

export function useGenreContent(mainGenre: string, subGenre: string) {
  const settings = useSettings();
  
  return useQuery<CardData[]>({ 
    queryKey: ['tmdb', 'genre', mainGenre, subGenre], 
    queryFn: () => fetchGenreContent(mainGenre, subGenre),
    staleTime: 300_000, // 5 minutes
    enabled: !!(mainGenre && subGenre),
    retry: (failureCount, error) => {
      console.error(`TMDB ${mainGenre}/${subGenre} error:`, error);
      return failureCount < 2;
    },
    // onError removed - not supported in newer React Query versions
  });
}

export function useForYouContent(forYouRows: ForYouRow[]) {
  const queries = forYouRows.map(row => 
    useGenreContent(row.mainGenre, row.subGenre)
  );
  
  return queries.map((query, index) => ({
    ...query,
    rowId: forYouRows[index]?.id,
    title: forYouRows[index]?.title || `${forYouRows[index]?.mainGenre}/${forYouRows[index]?.subGenre}`
  }));
}

