import type { LibraryEntry } from '@/lib/storage';

/** YYYY-MM-DD offset from today (UTC calendar day). */
export function isoDaysFromToday(offset: number): string {
  const today = new Date();
  const utc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + offset
  );
  const d = new Date(utc);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function mockWatchingTv(
  overrides: Partial<LibraryEntry> & Pick<LibraryEntry, 'id' | 'title'>
): LibraryEntry {
  return {
    mediaType: 'tv',
    list: 'watching',
    addedAt: Date.now(),
    ...overrides,
  };
}
