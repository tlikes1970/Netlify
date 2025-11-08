import { useEffect, useMemo, useState, useRef } from 'react';
import { Library, type LibraryEntry } from '@/lib/storage';
import { getDisplayAirDate, getNextAirDate, isReturning, RETURNING_STATUS } from '@/lib/constants/metadata';

export interface ReturningShow extends LibraryEntry {
  displayAirDate: string; // formatted date or 'TBA'
}

/**
 * Provides the computed "Returning" smart view across the user's library.
 * - Filters TV shows with status === "Returning Series"
 * - Sorts dated ascending, then undated alphabetically by title
 * - Returns derived display field for date/TBA
 */
export function useReturningShows(): ReturningShow[] {
  const [version, setVersion] = useState(0);
  const prevReturningRef = useRef<string>(''); // Track previous returning shows IDs

  useEffect(() => {
    const unsub = Library.subscribe(() => {
      // Only update version if returning shows actually changed
      const all = Library.getAll();
      const onlyReturning = all.filter(x => x.mediaType === 'tv' && isReturning(x));
      const currentReturningIds = onlyReturning.map(x => `${x.mediaType}:${x.id}`).sort().join(',');
      
      if (currentReturningIds !== prevReturningRef.current) {
        prevReturningRef.current = currentReturningIds;
        setVersion(v => v + 1);
      }
    });
    return () => { unsub(); };
  }, []);

  const all = useMemo(() => Library.getAll(), [version]);

  const returning = useMemo(() => {
    const onlyReturning = all.filter(x => x.mediaType === 'tv' && isReturning(x));

    const withDerived: ReturningShow[] = onlyReturning.map(x => ({
      ...x,
      displayAirDate: getDisplayAirDate(x)
    }));

    const sorted = [...withDerived].sort((a, b) => {
      const ad = getNextAirDate(a);
      const bd = getNextAirDate(b);
      if (ad && bd) return ad.getTime() - bd.getTime();
      if (ad && !bd) return -1;
      if (!ad && bd) return 1;
      return (a.title || '').localeCompare(b.title || '');
    });

    return sorted;
  }, [all]);

  return returning;
}

export { RETURNING_STATUS };


