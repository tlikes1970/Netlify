import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadForYouRows,
  saveForYouRows,
  clearAllForYouRowsStorage,
  clearForYouRowsOnSignOut,
  DEFAULT_FOR_YOU_ROWS,
  FOR_YOU_ROWS_LEGACY_KEY,
  FOR_YOU_ROWS_STORAGE_VERSION,
} from '../forYouRowsStorage';

const dramaRow = [
  {
    id: '1',
    mainGenre: 'drama',
    subGenre: 'crime',
    title: 'Drama/Crime',
  },
] as const;

describe('forYouRowsStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAllForYouRowsStorage();
  });

  it('writes versioned payload for guest', () => {
    saveForYouRows(DEFAULT_FOR_YOU_ROWS, null);
    const raw = localStorage.getItem('flicklet:forYouRows:v2:guest');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(FOR_YOU_ROWS_STORAGE_VERSION);
    expect(parsed.rows).toHaveLength(3);
  });

  it('resets invalid legacy rows to defaults', () => {
    localStorage.setItem(
      FOR_YOU_ROWS_LEGACY_KEY,
      JSON.stringify([
        { id: '1', mainGenre: 'anime', subGenre: 'action', title: 'Anime/Action' },
      ])
    );
    const rows = loadForYouRows('user-a');
    expect(rows).toEqual(DEFAULT_FOR_YOU_ROWS);
    expect(localStorage.getItem(FOR_YOU_ROWS_LEGACY_KEY)).toBeNull();
  });

  it('migrates valid legacy rows to uid-scoped key and removes legacy', () => {
    localStorage.setItem(FOR_YOU_ROWS_LEGACY_KEY, JSON.stringify(dramaRow));
    const rows = loadForYouRows('user-b');
    expect(rows).toEqual(dramaRow);
    expect(localStorage.getItem('flicklet:forYouRows:v2:user-b')).toBeTruthy();
    expect(localStorage.getItem(FOR_YOU_ROWS_LEGACY_KEY)).toBeNull();
  });

  it('same uid retains rows after sign-out/sign-in', () => {
    saveForYouRows([...dramaRow], 'user-same');
    clearForYouRowsOnSignOut();
    expect(loadForYouRows('user-same')).toEqual(dramaRow);
  });

  it('different uids keep separate rows', () => {
    saveForYouRows([...dramaRow], 'user-one');
    saveForYouRows(DEFAULT_FOR_YOU_ROWS, 'user-two');
    expect(loadForYouRows('user-one')).toEqual(dramaRow);
    expect(loadForYouRows('user-two')).toEqual(DEFAULT_FOR_YOU_ROWS);
  });

  it('guest rows do not overwrite uid rows', () => {
    saveForYouRows([...dramaRow], 'user-keep');
    saveForYouRows(DEFAULT_FOR_YOU_ROWS, null);
    expect(loadForYouRows('user-keep')).toEqual(dramaRow);
    expect(loadForYouRows(null)[0].mainGenre).toBe('anime');
  });

  it('clearForYouRowsOnSignOut clears guest and legacy but preserves uid keys', () => {
    saveForYouRows([...dramaRow], 'user-c');
    saveForYouRows(DEFAULT_FOR_YOU_ROWS, null);
    localStorage.setItem(FOR_YOU_ROWS_LEGACY_KEY, '[]');
    clearForYouRowsOnSignOut();
    expect(localStorage.getItem('flicklet:forYouRows:v2:user-c')).toBeTruthy();
    expect(localStorage.getItem('flicklet:forYouRows:v2:guest')).toBeNull();
    expect(localStorage.getItem(FOR_YOU_ROWS_LEGACY_KEY)).toBeNull();
  });

  it('clearAllForYouRowsStorage removes every For You key', () => {
    saveForYouRows(DEFAULT_FOR_YOU_ROWS, 'user-c');
    localStorage.setItem(FOR_YOU_ROWS_LEGACY_KEY, '[]');
    clearAllForYouRowsStorage();
    expect(localStorage.getItem('flicklet:forYouRows:v2:user-c')).toBeNull();
    expect(localStorage.getItem(FOR_YOU_ROWS_LEGACY_KEY)).toBeNull();
  });
});
