import { useQuery } from '@tanstack/react-query';
import { fetchGenreContent, CardData } from '@/lib/tmdb';
// import { useSettings, getPersonalityText } from '@/lib/settings'; // Unused
import { ForYouRow } from '@/components/GenreRowConfig';
import { Library } from '@/lib/storage';
import { useState, useEffect, useRef } from 'react';

export function useGenreContent(mainGenre: string, subGenre: string) {
  // const settings = useSettings(); // Unused
  
  return useQuery<CardData[]>({ 
    queryKey: ['tmdb', 'genre', mainGenre, subGenre], 
    queryFn: () => {
      console.log(`🎬 useGenreContent: Fetching ${mainGenre}/${subGenre}`);
      return fetchGenreContent(mainGenre, subGenre);
    },
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
  console.log('🎬 useForYouContent: Processing rows:', forYouRows);
  
  // State to trigger re-renders when library changes
  const [libraryVersion, setLibraryVersion] = useState(0);
  const prevLibrarySizeRef = useRef(Library.getAll().length);
  
  // Subscribe to library changes - only update if library size actually changed
  // This prevents unnecessary re-renders when library updates don't affect filtering
  useEffect(() => {
    const unsubscribe = Library.subscribe(() => {
      const currentSize = Library.getAll().length;
      // Only update if library size changed (items added/removed)
      // This is a simple heuristic - could be improved to check specific items
      if (currentSize !== prevLibrarySizeRef.current) {
        console.log('🔄 Library changed, updating For You filtering');
        prevLibrarySizeRef.current = currentSize;
        setLibraryVersion(prev => prev + 1);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);
  
  const queries = forYouRows.map(row => 
    useGenreContent(row.mainGenre, row.subGenre)
  );
  
  return queries.map((query, index) => {
    // Filter out items that are already in the library
    const filteredData = query.data?.filter(item => {
      const isInLibrary = Library.has(item.id, item.kind);
      
      if (isInLibrary) {
        console.log(`🚫 Filtering out ${item.title} (already in library)`);
      }
      
      return !isInLibrary;
    }) || [];
    
    const result = {
      ...query,
      data: filteredData,
      rowId: forYouRows[index]?.id,
      title: forYouRows[index]?.title || `${forYouRows[index]?.mainGenre}/${forYouRows[index]?.subGenre}`
    };
    
    console.log(`🎬 useForYouContent: Row ${index} (${result.title}):`, {
      isLoading: query.isLoading,
      isError: query.isError,
      originalDataLength: query.data?.length || 0,
      filteredDataLength: filteredData.length,
      libraryVersion,
      error: query.error
    });
    
    return result;
  });
}

