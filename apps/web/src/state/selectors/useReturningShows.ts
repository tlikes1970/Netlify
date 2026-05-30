import { useMemo } from 'react';
import { useLibrary } from '@/lib/storage';
import {
  buildUpNextShows,
  type UpNextShow,
} from '@/lib/upNextShows';
import { RETURNING_STATUS } from '@/lib/constants/metadata';

export type ReturningShow = UpNextShow;

/**
 * Reactive Up Next / Returning dataset from the Watching list.
 * Used by Home (capped) and Returning tab (full list).
 */
export function useReturningShows(): ReturningShow[] {
  const watching = useLibrary('watching');
  return useMemo(() => buildUpNextShows(watching), [watching]);
}

export { RETURNING_STATUS };
