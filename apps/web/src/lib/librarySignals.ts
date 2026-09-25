/**
 * Lightweight library counts for Flicklet observation copy (Phase 2).
 */

import { Library } from './storage';

export type LibrarySignals = {
  watchingCount: number;
  wantCount: number;
  watchedCount: number;
  notCount: number;
  totalCount: number;
  ratedCount: number;
  emptyWatching: boolean;
  hugeWantTinyWatching: boolean;
  largeBacklog: boolean;
  heavyWatched: boolean;
  noRatings: boolean;
  tinyLibrary: boolean;
  /** @deprecated Phase 1 signal — not used in Phase 2 selection */
  smallLibrary: boolean;
  /** @deprecated Phase 1 signal — not used in Phase 2 selection */
  singleShowFocus: boolean;
};

function countRatedEntries(): number {
  return Library.getAll().filter(
    (entry) =>
      entry.userRating !== undefined &&
      entry.userRating !== null &&
      entry.userRating >= 1
  ).length;
}

export function getLibrarySignals(): LibrarySignals {
  const watchingCount = Library.getByList('watching').length;
  const wantCount = Library.getByList('wishlist').length;
  const watchedCount = Library.getByList('watched').length;
  const notCount = Library.getByList('not').length;
  const totalCount = Library.getAll().length;
  const ratedCount = countRatedEntries();

  const emptyWatching = watchingCount === 0;
  const hugeWantTinyWatching = wantCount >= 10 && watchingCount <= 2;
  const largeBacklog =
    wantCount >= 10 && wantCount > watchingCount * 2 && wantCount - watchingCount >= 5;
  const heavyWatched = watchedCount >= 25;
  const noRatings = totalCount > 0 && ratedCount <= 2;
  const tinyLibrary = totalCount <= 3;

  return {
    watchingCount,
    wantCount,
    watchedCount,
    notCount,
    totalCount,
    ratedCount,
    emptyWatching,
    hugeWantTinyWatching,
    largeBacklog,
    heavyWatched,
    noRatings,
    tinyLibrary,
    smallLibrary: tinyLibrary,
    singleShowFocus: watchingCount === 1,
  };
}
