import { describe, it, expect } from 'vitest';
import {
  getItemSynopsis,
  itemNeedsSynopsisBackfill,
} from '@/lib/itemSynopsis';

describe('getItemSynopsis', () => {
  it('returns synopsis when present', () => {
    expect(
      getItemSynopsis({
        id: 1,
        mediaType: 'tv',
        title: 'Test',
        synopsis: 'A saved summary.',
      })
    ).toBe('A saved summary.');
  });

  it('falls back to legacy overview field', () => {
    expect(
      getItemSynopsis({
        id: 2,
        mediaType: 'movie',
        title: 'Legacy',
        overview: 'Older stored overview text.',
      })
    ).toBe('Older stored overview text.');
  });

  it('prefers synopsis over overview', () => {
    expect(
      getItemSynopsis({
        id: 3,
        mediaType: 'tv',
        title: 'Both',
        synopsis: 'Primary synopsis.',
        overview: 'Legacy overview.',
      })
    ).toBe('Primary synopsis.');
  });
});

describe('itemNeedsSynopsisBackfill', () => {
  it('flags media items without synopsis or overview', () => {
    expect(
      itemNeedsSynopsisBackfill({
        id: 4,
        mediaType: 'movie',
        title: 'Missing',
      })
    ).toBe(true);
  });

  it('skips items that already have synopsis text', () => {
    expect(
      itemNeedsSynopsisBackfill({
        id: 5,
        mediaType: 'tv',
        title: 'Ready',
        synopsis: 'Already here.',
      })
    ).toBe(false);
  });
});
