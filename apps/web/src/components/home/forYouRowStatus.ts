/** Inputs needed to decide For You row UI state (loading / error / idle). */
export type ForYouRowStatusInput = {
  data: unknown[];
  rawData?: unknown[];
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  isSuccess: boolean;
};

export type ForYouRowLoadState = 'loading' | 'error' | 'idle';

/**
 * Derive row load state for For You rails.
 * - idle: show cards (or legitimately empty after success/cache)
 * - loading: lite skeletons
 * - error: compact fallback + retry (no cache to show)
 */
export function getForYouRowLoadState(row: ForYouRowStatusInput): ForYouRowLoadState {
  if (row.data.length > 0) {
    return 'idle';
  }

  if ((row.rawData?.length ?? 0) > 0) {
    return 'idle';
  }

  if (row.isSuccess) {
    return 'idle';
  }

  if (row.isError) {
    return 'error';
  }

  if (row.isPending || row.isFetching) {
    return 'loading';
  }

  return 'idle';
}

export function isForYouRowLoading(row: ForYouRowStatusInput): boolean {
  return getForYouRowLoadState(row) === 'loading';
}

export function isForYouRowError(row: ForYouRowStatusInput): boolean {
  return getForYouRowLoadState(row) === 'error';
}
