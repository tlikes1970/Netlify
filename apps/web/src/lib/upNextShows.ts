import {
  getDisplayAirDate,
  getHumanizedAirDate,
  getNextAirDate,
  getNextAirStatus,
  getValidatedNextAirDate,
  formatUpNextDate,
  type NextAirStatus,
} from '@/lib/constants/metadata';
import type { LibraryEntry } from '@/lib/storage';
import { getShowStatusInfo } from '@/utils/showStatus';

type UpNextCandidate = {
  nextAirDate?: string | null;
  showStatus?: string | null;
  next_episode_to_air?: { air_date?: string | null } | null;
};

export const HOME_UP_NEXT_LIMIT = 12;

export interface UpNextShow extends LibraryEntry {
  displayAirDate: string;
}

function statusPriority(status: string | null | undefined): number {
  switch (status) {
    case 'Returning Series':
      return 1;
    case 'In Production':
      return 2;
    case 'Planned':
      return 3;
    default:
      return 4;
  }
}

/**
 * Shared Up Next / Returning dataset from the Watching list.
 * Dated items first (soonest first), then undated upcoming shows.
 */
export function buildUpNextShows(watching: LibraryEntry[]): UpNextShow[] {
  const activeShows = watching.filter((item) => {
    if (item.mediaType !== 'tv') return false;
    const statusInfo = getShowStatusInfo(item.showStatus);
    return !statusInfo?.isCompleted;
  });

  const withMeta = activeShows.map((show) => {
    const rawDate = getNextAirDate(show);
    const validatedDate = getValidatedNextAirDate(rawDate);
    const airStatus = getNextAirStatus(rawDate);
    return { show, validatedDate, airStatus };
  });

  const dated = withMeta
    .filter(
      ({ validatedDate, airStatus }) =>
        validatedDate !== null && airStatus !== 'tba'
    )
    .sort((a, b) => {
      if (a.airStatus === 'soon' && b.airStatus !== 'soon') return -1;
      if (a.airStatus !== 'soon' && b.airStatus === 'soon') return 1;
      if (a.validatedDate && b.validatedDate) {
        return a.validatedDate.getTime() - b.validatedDate.getTime();
      }
      return (a.show.title || '').localeCompare(b.show.title || '');
    })
    .map(({ show }) => ({
      ...show,
      displayAirDate: getDisplayAirDate(show),
    }));

  const undated = withMeta
    .filter(({ validatedDate }) => validatedDate === null)
    .map(({ show }) => show)
    .sort((a, b) => {
      const byStatus = statusPriority(a.showStatus) - statusPriority(b.showStatus);
      if (byStatus !== 0) return byStatus;
      return (a.title || '').localeCompare(b.title || '');
    })
    .map((show) => ({
      ...show,
      displayAirDate: getDisplayAirDate(show),
    }));

  return [...dated, ...undated];
}

/** Human-readable Up Next line for cards (validated dates only). */
export function getUpNextLabel(show: UpNextCandidate): string {
  const rawDate = getNextAirDate(show);
  const validatedDate = getValidatedNextAirDate(rawDate);
  const airStatus: NextAirStatus = getNextAirStatus(rawDate);

  if (validatedDate && airStatus !== 'tba') {
    if (airStatus === 'soon') {
      return `Up Next: ${getHumanizedAirDate(rawDate)}`;
    }
    return `Up Next: ${formatUpNextDate(rawDate)}`;
  }

  switch (show.showStatus) {
    case 'Returning Series':
      return 'Returning Soon';
    case 'In Production':
      return 'In Production';
    case 'Planned':
      return 'Date TBA';
    default:
      return 'Date TBA';
  }
}
