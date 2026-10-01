import { beforeEach, describe, expect, it } from 'vitest';
import {
  isLibrarySegment,
  LIBRARY_SEGMENT_STORAGE_KEY,
  readStoredLibrarySegment,
  resolveNavigation,
  writeStoredLibrarySegment,
  type LibrarySegment,
} from '@/lib/navigation';

const segments: LibrarySegment[] = ['watching', 'want', 'watched', 'mylists'];

describe('Library navigation without standalone Up Next', () => {
  beforeEach(() => sessionStorage.clear());

  it.each(['returning', 'up-next'] as const)('routes legacy %s requests to Home', target => {
    expect(isLibrarySegment(target)).toBe(false);
    expect(resolveNavigation(target, 'watched')).toEqual({ view: 'home', segment: 'watched' });
  });

  it.each(['returning', 'up-next', 'invalid'])('rejects stored %s and opens a valid Watching segment', stored => {
    sessionStorage.setItem(LIBRARY_SEGMENT_STORAGE_KEY, stored);
    const segment = readStoredLibrarySegment();
    expect(segment).toBe('watching');
    expect(resolveNavigation('library', segment)).toEqual({ view: 'library', segment: 'watching' });
  });

  it.each(segments)('keeps %s navigation and persistence', segment => {
    expect(isLibrarySegment(segment)).toBe(true);
    expect(resolveNavigation(segment, 'watching')).toEqual({ view: 'library', segment });
    writeStoredLibrarySegment(segment);
    expect(readStoredLibrarySegment()).toBe(segment);
  });

  it('keeps top-level navigation and defaults to Watching without saved state', () => {
    expect(readStoredLibrarySegment()).toBe('watching');
    for (const view of ['home', 'library', 'discovery'] as const) {
      expect(resolveNavigation(view, 'mylists')).toEqual({ view, segment: 'mylists' });
    }
  });
});
