import { useEffect, useMemo, useState, useRef } from 'react';
import { Library, type LibraryEntry } from '@/lib/storage';
import { getDisplayAirDate, getNextAirDate, getValidatedNextAirDate, getNextAirStatus, isReturning, RETURNING_STATUS, type NextAirStatus } from '@/lib/constants/metadata';

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
    // Filter to TV shows with "Returning Series" status
    const onlyReturning = all.filter(x => x.mediaType === 'tv' && isReturning(x));

    // Map to include validated dates and status
    const withDerived: (ReturningShow & { validatedDate: Date | null; airStatus: NextAirStatus })[] = onlyReturning.map(x => {
      const rawDate = getNextAirDate(x);
      const validatedDate = getValidatedNextAirDate(rawDate);
      const airStatus = getNextAirStatus(rawDate);
      
      return {
        ...x,
        displayAirDate: getDisplayAirDate(x),
        validatedDate,
        airStatus
      };
    });

    // Filter out shows with no valid date (TBA) - only include shows with confirmed dates
    const withValidDates = withDerived.filter(x => x.airStatus !== 'tba');

    // Sort: soon first, then future, then alphabetical
    const sorted = [...withValidDates].sort((a, b) => {
      // Priority: soon > future
      if (a.airStatus === 'soon' && b.airStatus !== 'soon') return -1;
      if (a.airStatus !== 'soon' && b.airStatus === 'soon') return 1;
      
      // Within same status, sort by date
      if (a.validatedDate && b.validatedDate) {
        return a.validatedDate.getTime() - b.validatedDate.getTime();
      }
      if (a.validatedDate && !b.validatedDate) return -1;
      if (!a.validatedDate && b.validatedDate) return 1;
      
      // Fallback to alphabetical
      return (a.title || '').localeCompare(b.title || '');
    });

    // Remove the temporary fields before returning
    return sorted.map(({ validatedDate, airStatus, ...rest }) => rest);
  }, [all]);

  return returning;
}

export { RETURNING_STATUS };


