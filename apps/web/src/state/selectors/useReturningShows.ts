import { useMemo } from 'react';
import { useLibrary } from '@/lib/storage';
import {
  buildUpNextShows,
  type UpNextShow,
} from '@/lib/upNextShows';
import { RETURNING_STATUS } from '@/lib/constants/metadata';

export type ReturningShow = UpNextShow;

/**
 * Reactive release-schedule dataset from active and caught-up shows.
 * Used by Home (capped) and Returning tab (full list).
 */
export function useReturningShows(): ReturningShow[] {
  const watching = useLibrary('watching');
  const watched = useLibrary('watched');
  return useMemo(() => buildUpNextShows([...watching, ...watched]), [watching, watched]);
}

export { RETURNING_STATUS };
