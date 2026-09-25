import { useQuery } from '@tanstack/react-query';
import { fetchGenreContent, CardData } from '@/lib/tmdb';
// import { useSettings, getPersonalityText } from '@/lib/settings'; // Unused
import { ForYouRow } from '@/components/GenreRowConfig';
import { Library } from '@/lib/storage';
import { buildLibraryMembershipSignature } from '@/lib/smartDiscovery';
import { useState, useEffect, useRef } from 'react';

function libraryMembershipSignature(): string {
  return buildLibraryMembershipSignature(Library.getAll());
}

export type ForYouContentRow = {
  data: CardData[];
  rawData: CardData[] | undefined;
  rowId?: string;
  title: string;
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => Promise<unknown>;
};

export function useGenreContent(
  mainGenre: string,
  subGenre: string,
  options?: { fetchEnabled?: boolean }
) {
  const fetchEnabled = options?.fetchEnabled !== false;

  return useQuery<CardData[]>({
    queryKey: ['tmdb', 'genre', mainGenre, subGenre],
    queryFn: async () => fetchGenreContent(mainGenre, subGenre),
    staleTime: 300_000, // 5 minutes
    enabled: fetchEnabled && !!(mainGenre && subGenre),
    retry: (failureCount) => failureCount < 2,
    networkMode: 'offlineFirst',
  });
}
export function useForYouContent(
  forYouRows: ForYouRow[],
  options?: { fetchEnabled?: boolean }
) {
  const fetchEnabled = options?.fetchEnabled !== false;
  
  // State to trigger re-renders when library changes
  const [libraryVersion, setLibraryVersion] = useState(0);
  const prevMembershipRef = useRef(libraryMembershipSignature());

  // Re-filter rails on list moves / not-interested — not on rating-only metadata
  useEffect(() => {
    const unsubscribe = Library.subscribe(() => {
      const signature = libraryMembershipSignature();
      if (signature !== prevMembershipRef.current) {
        prevMembershipRef.current = signature;
        setLibraryVersion((prev) => prev + 1);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);
  
  const queries = forYouRows.map((row) =>
    useGenreContent(row.mainGenre, row.subGenre, { fetchEnabled })
  );
  
  return queries.map((query, index) => {
    // libraryVersion forces re-filter after membership changes (no TMDB refetch)
    void libraryVersion;

    const rawData = query.data;

    // Filter out items that are already in the library
    const filteredData =
      rawData?.filter((item) => !Library.has(item.id, item.kind)) ?? [];

    const row = forYouRows[index];
    return {
      data: filteredData,
      rawData,
      rowId: row?.id,
      title: row?.title || `${row?.mainGenre}/${row?.subGenre}`,
      isPending: query.isPending,
      isFetching: query.isFetching,
      isError: query.isError,
      isSuccess: query.isSuccess,
      refetch: query.refetch,
    };
  });
}
