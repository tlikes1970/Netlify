/** Stable persisted values and the confirmed legacy alias. */
export const WATCH_STATUS_LABELS = {
  watching: 'Watching', wishlist: 'Want to Watch', watched: 'Watched', not: 'Not Interested',
} as const;
export type WatchStatus = keyof typeof WATCH_STATUS_LABELS;
export function normalizeWatchStatus(value: unknown): WatchStatus | null {
  if (value === 'want') return 'wishlist';
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(WATCH_STATUS_LABELS, value)
    ? value as WatchStatus : null;
}
