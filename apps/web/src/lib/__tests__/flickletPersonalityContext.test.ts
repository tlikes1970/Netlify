import { describe, it, expect } from 'vitest';
import type { LibrarySignals } from '../librarySignals';
import {
  resolveForYouBehaviorContext,
  resolveForYouGenreContext,
  resolveForYouIntroContext,
  resolveHomeHeaderContext,
  resolveEmptyStateContext,
} from '../flickletPersonalityContext';

function baseSignals(overrides: Partial<LibrarySignals> = {}): LibrarySignals {
  return {
    watchingCount: 2,
    wantCount: 5,
    watchedCount: 10,
    notCount: 0,
    totalCount: 17,
    ratedCount: 8,
    emptyWatching: false,
    hugeWantTinyWatching: false,
    largeBacklog: false,
    heavyWatched: false,
    noRatings: false,
    tinyLibrary: false,
    smallLibrary: false,
    singleShowFocus: false,
    ...overrides,
  };
}

describe('For You intro hierarchy', () => {
  it('prioritizes behavior over genre', () => {
    const signals = baseSignals({ largeBacklog: true });
    expect(resolveForYouIntroContext(signals, 'horror')).toBe('Large Backlog - Behavior');
  });

  it('uses behavior priority order when multiple match', () => {
    const signals = baseSignals({
      largeBacklog: true,
      emptyWatching: true,
      noRatings: true,
    });
    expect(resolveForYouBehaviorContext(signals)).toBe('Large Backlog - Behavior');

    const emptyOnly = baseSignals({ emptyWatching: true, noRatings: true });
    expect(resolveForYouBehaviorContext(emptyOnly)).toBe('Empty Watching - Behavior');

    const ratingsOnly = baseSignals({ noRatings: true, heavyWatched: true });
    expect(resolveForYouBehaviorContext(ratingsOnly)).toBe('No Ratings - Behavior');

    const watchedOnly = baseSignals({ heavyWatched: true, tinyLibrary: true });
    expect(resolveForYouBehaviorContext(watchedOnly)).toBe('Heavy Watched - Behavior');

    const tinyOnly = baseSignals({ tinyLibrary: true });
    expect(resolveForYouBehaviorContext(tinyOnly)).toBe('Tiny Library - Behavior');
  });

  it('falls back to genre when no behavior matches', () => {
    const signals = baseSignals();
    expect(resolveForYouIntroContext(signals, 'horror')).toBe('For You Intro - Horror');
    expect(resolveForYouIntroContext(signals, 'science-fiction')).toBe('For You Intro - Sci-Fi');
    expect(resolveForYouGenreContext('drama', 'crime')).toBe('For You Intro - Crime');
  });

  it('falls back to General when no behavior or genre matches', () => {
    const signals = baseSignals();
    expect(resolveForYouIntroContext(signals, 'anime')).toBe('For You Intro - General');
    expect(resolveForYouIntroContext(signals)).toBe('For You Intro - General');
  });
});

describe('Home header hierarchy', () => {
  it('prioritizes huge want over heavy watched and empty watching', () => {
    const signals = baseSignals({
      hugeWantTinyWatching: true,
      heavyWatched: true,
      emptyWatching: true,
    });
    expect(resolveHomeHeaderContext(signals)).toBe('Home Header - Huge Want / Tiny Watching');
  });

  it('uses heavy watched when huge want does not match', () => {
    const signals = baseSignals({ heavyWatched: true, emptyWatching: true });
    expect(resolveHomeHeaderContext(signals)).toBe('Home Header - Heavy Watched');
  });

  it('uses empty watching before generic fallback', () => {
    const signals = baseSignals({ emptyWatching: true });
    expect(resolveHomeHeaderContext(signals)).toBe('Home Header - Empty Watching');
  });

  it('falls back to generic when no header signal matches', () => {
    expect(resolveHomeHeaderContext(baseSignals())).toBe('Home Header - Generic');
  });
});

describe('empty state context mapping', () => {
  it('maps surfaces to exact Phase 2 contexts', () => {
    expect(resolveEmptyStateContext('empty.want')).toBe('Empty States - Empty Want');
    expect(resolveEmptyStateContext('empty.watched')).toBe('Empty States - Empty Watched');
    expect(resolveEmptyStateContext('empty.upnext')).toBe('Empty States - Empty Up Next');
    expect(resolveEmptyStateContext('empty.customList')).toBe('Empty States - Empty Custom List');
    expect(resolveEmptyStateContext('empty.watching')).toBe('Empty Watching - Behavior');
  });
});
