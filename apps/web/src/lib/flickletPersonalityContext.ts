/**
 * Phase 2 personality context selection hierarchy.
 */

import type { PersonalityContext } from '../data/flickletPersonalityPhase2';
import type { LibrarySignals } from './librarySignals';

const BEHAVIOR_PRIORITY: Array<{
  context: PersonalityContext;
  matches: (signals: LibrarySignals) => boolean;
}> = [
  { context: 'Large Backlog - Behavior', matches: (s) => s.largeBacklog },
  { context: 'Empty Watching - Behavior', matches: (s) => s.emptyWatching },
  { context: 'No Ratings - Behavior', matches: (s) => s.noRatings },
  { context: 'Heavy Watched - Behavior', matches: (s) => s.heavyWatched },
  { context: 'Tiny Library - Behavior', matches: (s) => s.tinyLibrary },
];

export function resolveForYouBehaviorContext(
  signals: LibrarySignals
): PersonalityContext | null {
  for (const { context, matches } of BEHAVIOR_PRIORITY) {
    if (matches(signals)) return context;
  }
  return null;
}

export function resolveForYouGenreContext(
  mainGenre?: string,
  subGenre?: string
): PersonalityContext | null {
  const main = (mainGenre ?? '').toLowerCase();
  const sub = (subGenre ?? '').toLowerCase();

  if (sub === 'crime' || sub === 'true-crime') return 'For You Intro - Crime';
  if (main === 'horror') return 'For You Intro - Horror';
  if (main === 'comedy') return 'For You Intro - Comedy';
  if (main === 'drama') return 'For You Intro - Drama';
  if (main === 'action') return 'For You Intro - Action';
  if (main === 'thriller') return 'For You Intro - Thriller';
  if (main === 'science-fiction' || main === 'sci-fi') return 'For You Intro - Sci-Fi';

  return null;
}

/** Behavior → Genre → General */
export function resolveForYouIntroContext(
  signals: LibrarySignals,
  mainGenre?: string,
  subGenre?: string
): PersonalityContext {
  const behavior = resolveForYouBehaviorContext(signals);
  if (behavior) return behavior;

  const genre = resolveForYouGenreContext(mainGenre, subGenre);
  if (genre) return genre;

  return 'For You Intro - General';
}

/** Huge Want / Tiny Watching → Heavy Watched → Empty Watching → Generic */
export function resolveHomeHeaderContext(signals: LibrarySignals): PersonalityContext {
  if (signals.hugeWantTinyWatching) return 'Home Header - Huge Want / Tiny Watching';
  if (signals.heavyWatched) return 'Home Header - Heavy Watched';
  if (signals.emptyWatching) return 'Home Header - Empty Watching';
  return 'Home Header - Generic';
}

export function resolveEmptyStateContext(
  surface:
    | 'empty.want'
    | 'empty.watched'
    | 'empty.upnext'
    | 'empty.watching'
): PersonalityContext {
  const map: Record<typeof surface, PersonalityContext> = {
    'empty.want': 'Empty States - Empty Want',
    'empty.watched': 'Empty States - Empty Watched',
    'empty.upnext': 'Empty States - Empty Up Next',
    'empty.watching': 'Empty Watching - Behavior',
  };
  return map[surface];
}
