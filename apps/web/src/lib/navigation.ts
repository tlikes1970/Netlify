/**
 * App navigation — top-level views and Library segments (mobile Library tab).
 */

export type AppView = 'home' | 'library' | 'discovery';

export type LibrarySegment =
  | 'watching'
  | 'want'
  | 'watched'
  | 'mylists';

/** Legacy list tab ids still emitted by deep links and navigate-to-tab events. */
export type LegacyListView = LibrarySegment;

export type NavTarget = AppView | LegacyListView | 'returning' | 'up-next';

const LIBRARY_SEGMENTS: LibrarySegment[] = [
  'watching',
  'want',
  'watched',
  'mylists',
];

export function isLibrarySegment(value: string): value is LibrarySegment {
  return (LIBRARY_SEGMENTS as string[]).includes(value);
}

export function resolveNavigation(
  target: NavTarget,
  currentSegment: LibrarySegment
): { view: AppView; segment: LibrarySegment } {
  if (target === 'returning' || target === 'up-next') {
    return { view: 'home', segment: currentSegment };
  }
  if (target === 'home') {
    return { view: 'home', segment: currentSegment };
  }
  if (target === 'discovery') {
    return { view: 'discovery', segment: currentSegment };
  }
  if (target === 'library') {
    return { view: 'library', segment: currentSegment };
  }
  return { view: 'library', segment: target };
}

export const LIBRARY_SEGMENT_STORAGE_KEY = 'flicklet.librarySegment';

export function readStoredLibrarySegment(): LibrarySegment {
  try {
    const stored = sessionStorage.getItem(LIBRARY_SEGMENT_STORAGE_KEY);
    if (stored && isLibrarySegment(stored)) {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return 'watching';
}

export function writeStoredLibrarySegment(segment: LibrarySegment): void {
  try {
    sessionStorage.setItem(LIBRARY_SEGMENT_STORAGE_KEY, segment);
  } catch {
    /* ignore */
  }
}
