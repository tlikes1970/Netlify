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
  return parseAirDateIso(iso);
}

/** Parse TMDB-style ISO date strings without local timezone drift. */
export function parseAirDateIso(iso: string): Date | null {
  if (!iso) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [year, month, day] = iso.split('-').map(Number);
    const utc = new Date(Date.UTC(year, month - 1, day));
    return isNaN(+utc) ? null : utc;
  }
  const parsed = new Date(iso);
  return isNaN(+parsed) ? null : parsed;
}

/**
 * Validates and normalizes a next-air date.
 * Returns null if date is invalid, in the past, or too far in the future (>365 days).
 */
export function getValidatedNextAirDate(date: Date | null | undefined): Date | null {
  if (!date) return null;

  const today = new Date();
  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const dateUtc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );

  // Reject past dates
  if (dateUtc < todayUtc) return null;

  // Reject dates more than 365 days in the future (treat as TBA)
  const daysDiff = Math.round((dateUtc - todayUtc) / (24 * 60 * 60 * 1000));
  if (daysDiff > 365) return null;

  return new Date(dateUtc);
}

/**
 * Returns the status of a next-air date: "soon", "future", or "tba"
 */
export type NextAirStatus = 'soon' | 'future' | 'tba';

export function getNextAirStatus(nextAirDate: Date | null | undefined): NextAirStatus {
  if (!nextAirDate) return 'tba';

  const validated = getValidatedNextAirDate(nextAirDate);
  if (!validated) return 'tba';

  const today = new Date();
  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const daysDiff = Math.round((validated.getTime() - todayUtc) / (24 * 60 * 60 * 1000));

  if (daysDiff <= RETURNING_NEAR_WINDOW_DAYS) {
    return 'soon';
  }

  return 'future';
}

export function isReturning(show: PossibleShow | null | undefined): boolean {
  if (!show) return false;
  const status = (show.showStatus || show.status || '').trim();
  return status === RETURNING_STATUS;
}

export function diffInDays(a: Date, b: Date): number {
  const MS = 24 * 60 * 60 * 1000;
  const at = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const bt = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((at - bt) / MS);
}

export function isWithinWindow(d: Date | null | undefined, days: number = RETURNING_NEAR_WINDOW_DAYS): boolean {
  if (!d) return false;
  const today = new Date();
  return Math.abs(diffInDays(d, today)) <= days;
}

export function getDisplayAirDate(show: PossibleShow | null | undefined): string {
  const d = getNextAirDate(show);
  const validated = getValidatedNextAirDate(d);
  if (!validated) return 'TBA';
  try {
    return validated.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return 'TBA';
  }
}

/**
 * Formats a date for display in UpNextCard (no year, short format)
 */
export function formatUpNextDate(date: Date | null | undefined): string {
  const validated = getValidatedNextAirDate(date);
  if (!validated) return 'TBA';
  try {
    // Parse as UTC to avoid timezone issues
    const isoString = validated.toISOString().split('T')[0];
    const utcDate = new Date(isoString + 'T00:00:00Z');
    return utcDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      timeZone: 'UTC'
    });
  } catch {
    return 'TBA';
  }
}

/**
 * Returns humanized relative date (e.g., "Tomorrow", "In 3 days") or formatted date
 */
export function getHumanizedAirDate(date: Date | null | undefined): string {
  const validated = getValidatedNextAirDate(date);
  if (!validated) return 'TBA';

  const today = new Date();
  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const daysDiff = Math.round((validated.getTime() - todayUtc) / (24 * 60 * 60 * 1000));

  if (daysDiff === 0) return 'Today';
  if (daysDiff === 1) return 'Tomorrow';
  if (daysDiff <= RETURNING_NEAR_WINDOW_DAYS) return `In ${daysDiff} days`;

  return formatUpNextDate(validated);
}


