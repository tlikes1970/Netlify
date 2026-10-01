import { useCallback, useEffect, useRef } from 'react';
import type { AppView, LibrarySegment } from '../lib/navigation';

type Location = { view: AppView; segment: LibrarySegment };
const isLists = (location: Location) => location.view === 'library' && location.segment === 'mylists';

/** A single history entry for Custom Lists; selecting lists does not add entries. */
export function useCustomListsNavigation(view: AppView, segment: LibrarySegment, apply: (location: Location) => void) {
  const previous = useRef<Location>({ view, segment });
  const current = useRef<Location>({ view, segment });
  const restore = useRef(apply);
  const fromHistory = useRef(false);
  const returnTo = useRef<Location>({ view: 'library', segment: 'watching' });
  restore.current = apply;
  current.current = { view, segment };

  useEffect(() => {
    const next = { view, segment };
    if (fromHistory.current) {
      fromHistory.current = false;
    } else if (isLists(next) && !isLists(previous.current)) {
      returnTo.current = previous.current;
      window.history.replaceState({ ...window.history.state, flickletListsLocation: previous.current }, '');
      window.history.pushState({ flickletListsLocation: next }, '');
    } else if (!isLists(next) && isLists(previous.current)) {
      // Forward must not reopen a list after explicitly leaving the feature.
      window.history.replaceState({ ...window.history.state, flickletListsLocation: next }, '');
    }
    previous.current = next;
  }, [view, segment]);

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const location = event.state?.flickletListsLocation as Location | undefined;
      if (!location) return;
      if (location.view === current.current.view && location.segment === current.current.segment) return;
      fromHistory.current = true;
      restore.current(location);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const back = useCallback(() => {
    if (isLists(window.history.state?.flickletListsLocation || { view: 'home' })) {
      window.history.back();
    } else {
      restore.current(returnTo.current);
    }
  }, []);

  useEffect(() => {
    if (!isLists({ view, segment })) return;
    const onBack = (event: Event) => {
      if (event.defaultPrevented) return;
      // Let existing modal/menu consumers handle their own Back first, even if
      // they mounted after the navigation listener.
      if (document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"]')) return;
      event.preventDefault();
      back();
    };
    window.addEventListener('flicklet:android-back', onBack);
    return () => window.removeEventListener('flicklet:android-back', onBack);
  }, [view, segment, back]);

  return back;
}
