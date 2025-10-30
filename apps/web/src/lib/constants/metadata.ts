// Constants and helpers for "Returning" smart view

export const RETURNING_STATUS = 'Returning Series';
export const RETURNING_NEAR_WINDOW_DAYS = 14;

type PossibleShow = {
  // App-level fields
  nextAirDate?: string | null;
  showStatus?: string | null;
  title?: string;
  // TMDB-style nested fields (if present in any fetched detail attached to item)
  status?: string | null;
  next_episode_to_air?: { air_date?: string | null } | null;
};

export function getNextAirDate(show: PossibleShow | null | undefined): Date | null {
  if (!show) return null;
  const iso = show.nextAirDate || show.next_episode_to_air?.air_date || null;
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(+d) ? null : d;
}

export function isReturning(show: PossibleShow | null | undefined): boolean {
  if (!show) return false;
  const status = (show.showStatus || show.status || '').trim();
  return status === RETURNING_STATUS;
}

export function diffInDays(a: Date, b: Date): number {
  const MS = 24 * 60 * 60 * 1000;
  const at = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bt = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((at - bt) / MS);
}

export function isWithinWindow(d: Date | null | undefined, days: number = RETURNING_NEAR_WINDOW_DAYS): boolean {
  if (!d) return false;
  const today = new Date();
  return Math.abs(diffInDays(d, today)) <= days;
}

export function getDisplayAirDate(show: PossibleShow | null | undefined): string {
  const d = getNextAirDate(show);
  if (!d) return 'TBA';
  try {
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return 'TBA';
  }
}


