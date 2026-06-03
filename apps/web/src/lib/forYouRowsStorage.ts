/**
 * Versioned, validated local storage for Home "For You" genre rows.
 * Migrates legacy `flicklet:forYouRows` and resets invalid/stale payloads.
 */

import type { ForYouRow } from '@/components/GenreRowConfig';
import { FOR_YOU_AVAILABLE_GENRES } from '@/components/GenreRowConfig';

export const FOR_YOU_ROWS_STORAGE_VERSION = 2;

/** Legacy device-global key (pre-v2). */
export const FOR_YOU_ROWS_LEGACY_KEY = 'flicklet:forYouRows';

const KEY_PREFIX = 'flicklet:forYouRows:v2:';

export const DEFAULT_FOR_YOU_ROWS: ForYouRow[] = [
  { id: '1', mainGenre: 'anime', subGenre: 'shonen', title: 'Anime/Shōnen' },
  { id: '2', mainGenre: 'horror', subGenre: 'psychological', title: 'Horror/Psychological' },
  { id: '3', mainGenre: 'comedy', subGenre: 'romantic', title: 'Comedy/Romantic' },
];

type StoredPayload = {
  version: number;
  rows: ForYouRow[];
};

function storageKey(uid: string | null | undefined): string {
  return `${KEY_PREFIX}${uid ?? 'guest'}`;
}

function isValidRow(row: unknown): row is ForYouRow {
  if (!row || typeof row !== 'object') return false;
  const r = row as ForYouRow;
  if (
    typeof r.id !== 'string' ||
    typeof r.mainGenre !== 'string' ||
    typeof r.subGenre !== 'string' ||
    typeof r.title !== 'string'
  ) {
    return false;
  }
  if (!r.mainGenre.trim() || !r.subGenre.trim()) return false;

  const genre = FOR_YOU_AVAILABLE_GENRES.find((g) => g.id === r.mainGenre);
  if (!genre) return false;
  return genre.subgenres.some((sg) => sg.id === r.subGenre);
}

function normalizeRows(rows: ForYouRow[]): ForYouRow[] | null {
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 3) return null;
  if (!rows.every(isValidRow)) return null;
  return rows.map((row) => ({ ...row }));
}

function parseRaw(raw: string | null): ForYouRow[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return normalizeRows(parsed as ForYouRow[]);
    }
    if (parsed && typeof parsed === 'object' && 'rows' in parsed) {
      const payload = parsed as StoredPayload;
      if (payload.version !== FOR_YOU_ROWS_STORAGE_VERSION) return null;
      return normalizeRows(payload.rows);
    }
  } catch {
    return null;
  }
  return null;
}

function readKey(key: string): ForYouRow[] | null {
  if (typeof localStorage === 'undefined') return null;
  return parseRaw(localStorage.getItem(key));
}

function writeKey(key: string, rows: ForYouRow[]): void {
  if (typeof localStorage === 'undefined') return;
  const payload: StoredPayload = {
    version: FOR_YOU_ROWS_STORAGE_VERSION,
    rows,
  };
  localStorage.setItem(key, JSON.stringify(payload));
}

const GUEST_STORAGE_KEY = storageKey(null);

/**
 * Sign-out cleanup: drop session-only guest rows and legacy orphan key.
 * Per-user `flicklet:forYouRows:v2:{uid}` keys are preserved for re-login.
 */
export function clearForYouRowsOnSignOut(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(FOR_YOU_ROWS_LEGACY_KEY);
  localStorage.removeItem(GUEST_STORAGE_KEY);
}

/** Test helper — removes all For You keys including per-user. */
export function clearAllForYouRowsStorage(): void {
  if (typeof localStorage === 'undefined') return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key === FOR_YOU_ROWS_LEGACY_KEY || key.startsWith(KEY_PREFIX))
    ) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

/**
 * Load rows for the current user (or guest). Invalid/stale data resets to defaults.
 */
export function loadForYouRows(uid: string | null | undefined): ForYouRow[] {
  const key = storageKey(uid);

  const fromScoped = readKey(key);
  if (fromScoped) return fromScoped;

  // One-time import from legacy device-global key (always discard legacy key after read)
  const legacyRaw = localStorage.getItem(FOR_YOU_ROWS_LEGACY_KEY);
  if (legacyRaw !== null) {
    const fromLegacy = parseRaw(legacyRaw);
    localStorage.removeItem(FOR_YOU_ROWS_LEGACY_KEY);
    if (fromLegacy) {
      writeKey(key, fromLegacy);
      return fromLegacy;
    }
  }

  writeKey(key, DEFAULT_FOR_YOU_ROWS);
  return DEFAULT_FOR_YOU_ROWS.map((row) => ({ ...row }));
}

export function saveForYouRows(
  rows: ForYouRow[],
  uid: string | null | undefined
): ForYouRow[] {
  const normalized = normalizeRows(rows);
  const validOnly = rows.filter(isValidRow).map((r) => ({ ...r }));
  const toSave =
    normalized ??
    (validOnly.length > 0
      ? validOnly
      : DEFAULT_FOR_YOU_ROWS.map((r) => ({ ...r })));
  writeKey(storageKey(uid), toSave);
  localStorage.removeItem(FOR_YOU_ROWS_LEGACY_KEY);
  return toSave;
}
