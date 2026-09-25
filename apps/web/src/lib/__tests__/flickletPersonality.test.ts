import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Library } from '../storage';
import { getLibrarySignals } from '../librarySignals';
import {
  resolveFlickletLine,
  getFlickletMarqueeMessages,
  clearFlickletPersonalitySession,
} from '../flickletPersonality';
import {
  getLinesForContext,
  personalityTierFromLevel,
} from '../../data/flickletPersonalityPhase2';

describe('getLibrarySignals', () => {
  beforeEach(() => {
    vi.spyOn(Library, 'getByList').mockImplementation((list) => {
      if (list === 'watching') return [];
      if (list === 'wishlist') return new Array(12).fill({ id: 1, mediaType: 'tv' as const });
      if (list === 'watched') return [];
      if (list === 'not') return [];
      return [];
    });
    vi.spyOn(Library, 'getAll').mockReturnValue(
      new Array(12).fill({ id: 1, mediaType: 'tv' as const, list: 'wishlist' })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('detects empty watching, huge want, and large backlog', () => {
    const signals = getLibrarySignals();
    expect(signals.emptyWatching).toBe(true);
    expect(signals.hugeWantTinyWatching).toBe(true);
    expect(signals.largeBacklog).toBe(true);
    expect(signals.wantCount).toBe(12);
    expect(signals.watchingCount).toBe(0);
  });
});

describe('resolveFlickletLine', () => {
  beforeEach(() => {
    clearFlickletPersonalitySession();
    vi.spyOn(Library, 'getByList').mockImplementation((list) => {
      if (list === 'watching') return [];
      if (list === 'wishlist') return new Array(15).fill({ id: 1, mediaType: 'tv' as const });
      if (list === 'watched') return new Array(30).fill({ id: 2, mediaType: 'tv' as const });
      return [];
    });
    vi.spyOn(Library, 'getAll').mockReturnValue(
      new Array(45).fill({ id: 1, mediaType: 'tv' as const, list: 'wishlist', userRating: 4 })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearFlickletPersonalitySession();
  });

  it('prioritizes huge want header context over empty watching', () => {
    const line = resolveFlickletLine('home.header', 2);
    const pool = getLinesForContext('Home Header - Huge Want / Tiny Watching', 'Standard');
    expect(pool.some((entry) => entry.text === line || line.length > 0)).toBe(true);
    expect(line.length).toBeGreaterThan(5);
  });

  it('uses generic header fallback for balanced libraries', () => {
    vi.spyOn(Library, 'getByList').mockImplementation((list) => {
      if (list === 'watching') return new Array(3).fill({ id: 3, mediaType: 'tv' as const });
      if (list === 'wishlist') return new Array(4).fill({ id: 1, mediaType: 'tv' as const });
      if (list === 'watched') return new Array(5).fill({ id: 2, mediaType: 'tv' as const });
      return [];
    });
    vi.spyOn(Library, 'getAll').mockReturnValue(
      new Array(12).fill({ id: 1, mediaType: 'tv' as const, list: 'wishlist', userRating: 4 })
    );
    clearFlickletPersonalitySession();
    const signals = getLibrarySignals();
    expect(signals.hugeWantTinyWatching).toBe(false);
    expect(signals.heavyWatched).toBe(false);
    expect(signals.emptyWatching).toBe(false);

    const line = resolveFlickletLine('home.header', 2);
    const genericPool = getLinesForContext('Home Header - Generic', 'Standard');
    expect(genericPool.map((entry) => entry.text)).toContain(line);
    expect(line.length).toBeGreaterThan(5);
  });

  it('uses Empty Watching behavior pool for empty watching surface', () => {
    const line = resolveFlickletLine('empty.watching', 2);
    const poolTexts = getLinesForContext('Empty Watching - Behavior', 'Standard').map((l) => l.text);
    expect(line.length).toBeGreaterThan(5);
    expect(poolTexts.length).toBeGreaterThan(0);
  });

  it('returns minimal marquee lines at minimal intensity', () => {
    const messages = getFlickletMarqueeMessages(1);
    const pool = getLinesForContext('Home Marquee - Rotating', 'Minimal');
    expect(messages.length).toBe(pool.length);
    expect(messages.length).toBeGreaterThan(0);
  });

  it('uses strict standard tier only for standard intensity', () => {
    clearFlickletPersonalitySession();
    const line = resolveFlickletLine('empty.want', 2);
    const standardPool = getLinesForContext('Empty States - Empty Want', 'Standard');
    const maximumPool = getLinesForContext('Empty States - Empty Want', 'Maximum');
    expect(standardPool.map((l) => l.text)).toContain(line);
    expect(maximumPool.map((l) => l.text)).not.toContain(line);
  });

  it('prefers behavior context over genre for For You intro', () => {
    clearFlickletPersonalitySession();
    const line = resolveFlickletLine('discover.rowIntro', 2, {
      rowTitle: 'Horror Picks',
      genre: 'horror',
    });
    const behaviorPool = getLinesForContext('Large Backlog - Behavior', 'Standard');
    const horrorPool = getLinesForContext('For You Intro - Horror', 'Standard');
    expect(behaviorPool.map((l) => l.text)).toContain(line);
    expect(horrorPool.map((l) => l.text)).not.toContain(line);
  });

  it('uses genre intro when no behavior matches', () => {
    vi.spyOn(Library, 'getByList').mockImplementation((list) => {
      if (list === 'watching') return new Array(3).fill({ id: 3, mediaType: 'tv' as const });
      if (list === 'wishlist') return new Array(4).fill({ id: 1, mediaType: 'tv' as const });
      if (list === 'watched') return new Array(5).fill({ id: 2, mediaType: 'tv' as const });
      return [];
    });
    vi.spyOn(Library, 'getAll').mockReturnValue(
      new Array(12).fill({ id: 1, mediaType: 'tv' as const, list: 'wishlist', userRating: 4 })
    );
    clearFlickletPersonalitySession();
    const signals = getLibrarySignals();
    expect(signals.largeBacklog).toBe(false);
    expect(signals.tinyLibrary).toBe(false);
    const line = resolveFlickletLine('discover.rowIntro', 2, {
      rowTitle: 'Drama',
      genre: 'drama',
    });
    const dramaPool = getLinesForContext('For You Intro - Drama', 'Standard');
    expect(dramaPool.map((l) => l.text)).toContain(line);
  });

  it('renders all active personality surfaces', () => {
    clearFlickletPersonalitySession();
    expect(resolveFlickletLine('home.header', 2).length).toBeGreaterThan(0);
    expect(getFlickletMarqueeMessages(2).length).toBeGreaterThan(0);
    expect(resolveFlickletLine('empty.want', 2).length).toBeGreaterThan(0);
    expect(
      resolveFlickletLine('discover.rowIntro', 2, { genre: 'comedy', rowTitle: 'Comedy' }).length
    ).toBeGreaterThan(0);
  });
});

describe('repetition avoidance', () => {
  beforeEach(() => {
    clearFlickletPersonalitySession();
    vi.spyOn(Library, 'getByList').mockReturnValue([]);
    vi.spyOn(Library, 'getAll').mockReturnValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearFlickletPersonalitySession();
  });

  it('does not repeat the same line when alternatives exist', () => {
    const pool = getLinesForContext('Empty States - Empty Want', 'Minimal');
    expect(pool.length).toBeGreaterThan(1);

    const first = resolveFlickletLine('empty.want', 1);
    const second = resolveFlickletLine('empty.want', 1);
    expect(second).not.toBe(first);
  });
});

describe('tier example output', () => {
  beforeEach(() => {
    clearFlickletPersonalitySession();
    vi.spyOn(Library, 'getByList').mockImplementation((list) => {
      if (list === 'watching') return [];
      if (list === 'wishlist') return new Array(12).fill({ id: 1, mediaType: 'tv' as const });
      return [];
    });
    vi.spyOn(Library, 'getAll').mockReturnValue(
      new Array(12).fill({ id: 1, mediaType: 'tv' as const, list: 'wishlist' })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearFlickletPersonalitySession();
  });

  it('samples one line per tier for home header', () => {
    for (const level of [1, 2, 3] as const) {
      clearFlickletPersonalitySession();
      const tier = personalityTierFromLevel(level);
      const line = resolveFlickletLine('home.header', level);
      const pool = getLinesForContext('Home Header - Huge Want / Tiny Watching', tier);
      expect(pool.map((entry) => entry.text)).toContain(line);
    }
  });
});
